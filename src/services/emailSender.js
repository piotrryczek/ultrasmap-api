import nodemailer from 'nodemailer';
import { EMAIL_FROM } from '@config/config';

class EmailSender {
  constructor() {
    this.transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  sendEmail = async ({ to, subject, html, attachments = {} }) => {
    await this.transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    });
  }
}

export default new EmailSender();
