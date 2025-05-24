import rateLimit from "express-rate-limit"


// Rate limiting for OTP and password reset
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 3 requests per windowMs
    message: "Too many requests, please try again later.",
  });

  export default otpLimiter