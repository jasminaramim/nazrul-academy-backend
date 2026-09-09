import mongoose, { Schema, Document } from 'mongoose';

// --- Notice Model ---
export interface INotice extends Document {
  id: string;
  date: string;
  title: string;
  description: string;
  priority: string;
}

const noticeSchema = new Schema<INotice>({
  id: { type: String, required: true, unique: true },
  date: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, default: 'সাধারণ' },
}, { timestamps: true, strict: false });

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);

// --- Schedule Model ---
export interface ISchedule extends Document {
  id: string;
  time: string;
  event: string;
  description?: string;
  order: number;
}

const scheduleSchema = new Schema<ISchedule>({
  id: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  event: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true, strict: false });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);

// --- Cultural Schedule Model ---
export interface ICultural extends Document {
  id: string;
  time: string;
  event: string;
  performer: string;
}

const culturalSchema = new Schema<ICultural>({
  id: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  event: { type: String, required: true },
  performer: { type: String, required: true },
}, { timestamps: true, strict: false });

export const Cultural = mongoose.model<ICultural>('CulturalSchedule', culturalSchema);
