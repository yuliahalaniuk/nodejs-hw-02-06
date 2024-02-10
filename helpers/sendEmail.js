import nodemailer from "nodemailer";
import "dotenv/config";

const { MAIL_USER, MAIL_PASSWORD, FROM_EMAIL } = process.env;

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD,
  },
});

function sendEmail(message) {
  message.from = FROM_EMAIL;
  return transport.sendMail(message);
}

export default sendEmail;
