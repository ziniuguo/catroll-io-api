import nodemailer from 'nodemailer';
import credentials from './credentials.json' assert { type: "json" };

export class MailSender {
    constructor(email, subject, content) {
        this.email = email;
        this.subject = subject;
        this.content = content;
        this.mailOpt = {
            from: credentials.mailerEmail,
            to: this.email,
            subject: this.subject,
            text: this.content
        }
    }
    transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
        auth: {
            user: credentials.mailerEmail,
            pass: credentials.mailerPwd,
        },
        secure: true
    });
}

