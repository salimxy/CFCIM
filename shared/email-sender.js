import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST) {
      throw new Error("SMTP_HOST est requis pour envoyer des emails");
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    // N'inclure auth que si les deux credentials sont présents
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, from }) {
  const sender = from ?? process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!sender) {
    throw new Error("SMTP_FROM ou SMTP_USER requis pour l'expéditeur");
  }
  const info = await getTransporter().sendMail({ from: sender, to, subject, html });
  return info.messageId;
}
