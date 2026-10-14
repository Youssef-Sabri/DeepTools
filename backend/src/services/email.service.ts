import nodemailer, { Transporter } from "nodemailer";

export interface SendMagicLinkOptions {
  email: string;
  magicLinkUrl: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    // In production with configured SMTP
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      return this.transporter;
    }

    // Zero-setup dev/test mode: create ephemeral Ethereal test account
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      // Fallback if ethereal is unreachable: json transport
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    return this.transporter;
  }

  async sendMagicLink({
    email,
    magicLinkUrl,
  }: SendMagicLinkOptions): Promise<void> {
    // 1. Direct console logger for immediate zero-friction developer testing
    console.log("\n=======================================================");
    console.log("📨 [MAGIC LINK EMAIL DISPATCHED]");
    console.log(`To: ${email}`);
    console.log(`Direct Access Link: ${magicLinkUrl}`);
    console.log("=======================================================\n");

    try {
      const transporter = await this.getTransporter();

      const info = await transporter.sendMail({
        from: '"DeepTools Support" <noreply@deeptools.ai>',
        to: email,
        subject:
          "Your DeepTools Lifetime Purchases Access Link | رابط الوصول الدائم لمشترياتك",
        text: `Hello,\n\nClick the link below to access your DeepTools digital purchases, lifetime licenses, and downloads:\n\n${magicLinkUrl}\n\nYour purchases are permanent. You can use this link to access and download your files anytime.\n\n---\nمرحباً،\n\nاضغط على الرابط التالي للوصول إلى مشترياتك وتراخيصك الدائمة وتنزيل ملفاتك في أي وقت:\n\n${magicLinkUrl}\n\nمشترياتك وتراخيصك دائمة مدى الحياة. يمكنك استخدام هذا الرابط للوصول والتحميل دائماً.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; border-radius: 12px; background: #0b0f19; color: #f8fafc;">
            <h2 style="color: #38bdf8; margin-top: 0;">DeepTools Lifetime Purchase Access</h2>
            <p style="color: #94a3b8; font-size: 15px;">Click the button below to access all your purchased tools and lifetime licenses anytime:</p>
            <div style="margin: 28px 0;">
              <a href="${magicLinkUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Access My Lifetime Purchases / الوصول إلى مشترياتي الدائمة
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px;">Your licenses are permanent with lifetime download rights. If you ever need a new access link in the future, you can request one anytime from DeepTools using your email.</p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🌐 Ethereal Test Inbox Preview: ${previewUrl}`);
      }
    } catch (err) {
      // Don't crash request if remote test transport has network issues; console log already captured it
      console.warn(
        "⚠️ Email transport note (link logged above):",
        (err as Error).message,
      );
    }
  }
}

export const emailService = new EmailService();
