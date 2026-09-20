import mongoose, { Schema, Document } from 'mongoose';

export type EmailLogType = 'donation_approval' | 'student_approval' | 'otp_verification' | 'other';
export type EmailLogStatus = 'sent' | 'failed' | 'pending';

export interface IEmailLog extends Document {
  id: string;
  recipientEmail: string;
  recipientName: string;
  type: EmailLogType;
  subject: string;
  relatedId?: string;
  status: EmailLogStatus;
  attempts: number;
  lastAttemptAt: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  htmlContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String, default: 'সম্মানিত সদস্য' },
    type: {
      type: String,
      enum: ['donation_approval', 'student_approval', 'otp_verification', 'other'],
      default: 'other',
      index: true,
    },
    subject: { type: String, required: true },
    relatedId: { type: String, index: true },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 1 },
    lastAttemptAt: { type: Date, default: Date.now },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
    htmlContent: { type: String },
  },
  { timestamps: true, strict: false }
);

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
