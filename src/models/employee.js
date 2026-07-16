const mongoose = require("mongoose");
const { Schema } = mongoose;

const degreeSchema = new Schema(
  {
    years_of_education: {
      type: Number,
      required: [true, "Years of education is required"],
      enum: [10, 12, 16, 18], // - 10 years of edu, - 12 years of edu
    },
    degree_title: {
      type: String,
      required: [true, "Degree title is required"],
    },
    awarding_org: { //university or board
      type: String,
      required: [true, "Degree awarding organization is required"],
    },
    passing_year: {
      type: Number,
      required: [true, "Passing year is required"],
    },
    obtained_marks: { // Marks or CGPA
      type: Number,
      required: [true, "Obtained marks or CGPA is required"],
    },
    total_marks: { // Marks or CGPA
      type: Number,
      required: [true, "Total marks or CGPA is required"],
    },
  }
);

const employeeSchema = new Schema(
  {
    employeeID: {
      type: Number,
      default: null
    },
    full_name: { //full name
      type: String,
      required: [true, 'Full name is required.'],
      trim: true, //trim setter
    },
    father_name: { //Father's full name
      type: String,
      required: [true, 'Father full name is required.'],
      trim: true, //trim setter
    },
    custom_id: { //e.g. Techno-A-12345678
      type: String,
      required: [true, 'Employee custom ID is required.'],
    },
    picture: {
      type: String,
      default: null,
    },
    employment_status: {
      type: Number,
      enum: [0, 1, 2, 3], // 0 - active, 1 - onleave, 2 - terminated, 3 - resigned
      required: [true, 'Employment status is required.'],
    },
    gender: {
      type: Number,
      required: [true, 'Gender is required.'],
      enum: [0, 1, 2], // 0 - Male, 1 - Female, 2 - Others
    },
    email: {
      type: String,
      unique: true, //unique index
      required: [true, 'Email is required.'],
    },
    roleID: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Employee role id is required."]
    },
    role_slug: {
      type: String,
      lowercase: true,
      required: [true, 'Role slug is required.'],
    },
    workingShift: {
      type: Schema.Types.ObjectId,
      ref: "WorkingHour",
      required: [true, "Employee's working shift is required."]
    },
    birthdate: {
      type: Date,
      required: [true, 'Birth date is required.'],
    },
    joining_date: {
      type: Date,
      required: [true, 'Joining date is required.'],
    },
    cnic_number: {
      type: String,
      default: null,
    },
    mobile_phone_number: {
      type: String,
      required: [true, 'Phone number is required.'],
    },
    referred_by: {
      type: String,
      default: null,
    },
    permanent_address: {
      type: String,
      required: [true, 'Permanent address is required.'],
    },
    mailing_address: {
      type: String,
      default: null,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required.'],
    },
    company: { //An employee can work for only one department at a time.
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Employee's company is required."]
    },
    department: { //An employee can work for only one company at a time
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Employee's department is required."]
    },
    degrees: [degreeSchema],
    cnic_front: {
      type: String,
      default: null,
    },
    cnic_back: {
      type: String,
      default: null,
    },
    resume: { //should accept only pdf file
      type: String,
      default: null
    },
    police_certificate: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Employee", employeeSchema);