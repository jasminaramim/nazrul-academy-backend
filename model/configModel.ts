import mongoose, { Schema, Document } from 'mongoose';

// Only using string keys for config documents

export interface IGlobalConfig extends Document {
  siteTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationFee: string;
  feeOldBatch: number;
  feeNewBatch: number;
  maxRegistrations: number;
  bkashNumber: string;
  bkashType: string;
  bkashAction: string; // 'send_money' | 'cash_out' | 'payment'
  bkashLimitOut: boolean;
  nagadNumber: string;
  nagadType: string;
  nagadAction: string;
  nagadLimitOut: boolean;
  rocketNumber: string;
  rocketType: string;
  rocketAction: string;
  rocketLimitOut: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankRoutingNumber: string;
  contactPhone1: string;
  contactPhone2: string;
  contactEmail: string;
  address: string;
  facebookUrl: string;
  youtubeUrl: string;
  cardBackgroundUrl: string;
  cardTitle: string;
  cardSubtitle1: string;
  cardSubtitle2: string;
  cardQuote: string;
  cardFooterText: string;
}
const globalConfigSchema = new Schema<IGlobalConfig>({
  siteTitle: { type: String, default: 'ত্রিশাল সরকারি নজরুল একাডেমি' },
  eventDate: { type: String },
  eventVenue: { type: String },
  registrationFee: { type: String },
  feeOldBatch: { type: Number, default: 1500 },
  feeNewBatch: { type: Number, default: 1000 },
  maxRegistrations: { type: Number, default: 8000 },
  bkashNumber: { type: String },
  bkashType: { type: String, default: 'মার্চেন্ট' },
  bkashAction: { type: String, default: 'payment' },
  bkashLimitOut: { type: Boolean, default: false },
  nagadNumber: { type: String },
  nagadType: { type: String, default: 'পার্সোনাল' },
  nagadAction: { type: String, default: 'send_money' },
  nagadLimitOut: { type: Boolean, default: false },
  rocketNumber: { type: String },
  rocketType: { type: String, default: 'পার্সোনাল' },
  rocketAction: { type: String, default: 'send_money' },
  rocketLimitOut: { type: Boolean, default: false },
  bankName: { type: String },
  bankAccountName: { type: String },
  bankAccountNumber: { type: String },
  bankBranch: { type: String },
  bankRoutingNumber: { type: String },
  contactPhone1: { type: String },
  contactPhone2: { type: String },
  contactEmail: { type: String },
  address: { type: String },
  facebookUrl: { type: String },
  youtubeUrl: { type: String },
  cardBackgroundUrl: { type: String },
  cardTitle: { type: String },
  cardSubtitle1: { type: String },
  cardSubtitle2: { type: String },
  cardQuote: { type: String },
  cardFooterText: { type: String },
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
  totalDonation: number;
}
const statsSchema = new Schema<IStats>({
  registeredStudents: { type: Number, default: 0 },
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
