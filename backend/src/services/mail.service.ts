import fs from "node:fs";
import path from "node:path";
import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "../config/env";

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class MailService {
  private smtpTransporter: Transporter | null = null;

  constructor() {
    // Inisialisasi transporter SMTP hanya jika konfigurasi driver aktif sebagai 'smtp'
    if (ENV.MAIL_MAILER === "smtp") {
      this.smtpTransporter = nodemailer.createTransport({
        host: ENV.MAIL_HOST,
        port: ENV.MAIL_PORT,
        secure: ENV.MAIL_PORT === 465,
        auth: {
          user: ENV.MAIL_USER,
          pass: ENV.MAIL_PASS,
        },
      });
    }
  }

  /**
   * Mengirim email menggunakan driver yang aktif ('log' atau 'smtp')
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    const fromAddress = `"${ENV.MAIL_FROM_NAME}" <${ENV.MAIL_FROM_ADDRESS}>`;

    if (ENV.MAIL_MAILER === "log") {
      await this.sendToLog(options, fromAddress);
      return;
    }

    if (!this.smtpTransporter) {
      throw new Error(
        "Koneksi SMTP belum diinisialisasi. Periksa kredensial MAIL_HOST dan MAIL_USER pada environment."
      );
    }

    await this.smtpTransporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  /**
   * Driver Log (Laravel-style): Menyimpan isi email ke file log dan terminal console
   */
  private async sendToLog(options: SendMailOptions, fromAddress: string): Promise<void> {
    const logDir = path.dirname(ENV.MAIL_LOG_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const mailContent = options.text || options.html || "(Konten email kosong)";

    const logEntry = [
      "=".repeat(80),
      `Date:    ${timestamp}`,
      `From:    ${fromAddress}`,
      `To:      ${options.to}`,
      `Subject: ${options.subject}`,
      "-".repeat(80),
      mailContent,
      "=".repeat(80),
      "\n",
    ].join("\n");

    fs.appendFileSync(ENV.MAIL_LOG_PATH, logEntry, "utf-8");

    // Ekstraksi URL tautan aksi untuk kemudahan testing langsung dari CLI
    const urlMatch = mailContent.match(/https?:\/\/[^\s"'<>]+/);
    const actionUrl = urlMatch ? urlMatch[0] : null;

    console.log(`\n📨 [MailService: LOG Driver] Email tercatat untuk: ${options.to}`);
    console.log(`   ├─ Subjek   : ${options.subject}`);
    if (actionUrl) {
      console.log(`   ├─ Aksi URL : ${actionUrl}`);
    }
    console.log(`   └─ File Log : ${path.relative(process.cwd(), ENV.MAIL_LOG_PATH)}`);
  }

  /**
   * Template email pemulihan / reset kata sandi
   */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = "Permintaan Reset Kata Sandi Akun NextShopID";

    const text = `Halo,

Kami menerima permintaan untuk mereset kata sandi akun NextShopID Anda.
Silakan klik atau salin tautan berikut di browser Anda untuk mengatur ulang kata sandi:

${resetUrl}

Catatan Keamanan:
- Tautan di atas berlaku selama 30 menit.
- Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.

Salam hangat,
Tim NextShopID`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
    .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Reset Kata Sandi Akun NextShopID</div>
    <div class="content">
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun NextShopID Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
      <div class="btn-wrapper">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Atur Ulang Kata Sandi</a>
      </div>
      <p>Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:</p>
      <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>Tautan ini hanya berlaku selama 30 menit. Abaikan email ini jika Anda tidak merasa melakukan permintaan.</p>
    </div>
  </div>
</body>
</html>`;

    await this.sendMail({
      to,
      subject,
      text,
      html,
    });
  }
}

export const mailService = new MailService();
