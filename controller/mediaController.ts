import { Request, Response } from 'express';
import { Donor, Gallery, Magazine } from '../model/miscModel';

// --- Donors ---
export const getDonors = async (req: Request, res: Response) => {
  try {
    const data = await Donor.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createDonor = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Donor({ id: 'dn-' + Date.now(), ...rest });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateDonor = async (req: Request, res: Response) => {
  try {
    const updated = await Donor.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteDonor = async (req: Request, res: Response) => {
  try {
    await Donor.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
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
    const data = await Magazine.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createMagazine = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newItem = new Magazine({ id: 'mag-' + Date.now(), date: req.body.date || new Date().toISOString().split('T')[0], ...rest });
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
