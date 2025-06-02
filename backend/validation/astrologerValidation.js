import Joi from "joi";

// 1. Astrologer Signup Schema
export const astrologerSignupSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().required().lowercase(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),

  gender: Joi.string().valid("male", "female", "other").required(),
  dob: Joi.date().iso().required(),
  location: Joi.string().allow(""),
  expertise: Joi.string().required(),
  yearsOfExperience: Joi.number().min(0).required(),
  bio: Joi.string().required(),
  languagesSpoken: Joi.array().items(Joi.string()).required(),
  pricePerMinute: Joi.number().min(0).required(),
  role: Joi.string().valid("astrologer", "user", "admin").required(),
  country: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
});

// 2. Astrologer List Query Schema
export const astrologerListQuerySchema = Joi.object({
  isOnline: Joi.string().valid("true", "false").optional(),
  // future: expertise, price ranges, etc.
});

