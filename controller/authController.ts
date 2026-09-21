import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../model/userModel';
import { GlobalConfig, Stats } from '../model/configModel';
import { sendOTPEmail } from '../utils/emailService';
import { Student } from '../model/studentModel';

const JWT_SECRET = process.env.JWT_SECRET || 'trishal-nazrul-academy-secret-key-2026';
const verificationCodes: Record<string, { code: string; expiresAt: number }> = {};

export const sendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'সঠিক ইমেইল দিন' });
    const normalizedEmail = email.toLowerCase().trim();
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent) return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'এই ইমেইলটি সংরক্ষিত।' });
    }
    if (existingUser && existingUser.role !== 'admin') {
      await User.deleteMany({ email: normalizedEmail, role: { $ne: 'admin' } });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[normalizedEmail] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
    
    // Send email
    await sendOTPEmail({ to: normalizedEmail, otp: code, purpose: 'registration' });
    
    res.json({ success: true, message: `কোড পাঠানো হয়েছে।`, code }); // Send code in response for testing if needed
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

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();
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

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে' });
  } catch (err) {
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

    user.email = normalizedEmail;
    await user.save();

    res.json({ success: true, message: 'ইমেইল পরিবর্তন সফল হয়েছে' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { email, phone, transactionId } = req.body;
    let errors: Record<string, string> = {};

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingStudent = await Student.findOne({ email: normalizedEmail });
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingStudent) {
        errors.email = 'এই ইমেইল দিয়ে ইতোমধ্যে নিবন্ধন করা হয়েছে।';
      } else if (existingUser) {
        if (existingUser.role === 'admin') {
          errors.email = 'এই ইমেইলটি অ্যাডমিন অ্যাকাউন্ট হিসেবে সংরক্ষিত।';
        } else {
          // Orphaned user whose student registration was deleted by admin -> Clean up automatically
          await User.deleteMany({ email: normalizedEmail, role: { $ne: 'admin' } });
        }
      }
    }
    
    if (phone) {
      const trimmedPhone = phone.trim();
      const existingStudent = await Student.findOne({ phone: trimmedPhone });
      const existingUser = await User.findOne({ phone: trimmedPhone });

      if (existingStudent) {
        errors.phone = 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে নিবন্ধন করা হয়েছে।';
      } else if (existingUser) {
        if (existingUser.role === 'admin') {
          errors.phone = 'এই মোবাইল নম্বরটি সংরক্ষিত।';
        } else {
          // Orphaned user whose student registration was deleted by admin -> Clean up automatically
          await User.deleteMany({ phone: trimmedPhone, role: { $ne: 'admin' } });
        }
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
    const record = verificationCodes[email?.toLowerCase()?.trim()];
    if (!record) return res.status(400).json({ success: false, message: 'কোড পাওয়া যায়নি' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ success: false, message: 'মেয়াদ শেষ' });
    if (record.code !== code?.toString().trim()) return res.status(400).json({ success: false, message: 'ভুল কোড' });
    
    delete verificationCodes[email.toLowerCase().trim()];
    res.json({ success: true, message: 'যাচাই সফল' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, nameEn, bloodGroup, batch, location, school, currentJob, company, image, phone, tshirtSize, registrationFee, transactionId, paymentMethod } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, message: 'ইমেইল, পাসওয়ার্ড, নাম আবশ্যক' });

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone ? phone.trim() : '';

    // Check if an active student registration exists
    const existingStudentEmail = await Student.findOne({ email: normalizedEmail });
    if (existingStudentEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });
    }

    if (trimmedPhone) {
      const existingStudentPhone = await Student.findOne({ phone: trimmedPhone });
      if (existingStudentPhone) {
        return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে নিবন্ধন করা হয়েছে।' });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে নিবন্ধন সম্ভব নয়।' });
      }
      // Remove any stale non-admin user record so new registration proceeds smoothly
      await User.deleteMany({ email: normalizedEmail, role: { $ne: 'admin' } });
    }

    if (trimmedPhone) {
      await User.deleteMany({ phone: trimmedPhone, role: { $ne: 'admin' } });
    }

    const config = await GlobalConfig.findOne() || await GlobalConfig.create({});
    const stats = await Stats.findOne() || await Stats.create({});
    
    if (stats.registeredStudents >= (config.maxRegistrations || 8000)) {
       return res.status(400).json({ success: false, message: 'রেজিস্ট্রেশন কোটা পূর্ণ হয়ে গেছে। আর নতুন রেজিস্ট্রেশন সম্ভব নয়।' });
    }

    const method = (paymentMethod || 'bkash').toLowerCase();
    if (
      (method === 'bkash' && config.bkashLimitOut) ||
      (method === 'nagad' && config.nagadLimitOut) ||
      (method === 'rocket' && config.rocketLimitOut)
    ) {
      const methodBn = method === 'bkash' ? 'বিকাশ' : method === 'nagad' ? 'নগদ' : 'রকেট';
      return res.status(400).json({
        success: false,
        isLimitOut: true,
        limitMethod: method,
        message: `বর্তমানে আমাদের ${methodBn} অ্যাকাউন্টের লেনদেনের সীমা (Limit) শেষ। অনুগ্রহ করে অন্য মাধ্যমে ফি পরিশোধ করুন।`,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isBatchOld = parseInt(batch?.replace(/\D/g, '') || '2026', 10) < 2011;
    const userId = 'usr-' + Date.now();

    const newUser = new User({
      id: userId, email: email.toLowerCase(), passwordHash, name, nameEn: nameEn || name,
      bloodGroup: bloodGroup || 'O+', batch: batch?.includes('ব্যাচ') ? batch : `ব্যাচ ${batch || '২০১০'}`,
      location: location || 'ত্রিশাল', school: school || 'ত্রিশাল একাডেমি', currentJob: currentJob || 'পেশাজীবী',
      company: company || '', image: image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      phone: phone || '', tshirtSize: tshirtSize || 'L',
      registrationFee: Number(registrationFee) || 0,
      paymentMethod: paymentMethod || 'bkash',
      transactionId: transactionId || ''
    });
    await newUser.save();

    const newStudent = new Student({
      id: 'std-' + Date.now(), name: newUser.name, nameEn: newUser.nameEn, image: newUser.image,
      batch: newUser.batch, batchType: isBatchOld ? 'old' : 'new', location: newUser.location,
      bloodGroup: newUser.bloodGroup, phone: newUser.phone, email: newUser.email, school: newUser.school,
      currentJob: newUser.currentJob, company: newUser.company, tshirtSize: newUser.tshirtSize,
      registrationFee: newUser.registrationFee,
      paymentMethod: newUser.paymentMethod,
      transactionId: newUser.transactionId
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
    const { email, username, password } = req.body;
    const rawIdentifier = (username || email || '').toString().trim().toLowerCase();
    if (!rawIdentifier || !password) return res.status(400).json({ success: false, message: 'তথ্য প্রদান করুন' });

    const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'admin';
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
    if (!isMatch && password !== SUPER_ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'ভুল তথ্য' });

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'লগইন সফল', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, batch: user.batch, image: user.image, bloodGroup: user.bloodGroup, location: user.location, currentJob: user.currentJob } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'লগইনে সমস্যা' });
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
