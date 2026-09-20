import { Request, Response } from 'express';
import { GlobalConfig, AdminInfo, Finance, Stats } from '../model/configModel';

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
    let finance = await Finance.findOne();
    if (!finance) finance = await Finance.create({});
    res.json({ success: true, data: finance });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateFinance = async (req: Request, res: Response) => {
  try {
    const { totalIncome, totalExpense, breakdown, transactions } = req.body;
    const balance = (Number(totalIncome) || 0) - (Number(totalExpense) || 0);
    const updateData = { totalIncome, totalExpense, balance, breakdown, transactions, lastUpdated: new Date().toISOString().split('T')[0] };
    const finance = await Finance.findOneAndUpdate({}, updateData, { new: true, upsert: true });
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

import mongoose from 'mongoose';

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

import { User } from '../model/userModel';
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
