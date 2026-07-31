const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    permissions: [
      {
        _id:false,
        menu: { type: String, required: true },
        actions: {
          read: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          list: { type: Boolean, default: false },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', RoleSchema);