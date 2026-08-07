const Joi = require('joi');

const createEventValidationSchema = Joi.object({
  people: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Each attendee ID must be a valid 24-character hex string',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Event must have at least one attendee',
      'any.required': 'Attendees are required',
      'array.base': 'Attendees must be an array',
    }),
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'any.required': 'Event title is required',
      'string.empty': 'Event title cannot be empty',
      'string.min': 'Event title must be at least 1 character',
      'string.max': 'Event title cannot exceed 200 characters',
    }),
  allDay: Joi.boolean()
    .required()
    .messages({
      'any.required': 'All day status is required',
      'boolean.base': 'All day must be true or false',
    }),
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'Event start date is required',
      'date.format': 'Start date must be a valid ISO date',
      'date.base': 'Start date must be a valid date',
    }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'any.required': 'Event end date is required',
      'date.format': 'End date must be a valid ISO date',
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after or equal to start date',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
});

const updateEventValidationSchema = Joi.object({
  people: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Each attendee ID must be a valid 24-character hex string',
        })
    )
    .min(1)
    .optional()
    .messages({
      'array.min': 'Event must have at least one attendee',
      'array.base': 'Attendees must be an array',
    }),
  title: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Event title cannot be empty',
      'string.min': 'Event title must be at least 1 character',
      'string.max': 'Event title cannot exceed 200 characters',
    }),
  allDay: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'All day must be true or false',
    }),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid ISO date',
      'date.base': 'Start date must be a valid date',
    }),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be a valid ISO date',
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after or equal to start date',
    }),
  status: Joi.string()
    .valid('scheduled', 'cancelled', 'completed')
    .optional()
    .messages({
      'any.only': 'Event status must be one of: scheduled, cancelled, completed',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
});

module.exports = {
  createEventValidationSchema,
  updateEventValidationSchema,
};