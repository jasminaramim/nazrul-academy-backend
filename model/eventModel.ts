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

// --- Upcoming Event / Activity Poster Model ---
export interface IUpcomingEvent extends Document {
  id: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // e.g. "10:00" or "সকাল ১০:০০ টা"
  dateTime?: Date;
  location: string;
  details: string;
  image?: string;
  chiefGuest?: string;
  specialAttraction?: string;
  isActive: boolean;
  showPopup: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const upcomingEventSchema = new Schema<IUpcomingEvent>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventTime: { type: String, default: 'সকাল ১০:০০ টা' },
  dateTime: { type: Date },
  location: { type: String, required: true },
  details: { type: String, default: '' },
  image: { type: String, default: '' },
  chiefGuest: { type: String, default: '' },
  specialAttraction: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  showPopup: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

export const UpcomingEvent = mongoose.model<IUpcomingEvent>('UpcomingEvent', upcomingEventSchema);
