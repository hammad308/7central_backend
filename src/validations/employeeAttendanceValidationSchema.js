const joi = require('joi');

const employeeLeaveValidationSchema = joi.object().keys({
  employeeID: joi.string().required(),
  status: joi.string().valid('On Time', 'Late', 'Half Day', 'Off Day').required(),
  checkInTime: joi.date().iso().required(),
});

module.exports = employeeLeaveValidationSchema;