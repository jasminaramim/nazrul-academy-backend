import { Request, Response } from 'express';
import { Donor, Gallery, Magazine } from '../model/miscModel';
import { Stats, Finance, GlobalConfig } from '../model/configModel';
import { sendDonationApprovalEmail } from '../utils/emailService';

// --- Donors ---
export const getDonors = async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === 'true';
    const query: any = showAll ? {} : { status: 'approved' };
    const data = await Donor.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitPublicDonation = async (req: Request, res: Response) => {
  try {
    const {
      name,
      nameEn,
      amount,
      batch,
      phone,
      email,
      image,
      paymentMethod,
      senderNumber,
      transactionId,
      message,
    } = req.body;

    if (!name || !amount || !phone || !senderNumber || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে নাম, মোবাইল নম্বর, অনুদানের পরিমাণ, প্রেরক নম্বর ও TrxID পূরণ করুন।',
      });
    }

    // Verify payment method limit status
    const config = await GlobalConfig.findOne();
    if (config) {
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
          message: `বর্তমানে আমাদের ${methodBn} অ্যাকাউন্টের লেনদেনের সীমা (Limit) শেষ। অনুগ্রহ করে অন্য কোনো মাধ্যমে পেমেন্ট করুন।`,
        });
      }
    }

    const newItem = new Donor({
      id: 'dn-' + Date.now(),
      name,
      nameEn: nameEn || '',
      amount: Number(amount),
      batch: batch || 'শুভানুধ্যায়ী',
      phone,
      email: email || '',
      image: image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Donor')}`,
      paymentMethod: paymentMethod || 'bkash',
      senderNumber,
      transactionId,
      message: message || '',
      status: 'pending',
      category: 'সম্মানিত দাতা',
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: 'আপনার অনুদানের তথ্য সফলভাবে জমা নেওয়া হয়েছে। অ্যাডমিন কর্তৃক যাচাই-বাছাই সাপেক্ষে এটি চূড়ান্ত অনুমোদন করা হবে।',
      data: newItem,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveDonation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findOne({ id });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'দাতার তথ্য পাওয়া যায়নি' });
    }

    if (donor.status === 'approved') {
      return res.status(400).json({ success: false, message: 'এই অনুদানটি পূর্বেই অনুমোদিত হয়েছে।' });
    }

    donor.status = 'approved';
    await donor.save();

    // 1. Update Stats
    await Stats.updateOne({}, { $inc: { totalDonation: donor.amount } }, { upsert: true });

    // 2. Update Finance
    let finance = await Finance.findOne();
    if (!finance) finance = await Finance.create({});
    finance.totalIncome = (finance.totalIncome || 0) + donor.amount;
    finance.balance = (finance.totalIncome || 0) - (finance.totalExpense || 0);

    if (donor.amount > 0) {
      finance.transactions.push({
        id: 'trx-dn-' + Date.now(),
        type: 'income',
        amount: donor.amount,
        source: 'Donation',
        name: donor.name + (donor.batch ? ` (${donor.batch})` : ''),
        date: new Date().toISOString().split('T')[0],
        note: `TrxID: ${donor.transactionId || 'N/A'}, Method: ${donor.paymentMethod || 'Online'}`,
      });
    }
    await finance.save();

    // 3. Send confirmation email if email exists
    let emailStatus = { success: false, message: 'ইমেইল দেওয়া হয়নি।' };
    if (donor.email && donor.email.includes('@')) {
      emailStatus = await sendDonationApprovalEmail({
        to: donor.email,
        donorName: donor.name,
        amount: donor.amount,
        transactionId: donor.transactionId,
        paymentMethod: donor.paymentMethod,
        batch: donor.batch,
        donorId: donor.id,
      });
    }

    res.json({
      success: true,
      message: `অনুদানটি সফলভাবে অনুমোদিত হয়েছে। ${emailStatus.success ? 'দাতার ইমেইলে নিশ্চিতকরণ পত্র পাঠানো হয়েছে ও লগ সেভ হয়েছে।' : 'ইমেইল পাঠানো সম্ভব হয়নি (লগে সংরক্ষিত)।'}`,
      data: donor,
      emailStatus,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createDonor = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Donor({
      id: 'dn-' + Date.now(),
      status: rest.status || 'approved',
      ...rest,
    });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDonor = async (req: Request, res: Response) => {
  try {
    const updated = await Donor.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteDonor = async (req: Request, res: Response) => {
  try {
    await Donor.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Gallery ---
export const getGallery = async (req: Request, res: Response) => {
  try {
    const data = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createGallery = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Gallery({ id: 'gal-' + Date.now(), date: req.body.date || '২০২৬', ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateGallery = async (req: Request, res: Response) => {
  try {
    const updated = await Gallery.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteGallery = async (req: Request, res: Response) => {
  try {
    await Gallery.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Magazine ---
export const getMagazine = async (req: Request, res: Response) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isApproved: true };
    const data = await Magazine.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createMagazine = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Magazine({ id: 'mag-' + Date.now(), date: req.body.date || new Date().toISOString().split('T')[0], isApproved: true, ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const submitMagazineArticle = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Magazine({ id: 'mag-' + Date.now(), date: req.body.date || new Date().toISOString().split('T')[0], isApproved: false, ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateMagazine = async (req: Request, res: Response) => {
  try {
    const updated = await Magazine.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteMagazine = async (req: Request, res: Response) => {
  try {
    await Magazine.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
