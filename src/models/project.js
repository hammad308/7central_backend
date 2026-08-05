"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileAttachmentSchema = new Schema(
  {
    clientFileName: {
      type: String,
      required: [true, "Attached file name is required."]
    },
    fileNameOnServerDisk: {
      type: String,
      required: [true, "Name of file stored on server's disk is required."]
    }
  }
);

const projectSchema = new Schema(
  {
    projectID: {
      type: Number,
      default: null
    },
    projectName: {
      type: String,
      required: [true, "Project Name is required."],
    },
    projectCreator: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Project Creator is required."]
    },
    projectOwnerCompany: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    projectOwnerEmployee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Project Manager is required."]
    },
    siteEngineers: [ {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    } ],
    staffMembers: [ {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    } ],
    projectCategory: {
      type: Schema.Types.ObjectId,
      ref: "ProjectCategory",
      required: [true, "Project Category is required."]
    },
    coveredArea: {
      type: Number,
      required: [true, "Covered area in sq. ft. is required."]
    },
    plotArea: {
      type: Number,
      required: [true, "Plot area in sq. ft. is required."]
    },
    numberOfUnits: {
      type: Number,
      default: null
    },
    projectPictures: [ {
      type: String,
    } ],
    projectSoilReport: {
      type: fileAttachmentSchema,
      default: null
    },
    projectBOQDocument: {
      type: fileAttachmentSchema,
      default: null
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

module.exports = mongoose.model("Project", projectSchema);