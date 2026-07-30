const APP_NAME = 'The Prestige';
const APP_SHORT_NAME = 'WAJ';

const CUSTOMER_PARTNER_TYPES = ["joint", "next_of_kin"];
const DOCUMENT_ASSIGN_TYPES = ["customer", "inventory", "next_of_kin"];
const CUSTOMER_RELATION_TYPES = [
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Grandson",
  "Granddaughter",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "other"
];
const DOCUMENT_TYPES = [
  "cnic",
  "passport",
  "driving_license",
  "utility_bill",
  "picture",
  "application_form",
  "reference_letter",
  "payment_receipt",
  "payment_plan",
  "booking_form",
  "sale_agreement",
  "purchase_agreement",
  "allotment_letter",
  "intimation_letter",
  "transfer_letter",
  "noc",
  "ownership_letter",
  "other"
];

const INSTALLMENT_TYPE = [
  'full_payment', 'down_payment', 'allocation', 'confirmation', 'possession',
  'regular', 'balloon', 'quarterly', 'monthly', 'monthly_balloon'
];
const INSTALLMENT_STATUS = ['un-paid', 'paid', 'overdue', 'defaulted', 'waived', 'pertially_paid', 'pending', 'approved'];

const INVENTORY_TYPES = [
  "residential", "commercial", "appartment", "kiosk", "pent_house", "others"
];
const OWNERSHIP_TYPES = [
  "self",
  "joint",
];
const PAYMENT_TYPES = [
  "full_payment",
  "installment",
];
const SALE_STATUS = [
  'draft', 'active', 'completed', 'cancelled', 'defaulted', 'transferred'
];

const LEAD_SOURCE = [
  'campaign', 'google_ads_search', 'dealer', 'walking_customer'
];

const CAMPAIGN_TYPES = [
  'public_realtion', 'brand', 'media'
];

const CAMPAIGN_PERIOD = [
  'day', 'weekly', 'monthly'
];

const LEAD_RESPONSE_TYPES = [
  'interested', 'future_plan', 'follow_up', 'schedule_visit', 'contact_later', 'successfull', 'not_interested', 'irrelevant', 'not_contacted'
];


//Prefixes for auto increment IDs
const PREFIX_PROJECT_AUTOINCREMENTID = `PT-${APP_SHORT_NAME}-`;
const PREFIX_SECTOR_AUTOINCREMENTID = `SE-${APP_SHORT_NAME}-`;
const PREFIX_INVENTORY_AUTOINCREMENTID = `INV-${APP_SHORT_NAME}-`;
const PREFIX_CUSTOMER_AUTOINCREMENTID = `${APP_SHORT_NAME}-`;
const PREFIX_JOINT_AUTOINCREMENTID = `JT-${APP_SHORT_NAME}-`;
const PREFIX_KIN_AUTOINCREMENTID = `KIN-${APP_SHORT_NAME}-`;
const PREFIX_INSTALLMENT_AUTOINCREMENTID = `INST-${APP_SHORT_NAME}-`;
const PREFIX_RECEIPT_AUTOINCREMENTID = `IN-${APP_SHORT_NAME}-`;
const PREFIX_DOCUMENT_AUTOINCREMENTID = `DOC-${APP_SHORT_NAME}-`;
const PREFIX_COMPANY_AUTOINCREMENTID = `CO-${APP_SHORT_NAME}-`;
const PREFIX_DEPARTMENT_AUTOINCREMENTID = `DP-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_AUTOINCREMENTID = `EMP-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_ATTENDANCE_AUTOINCREMENTID = `ATT-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_BONUS_AUTOINCREMENTID = `BON-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID = `CMP-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_INCREMENT_AUTOINCREMENTID = `INC-${APP_SHORT_NAME}-`;
const PREFIX_EMPLOYEE_LEAVE_AUTOINCREMENTID = `LEA-${APP_SHORT_NAME}-`;
const PREFIX_LEAVERULE_AUTOINCREMENTID = `LR-${APP_SHORT_NAME}-`;
const PREFIX_WORKINGHOUR_AUTOINCREMENTID = `WH-${APP_SHORT_NAME}-`;
const PREFIX_PUBLICHOLIDAY_AUTOINCREMENTID = `PH-${APP_SHORT_NAME}-`;
const PREFIX_REFERAL_AUTOINCREMENTID = `REF-${APP_SHORT_NAME}-`;
const PREFIX_BLOCKORFLOOR_AUTOINCREMENTID = `BF-${APP_SHORT_NAME}-`;
const PREFIX_DEALER_AUTOINCREMENTID = `DLR-${APP_SHORT_NAME}-`;

const NUMBERS_DIR = "numbers";


module.exports = {
  APP_NAME, APP_SHORT_NAME,
  PREFIX_PROJECT_AUTOINCREMENTID,
  PREFIX_SECTOR_AUTOINCREMENTID, PREFIX_RECEIPT_AUTOINCREMENTID,
  PREFIX_INVENTORY_AUTOINCREMENTID, PREFIX_CUSTOMER_AUTOINCREMENTID,
  PREFIX_INSTALLMENT_AUTOINCREMENTID,
  PREFIX_DOCUMENT_AUTOINCREMENTID,
  CUSTOMER_PARTNER_TYPES,
  CUSTOMER_RELATION_TYPES,
  DOCUMENT_TYPES,
  DOCUMENT_ASSIGN_TYPES,
  INVENTORY_TYPES,
  PREFIX_JOINT_AUTOINCREMENTID,
  PREFIX_KIN_AUTOINCREMENTID,
  SALE_STATUS,
  INSTALLMENT_TYPE,
  INSTALLMENT_STATUS,
  LEAD_SOURCE,
  LEAD_RESPONSE_TYPES,
  OWNERSHIP_TYPES,
  PAYMENT_TYPES,
  CAMPAIGN_TYPES,
  CAMPAIGN_PERIOD,
  NUMBERS_DIR,
  PREFIX_COMPANY_AUTOINCREMENTID,
  PREFIX_DEPARTMENT_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_ATTENDANCE_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_BONUS_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_INCREMENT_AUTOINCREMENTID,
  PREFIX_EMPLOYEE_LEAVE_AUTOINCREMENTID,
  PREFIX_LEAVERULE_AUTOINCREMENTID,
  PREFIX_WORKINGHOUR_AUTOINCREMENTID,
  PREFIX_PUBLICHOLIDAY_AUTOINCREMENTID,
  PREFIX_REFERAL_AUTOINCREMENTID,
  PREFIX_BLOCKORFLOOR_AUTOINCREMENTID,
  PREFIX_DEALER_AUTOINCREMENTID
};