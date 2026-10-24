import { Request, Response } from 'express';
import { Student } from '../model/studentModel';
import { Stats } from '../model/configModel';
import { User } from '../model/userModel';

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { batchType, batch, bloodGroup, search } = req.query;
    let query: any = {};

    if (batchType && batchType !== 'all') query.batchType = batchType;
    if (batch && batch !== 'all') query.batch = { $regex: batch as string, $options: 'i' };
    if (bloodGroup && bloodGroup !== 'all') query.bloodGroup = bloodGroup;
    if (search) {
      const q = (search as string).toLowerCase();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nameEn: { $regex: q, $options: 'i' } },
        { batch: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: students, total: students.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const newStudent = new Student({
      id: 'std-' + Date.now(),
      ...rest,
      status: req.body.status || 'approved',
    });
    await newStudent.save();
    await Stats.updateOne({}, { $inc: { registeredStudents: 1 } }, { upsert: true });
    res.status(201).json({ success: true, data: newStudent });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const updated = await Student.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'পাওয়া যায়নি' });

    // Sync corresponding User account if exists
    if (updated.email || updated.phone || updated.id) {
      const userUpdates: any = {};
      if (req.body.name !== undefined) userUpdates.name = req.body.name;
      if (req.body.nameEn !== undefined) userUpdates.nameEn = req.body.nameEn;
      if (req.body.batch !== undefined) userUpdates.batch = req.body.batch;
      if (req.body.bloodGroup !== undefined) userUpdates.bloodGroup = req.body.bloodGroup;
      if (req.body.location !== undefined) userUpdates.location = req.body.location;
      if (req.body.currentJob !== undefined) userUpdates.currentJob = req.body.currentJob;
      if (req.body.company !== undefined) userUpdates.company = req.body.company;
      if (req.body.image !== undefined) userUpdates.image = req.body.image;
      if (req.body.tshirtSize !== undefined) userUpdates.tshirtSize = req.body.tshirtSize;

      const orConditions: any[] = [{ id: req.params.id }];
      if (updated.email) orConditions.push({ email: updated.email.toLowerCase() });
      if (updated.phone) orConditions.push({ phone: updated.phone });

      if (Object.keys(userUpdates).length > 0) {
        await User.updateMany({ $or: orConditions }, { $set: userUpdates });
      }
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const deleted = await Student.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'পাওয়া যায়নি' });

    // Also delete associated User account so email/phone are released immediately for re-registration
    const orConditions: any[] = [];
    if (deleted.email) orConditions.push({ email: deleted.email.toLowerCase() });
    if (deleted.phone) orConditions.push({ phone: deleted.phone });
    if (deleted.id) orConditions.push({ id: deleted.id });

    if (orConditions.length > 0) {
      await User.deleteMany({
        role: { $ne: 'admin' },
        $or: orConditions
      });
    }

    await Stats.updateOne({}, { $inc: { registeredStudents: -1 } });
    res.json({ success: true, message: 'শিক্ষার্থী ও সংশ্লিষ্ট অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
