const Joi = require("joi");
const { DOCUMENT_TYPES, DOCUMENT_ASSIGN_TYPES } = require("../constants/app.constants");
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const customerDocumentValidationSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Customer ID format.'
  }),
  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required()
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),
  name: Joi.string().required().messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),
  other: Joi.string().optional().messages({
    'string.base': 'Document others must be a string',
    'string.empty': 'Other Field is optional but it cannot be empty'
  }),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().dataUri().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
          'string.dataUri': 'File URL must be a valid Data URI.'
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required."
    })
});

const inventoryDocumentValidationSchema = Joi.object({
  customer: objectId.optional().allow(null, '').messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Customer ID format.'
  }),
  inventory: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Inventory ID format.'
  }),
  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required()
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),
  name: Joi.string().required().messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),
  other: Joi.string().optional().messages({
    'string.base': 'Document others must be a string',
    'string.empty': 'Other Field is optional but it cannot be empty'
  }),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().dataUri().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
          'string.dataUri': 'File URL must be a valid Data URI.'
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required."
    })
});

const createNextOfKinValidationSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.base": "Document Name must be a string",
    "any.required": "Document Name is rerquired"
  }),
  nextOfKin: objectId.required().messages({
    "any.required": "Partner ID is required",
    "string.base": "Partner ID must be a string",
    'string.pattern.base': 'Invalid Partner ID format.'
  }),
  type: Joi.string().required()
    .valid(...DOCUMENT_TYPES)
    .label('Document Type')
    .messages({
      'any.only': '{#label} must be one of the following: {#valids}',
      'string.base': 'Document Type must be a string',
      'any.required': 'Document Type is required'
    }),
  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().dataUri().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
          'string.dataUri': 'File URL must be a valid Data URI.'
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required."
    }),
  other: Joi.string().optional().messages({
    'string.base': 'Document others must be a string',
    'string.empty': 'Other Field is optional but it cannot be empty'
  })
});

const updateDocumentValidationSchema = Joi.object({


  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .optional()
    .allow(null)
    .messages({
      "any.required": "Document type is required.",
      "string.base": "Document type must be a string.",
      "any.only": `Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`,
    }),


  name: Joi.string().optional().allow(null).messages({
    "any.required": "Document name is required.",
    "string.base": "Document name must be a string.",
  }),

  attachments: Joi.array()
    .items(
      Joi.object({
        fileUrl: Joi.string().dataUri().required().messages({
          "any.required": "File URL is required in each attachment.",
          "string.base": "File URL must be a string.",
          'string.dataUri': 'File URL must be a valid Data URI.'
        }),
        tags: Joi.array().items(Joi.string()).default([]),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one attachment is required.",
      "any.required": "Attachments are required."
    }),

  other: Joi.string().optional().messages({
    'string.base': 'Document others must be a string',
    'string.empty': 'Other Field is optional but it cannot be empty'
  })
});

module.exports = { customerDocumentValidationSchema, inventoryDocumentValidationSchema, updateDocumentValidationSchema, createNextOfKinValidationSchema };
