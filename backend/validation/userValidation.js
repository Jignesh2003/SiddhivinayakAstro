import Joi from "joi";

// done
export const signupValidation = Joi.object({
  email: Joi.string().email().max(100).lowercase().required(),

  firstName: Joi.string().max(30).required(),
  lastName: Joi.string().max(30).required(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({ "string.pattern.base": "Phone number must be 10 digits" })
    .allow("", null), // optional with empty string allowed

  address: Joi.string().max(1000).allow("", null),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .messages({ "string.pattern.base": "Pincode must be 6 digits" })
    .allow("", null),

  city: Joi.string().max(30).allow("", null),
  state: Joi.string().max(30).allow("", null),
  country: Joi.string().max(30).allow("", null),

  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      "string.pattern.base": "Password must be minimum 6 characters !",
    }),
  agreedToTerms: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the terms and conditions",
  }),
});

//done
export const loginSchema = Joi.object({
  email: Joi.string().lowercase().required().messages({
    "string.empty": "Email or phone is required",
  }).min(1).max(99),
  password: Joi.string().min(6).max(30).required().messages({
    "string.empty": "Password is required",
  }),
});

export const addReviewSchema = Joi.object({
  userId: Joi.string().required(),
  text: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  media: Joi.string().allow(null, ''),
});
