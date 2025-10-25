import Joi from "joi";

// ✅ Updated for simplified signup form
export const signupValidation = Joi.object({
  // Required fields
  email: Joi.string().email().max(100).lowercase().required(),
  firstName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  lastName: Joi.string().max(30).allow("", null).optional().default(""), // Optional, can be empty
  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters!",
      "string.empty": "Password is required",
    }),
  agreedToTerms: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the terms and conditions",
  }),

  // COMMENTED OUT: Not needed for simplified signup
  // phone: Joi.string()
  //   .pattern(/^[0-9]{10}$/)
  //   .messages({ "string.pattern.base": "Phone number must be 10 digits" })
  //   .allow("", null),

  // address: Joi.string().max(1000).allow("", null),

  // pincode: Joi.string()
  //   .pattern(/^[0-9]{6}$/)
  //   .messages({ "string.pattern.base": "Pincode must be 6 digits" })
  //   .allow("", null),

  // city: Joi.string().max(30).allow("", null),
  // state: Joi.string().max(30).allow("", null),
  // country: Joi.string().max(30).allow("", null),
});

// done - kept as is
export const loginSchema = Joi.object({
  email: Joi.string().lowercase().required().messages({
    "string.empty": "Email or phone is required",
  }).min(1).max(99),
  password: Joi.string().min(6).max(30).required().messages({
    "string.empty": "Password is required",
  }),
});

// done - kept as is
export const addReviewSchema = Joi.object({
  userId: Joi.string().required(),
  text: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  media: Joi.string().allow(null, ''),
});
