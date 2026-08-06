const Joi = require('joi');
const menus = require("../constants/menus.constants");

const menuValues = Object.values(menus);

const permissionActionSchema = Joi.object({
  read: Joi.boolean().optional(),
  create: Joi.boolean().optional(),
  update: Joi.boolean().optional(),
  delete: Joi.boolean().optional(),
  list: Joi.boolean().optional(),
});

const permissionSchema = Joi.object({
  menu: Joi.string().valid(...menuValues).required().messages({
    'any.only': `Menu must be one of: ${menuValues.join(', ')}`,
    'any.required': 'Menu is required',
  }),
  actions: permissionActionSchema.required(),
});

const roleValidationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Role name is required',
    'string.min': 'Role name must be at least 2 characters',
    'string.max': 'Role name cannot exceed 50 characters',
  }),
  slug: Joi.string().lowercase().optional(),
  permissions: Joi.array().items(permissionSchema).min(1).required().messages({
    'any.required': 'At least one permission is required',
  }),
});

module.exports = roleValidationSchema;