const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse, getLongAutoIncrementId, displayNameFromBuyers } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require('../logger')('INVENTORY_CONTROLLER');
const Inventory = require("../models/inventoryModel");
const Sale = require("../models/saleModel");
const OwnerShipHistory = require("../models/ownershipHistoryModel");
const { saleValidationSchema } = require("../validations/saleValidation");
const { installmentPlanSchema } = require("../validations/installmentPlanValidation");
const dayjs = require('dayjs');
const InstallmentPlan = require("../models/installmentPlanModel");
const Installment = require("../models/installmentModel");
const handlerFactory = require('./factories/handlerFactory');
const Customer = require("../models/customerModel");
const { buildInstallmentRows, applyPaidAmountFIFO } = require("../utils/installmentPlanBuilder");
const { uploadBase64Image } = require("../utils/uploadFiles");
const { default: mongoose } = require("mongoose");


exports.createSale = catchAsync(async (req, res, next) => {
  const { error } = saleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const { inventory, buyers, sellingPrice, actualPrice, paymentType } = req.body;
  const checkInventory = await Inventory.findById(inventory);
  if (!checkInventory) return next(new AppError("Inventory not found", 404));
  if (checkInventory.status !== 'not_assigned') {
    return next(new AppError("This inventory not available for sale", 400));
  }
  const checkCustomers = await Customer.find({ _id: { $in: buyers } });
  if (checkCustomers.length !== buyers.length) {
    return next(new AppError("One or more buyers not found", 404));
  }
  const buyersDisplayName = displayNameFromBuyers(checkCustomers);
  if (req.body.image && req.body.image.startsWith('data:image/')) {
    const basse64String = req.body.image.split(',')[1];
    const uploadDir = `/uploads/${req.uploadDirectory}`;
    const result = await uploadBase64Image(basse64String, uploadDir);
    req.body.image = `${req.uploadDirectory}/${result.fileName}`;
  }
  const sale = await Sale.create({
    ...req.body,
    buyersDisplayName,
    status: 'draft',
    createdBy: req.user._id,
  });
  // Update inventory ownership
  checkInventory.actualPrice = actualPrice || null;
  checkInventory.currentSale = sale._id;
  checkInventory.status = 'assigned';
  await checkInventory.save();
  // Log ownership history
  await OwnerShipHistory.create({
    inventory,
    newSale: sale._id,
    newBuyers: buyers,
    remarks: "Initial purchase",
    createdBy: req.user._id,
  });
  sendSuccessResponse(res, 200, logger, {
    message: "Inventory assigned successfully.",
    doc: { inventory: checkInventory, sale }
  });
});

exports.changeInventoryOwnershipSale = catchAsync(async (req, res, next) => {
  const { error } = saleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const { inventory, buyers, sellingPrice, actualPrice, paymentType } = req.body;
  const checkInventory = await Inventory.findById(inventory);
  if (!checkInventory) return next(new AppError("Inventory not found", 404));
  if (checkInventory.status !== 'assigned') {
    return next(new AppError("This inventory not available for sale", 400));
  }
  let currentSale = await Sale.findById(checkInventory.currentSale);
  if (!currentSale) {
    return next(new AppError("Current sale not found for this inventory", 404));
  }
  const checkCustomers = await Customer.find({ _id: { $in: buyers } });
  if (checkCustomers.length !== buyers.length) {
    return next(new AppError("One or more buyers not found", 404));
  }
  const buyersDisplayName = displayNameFromBuyers(checkCustomers);
  let sale = await Sale.create({
    ...req.body,
    buyersDisplayName,
    status: 'draft',
    createdBy: req.user._id,
    transferredFrom: currentSale._id,
    sellingPrice: sellingPrice || currentSale.sellingPrice,
    actualPrice: actualPrice || currentSale.actualPrice,
    plan: currentSale.plan,
  });
  // Update inventory ownership
  // checkInventory.actualPrice = actualPrice || null;
  checkInventory.currentSale = sale._id;
  checkInventory.status = 'assigned';
  await checkInventory.save();
  currentSale.status = 'transferred';
  currentSale.transferredTo = sale._id;
  await currentSale.save();
  await Installment.updateMany(
    {
      sale: currentSale._id,
      status: { $in: ["un-paid", "overdue", "defaulted"] }
    },
    {
      sale: sale._id
    }
  );
  sale.status = 'active';
  await sale.save();
  // Log ownership history
  await OwnerShipHistory.create({
    inventory,
    newSale: sale._id,
    newBuyers: buyers,
    previousBuyers: currentSale.buyers,
    oldSale: currentSale._id,
    remarks: "Ownership transfer",
    createdBy: req.user._id,
  });
  sendSuccessResponse(res, 200, logger, {
    message: "Inventory Ownership transfered successfully.",
    doc: { inventory: checkInventory, sale }
  });
});

