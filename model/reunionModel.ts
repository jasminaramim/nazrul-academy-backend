import mongoose, { Schema, Document } from 'mongoose';

export interface IReunion extends Document {
  id: string; // e.g. "reunion-2026"
  title: string; // e.g. "শতবর্ষ পূর্তি পুনর্মিলনী ২০২৬"
  year: number; // e.g. 2026
  isActive: boolean; // Is this the current ongoing reunion?
}

const reunionSchema = new Schema<IReunion>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  year: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export const Reunion = mongoose.model<IReunion>('Reunion', reunionSchema);
