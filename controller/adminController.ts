import { Request, Response } from 'express';
import { GlobalConfig, AdminInfo, Finance, Stats } from '../model/configModel';
import { User } from '../model/userModel';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// --- Global Config ---
export const getGlobalConfig = async (req: Request, res: Response) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) config = await GlobalConfig.create({});
    res.json({ success: true, data: config });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateGlobalConfig = async (req: Request, res: Response) => {
  try {
    const config = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: 'গ্লোবাল তথ্য আপডেট করা হয়েছে', data: config });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Contact Info (Derived from Global Config) ---
export const getContact = async (req: Request, res: Response) => {
  try {
    const config = await GlobalConfig.findOne() || await GlobalConfig.create({});
    const { contactPhone1, contactPhone2, contactEmail, address, facebookUrl, youtubeUrl } = config;
    res.json({ success: true, data: { contactPhone1, contactPhone2, contactEmail, address, facebookUrl, youtubeUrl } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateContact = async (req: Request, res: Response) => {
  try {
    const config = await GlobalConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: 'যোগাযোগের তথ্য আপডেট হয়েছে', data: config });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Admin Info ---
export const getAdminInfo = async (req: Request, res: Response) => {
  try {
    let info = await AdminInfo.findOne();
    if (!info) info = await AdminInfo.create({ name: 'Jasmin', phone: '', email: '' });
    res.json({ success: true, data: info });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateAdminInfo = async (req: Request, res: Response) => {
  try {
    const info = await AdminInfo.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: 'অ্যাডমিন তথ্য আপডেট হয়েছে', data: info });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Finance ---
export const getFinance = async (req: Request, res: Response) => {
  try {
    const { reunionId } = req.query;
    let query: any = {};
    if (reunionId) {
      query.reunionId = reunionId;
    } else {
      const activeReunion = await mongoose.model('Reunion').findOne({ isActive: true });
      if (activeReunion) {
        query.reunionId = activeReunion.id;
      }
    }

    let finance: any = await Finance.findOne(query);
    if (!finance) finance = await Finance.create(query);
    finance = finance.toObject();

    // Auto-fix old data if necessary
    const Student = mongoose.model('Student');
    const Donor = mongoose.model('Donor');
    const unassignedStudents = await Student.countDocuments({ $or: [{ reunionId: { $exists: false } }, { reunionId: null }, { reunionId: '' }] });
    if (unassignedStudents > 0) {
      const oldestReunion = await mongoose.model('Reunion').findOne().sort({ year: 1 });
      if (oldestReunion) {
        await Student.updateMany({ $or: [{ reunionId: { $exists: false } }, { reunionId: null }, { reunionId: '' }] }, { $set: { reunionId: oldestReunion.id } });
        await Donor.updateMany({ $or: [{ reunionId: { $exists: false } }, { reunionId: null }, { reunionId: '' }] }, { $set: { reunionId: oldestReunion.id } });
      }
    }

    // Calculate student fees
    let studentMatchQuery: any = { status: 'approved' };
    if (query.reunionId) {
      studentMatchQuery.reunionId = query.reunionId;
    }
    
    const studentAgg = await Student.aggregate([
      { $match: studentMatchQuery },
      { $group: { _id: null, total: { $sum: { $convert: { input: "$registrationFee", to: "double", onError: 0, onNull: 0 } } } } }
    ]);
    const totalStudentIncome = studentAgg[0] ? studentAgg[0].total : 0;

    // Calculate global donations from donors
    const donorAgg = await Donor.aggregate([
      { $match: { status: 'approved' } }, // Force global donation
      { $group: { _id: null, total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } } }
    ]);
    const totalDonations = donorAgg[0] ? donorAgg[0].total : 0;

    // Calculate global manual donations across all events
    const allFinances = await Finance.find({});
    let globalManualDonationIncome = 0;
    let globalDonationExpense = 0;
    
    allFinances.forEach((f: any) => {
      if (f.transactions && Array.isArray(f.transactions)) {
        f.transactions.forEach((t: any) => {
          if (t.type === 'income' && t.fundSource === 'donation') globalManualDonationIncome += (Number(t.amount) || 0);
          if (t.type === 'expense' && t.fundSource === 'donation') globalDonationExpense += (Number(t.amount) || 0);
        });
      }
    });

    const globalDonationFund = totalDonations + globalManualDonationIncome - globalDonationExpense;
    const globalTotalDonationIncome = totalDonations + globalManualDonationIncome;

    // Calculate transaction sums for CURRENT EVENT
    let manualIncome = 0;
    let manualExpense = 0;
    if (finance.transactions && Array.isArray(finance.transactions)) {
      finance.transactions.forEach((t: any) => {
        if (t.type === 'income' && t.source !== 'Registration' && t.source !== 'Donation') manualIncome += (Number(t.amount) || 0);
        if (t.type === 'expense') manualExpense += (Number(t.amount) || 0);
      });
    }

    finance.totalIncome = manualIncome + totalStudentIncome;
    finance.totalExpense = manualExpense;
    finance.balance = finance.totalIncome - finance.totalExpense;

    // Update the breakdown explicitly
    finance.breakdown = {
      ...((!Array.isArray(finance.breakdown) && finance.breakdown) || {}),
      registrationFees: totalStudentIncome,
      donations: totalDonations
    };

    // Return finance as object and attach globalDonationFund
    res.json({ 
      success: true, 
      data: {
        ...(typeof finance.toObject === 'function' ? finance.toObject() : finance),
        globalDonationFund,
        globalTotalDonationIncome
      } 
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getGlobalFinance = async (req: Request, res: Response) => {
  try {
    const Student = mongoose.model('Student');
    const studentAgg = await Student.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: { $convert: { input: "$registrationFee", to: "double", onError: 0, onNull: 0 } } } } }
    ]);
    const totalRegistrationIncome = studentAgg[0] ? studentAgg[0].total : 0;

    const Donor = mongoose.model('Donor');
    const donorAgg = await Donor.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } } } } }
    ]);
    const totalDonationIncome = donorAgg[0] ? donorAgg[0].total : 0;

    const finances = await Finance.find({});
    let totalManualIncome = 0;
    let totalManualExpense = 0;
    let globalManualDonationIncome = 0;
    let globalDonationExpense = 0;
    
    finances.forEach((f: any) => {
      if (f.transactions && Array.isArray(f.transactions)) {
        f.transactions.forEach((t: any) => {
          if (t.type === 'income') {
            if (t.fundSource === 'donation') globalManualDonationIncome += (Number(t.amount) || 0);
            if (t.source !== 'Registration' && t.source !== 'Donation') totalManualIncome += (Number(t.amount) || 0);
          }
          if (t.type === 'expense') {
            if (t.fundSource === 'donation') globalDonationExpense += (Number(t.amount) || 0);
            totalManualExpense += (Number(t.amount) || 0);
          }
        });
      }
    });

    const globalDonationFund = totalDonationIncome + globalManualDonationIncome - globalDonationExpense;

    const grandTotalIncome = totalRegistrationIncome + totalDonationIncome + totalManualIncome;
    const grandTotalExpense = totalManualExpense;
    const grandBalance = grandTotalIncome - grandTotalExpense;

    res.json({
      success: true,
      data: {
        totalRegistrationIncome,
        totalDonationIncome,
        totalManualIncome,
        totalManualExpense,
        grandTotalIncome,
        grandTotalExpense,
        grandBalance,
        globalDonationFund,
        globalTotalDonationIncome
      }
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateFinance = async (req: Request, res: Response) => {
  try {
    const { totalIncome, totalExpense, breakdown, transactions, reunionId } = req.body;
    let query: any = {};
    if (reunionId) query.reunionId = reunionId;
    else {
      const activeReunion = await mongoose.model('Reunion').findOne({ isActive: true });
      if (activeReunion) query.reunionId = activeReunion.id;
    }

    const balance = (Number(totalIncome) || 0) - (Number(totalExpense) || 0);
    const updateData = { totalIncome, totalExpense, balance, breakdown, transactions, lastUpdated: new Date().toISOString().split('T')[0], reunionId: query.reunionId };
    const finance = await Finance.findOneAndUpdate(query, updateData, { new: true, upsert: true });
    res.json({ success: true, message: 'আর্থিক হিসাব আপডেট করা হয়েছে', data: finance });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Stats ---
export const getStats = async (req: Request, res: Response) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) stats = await Stats.create({});
    res.json({ success: true, data: stats });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateStats = async (req: Request, res: Response) => {
  try {
    const stats = await Stats.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: 'পরিসংখ্যান আপডেট করা হয়েছে', data: stats });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- System & MongoDB Config (Legacy Support for UI) ---
export const getMongoConfig = async (req: Request, res: Response) => {
  res.json({ success: true, connected: true, mongoUriConfigured: true, storageType: 'MongoDB via Mongoose', collections: [] });
};
export const updateMongoConfig = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'URI Updated', status: { connected: true, collections: [] } });
};
export const forceMongoSync = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Sync not needed for Mongoose', status: { connected: true } });
};
export const seedDemoData = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Demo data seeder disabled in Mongoose migration' });
};


