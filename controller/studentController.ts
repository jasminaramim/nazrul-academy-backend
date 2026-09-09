import { Request, Response } from 'express';
import { Student } from '../model/studentModel';
import { Stats } from '../model/configModel';

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
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const deleted = await Student.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'পাওয়া যায়নি' });
    await Stats.updateOne({}, { $inc: { registeredStudents: -1 } });
    res.json({ success: true, message: 'ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
