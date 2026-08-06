const Joi = require('joi');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const notificationSettingValidationSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Customer ID format.'
  }),
  emailNotifications: Joi.boolean().optional().messages({
    'boolean.base': 'Email notifications must be true or false.'
  }),
  smsNotifications: Joi.boolean().optional().messages({
    'boolean.base': 'SMS notifications must be true or false.',
  }),
  whatsappNotifications: Joi.boolean().optional().messages({
    'boolean.base': 'WhatsApp notifications must be true or false.',
  })
});


module.exports = notificationSettingValidationSchema;
