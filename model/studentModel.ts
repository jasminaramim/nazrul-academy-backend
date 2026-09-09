import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  id: string;
  name: string;
  nameEn?: string;
  image?: string;
  batch: string;
  batchType: string;
  location?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  school?: string;
  currentJob?: string;
  company?: string;
  tshirtSize?: string;
  familyMembersCount?: number;
  status: string;
}

const studentSchema = new Schema<IStudent>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  image: { type: String },
  batch: { type: String, required: true },
  batchType: { type: String, default: 'new' },
  location: { type: String },
  bloodGroup: { type: String },
  phone: { type: String },
  email: { type: String },
  school: { type: String },
  currentJob: { type: String },
  company: { type: String },
  tshirtSize: { type: String },
  familyMembersCount: { type: Number, default: 0 },
  status: { type: String, default: 'approved' },
}, { timestamps: true, strict: false });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
