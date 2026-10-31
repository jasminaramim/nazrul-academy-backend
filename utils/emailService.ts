import nodemailer from 'nodemailer';
import { EmailLog, EmailLogType, EmailLogStatus, IEmailLog } from '../model/emailLogModel';

interface DonationApprovalEmailParams {
  to: string;
  donorName: string;
  amount: number;
  transactionId?: string;
  paymentMethod?: string;
  batch?: string;
  donorId?: string;
}

interface StudentApprovalEmailParams {
  to: string;
  studentName: string;
  batch: string;
  phone?: string;
  registrationFee?: number;
  transactionId?: string;
  paymentMethod?: string;
  studentId?: string;
  cardImageData?: string;
}

interface OtpEmailParams {
  to: string;
  otp: string;
  purpose: 'registration' | 'password_reset' | 'admin_login';
}

// Official Google Gmail configuration for instant 1-second 100% inbox delivery
const DEFAULT_GMAIL_USER = 'nazrulacademydarirampur@gmail.com';
const DEFAULT_GMAIL_PASS = 'gpwnaalf rffdboyk';

// Smart Multi-Engine Email Dispatcher:
// Tier 1: Gmail Port 587 TLS (Direct Google SMTP, avoids shared-hosting Port 465 blocking)
// Tier 2: HostSeba Domain Mail Port 587 (Local server delivery, 100% accessible on HostSeba)
export async function sendMailWithSmartFallback(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}): Promise<{ messageId: string; response: string; provider: string }> {
  const gmailUser = (process.env.EMAIL_USER || DEFAULT_GMAIL_USER).trim();
  const gmailPass = (process.env.EMAIL_PASS || DEFAULT_GMAIL_PASS).replace(/\s+/g, '');

  // 1. Try Gmail via Port 587 (TLS)
  try {
    const gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
      tls: { rejectUnauthorized: false }
    });

    const info = await gmailTransporter.sendMail({
      from: `"ত্রিশাল নজরুল একাডেমি" <${gmailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log(`[EmailService] ✅ Sent via Gmail Port 587 to: "${options.to}" | MessageId: ${info.messageId}`);
    return { messageId: info.messageId, response: info.response, provider: 'gmail_587' };
  } catch (gmailErr: any) {
    console.warn(`[EmailService] ⚠️ Gmail 587 attempt failed (${gmailErr.message}). Switching to HostSeba Domain SMTP fallback...`);
  }

  // 2. Fallback: HostSeba Domain SMTP on Port 587
  const host = process.env.SMTP_HOST || 'mail.nazrul-academy-alumni.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'info@nazrul-academy-alumni.com';
  const pass = process.env.SMTP_PASS || '@Nazrul64249109#';

  const hostsebaTransporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  const info = await hostsebaTransporter.sendMail({
    from: `"ত্রিশাল নজরুল একাডেমি" <${user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });

  console.log(`[EmailService] ✅ Sent via HostSeba Domain SMTP to: "${options.to}" | MessageId: ${info.messageId}`);
  return { messageId: info.messageId, response: info.response, provider: 'hostseba_smtp' };
}

// Helper to record email log in MongoDB
export async function recordEmailLog({
  recipientEmail,
  recipientName,
  type,
  subject,
  relatedId,
  status,
  errorMessage,
  metadata,
  htmlContent,
}: {
  recipientEmail: string;
  recipientName: string;
  type: EmailLogType;
  subject: string;
  relatedId?: string;
  status: EmailLogStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
  htmlContent?: string;
}): Promise<IEmailLog | null> {
  try {
    const logId = 'eml-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newLog = await EmailLog.create({
      id: logId,
      recipientEmail,
      recipientName,
      type,
      subject,
      relatedId,
      status,
      attempts: 1,
      lastAttemptAt: new Date(),
      errorMessage: errorMessage || null,
      metadata,
      htmlContent,
    });
    return newLog;
  } catch (err: any) {
    console.error('Failed to record EmailLog in database:', err.message);
    return null;
  }
}

