import mongoose, { Schema, Document } from 'mongoose';

// Only using string keys for config documents

export interface IGlobalConfig extends Document {
  siteTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationFee: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  contactPhone1: string;
  contactPhone2: string;
  contactEmail: string;
  address: string;
  facebookUrl: string;
  youtubeUrl: string;
}
const globalConfigSchema = new Schema<IGlobalConfig>({
  siteTitle: { type: String, default: 'ত্রিশাল সরকারি নজরুল একাডেমি' },
  eventDate: { type: String },
  eventVenue: { type: String },
  registrationFee: { type: String },
  bkashNumber: { type: String },
  nagadNumber: { type: String },
  rocketNumber: { type: String },
  contactPhone1: { type: String },
  contactPhone2: { type: String },
  contactEmail: { type: String },
  address: { type: String },
  facebookUrl: { type: String },
  youtubeUrl: { type: String },
}, { timestamps: true, strict: false });
export const GlobalConfig = mongoose.model<IGlobalConfig>('GlobalConfig', globalConfigSchema);

export interface IAdminInfo extends Document {
  name: string;
  phone: string;
  email: string;
}
const adminInfoSchema = new Schema<IAdminInfo>({
  name: { type: String },
  phone: { type: String },
  email: { type: String },
}, { timestamps: true, strict: false });
export const AdminInfo = mongoose.model<IAdminInfo>('AdminInfo', adminInfoSchema);

export interface IStats extends Document {
  registeredStudents: number;
  familyMembersCount: number;
  totalDonation: number;
}
const statsSchema = new Schema<IStats>({
  registeredStudents: { type: Number, default: 0 },
  familyMembersCount: { type: Number, default: 0 },
  totalDonation: { type: Number, default: 0 },
}, { timestamps: true, strict: false });
export const Stats = mongoose.model<IStats>('Stats', statsSchema);

export interface IFinance extends Document {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  lastUpdated: string;
  breakdown: any[];
  transactions: any[];
}
const financeSchema = new Schema<IFinance>({
  totalIncome: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  lastUpdated: { type: String },
  breakdown: [{ type: Schema.Types.Mixed }],
  transactions: [{ type: Schema.Types.Mixed }],
}, { timestamps: true, strict: false });
export const Finance = mongoose.model<IFinance>('Finance', financeSchema);