export const getMongoCollectionDocs = async (req: Request, res: Response) => {
  try {
    const { collectionName } = req.params;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'ডাটাবেজ সংযুক্ত নয়' });
    }
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).sort({ _id: -1 }).limit(100).toArray();
    const count = await collection.countDocuments();
    res.json({ success: true, collection: collectionName, count, documents });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};


import { Student } from '../model/studentModel';
import { sendStudentApprovalEmail } from '../utils/emailService';

export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cardImageData } = req.body;
    const student = await Student.findOne({ id });
    if (!student) return res.status(404).json({ success: false, message: 'শিক্ষার্থী পাওয়া যায়নি' });

    const user = await User.findOne({ email: student.email });
    if (!user) return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    
    if (student.status === 'approved' || user.status === 'approved') {
      return res.status(400).json({ success: false, message: 'আগেই অনুমোদন করা হয়েছে' });
    }

    user.status = 'approved';
    await user.save();

    student.status = 'approved';
    await student.save();

    // Update Stats
    await Stats.updateOne({}, { $inc: { registeredStudents: 1 } }, { upsert: true });

    // Update Finance
    let finance = await Finance.findOne();
    if (!finance) finance = await Finance.create({});
    
    const fee = user.registrationFee || 0;
    finance.totalIncome = (finance.totalIncome || 0) + fee;
    finance.balance = (finance.totalIncome || 0) - (finance.totalExpense || 0);
    
    // Add transaction record
    if (fee > 0) {
      finance.transactions.push({
        id: 'trx-' + Date.now(),
        type: 'income',
        amount: fee,
        source: 'Registration',
        name: user.name,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    await finance.save();

    // Send confirmation email to student
    let emailStatus = { success: false, message: 'ইমেইল দেওয়া হয়নি।' };
    const targetEmail = student.email || user.email;
    if (targetEmail && targetEmail.includes('@')) {
      emailStatus = await sendStudentApprovalEmail({
        to: targetEmail,
        studentName: student.name || user.name,
        batch: student.batch,
        phone: student.phone || user.phone,
        registrationFee: fee,
        transactionId: student.transactionId || user.transactionId,
        paymentMethod: (user as any).paymentMethod,
        studentId: student.id,
        cardImageData,
      });
    }

    res.json({
      success: true,
      message: `রেজিস্ট্রেশন সফলভাবে অনুমোদন করা হয়েছে। ${emailStatus.success ? 'শিক্ষার্থীর ইমেইলে নিশ্চিতকরণ পত্র পাঠানো হয়েছে ও লগ সেভ হয়েছে।' : 'ইমেইল পাঠানো সম্ভব হয়নি (লগে সংরক্ষিত)।'}`,
      emailStatus,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Admin Management ---

export const getAdmins = async (req: any, res: Response) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super-admin'] } }).select('-passwordHash');
    res.json({ success: true, data: admins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const createAdmin = async (req: any, res: Response) => {
  try {
    // Only super-admin can create new admins
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র সুপার-অ্যাডমিন নতুন অ্যাডমিন তৈরি করতে পারবেন' });
    }

    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'সব তথ্য দিন' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল বা ইউজারনেম ইতিমধ্যে ব্যবহৃত হচ্ছে' });
    }

    const newAdmin = new User({
      id: 'adm-' + Date.now().toString(36),
      name,
      username,
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'admin',
      status: 'approved'
    });

    await newAdmin.save();
    const adminObj = newAdmin.toObject();
    delete adminObj.passwordHash;

    res.json({ success: true, message: 'নতুন অ্যাডমিন তৈরি করা হয়েছে', data: adminObj });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const deleteAdmin = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র সুপার-অ্যাডমিন অন্য অ্যাডমিন ডিলিট করতে পারবেন' });
    }

    const { id } = req.params;
    const targetAdmin = await User.findOne({ id });

    if (!targetAdmin) return res.status(404).json({ success: false, message: 'অ্যাডমিন পাওয়া যায়নি' });
    if (targetAdmin.role === 'super-admin') return res.status(400).json({ success: false, message: 'সুপার-অ্যাডমিন অ্যাকাউন্ট ডিলিট করা সম্ভব নয়' });
    if (targetAdmin.id === req.user.id) return res.status(400).json({ success: false, message: 'নিজের অ্যাকাউন্ট ডিলিট করা সম্ভব নয়' });

    await User.deleteOne({ id });
    res.json({ success: true, message: 'অ্যাডমিন অ্যাকাউন্ট রিমুভ করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};

export const transferSuperAdmin = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'super-admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'শুধুমাত্র বর্তমান সুপার-অ্যাডমিন এই কাজটি করতে পারবেন' });
    }

    const { targetId } = req.body;
    if (!targetId || targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'সঠিক অ্যাডমিন আইডি দিন' });
    }

    const queryTarget = mongoose.isValidObjectId(targetId) ? { $or: [{ id: targetId }, { _id: targetId }] } : { id: targetId };
    const targetAdmin = await User.findOne(queryTarget);
    if (!targetAdmin || (targetAdmin.role === 'super-admin' || targetAdmin.role === 'super_admin')) {
      return res.status(404).json({ success: false, message: 'কাঙ্ক্ষিত অ্যাডমিন পাওয়া যায়নি বা উনি ইতোমধ্যে সুপার-অ্যাডমিন' });
    }

    const querySelf = mongoose.isValidObjectId(req.user.id) ? { $or: [{ id: req.user.id }, { _id: req.user.id }] } : { id: req.user.id };
    const currentSuperAdmin = await User.findOne(querySelf);
    if (!currentSuperAdmin) return res.status(404).json({ success: false, message: 'আপনার অ্যাকাউন্ট পাওয়া যায়নি' });

    // Swap roles
    await Promise.all([
      User.updateOne(querySelf, { $set: { role: 'admin' } }),
      User.updateOne(queryTarget, { $set: { role: 'super-admin' } })
    ]);

    res.json({ success: true, message: 'সুপার-অ্যাডমিন ভূমিকা সফলভাবে স্থানান্তর করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে' });
  }
};
