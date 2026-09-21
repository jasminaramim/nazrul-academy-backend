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
  purpose: 'registration' | 'password_reset';
}

// Create reusable transporter object using SMTP transport or fallback
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Gmail service configuration
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
    });
  }

  return null;
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
      return { success: false, message: 'সঠিক ইমেইল দিন' };
    }
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Email Mock] OTP for ${to}: ${otp}`);
      return { success: true, message: 'মক সার্ভিস: ওটিপি কনসোলে প্রিন্ট করা হয়েছে।' };
    }

    await transporter.sendMail({
      from: `"ত্রিশাল নজরুল একাডেমি" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@trishalnazrulacademy.edu.bd'}>`,
      to,
      subject,
      html: htmlContent,
    });
    return { success: true, message: 'ওটিপি পাঠানো হয়েছে।' };
  } catch (error: any) {
    console.error('Failed to send OTP email:', error);
    return { success: false, message: 'ইমেইল পাঠানো সম্ভব হয়নি।' };
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

    const transporter = getTransporter();

    if (!transporter) {
      console.log(`[Email Mock/Preview] Confirmation email ready for ${to}:`, {
        donorName,
        amount,
        transactionId,
      });
      const log = await recordEmailLog({
        recipientEmail: to,
        recipientName: donorName,
        type: 'donation_approval',
        subject,
        relatedId: donorId || transactionId,
        status: 'sent',
        metadata: { amount, transactionId, paymentMethod, batch, isMock: true },
        htmlContent,
      });
      return {
        success: true,
        message: 'ইমেইল লগ সফলভাবে সংরক্ষিত হয়েছে।',
        logId: log?.id,
      };
    }

    await transporter.sendMail({
      from: `"ত্রিশাল নজরুল একাডেমি" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@trishalnazrulacademy.edu.bd'}>`,
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

    const transporter = getTransporter();

    if (!transporter) {
      console.log(`[Email Mock/Preview] Student approval confirmation for ${to}:`, {
        studentName,
        batch,
        registrationFee,
      });
      const log = await recordEmailLog({
        recipientEmail: to,
        recipientName: studentName,
        type: 'student_approval',
        subject,
        relatedId: studentId || transactionId,
        status: 'sent',
        metadata: { batch, phone, registrationFee, transactionId, paymentMethod, isMock: true },
        htmlContent,
      });
      return {
        success: true,
        message: 'ইমেইল লগ সফলভাবে সংরক্ষিত হয়েছে।',
        logId: log?.id,
      };
    }

    await transporter.sendMail({
      from: `"ত্রিশাল নজরুল একাডেমি" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@trishalnazrulacademy.edu.bd'}>`,
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
      metadata: { batch, phone, registrationFee, transactionId, paymentMethod },
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
      metadata: { batch, phone, registrationFee, transactionId, paymentMethod },
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

    const transporter = getTransporter();

    if (!transporter) {
      log.attempts += 1;
      log.lastAttemptAt = new Date();
      log.status = 'sent';
      log.errorMessage = undefined;
      await log.save();
      return { success: true, message: 'ইমেইল সফলভাবে পুনরায় পাঠানো হয়েছে (মক সার্ভিস)।', log };
    }

    await transporter.sendMail({
      from: `"ত্রিশাল নজরুল একাডেমি" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@trishalnazrulacademy.edu.bd'}>`,
      to: log.recipientEmail,
      subject: log.subject,
      html: log.htmlContent || `<p>ত্রিশাল সরকারি নজরুল একাডেমি বিজ্ঞপ্তি</p>`,
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
