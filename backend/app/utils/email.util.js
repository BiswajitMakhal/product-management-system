const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log("-----------------------------------------");
      console.log(`📧 [MOCK EMAIL] To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      console.log("-----------------------------------------");
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 2525),
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
       family: 4,//for render(cloud hosting server)
    });

    await transporter.sendMail({
      from: `"Product Management System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error.message);
    return false;
  }
};

module.exports = sendEmail;
