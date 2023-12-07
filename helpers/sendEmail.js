import nodemailer from "nodemailer";
import "dotenv/config";

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

function sendEmail(message) {
  const email = { ...message, from: "yuliiaa.halaniuk@gmail.com" };
  return transport.sendMail(email);

  //   message.from = "yuliiaa.halaniuk@gmail.com";
}

export default sendEmail;
