import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Explicitly set the SMTP host
  port: 587, // Use 587 for TLS (secure) or 465 for SSL
  secure: false, // Set to true for port 465, false for 587
  auth: {
    user: 'jokerdclown01@gmail.com',
    pass: 'nbho gytl cxhv qkxn',
  },
});

const sendEmail = async (email, subject, text) => {
  try {
    await transporter.sendMail({
      from:process.env.EMAIL_USER, // Sender name
      to: email,
      subject,
      text,
    });

    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("🚨 Email send error:", error.response || error.message);

  }
};

export default sendEmail;
