import Joi from "joi";

export const signupSchema = Joi.object({
  email: Joi.string().email().max(50).lowercase().required(),
  firstName: Joi.string().max(30).required(),
  lastName: Joi.string().max(30).required(),
  phone: Joi.string().max(15).optional().allow(""),
  address: Joi.string().max(100).optional().allow(""),
  pincode: Joi.string().max(10).optional().allow(""),
  city: Joi.string().max(30).optional().allow(""),
  state: Joi.string().max(30).optional().allow(""),
  country: Joi.string().max(30).optional().allow(""),
  password: Joi.string().min(6).max(30).required(),
});


export const loginSchema = Joi.object({
  email: Joi.string().lowercase().required().messages({
    "string.empty": "Email or phone is required",
  }).min(1).max(99),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});



export const sendOtpSchema = Joi.object({
  userId: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  userId: Joi.string().required(),
  otp: Joi.string().length(6).required(),
});

export const addReviewSchema = Joi.object({
  userId: Joi.string().required(),
  text: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  media: Joi.string().allow(null, ''),
});
