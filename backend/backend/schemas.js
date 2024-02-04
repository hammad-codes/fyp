const baseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = baseJoi.extend(extension);

module.exports.adminSchema = Joi.object({
  name: Joi.string().required().escapeHTML(),
  cnic: Joi.string()
    .pattern(/^\d{13}$/)
    .required()
    .escapeHTML(),
  phone: Joi.string()
    .pattern(/^\+\d{12}$/)
    .required()
    .escapeHTML(),
  address: Joi.string().required().escapeHTML(),
  email: Joi.string().email().required().escapeHTML(),
  password: Joi.string().min(6).required().escapeHTML(),
});

module.exports.customerSchema = Joi.object({
  name: Joi.string().required().escapeHTML(),
  cnic: Joi.string()
    .pattern(/^\d{13}$/)
    .required()
    .escapeHTML(),
  phone: Joi.string()
    .pattern(/^\+\d{12}$/)
    .required()
    .escapeHTML(),
  address: Joi.string().required().escapeHTML(),
  email: Joi.string().email().required().escapeHTML(),
});

module.exports.emergencyRequestSchema = Joi.object({
  tripRef: Joi.string().required().escapeHTML(),
  routeRef: Joi.string().required().escapeHTML(),
  riderRef: Joi.string().required().escapeHTML(),
  locationRef: Joi.string().required().escapeHTML(),
  type: Joi.string().required().escapeHTML(),
  description: Joi.string().required().escapeHTML(),
});

module.exports.locationSchema = Joi.object({
  longitude: Joi.number().required(),
  latitude: Joi.number().required(),
});

module.exports.parcelSchema = Joi.object({
  locationRef: Joi.string().required().escapeHTML(),
  senderRef: Joi.string().required().escapeHTML(),
  receiverRef: Joi.string().required().escapeHTML(),
  weight: Joi.number().required(),
  readyTime: Joi.date().required(),
  dueTime: Joi.date().required(),
  expectedTime: Joi.date().required(),
  actualDeliveryTime: Joi.date().required(),
  status: Joi.string().required().escapeHTML(),
  serviceTime: Joi.number().required(),
  onTimeDelivery: Joi.boolean().required(),
});

module.exports.riderSchema = Joi.object({
  name: Joi.string().required().escapeHTML(),
  cnic: Joi.string()
    .pattern(/^\d{13}$/)
    .required()
    .escapeHTML(),
  phone: Joi.string()
    .pattern(/^\+\d{12}$/)
    .required()
    .escapeHTML(),
  address: Joi.string().required().escapeHTML(),
  email: Joi.string().email().required().escapeHTML(),
  password: Joi.string().min(6).required().escapeHTML(),
});

module.exports.subrouteSchema = Joi.object({
  tripRef: Joi.string().required().escapeHTML(),
  riderRef: Joi.string().required().escapeHTML(),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  parcels: Joi.array()
});

module.exports.tripSchema = Joi.object({
  nRiders: Joi.number().required(),
  nParcels: Joi.number().required(),
  nTWV: Joi.number().required(),
  totalDistance: Joi.number().required(),
  date: Joi.date().required(),
});