exports.createPaymentPlan = catchAsync(async (req, res, next) => {
  const { value, error } = installmentPlanSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));

  const sale = await Sale.findById(value.sale);
  if (!sale) return next(new AppError("Sale not found", 404));

  // Check for existing plan
  const existingPlan = await InstallmentPlan.findOne({ sale: value.sale });
  if (existingPlan) {
    return next(new AppError("A payment plan already exists for this sale.", 400));
  }

  // Calculate totalScheduled
  if (value.totalScheduled == null || value.totalScheduled === 0) {
    value.totalScheduled = value._computedTotalScheduled || 0;
  }
  if (value.fullPayment && value.fullPayment > 0) {
    value.totalScheduled = value.fullPayment;
  }
  delete value._computedTotalScheduled;

  // Create plan with isApproved: false
  const plan = await InstallmentPlan.create({
    ...value,
    isApproved: false,
    approvedBy: null,
    approvedAt: null
  });

  // Update sale with plan reference (status remains 'draft')
  sale.plan = plan._id;
  await sale.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Payment plan created successfully. Waiting for approval.",
    plan,
    sale
  });
});

exports.approvePurchasePlan = catchAsync(async (req, res, next) => {
  const plan = await InstallmentPlan.findById(req.params.id);
  if (!plan) {
    return next(new AppError("Installment plan not found or invalid ID.", 404));
  }

  if (plan.isApproved) {
    return next(new AppError("This payment plan is already approved!", 400));
  }

  const sale = await Sale.findById(plan.sale);
  if (!sale) {
    return next(new AppError("Sale not found.", 404));
  }

  if (sale.status === 'active') {
    return next(new AppError("This sale is already active.", 400));
  }

  // APPROVE THE PLAN
  plan.isApproved = true;
  plan.approvedBy = req.user._id;
  plan.approvedAt = new Date();
  await plan.save();

  // GENERATE INSTALLMENTS using the builder (NOW with today = approval date)
  const rows = buildInstallmentRows(plan, plan.sale, req.user._id);
  const docs = await Installment.insertMany(rows);
  const totalAmount = docs.reduce((s, r) => s + r.amount, 0);

  // Update sale status to 'active'
  const updatedSale = await Sale.findByIdAndUpdate(
    plan.sale,
    { status: "active" },
    { runValidators: true, returnDocument: "after" }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Payment plan approved successfully. Installments have been generated.",
    plan,
    sale: updatedSale,
    installments: docs,
    totalAmount: totalAmount,
    totalInstallments: docs.length
  });
});

exports.updatePaymentPlan = catchAsync(async (req, res, next) => {
  const { value, error } = installmentPlanSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));

  const sale = await Sale.findById(value.sale);
  if (!sale) return next(new AppError("Sale not found", 404));

  const existingPlan = await InstallmentPlan.findById(sale.plan);
  if (!existingPlan) return next(new AppError("Installment plan not found", 404));

  // normalize totals
  if (value.totalScheduled == null) value.totalScheduled = value._computedTotalScheduled;
  if (value.fullPayment) value.totalScheduled = value.fullPayment;
  delete value._computedTotalScheduled;

  const existingInstallments = await Installment.find({ plan: existingPlan._id })
    .sort({ seq: 1, dueDate: 1, createdAt: 1 });

  const paidInstallments = existingInstallments.filter(
    i => Number(i.paidAmount || 0) > 0 || i.status === "paid" || i.status === "partially-paid"
  );
  const unpaidInstallments = existingInstallments.filter(
    i => !(Number(i.paidAmount || 0) > 0 || i.status === "paid" || i.status === "partially-paid")
  );

  const totalPaidAlready = paidInstallments.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0), 0
  );

  const freshRows = buildInstallmentRows({ value, sale, planId: existingPlan._id, userId: req.user?._id });
  const totalNewSchedule = freshRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (totalPaidAlready > totalNewSchedule) {
    return next(new AppError(
      `Already paid (${totalPaidAlready}) exceeds new plan total (${totalNewSchedule}).`, 422
    ));
  }

  const projectedRows = applyPaidAmountFIFO(freshRows, totalPaidAlready);

  const outstandingRows = projectedRows
    .filter(row => (Number(row.amount || 0) - Number(row.paidAmount || 0)) > 0)
    .map(row => ({
      ...row,
      amount: Number(row.amount || 0) - Number(row.paidAmount || 0),
      paidAmount: 0, paidAt: null, paidBy: null, status: "un-paid",
    }));

  // Delete old unpaid installments
  if (unpaidInstallments.length) {
    await Installment.deleteMany({ _id: { $in: unpaidInstallments.map(i => i._id) } });
  }

  let seqStart = paidInstallments.length + 1;
  const newOutstandingDocs = outstandingRows.map(row => ({
    ...row,
    seq: seqStart++,
    plan: existingPlan._id,
    sale: sale._id,
    inventory: sale.inventory,
    createdBy: req.user?._id || null,
  }));

  let createdInstallments = [];
  if (newOutstandingDocs.length) {
    createdInstallments = await Installment.insertMany(newOutstandingDocs);
  }

  const updatedPlan = await InstallmentPlan.findByIdAndUpdate(
    existingPlan._id,
    { $set: { ...value, sale: sale._id, inventory: sale.inventory, totalScheduled: totalNewSchedule } },
    { new: true, runValidators: true }
  );

  sale.plan = updatedPlan._id;
  sale.status = "active";
  await sale.save();

  const finalInstallments = await Installment.find({ plan: updatedPlan._id }).sort({ seq: 1, dueDate: 1 });

  sendSuccessResponse(res, 200, logger, {
    message: "Payment plan updated successfully.",
    plan: updatedPlan, sale,
    alreadyPaidAmount: totalPaidAlready,
    totalScheduled: totalNewSchedule,
    outstandingAmount: totalNewSchedule - totalPaidAlready,
    installments: finalInstallments,
    createdOutstandingInstallments: createdInstallments,
  });
});


