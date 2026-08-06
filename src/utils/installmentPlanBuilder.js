const dayjs = require("dayjs");
const AppError = require("../utils/appError");

function addPeriod(d, durationStr) {
  const map = {
    'Monthly': { months: 1 },
    'Quarterly': { months: 3 },
    'Half Yearly': { months: 6 },
    'Monthly + Half Yearly': { months: 6 },
    'Yearly': { years: 1 }
  };
  const inc = map[durationStr];
  if (!inc) throw new Error(`Unknown duration ${durationStr}`);
  return dayjs(d).add(inc.months || 0, 'month').add(inc.years || 0, 'year').toDate();
}

function buildInstallmentRows(plan, saleId, userId) {
  // Use plain Error if AppError not available
  if (!plan || !plan._id) {
    throw new Error("Invalid plan object");
  }
  if (!saleId) {
    throw new Error("Sale ID is required");
  }

  const rows = [];
  const monthMap = new Map();
  const today = dayjs().startOf("day");

  // If fullPayment exists, create single installment and return
  if (plan.fullPayment && plan.fullPayment > 0) {
    rows.push({
      plan: plan._id,
      sale: saleId,
      inventory: plan.inventory,
      type: "full_payment",
      dueDate: today.toDate(),
      amount: plan.fullPayment,
      status: "un-paid",
      paidAmount: 0,
      paidAt: null,
      createdBy: userId || null,
      seq: 1
    });
    return rows;
  }

  const monthKey = (d) => dayjs(d).format("YYYY-MM");

  // push function with monthMap to prevent same type in same month
  const push = (kind, dueDate, amount) => {
    if (!amount || amount <= 0) return;

    const key = monthKey(dueDate);
    const existingSameType = monthMap.get(key)?.[kind];

    if (existingSameType) {
      // Same type already exists in this month → shift to next month
      let d = dayjs(dueDate).add(1, "month").startOf("day");
      let safety = 0;
      while (safety++ < 12) {
        const newKey = monthKey(d);
        if (!monthMap.get(newKey)?.[kind]) {
          if (!monthMap.has(newKey)) monthMap.set(newKey, {});
          monthMap.get(newKey)[kind] = true;
          rows.push({
            plan: plan._id,
            sale: saleId,
            inventory: plan.inventory,
            type: kind,
            dueDate: d.toDate(),
            amount,
            status: "un-paid",
            paidAmount: 0,
            paidAt: null,
            createdBy: userId || null,
          });
          return;
        }
        d = d.add(1, "month");
      }
      // If no free month found after 12 attempts, just push to next month (fallback)
      rows.push({
        plan: plan._id,
        sale: saleId,
        inventory: plan.inventory,
        type: kind,
        dueDate: d.toDate(),
        amount,
        status: "un-paid",
        paidAmount: 0,
        paidAt: null,
        createdBy: userId || null,
      });
    } else {
      // First time for this type in this month
      if (!monthMap.has(key)) monthMap.set(key, {});
      monthMap.get(key)[kind] = true;
      rows.push({
        plan: plan._id,
        sale: saleId,
        inventory: plan.inventory,
        type: kind,
        dueDate: dayjs(dueDate).startOf("day").toDate(),
        amount,
        status: "un-paid",
        paidAmount: 0,
        paidAt: null,
        createdBy: userId || null,
      });
    }
  };

  // 1) Milestones
  if (plan.downPayment) {
    push("down_payment", today.toDate(), plan.downPayment);
  }
  if (plan.allocation) {
    push("allocation", today.add(30, "day").toDate(), plan.allocation);
  }
  if (plan.confirmation) {
    push("confirmation", today.add(60, "day").toDate(), plan.confirmation);
  }

  // 2) Balloon stream (Half Yearly)
  if (plan.balloon && plan.balloon.count) {
    let d = plan.balloon.startDate ? dayjs(plan.balloon.startDate).startOf("day") : today.add(6, "month");
    for (let i = 0; i < plan.balloon.count; i++) {
      push("balloon", d.toDate(), plan.balloon.amount);
      d = dayjs(addPeriod(d.toDate(), plan.balloon.duration));
    }
  }

  // 3) Monthly Balloon stream (Monthly + Half Yearly)
  if (plan.monthlyBalloon && plan.monthlyBalloon.count) {
    let d = plan.monthlyBalloon.startDate ? dayjs(plan.monthlyBalloon.startDate).startOf("day") : today.add(6, "month");
    for (let i = 0; i < plan.monthlyBalloon.count; i++) {
      push("monthly_balloon", d.toDate(), plan.monthlyBalloon.amount);
      d = dayjs(addPeriod(d.toDate(), plan.monthlyBalloon.duration));
    }
  }

  // 4) Quarterly stream
  if (plan.quarterly && plan.quarterly.count) {
    let d = plan.quarterly.startDate ? dayjs(plan.quarterly.startDate).startOf("day") : today.add(3, "month");
    for (let i = 0; i < plan.quarterly.count; i++) {
      push("quarterly", d.toDate(), plan.quarterly.amount);
      d = dayjs(addPeriod(d.toDate(), plan.quarterly.duration));
    }
  }

  // 5) Monthly stream
  if (plan.monthly && plan.monthly.count) {
    let d = plan.monthly.startDate ? dayjs(plan.monthly.startDate).startOf("day") : today.add(1, "month");
    for (let i = 0; i < plan.monthly.count; i++) {
      push("monthly", d.toDate(), plan.monthly.amount);
      d = dayjs(addPeriod(d.toDate(), plan.monthly.duration));
    }
  }

  // 6) Possession – after all installments
  if (plan.possession && plan.possession > 0) {
    let lastDate = today.toDate();
    if (rows.length > 0) {
      lastDate = rows.reduce((max, r) => r.dueDate > max ? r.dueDate : max, rows[0].dueDate);
    }
    const possessionDate = dayjs(lastDate).add(1, "month").startOf("day").toDate();
    push("possession", possessionDate, plan.possession);
  }

  // Sort by due date
  rows.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Assign sequence numbers
  rows.forEach((row, index) => row.seq = index + 1);

  return rows;
}

function applyPaidAmountFIFO(rows, totalPaid) {
  let remainingPaid = Number(totalPaid || 0);

  return rows.map((row) => {
    const cloned = { ...row };

    if (remainingPaid <= 0) {
      cloned.paidAmount = 0;
      cloned.status = "un-paid";
      cloned.paidAt = null;
      return cloned;
    }

    if (remainingPaid >= cloned.amount) {
      cloned.paidAmount = cloned.amount;
      cloned.status = "paid";
      remainingPaid -= cloned.amount;
      return cloned;
    }

    cloned.paidAmount = remainingPaid;
    cloned.status = "partially-paid";
    remainingPaid = 0;
    return cloned;
  });
}

module.exports = {
  buildInstallmentRows,
  applyPaidAmountFIFO
}