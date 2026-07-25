const Joi = require('joi');

const permissionActionSchema = Joi.object({
  read: Joi.boolean().optional(),
  create: Joi.boolean().optional(),
  update: Joi.boolean().optional(),
  delete: Joi.boolean().optional(),
  list: Joi.boolean().optional(),
});

const permissionSchema = Joi.object({
  menu: Joi.string().required(),
  actions: permissionActionSchema.required(),
});

const roleValidationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Role name is required',
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name cannot exceed 50 characters',
  }),
  slug: Joi.string().lowercase().optional(), // optional; if not given, auto‑generate from name
  permissions: Joi.array().items(permissionSchema).min(1).required().messages({
    'any.required': 'At least one permission is required',
  }),
});

module.exports = roleValidationSchema;