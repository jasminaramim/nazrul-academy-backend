import { Request, Response } from 'express';
import { Notice, Schedule, Cultural, UpcomingEvent } from '../model/eventModel';

// --- Upcoming Events / Activities ---
const parseEventDateTime = (eventDate: string, eventTime?: string): Date => {
  try {
    if (!eventDate) return new Date();
    // Try to parse time if e.g. "14:30" or "10:00"
    let timePart = '10:00:00';
    if (eventTime) {
      const match = eventTime.match(/(\d{1,2})[:.](\d{2})/);
      if (match) {
        let hour = parseInt(match[1], 10);
        const min = match[2];
        if (eventTime.includes('অপরাহ্ন') || eventTime.includes('রাত') || eventTime.toLowerCase().includes('pm')) {
          if (hour < 12) hour += 12;
        }
        timePart = `${hour.toString().padStart(2, '0')}:${min}:00`;
      }
    }
    const d = new Date(`${eventDate}T${timePart}`);
    if (isNaN(d.getTime())) return new Date(eventDate);
    return d;
  } catch {
    return new Date(eventDate);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const data = await UpcomingEvent.find().sort({ eventDate: 1, createdAt: -1 });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createUpcomingEvent = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const dateTime = parseEventDateTime(rest.eventDate, rest.eventTime);
    const newItem = new UpcomingEvent({
      id: 'event-' + Date.now(),
      dateTime,
      ...rest,
    });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUpcomingEvent = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.eventDate) {
      updateData.dateTime = parseEventDateTime(updateData.eventDate, updateData.eventTime);
    }
    const updated = await UpcomingEvent.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUpcomingEvent = async (req: Request, res: Response) => {
  try {
    await UpcomingEvent.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'সফলভাবে ডিলিট করা হয়েছে' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
