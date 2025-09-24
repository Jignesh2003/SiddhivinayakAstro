//sending email

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Explicitly set the SMTP host
  port: 587, // Use 587 for TLS (secure) or 465 for SSL
  secure: false, // Set to true for port 465, false for 587
  auth: {
    user: process.env.MAIN_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (email, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.ALIAS_EMAIL, // Sender name
      to: email,
      subject,
      text,
    });

    console.log("✅ Email sent successfully TO:",email,"FROM:",process.env.ALIAS_EMAIL);
  } catch (error) {
    console.error("🚨 Email send error:", error);
  }
};

export default sendEmail;
