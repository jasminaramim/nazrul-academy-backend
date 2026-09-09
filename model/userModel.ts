import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string; // custom id string
  name: string;
  nameEn?: string;
  username?: string;
  email: string;
  passwordHash: string;
  role: string;
  phone?: string;
  bloodGroup?: string;
  batch?: string;
  location?: string;
  school?: string;
  currentJob?: string;
  company?: string;
  status: string;
  createdAt: string;
  image?: string;
  familyMembersCount?: number;
  tshirtSize?: string;
}

const userSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  username: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'alumni' },
  phone: { type: String },
  bloodGroup: { type: String },
  batch: { type: String },
  location: { type: String },
  school: { type: String },
  currentJob: { type: String },
  company: { type: String },
  status: { type: String, default: 'approved' },
  createdAt: { type: String },
  image: { type: String },
  familyMembersCount: { type: Number, default: 0 },
  tshirtSize: { type: String },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);
