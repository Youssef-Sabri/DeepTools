import nodemailer, { Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Generic SMTP transport. Callers must provide their own authenticated flow. */
export class EmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP transport is not configured");
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return this.transporter;
  }

  async send(options: SendEmailOptions): Promise<void> {
    const transporter = await this.getTransporter();
    await transporter.sendMail({
      from: '"DeepTools" <noreply@deeptools.ai>',
      ...options,
    });
  }
}

export const emailService = new EmailService();
