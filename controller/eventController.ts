import { Request, Response } from 'express';
import { Notice, Schedule, Cultural } from '../model/eventModel';

// --- Notices ---
export const getNotices = async (req: Request, res: Response) => {
  try {
    const data = await Notice.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createNotice = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Notice({ id: 'notice-' + Date.now(), ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateNotice = async (req: Request, res: Response) => {
  try {
    const updated = await Notice.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteNotice = async (req: Request, res: Response) => {
  try {
    await Notice.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Schedule ---
export const getSchedule = async (req: Request, res: Response) => {
  try {
    const data = await Schedule.find().sort({ order: 1 });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Schedule({ id: 'sch-' + Date.now(), ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const updated = await Schedule.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    await Schedule.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Cultural Schedule ---
export const getCultural = async (req: Request, res: Response) => {
  try {
    const data = await Cultural.find().sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createCultural = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Cultural({ id: 'cult-' + Date.now(), ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateCultural = async (req: Request, res: Response) => {
  try {
    const updated = await Cultural.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteCultural = async (req: Request, res: Response) => {
  try {
    await Cultural.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
