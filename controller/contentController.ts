import { Request, Response } from 'express';
import { HeroSlide, TeacherMessage } from '../model/miscModel';

// --- Hero Slides ---
export const getHeroSlides = async (req: Request, res: Response) => {
  try {
    const data = await HeroSlide.find().sort({ order: 1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createHeroSlide = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const count = await HeroSlide.countDocuments();
    const newItem = new HeroSlide({ id: 'hero-' + Date.now(), ...rest, order: count + 1 });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateHeroSlide = async (req: Request, res: Response) => {
  try {
    const updated = await HeroSlide.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteHeroSlide = async (req: Request, res: Response) => {
  try {
    await HeroSlide.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'স্লাইড ডিলিট করা হয়েছে' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// --- Teacher Messages ---
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const data = await TeacherMessage.find().sort({ order: 1 });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const count = await TeacherMessage.countDocuments();
    const newItem = new TeacherMessage({ id: 'tm-' + Date.now(), ...rest, order: count + 1 });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const updated = await TeacherMessage.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteTeacher = async (req: Request, res: Response) => {
  try {
    await TeacherMessage.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'মুছে ফেলা হয়েছে' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
