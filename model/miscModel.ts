import mongoose, { Schema, Document } from 'mongoose';

export interface IDonor extends Document {
  id: string;
  name: string;
  amount: number;
  batch?: string;
}
const donorSchema = new Schema<IDonor>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  batch: { type: String },
}, { timestamps: true, strict: false });
export const Donor = mongoose.model<IDonor>('Donor', donorSchema);

export interface IGallery extends Document {
  id: string;
  type: string;
  url: string;
  title?: string;
  date?: string;
}
const gallerySchema = new Schema<IGallery>({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String },
  date: { type: String },
}, { timestamps: true, strict: false });
export const Gallery = mongoose.model<IGallery>('Gallery', gallerySchema);

export interface IMagazine extends Document {
  id: string;
  title: string;
  author: string;
  type: string;
  excerpt?: string;
  content: string;
  date?: string;
}
const magazineSchema = new Schema<IMagazine>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  type: { type: String, required: true },
  excerpt: { type: String },
  content: { type: String, required: true },
  date: { type: String },
}, { timestamps: true, strict: false });
export const Magazine = mongoose.model<IMagazine>('Magazine', magazineSchema);

export interface IHeroSlide extends Document {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  order: number;
}
const heroSchema = new Schema<IHeroSlide>({
  id: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  order: { type: Number, default: 0 },
}, { timestamps: true, strict: false });
export const HeroSlide = mongoose.model<IHeroSlide>('HeroSlide', heroSchema);

export interface ITeacherMsg extends Document {
  id: string;
  name: string;
  designation: string;
  image: string;
  message: string;
  order: number;
}
const teacherSchema = new Schema<ITeacherMsg>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  image: { type: String, required: true },
  message: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true, strict: false });
export const TeacherMessage = mongoose.model<ITeacherMsg>('Teacher', teacherSchema);
