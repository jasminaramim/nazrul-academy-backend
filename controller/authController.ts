import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../model/userModel';
import { GlobalConfig, Stats } from '../model/configModel';
import { sendOTPEmail } from '../utils/emailService';
import { Student } from '../model/studentModel';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'trishal-nazrul-academy-secret-key-2026';
const verificationCodes: Record<string, { code: string; expiresAt: number }> = {};
export const verifiedEmails: Record<string, number> = {};
const admin2FACodes: Record<string, { code: string; expiresAt: number }> = {};

export const sendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });
    const normalizedEmail = email.toLowerCase().trim();
    const activeReunion = await mongoose.model('Reunion').findOne({ isActive: true });
    const existingStudent = await Student.findOne({ email: normalizedEmail, reunionId: activeReunion?.id });
    if (existingStudent) return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে বর্তমান ইভেন্টে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'এই ইমেইলটি সংরক্ষিত।' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[normalizedEmail] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
    
    // Send email
    await sendOTPEmail({ to: normalizedEmail, otp: code, purpose: 'registration' });
    
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ 
      success: true, 
      message: 'আপনার ইমেইলে ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      ...(isDev ? { code } : {})
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

// --- Password Reset & Management ---

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'ইউজারনেম বা ইমেইল দিন' });

    const rawIdentifier = username.toString().trim().toLowerCase();
    const user = await User.findOne({ 
      $or: [{ email: rawIdentifier }, { username: rawIdentifier }],
      role: { $in: ['admin', 'super-admin'] }
    });

    if (!user) return res.status(404).json({ success: false, message: 'অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[user.email] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };

    await sendOTPEmail({ to: user.email, otp: code, purpose: 'password_reset' });

    // Mask the email for response
    const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
      return gp2 + '*'.repeat(gp3.length); 
    });

    res.json({ success: true, message: 'ওটিপি পাঠানো হয়েছে', email: user.email, maskedEmail });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'সব তথ্য দিন' });

    const normalizedEmail = email.toLowerCase().trim();
    const verification = verificationCodes[normalizedEmail];

    if (!verification) return res.status(400).json({ success: false, message: 'কোনো ওটিপি অনুরোধ পাওয়া যায়নি' });
    if (verification.code !== otp) return res.status(400).json({ success: false, message: 'ওটিপি ভুল' });
    if (Date.now() > verification.expiresAt) return res.status(400).json({ success: false, message: 'ওটিপি মেয়াদোত্তীর্ণ' });

    const user = await User.findOne({ email: normalizedEmail, role: { $in: ['admin', 'super-admin'] } });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    await User.updateOne({ email: normalizedEmail, role: { $in: ['admin', 'super-admin'] } }, { passwordHash: newHash });
    
    delete verificationCodes[normalizedEmail];

    res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'সব তথ্য দিন' });

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    
    // Check if they are using the fallback env password
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const usingFallback = !isMatch && currentPassword === SUPER_ADMIN_PASSWORD;

    if (!isMatch && !usingFallback) return res.status(401).json({ success: false, message: 'বর্তমান পাসওয়ার্ড ভুল' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    await User.updateOne({ id: req.user.id }, { passwordHash: newHash });

    res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে' });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const changeEmail = async (req: any, res: Response) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.includes('@')) return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });

    const normalizedEmail = newEmail.toLowerCase().trim();
    
    // Check if new email is already in use
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ success: false, message: 'এই ইমেইলটি অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });

    await User.updateOne({ id: req.user.id }, { email: normalizedEmail });

    res.json({ success: true, message: 'ইমেইল পরিবর্তন সফল হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { email, phone, transactionId } = req.body;
    let errors: Record<string, string> = {};

    const activeReunion = await mongoose.model('Reunion').findOne({ isActive: true });
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingStudent = await Student.findOne({ email: normalizedEmail, reunionId: activeReunion?.id });
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingStudent) {
        errors.email = 'এই ইমেইল দিয়ে বর্তমান ইভেন্টে ইতোমধ্যে নিবন্ধন করা হয়েছে।';
      } else if (existingUser && existingUser.role === 'admin') {
        errors.email = 'এই ইমেইলটি অ্যাডমিন অ্যাকাউন্ট হিসেবে সংরক্ষিত।';
      }
    }
    
    if (phone) {
      const trimmedPhone = phone.trim();
      const existingStudent = await Student.findOne({ phone: trimmedPhone, reunionId: activeReunion?.id });
      const existingUser = await User.findOne({ phone: trimmedPhone });

      if (existingStudent) {
        errors.phone = 'এই মোবাইল নম্বর দিয়ে বর্তমান ইভেন্টে ইতোমধ্যে নিবন্ধন করা হয়েছে।';
      } else if (existingUser && existingUser.role === 'admin') {
        errors.phone = 'এই মোবাইল নম্বরটি সংরক্ষিত।';
      }
    }
    
    if (transactionId) {
      const trimmedTrx = transactionId.trim();
      const existingStudent = await Student.findOne({ transactionId: trimmedTrx });
      if (existingStudent) errors.transactionId = 'এই ট্রানজ্যাকশন আইডি ইতোমধ্যে ব্যবহৃত হয়েছে।';
    }

    res.json({ success: true, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সার্ভার সমস্যা দেখা দিয়েছে' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'ইমেইল ও কোড প্রয়োজন' });
    const normalizedEmail = email.toLowerCase().trim();
    const record = verificationCodes[normalizedEmail];
    if (!record) return res.status(400).json({ success: false, message: 'কোড পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে' });
    if (Date.now() > record.expiresAt) {
      delete verificationCodes[normalizedEmail];
      return res.status(400).json({ success: false, message: 'মেয়াদ শেষ। অনুগ্রহ করে নতুন কোড নিন।' });
    }
    if (record.code !== code?.toString().trim()) {
      return res.status(400).json({ success: false, message: 'ভুল কোড প্রদান করেছেন।' });
    }
    
    delete verificationCodes[normalizedEmail];
    // Mark email as verified for 30 minutes
    verifiedEmails[normalizedEmail] = Date.now() + 30 * 60 * 1000;
    res.json({ success: true, message: 'ইমেইল সফলভাবে যাচাই হয়েছে।' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      email, password, name, nameEn, bloodGroup, batch, location, school, 
      currentJob, company, image, phone, tshirtSize, registrationFee, 
      transactionId, paymentMethod, hp_website_url, turnstileToken 
    } = req.body;

    // 1. Honeypot Bot Trap check
    if (hp_website_url) {
      return res.status(400).json({ success: false, message: 'অবৈধ অনুরোধ সনাক্ত হয়েছে।' });
    }

    if (!email || !password || !name) return res.status(400).json({ success: false, message: 'ইমেইল, পাসওয়ার্ড, নাম আবশ্যক' });

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone ? phone.trim() : '';

    // 2. Mandatory Email OTP Verification Check
    if (!verifiedEmails[normalizedEmail] || Date.now() > verifiedEmails[normalizedEmail]) {
      return res.status(400).json({ 
        success: false, 
        message: 'নিবন্ধন সম্পন্ন করতে প্রথমে আপনার ইমেইল ওটিপি (OTP) দিয়ে ভেরিফাই করুন।' 
      });
    }

    // 3. Strict BD Phone Number Validation
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    const cleanPhone = trimmedPhone.replace(/[-\s+]/g, '').replace(/^88/, '');
    if (!bdPhoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'অনুগ্রহ করে সঠিক ১১-সংখ্যার বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।' 
      });
    }

    // 4. Strict Transaction ID Format Validation
    const cleanTrx = transactionId ? transactionId.trim().toUpperCase() : '';
    if (!cleanTrx || cleanTrx.length < 6 || cleanTrx.length > 25 || !/^[A-Z0-9]+$/.test(cleanTrx)) {
      return res.status(400).json({ 
        success: false, 
        message: 'অনুগ্রহ করে সঠিক আলফানিউমেরিক ট্রানজ্যাকশন আইডি (Transaction ID) প্রদান করুন।' 
      });
    }

    // 5. Cloudflare Turnstile Bot Check (if secret is configured)
    const cfSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (cfSecret && turnstileToken) {
      try {
        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: cfSecret,
            response: turnstileToken,
            remoteip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || ''
          })
        });
        const cfData: any = await cfRes.json();
        if (!cfData.success) {
          return res.status(400).json({ success: false, message: 'ক্লাউডফ্লেয়ার সিকিউরিটি ভেরিফিকেশন ব্যর্থ হয়েছে।' });
        }
      } catch (cfErr) {
        console.error('Turnstile verification check error:', cfErr);
      }
    }

    const activeReunion = await mongoose.model('Reunion').findOne({ isActive: true });
    
    // Check if an active student registration exists FOR THIS REUNION
    const existingStudentEmail = await Student.findOne({ email: normalizedEmail, reunionId: activeReunion?.id });
    if (existingStudentEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে বর্তমান ইভেন্টে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });
    }

    if (trimmedPhone) {
      const existingStudentPhone = await Student.findOne({ phone: trimmedPhone, reunionId: activeReunion?.id });
      if (existingStudentPhone) {
        return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বর দিয়ে বর্তমান ইভেন্টে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });
      }
    }

    const config = await GlobalConfig.findOne() || await GlobalConfig.create({});
    const stats = await Stats.findOne() || await Stats.create({});
    
    if (stats.registeredStudents >= (config.maxRegistrations || 8000)) {
       return res.status(400).json({ success: false, message: 'রেজিস্ট্রেশন কোটা পূর্ণ হয়ে গেছে। আর নতুন রেজিস্ট্রেশন সম্ভব নয়।' });
    }

    const fullMethod = (paymentMethod || 'bkash').toLowerCase();
    const [method, idxStr] = fullMethod.split('-');
    const idx = parseInt(idxStr) || 0;
    const isOut = 
      (method === 'bkash' && config.bkashAccounts && config.bkashAccounts[idx]?.isLimitOut) ||
      (method === 'nagad' && config.nagadAccounts && config.nagadAccounts[idx]?.isLimitOut) ||
      (method === 'rocket' && config.rocketAccounts && config.rocketAccounts[idx]?.isLimitOut);

    if (isOut) {
      const methodBn = method === 'bkash' ? 'বিকাশ' : method === 'nagad' ? 'নগদ' : 'রকেট';
      return res.status(400).json({
        success: false,
        isLimitOut: true,
        limitMethod: fullMethod,
        message: `বর্তমানে আমাদের ${methodBn} অ্যাকাউন্টের লেনদেনের সীমা (Limit) শেষ। অনুগ্রহ করে অন্য মাধ্যমে ফি পরিশোধ করুন।`,
      });
    }

    // Clean up verified state so it cannot be used again
    delete verifiedEmails[normalizedEmail];

    const passwordHash = await bcrypt.hash(password, 10);
    const isBatchOld = parseInt(batch?.replace(/\D/g, '') || '2026', 10) < 2011;
    
    let newUser = await User.findOne({ email: normalizedEmail });
    if (newUser) {
      if (newUser.role === 'admin') {
        return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে নিবন্ধন সম্ভব নয়।' });
      }
      // Update existing user with new details for the new reunion
      newUser.passwordHash = passwordHash;
      newUser.name = name;
      if (nameEn) newUser.nameEn = nameEn;
      if (bloodGroup) newUser.bloodGroup = bloodGroup;
      if (batch) newUser.batch = batch?.includes('ব্যাচ') ? batch : `ব্যাচ ${batch || '২০১০'}`;
      if (location) newUser.location = location;
      if (school) newUser.school = school;
      if (currentJob) newUser.currentJob = currentJob;
      if (company) newUser.company = company;
      if (image) newUser.image = image;
      if (phone) newUser.phone = phone;
      if (tshirtSize) newUser.tshirtSize = tshirtSize;
      newUser.registrationFee = Number(registrationFee) || 0;
      newUser.paymentMethod = paymentMethod || 'bkash';
      newUser.transactionId = transactionId || '';
      await newUser.save();
    } else {
      const userId = 'usr-' + Date.now();
      newUser = new User({
        id: userId, email: normalizedEmail, passwordHash, name, nameEn: nameEn || name,
        bloodGroup: bloodGroup || 'O+', batch: batch?.includes('ব্যাচ') ? batch : `ব্যাচ ${batch || '২০১০'}`,
        location: location || 'ত্রিশাল', school: school || 'ত্রিশাল একাডেমি', currentJob: currentJob || 'পেশাজীবী',
        company: company || '', image: image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        phone: phone || '', tshirtSize: tshirtSize || 'L',
        registrationFee: Number(registrationFee) || 0,
        paymentMethod: paymentMethod || 'bkash',
        transactionId: transactionId || ''
      });
      await newUser.save();
    }

    const newStudent = new Student({
      id: 'std-' + Date.now(), name: newUser.name, nameEn: newUser.nameEn, image: newUser.image,
      batch: newUser.batch, batchType: isBatchOld ? 'old' : 'new', location: newUser.location,
      bloodGroup: newUser.bloodGroup, phone: newUser.phone, email: newUser.email, school: newUser.school,
      currentJob: newUser.currentJob, company: newUser.company, tshirtSize: newUser.tshirtSize,
      registrationFee: newUser.registrationFee,
      paymentMethod: newUser.paymentMethod,
      transactionId: newUser.transactionId,
      reunionId: activeReunion ? activeReunion.id : undefined
    });
    await newStudent.save();

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'নিবন্ধন সম্পন্ন', token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, batch: newUser.batch, image: newUser.image, bloodGroup: newUser.bloodGroup, location: newUser.location } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password, twoFactorCode } = req.body;
    const rawIdentifier = (username || email || '').toString().trim().toLowerCase();
    if (!rawIdentifier || !password) return res.status(400).json({ success: false, message: 'তথ্য প্রদান করুন' });

    const SUPER_ADMIN_USERNAME = (process.env.SUPER_ADMIN_USERNAME || 'admin').toLowerCase();
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

    let user = await User.findOne({ $or: [{ email: rawIdentifier }, { username: rawIdentifier }] });

    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || (rawIdentifier.includes('@') ? rawIdentifier : 'admin@nazrulacademy.edu.bd');
    const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'প্রধান প্রশাসক';
    
    if (!user && rawIdentifier === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
      user = await User.findOneAndUpdate(
        { email: SUPER_ADMIN_EMAIL },
        {
          id: 'usr-admin-system', name: SUPER_ADMIN_NAME, nameEn: SUPER_ADMIN_NAME, username: SUPER_ADMIN_USERNAME,
          email: SUPER_ADMIN_EMAIL, passwordHash: bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10), role: 'super-admin',
          phone: process.env.SUPER_ADMIN_PHONE || '+880 0000-000000', bloodGroup: process.env.SUPER_ADMIN_BLOOD_GROUP || 'A+', 
          batch: process.env.SUPER_ADMIN_BATCH || '২০০০', location: process.env.SUPER_ADMIN_LOCATION || 'ত্রিশাল', 
          school: process.env.SUPER_ADMIN_SCHOOL || 'ত্রিশাল সরকারি নজরুল একাডেমি',
          currentJob: process.env.SUPER_ADMIN_JOB || 'অ্যাডমিন', company: process.env.SUPER_ADMIN_COMPANY || 'সিস্টেম'
        },
        { upsert: true, new: true }
      );
    } else if (!user) {
      return res.status(401).json({ success: false, message: 'ভুল তথ্য' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    const isSuperAdminPasswordMatch = (rawIdentifier === SUPER_ADMIN_USERNAME || user.username === SUPER_ADMIN_USERNAME) && password === SUPER_ADMIN_PASSWORD;

    if (!isMatch && !isSuperAdminPasswordMatch) {
      return res.status(401).json({ success: false, message: 'ভুল ইউজারনেম বা পাসওয়ার্ড' });
    }

    // 🔒 Admin 2FA (Two-Factor Authentication via Email OTP)
    if (user.role === 'admin' || user.role === 'super-admin') {
      if (!twoFactorCode) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        admin2FACodes[user.email] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
        
        console.log(`[Admin 2FA] 🔐 Triggering 2FA for: "${user.email}" (Username: ${rawIdentifier})`);
        console.log(`[Admin 2FA] 🔑 Generated Security OTP Code: 👉 ${code} 👈`);
        
        const emailRes = await sendOTPEmail({
          to: user.email,
          otp: code,
          purpose: 'admin_login'
        });

        console.log(`[Admin 2FA] 📩 Email dispatch result for ${user.email}:`, emailRes);

        const masked = user.email.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(1, b.length)) + c);
        return res.json({
          success: true,
          requires2FA: true,
          email: user.email,
          maskedEmail: masked,
          message: `অ্যাডমিন একাউন্টের সুরক্ষার্থে আপনার ইমেইলে (${masked}) ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
        });
      }

      console.log(`[Admin 2FA] 🔑 Verifying 2FA code for admin: "${user.email}"`);

      const record = admin2FACodes[user.email];
      if (!record || Date.now() > record.expiresAt) {
        return res.status(400).json({ success: false, message: 'ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।' });
      }
      if (record.code !== twoFactorCode.toString().trim()) {
        return res.status(400).json({ success: false, message: 'ভুল ভেরিফিকেশন কোড প্রদান করেছেন।' });
      }
      delete admin2FACodes[user.email];
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      message: 'লগইন সফল', 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role, batch: user.batch, image: user.image, bloodGroup: user.bloodGroup, location: user.location, currentJob: user.currentJob } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'লগইনে সমস্যা: ' + err.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'পাওয়া যায়নি' });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সমস্যা' });
  }
};

export const checkApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: 'ফোন নম্বর এবং পাসওয়ার্ড প্রয়োজন।' });

    const trimmedPhone = phone.trim();
    const user = await User.findOne({ phone: trimmedPhone });
    if (!user) return res.status(404).json({ success: false, message: 'এই ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'ভুল পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' });

    // Try to get more accurate status from Student collection
    let status = user.status;
    const student = await Student.findOne({ phone: trimmedPhone });
    if (student) {
      status = student.status;
    }

    res.json({ 
      success: true, 
      status, 
      name: user.name,
      message: 'স্ট্যাটাস চেক সফল হয়েছে।'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সার্ভার সমস্যা দেখা দিয়েছে।' });
  }
};

export const changeName = async (req: any, res: Response) => {
  try {
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ success: false, message: 'নতুন নাম প্রদান করুন' });

    const mongoose = require('mongoose');
    const querySelf = mongoose.isValidObjectId(req.user.id) ? { $or: [{ id: req.user.id }, { _id: req.user.id }] } : { id: req.user.id };
    const user = await User.findOne(querySelf);
    if (!user) return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি' });

    await User.updateOne(querySelf, { $set: { name: newName } });
    res.json({ success: true, message: 'নাম সফলভাবে পরিবর্তন করা হয়েছে' });
  } catch (err: any) {
    console.error('changeName error:', err);
    res.status(500).json({ success: false, message: 'সার্ভার সমস্যা: ' + err.message });
  }
};