exports.getPaymentPlan = catchAsync(async (req, res, next) => {
  const { inventory } = req.query;
  const query = {};


  const checkInventory = Inventory.findById(inventory);
  if (!checkInventory) {
    return next(new AppError("Inventory not found.", 404));
  }


  // if(!checkInventory.currentSale){
  //   return next(new AppError("This inventory currently not purchased or not assigned.", 404));
  // }

  const currentSale = await Sale.findById(checkInventory.currentSale);
  query.sale = currentSale._id;

  if (!currentSale.plan) {
    return next(new AppError("This inventory does not have any purchasing plan.", 404));
  }
  const allInstallments = await Installment.find(query).sort({ seq: 1 });



  sendSuccessResponse(res, 200, logger, {
    inventory: checkInventory, installments: allInstallments,
    sale: currentSale
  });
});
const popItems = [
  { path: 'plan' },
  { path: 'sale', populate: { path: 'buyers', select: " name fatherName cnic phoneNumber email " } },
  {
    path: 'inventory', populate: [
      { path: 'project', select: 'title -_id' },
      { path: 'blockOrFloor', select: 'title -_id' },
      { path: 'currentSale', populate: { path: 'buyers', select: " name fatherName cnic phoneNumber email " } },
    ]
  },
  {
    path: 'createdBy',
    select: 'username image email -_id'
  }
]
exports.getAllInstallments = catchAsync(async (req, res, next) => {
  const { inventory, type, status } = req.query;
  const query = {};
  if (inventory) {
    query.inventory = inventory;
  } else if (type) {
    query.type = type;
  }
  else if (status) {
    query.status = status;
  }
  handlerFactory.getAll(Installment, popItems, logger, query)(req, res, next)
});
exports.getAllInstallments = catchAsync(async (req, res, next) => {
  const { inventory, type, status } = req.query;
  const query = {};
  if (inventory) {
    query.inventory = inventory;
  } else if (type) {
    query.type = type;
  }
  else if (status) {
    query.status = status;
  }
  req.query.sort = "dueDate:asc";
  handlerFactory.getAll(Installment, popItems, logger, query)(req, res, next)
});

exports.getSingleInstallment = handlerFactory.getOne(Installment, popItems, logger);


const popItems2 = [
  { path: 'previousBuyers', select: " name fatherName cnic phoneNumber email " },
  { path: 'newBuyers', select: " name fatherName cnic phoneNumber email " },
  { path: 'oldSale', populate: { path: 'buyers', select: " name fatherName cnic phoneNumber email " } },
  { path: 'newSale', populate: { path: 'buyers', select: " name fatherName cnic phoneNumber email " } },
  {
    path: 'inventory', populate: [
      { path: 'project', select: 'title -_id' },
      { path: 'blockOrFloor', select: 'title -_id' },
      { path: 'currentSale', populate: { path: 'buyers', select: " name fatherName cnic phoneNumber email " } },
    ]
  },
  {
    path: 'createdBy',
    select: 'username image email -_id'
  }
]
exports.getSingleInventoryAllOwnerShips = catchAsync(async (req, res, next) => {
  const { inventory } = req.query;
  const query = {};
  if (inventory) {
    query.inventory = inventory;
  }
  handlerFactory.getAll(OwnerShipHistory, popItems2, logger, query)(req, res, next)
});