// 0. Send OTP Email
export async function sendOTPEmail({ to, otp, purpose }: OtpEmailParams): Promise<{ success: boolean; message: string; logId?: string }> {
  const subject = purpose === 'password_reset' 
    ? 'নজরুল একাডেমী অ্যালামনাই - পাসওয়ার্ড রিসেট ওটিপি (OTP)'
    : purpose === 'admin_login'
    ? 'নজরুল একাডেমি - অ্যাডমিন লগইন সিকিউরিটি ওটিপি (2FA OTP)'
    : 'নজরুল একাডেমী অ্যালামনাই - ইমেইল ভেরিফিকেশন কোড';
    
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #00732A 0%, #005c21 60%, #0f172a 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">নজরুল একাডেমি অ্যালামনাই</h1>
      </div>
      <div style="padding: 28px 24px; color: #1e293b; text-align: center;">
        <h2 style="font-size: 20px; color: #00732A; font-weight: 700;">আপনার ওটিপি (OTP) কোড</h2>
        <p style="font-size: 15px; color: #64748b; margin-bottom: 24px;">দয়া করে নিচের ৬-ডিজিটের কোডটি ব্যবহার করুন:</p>
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f172a; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">কোডটি আগামী ১০ মিনিট পর্যন্ত কার্যকর থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে এটি এড়িয়ে যান।</p>
      </div>
    </div>
  `;

  try {
    if (!to || !to.includes('@')) {
      console.warn(`[EmailService] ⚠️ Invalid recipient email: ${to}`);
      return { success: false, message: 'সঠিক ইমেইল দিন' };
    }

    console.log(`[EmailService] 📤 Sending OTP email to: "${to}" | Purpose: ${purpose}`);

    const sendResult = await sendMailWithSmartFallback({
      to,
      subject,
      html: htmlContent,
    });

    const log = await recordEmailLog({
      recipientEmail: to,
      recipientName: 'অ্যাডমিন / সদস্য',
      type: 'otp_verification',
      subject,
      status: 'sent',
      metadata: { purpose, messageId: sendResult.messageId, provider: sendResult.provider },
      htmlContent,
    });

    return { success: true, message: 'ওটিপি পাঠানো হয়েছে।', logId: log?.id };
  } catch (error: any) {
    console.error(`[EmailService] ❌ Failed to send OTP to "${to}":`, error.message);

    const log = await recordEmailLog({
      recipientEmail: to || 'unknown',
      recipientName: 'অ্যাডমিন / সদস্য',
      type: 'otp_verification',
      subject,
      status: 'failed',
      errorMessage: error.message || 'ইমেইল সেন্ড ত্রুটি',
      metadata: { purpose },
      htmlContent,
    });

    return { success: false, message: 'ইমেইল পাঠানো সম্ভব হয়নি: ' + error.message, logId: log?.id };
  }
}

// 1. Send Donation Approval Email
export async function sendDonationApprovalEmail({
  to,
  donorName,
  amount,
  transactionId,
  paymentMethod,
  batch,
  donorId,
}: DonationApprovalEmailParams): Promise<{ success: boolean; message: string; logId?: string }> {
  const subject = 'নজরুল একাডেমী  অ্যালামনাই - আপনার অনুদান সফলভাবে অনুমোদিত হয়েছে 🎉';
  const formattedAmount = Number(amount).toLocaleString('bn-BD');
  const methodLabel =
    paymentMethod === 'bkash'
      ? 'বিকাশ (bKash)'
      : paymentMethod === 'nagad'
      ? 'নগদ (Nagad)'
      : paymentMethod === 'rocket'
      ? 'রকেট (Rocket)'
      : paymentMethod === 'bank'
      ? 'ব্যাংক ট্রান্সফার'
      : paymentMethod || 'অনলাইন পেমেন্ট';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00732A 0%, #005c21 60%, #CA0000 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">নজরুল একাডেমি অ্যালামনাই অ্যাসোসিয়েশন</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">প্রাক্তন ছাত্র-ছাত্রী অ্যালামনাই অ্যাসোসিয়েশন ও পুনর্মিলনী উৎসব ২০২৬</p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px;">
            🎉
          </div>
          <h2 style="margin: 14px 0 6px; font-size: 20px; color: #00732A; font-weight: 700;">অনুদান নিশ্চিতকরণ ও আন্তরিক ধন্যবাদ</h2>
          <p style="margin: 0; font-size: 14px; color: #64748b;">আপনার অনুদানটি সফলভাবে যাচাই ও অনুমোদন করা হয়েছে।</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          শ্রদ্ধেয় <strong>${donorName}</strong> (${batch || 'সম্মানিত শুভানুধ্যায়ী'}),<br/>
          ত্রিশাল সরকারি নজরুল একাডেমির শতবর্ষ উদযাপন ও ঐতিহাসিক পুনর্মিলনী ২০২৬-এ আপনার মহতী অনুদানের জন্য আমরা আন্তরিকভাবে কৃতজ্ঞ।
        </p>

        <!-- Receipt Details Table -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            রসিদ বিবরণী (Donation Receipt)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">দাতার নাম:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #1e293b;">${donorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">অনুদানের পরিমাণ:</td>
              <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #00732A; font-size: 16px;">৳ ${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">পেমেন্ট মাধ্যম:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #1e293b;">${methodLabel}</td>
            </tr>
            ${
              transactionId
                ? `<tr>
                    <td style="padding: 6px 0; color: #64748b;">ট্রানজেকশন আইডি:</td>
                    <td style="padding: 6px 0; font-weight: 600; font-family: monospace; text-align: right; color: #0f172a;">${transactionId}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding: 6px 0; color: #64748b;">স্ট্যাটাস:</td>
              <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #059669;">অনুমোদিত (Approved)</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0;">
          আপনার এই অনুদান উৎসব ও আমাদের প্রিয় বিদ্যাপীঠের অবকাঠামোগত উন্নয়নে গুরুত্বপূর্ণ অবদান রাখবে। আমাদের অফিসিয়াল ওয়েবসাইটে সম্মানিত দাতা তালিকায় আপনার নাম অন্তর্ভুক্ত করা হয়েছে।
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px;">ত্রিশাল সরকারি নজরুল একাডেমি অ্যালামনাই অ্যাসোসিয়েশন</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">নজরুল রোড, ত্রিশাল, ময়মনসিংহ | হেল্পলাইন: +880 1797-585073</p>
      </div>
    </div>
  `;

  try {
    if (!to || !to.includes('@')) {
      const err = 'প্রদত্ত ইমেইল সঠিক নয়।';
      const log = await recordEmailLog({
        recipientEmail: to || 'unknown',
        recipientName: donorName,
        type: 'donation_approval',
        subject,
        relatedId: donorId || transactionId,
        status: 'failed',
        errorMessage: err,
        metadata: { amount, transactionId, paymentMethod, batch },
        htmlContent,
      });
      return { success: false, message: err, logId: log?.id };
    }

    const sendResult = await sendMailWithSmartFallback({
      to,
      subject,
      html: htmlContent,
    });

    const log = await recordEmailLog({
      recipientEmail: to,
      recipientName: donorName,
      type: 'donation_approval',
      subject,
      relatedId: donorId || transactionId,
      status: 'sent',
      metadata: { amount, transactionId, paymentMethod, batch },
      htmlContent,
    });

    return { success: true, message: 'নিশ্চিতকরণ ইমেইল সফলভাবে পাঠানো হয়েছে।', logId: log?.id };
  } catch (error: any) {
    console.error('Failed to send donation approval email:', error);
    const log = await recordEmailLog({
      recipientEmail: to || 'unknown',
      recipientName: donorName,
      type: 'donation_approval',
      subject,
      relatedId: donorId || transactionId,
      status: 'failed',
      errorMessage: error.message || 'ইমেইল সেন্ড ত্রুটি',
      metadata: { amount, transactionId, paymentMethod, batch },
      htmlContent,
    });
    return { success: false, message: error.message || 'ইমেইল পাঠানো সম্ভব হয়নি।', logId: log?.id };
  }
}

// 2. Send Student Registration Approval Email
export async function sendStudentApprovalEmail({
  to,
  studentName,
  batch,
  phone,
  registrationFee,
  transactionId,
  paymentMethod,
  studentId,
  cardImageData,
}: StudentApprovalEmailParams): Promise<{ success: boolean; message: string; logId?: string }> {
  const subject = 'নজরুল একাডেমী  অ্যালামনাই - আপনার রেজিস্ট্রেশন সফলভাবে অনুমোদিত হয়েছে 🏫';
  const formattedFee = registrationFee ? Number(registrationFee).toLocaleString('bn-BD') : '০';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00732A 0%, #005c21 60%, #0f172a 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">নজরুল একাডেমি অ্যালামনাই অ্যাসোসিয়েশন</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">ঐতিহাসিক শতবর্ষ পূর্তি ও মহা পুনর্মিলনী উৎসব ২০২৬</p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 26px;">
            🎓
          </div>
          <h2 style="margin: 14px 0 6px; font-size: 20px; color: #00732A; font-weight: 700;">অভিনন্দন! রেজিস্ট্রেশন অনুমোদিত</h2>
          <p style="margin: 0; font-size: 14px; color: #64748b;">পুনর্মিলনী উৎসবে অংশগ্রহণের জন্য আপনার নিবন্ধন নিশ্চিত করা হয়েছে।</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          প্রিয় শিক্ষার্থী <strong>${studentName}</strong> (এসএসসি ব্যাচ: <strong>${batch}</strong>),<br/>
          নজরুল একাডেমি অ্যালামনাই অ্যাসোসিয়েশন পরিবারের পক্ষ থেকে আপনাকে আন্তরিক মোবারকবাদ। আপনার নিবন্ধন ও পেমেন্ট তথ্য যাচাইপূর্বক অ্যাডমিন কর্তৃক অনুমোদন দেওয়া হয়েছে।
        </p>

        <!-- Registration Details Table -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            নিবন্ধন ও পেমেন্ট বিবরণী
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">শিক্ষার্থীর নাম:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #1e293b;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">এসএসসি ব্যাচ:</td>
              <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #00732A;">${batch}</td>
            </tr>
            ${
              phone
                ? `<tr>
                    <td style="padding: 6px 0; color: #64748b;">মোবাইল নম্বর:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #1e293b;">${phone}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding: 6px 0; color: #64748b;">রেজিস্ট্রেশন ফি:</td>
              <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #00732A; font-size: 15px;">৳ ${formattedFee}</td>
            </tr>
            ${
              transactionId
                ? `<tr>
                    <td style="padding: 6px 0; color: #64748b;">ট্রানজেকশন আইডি:</td>
                    <td style="padding: 6px 0; font-weight: 600; font-family: monospace; text-align: right; color: #0f172a;">${transactionId}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding: 6px 0; color: #64748b;">স্ট্যাটাস:</td>
              <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #059669;">অনুমোদিত (Approved)</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0;">
          অনুষ্ঠানের দিন আপনার এই নিশ্চিতকরণ ইমেইল বা ফোন নম্বর ব্যবহার করে অনুষ্ঠান প্রাঙ্গণে এন্ট্রি পাস, স্মরণিকা ম্যাগাজিন ও উপহার সামগ্রী সংগ্রহ করতে পারবেন।
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px;">ত্রিশাল সরকারি নজরুল একাডেমি অ্যালামনাই অ্যাসোসিয়েশন</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">নজরুল রোড, ত্রিশাল, ময়মনসিংহ | হেল্পলাইন: +880 1797-585073</p>
      </div>
    </div>
  `;

  try {
    if (!to || !to.includes('@')) {
      const err = 'শিক্ষার্থীর ইমেইল ঠিকানা সঠিক নয়।';
      const log = await recordEmailLog({
        recipientEmail: to || 'unknown',
        recipientName: studentName,
        type: 'student_approval',
        subject,
        relatedId: studentId || transactionId,
        status: 'failed',
        errorMessage: err,
        metadata: { batch, phone, registrationFee, transactionId, paymentMethod },
        htmlContent,
      });
      return { success: false, message: err, logId: log?.id };
    }

    const sendResult = await sendMailWithSmartFallback({
      to,
      subject,
      html: htmlContent,
      attachments: cardImageData ? [
        {
          filename: `ID-Card-${studentName}.jpg`,
          path: cardImageData
        }
      ] : undefined,
    });

    const log = await recordEmailLog({
      recipientEmail: to,
      recipientName: studentName,
      type: 'student_approval',
      subject,
      relatedId: studentId || transactionId,
      status: 'sent',
      metadata: { batch, phone, registrationFee, transactionId, paymentMethod, cardImageData },
      htmlContent,
    });

    return { success: true, message: 'নিশ্চিতকরণ ইমেইল সফলভাবে পাঠানো হয়েছে।', logId: log?.id };
  } catch (error: any) {
    console.error('Failed to send student approval email:', error);
    const log = await recordEmailLog({
      recipientEmail: to || 'unknown',
      recipientName: studentName,
      type: 'student_approval',
      subject,
      relatedId: studentId || transactionId,
      status: 'failed',
      errorMessage: error.message || 'ইমেইল সেন্ড ত্রুটি',
      metadata: { batch, phone, registrationFee, transactionId, paymentMethod, cardImageData },
      htmlContent,
    });
    return { success: false, message: error.message || 'ইমেইল পাঠানো সম্ভব হয়নি।', logId: log?.id };
  }
}

// 3. Resend Email by Log ID
export async function resendEmailById(logId: string): Promise<{ success: boolean; message: string; log?: IEmailLog | null }> {
  try {
    const log = await EmailLog.findOne({ id: logId });
    if (!log) {
      return { success: false, message: 'ইমেইল লগ পাওয়া যায়নি।' };
    }

    if (!log.recipientEmail || !log.recipientEmail.includes('@')) {
      log.attempts += 1;
      log.lastAttemptAt = new Date();
      log.status = 'failed';
      log.errorMessage = 'প্রাপকের ইমেইল সঠিক নয়।';
      await log.save();
      return { success: false, message: 'প্রাপকের ইমেইল সঠিক নয়।', log };
    }

    let attachments = undefined;
    if (log.metadata && log.metadata.cardImageData) {
      attachments = [
        {
          filename: `ID-Card-${log.recipientName}.jpg`,
          path: log.metadata.cardImageData
        }
      ];
    }

    await sendMailWithSmartFallback({
      to: log.recipientEmail,
      subject: log.subject,
      html: log.htmlContent || `<p>ত্রিশাল সরকারি নজরুল একাডেমি বিজ্ঞপ্তি</p>`,
      attachments
    });

    log.attempts += 1;
    log.lastAttemptAt = new Date();
    log.status = 'sent';
    log.errorMessage = undefined;
    await log.save();

    return { success: true, message: 'ইমেইল সফলভাবে পুনরায় পাঠানো হয়েছে।', log };
  } catch (error: any) {
    console.error('Failed to resend email:', error);
    const log = await EmailLog.findOne({ id: logId });
    if (log) {
      log.attempts += 1;
      log.lastAttemptAt = new Date();
      log.status = 'failed';
      log.errorMessage = error.message || 'পুনরায় পাঠাতে ব্যর্থ';
      await log.save();
    }
    return { success: false, message: error.message || 'ইমেইল পুনরায় পাঠানো সম্ভব হয়নি।', log };
  }
}

// 4. Send Security Alert Email (Brute-force & Attack Detection)
export async function sendSecurityAlertEmail({
  to,
  targetAccount,
  attackerIp,
  reason
}: {
  to: string;
  targetAccount: string;
  attackerIp: string;
  reason: string;
}): Promise<{ success: boolean; message: string }> {
  const subject = '🚨 সিকিউরিটি অ্যালার্ট: নজরুল একাডেমি অ্যাডমিন প্যানেলে সন্দেহজনক লগইন চেষ্টা!';
  const timeStr = new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #fee2e2; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🚨 সিকিউরিটি সতর্কতা অ্যালার্ট</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">নজরুল একাডেমি অ্যাডমিন ডিফেন্স সিস্টেম</p>
      </div>
      <div style="padding: 26px 24px; color: #1e293b;">
        <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
          আপনার নজরুল একাডেমি অ্যাডমিন সিস্টেমে একটি সন্দেহজনক লগইন চেষ্টা শনাক্ত হয়েছে এবং প্রতিরোধমূলক ব্যবস্থা গ্রহণ করা হয়েছে:
        </p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 6px 0;"><strong>টার্গেট অ্যাকাউন্ট:</strong> ${targetAccount}</p>
          <p style="margin: 6px 0;"><strong>আক্রমণকারীর আইপি (IP):</strong> ${attackerIp}</p>
          <p style="margin: 6px 0;"><strong>শনাক্তের সময়:</strong> ${timeStr}</p>
          <p style="margin: 6px 0; color: #b91c1c;"><strong>গৃহীত ব্যবস্থা:</strong> ${reason}</p>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          🛡️ আপনি যদি নিজে এই চেষ্টা না করে থাকেন, তবে দুশ্চিন্তার কারণ নেই। সিস্টেম আক্রমণকারীকে ইতোমধ্যে ৩০ মিনিটের জন্য ব্লক করেছে এবং অ্যাডমিন একাউন্ট নিরাপদ রয়েছে।
        </p>
      </div>
    </div>
  `;

  try {
    const sendRes = await sendMailWithSmartFallback({
      to,
      subject,
      html: htmlContent
    });
    return { success: true, message: 'সিকিউরিটি অ্যালার্ট ইমেইল সফলভাবে পাঠানো হয়েছে।' };
  } catch (err: any) {
    console.error('[SecurityAlert] Failed to send alert email:', err.message);
    return { success: false, message: err.message };
  }
}

