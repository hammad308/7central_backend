const EmployeeNotification = require("../models/employeeNotificationModel");
const Employee = require("../models/employeeModel");
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const logger = require("../logger")("EMPLOYEE_NOTIFICATION_CONTROLLER");
const AppError = require("../utils/appError");

exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const employeeId = req.user.employee;
    if (!employeeId) return next(new AppError("No Employee Profile", 403));

    const employee = await Employee.findOne({
        _id: employeeId,
        status: { $nin: ['inactive', 'deleted'] },
        employmentStatus: { $nin: ['resigned', 'terminated'] }
    });
    if (!employee) return next(new AppError("No Employee Found with active status"));
    const employeeNotifications = await EmployeeNotification.find({ employee: employee._id, status: "active" }).sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, logger, {
        message: "Employee Notifications fetched successfully",
        docs: employeeNotifications
    })
});

exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await EmployeeNotification.findOne({
        _id: req.params.id,
        status: "active",
        isRead: false
    });
    if (!notification) {
        return next(new AppError("No Notification found to mark read", 404));
    }
    if (notification.employee.toString() !== req.user.employee_id.toString()) {
        return next(new AppError("You are not authenticated to mark Read this notification", 403));
    }
    notification.isRead = true;
    await notification.save();
    sendSuccessResponse(res, 200, logger, {
        message: "Notifcation marked as Read Successfully",
        doc: notification
    })
})