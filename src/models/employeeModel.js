const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const degreeSchema = new Schema({
  yearsOfEducation: {
    type: Number,
    required: [true, 'Years of education is required'],
    enum: [10, 12, 16, 18],
  },
  degreeTitle: {
    type: String,
    required: [true, 'Degree title is required'],
  },
  awardingOrg: {
    type: String,
    required: [true, 'Degree awarding organization is required'],
  },
  passingYear: {
    type: Number,
    required: [true, 'Passing year is required'],
  },
  obtainedMarks: {
    type: Number,
    required: [true, 'Obtained marks or CGPA is required'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks or CGPA is required'],
  },
});

const employeeSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    customId: {
      type: String,
      unique: true,
      required: [true, 'Employee custom ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      default: null,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    image: {
      type: String,
      default: null,
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_leave', 'terminated', 'resigned'],
      required: [true, 'Employment status is required'],
      default: 'active',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Employee role is required'],
    },
    roleSlug: {
      type: String,
      lowercase: true,
      required: [true, 'Role slug is required'],
    },
    workingShift: {
      type: Schema.Types.ObjectId,
      ref: 'WorkingHour',
      required: [true, 'Working shift is required'],
    },
    birthDate: {
      type: Date,
      required: [true, 'Birth date is required'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    referredBy: {
      type: String,
      default: null,
    },
    permanentAddress: {
      type: String,
      required: [true, 'Permanent address is required'],
    },
    mailingAddress: {
      type: String,
      default: null,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Employee company is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Employee department is required'],
    },
    degrees: [degreeSchema],
    cnicFront: {
      type: String,
      default: null,
    },
    cnicBack: {
      type: String,
      default: null,
    },
    resume: {
      type: String,
      default: null,
    },
    policeCertificate: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);