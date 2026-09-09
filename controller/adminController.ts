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

