const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 2525),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  family: 4, //for render (cloud hosting server)
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Product Management System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email error:", error.code, error.message);
    return false;
  }
};

module.exports = sendEmail;