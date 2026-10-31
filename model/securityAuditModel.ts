import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityAudit extends Document {
  id: string;
  action: string;
  performedBy?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'blocked' | 'warning';
  details?: Record<string, any>;
  createdAt: Date;
}

const SecurityAuditSchema = new Schema<ISecurityAudit>({
  id: { type: String, required: true, unique: true },
  action: { type: String, required: true, index: true },
  performedBy: {
    id: String,
    email: String,
    name: String,
    role: String,
  },
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure', 'blocked', 'warning'], default: 'success' },
  details: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const SecurityAudit = mongoose.model<ISecurityAudit>('SecurityAudit', SecurityAuditSchema);

export async function recordSecurityAudit({
  action,
  performedBy,
  ipAddress,
  userAgent,
  status = 'success',
  details
}: {
  action: string;
  performedBy?: { id?: string; email?: string; name?: string; role?: string };
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'blocked' | 'warning';
  details?: Record<string, any>;
}) {
  try {
    const id = 'sec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    await SecurityAudit.create({
      id,
      action,
      performedBy,
      ipAddress,
      userAgent,
      status,
      details,
      createdAt: new Date(),
    });
  } catch (err: any) {
    console.error('[SecurityAudit] Failed to record audit log:', err.message);
  }
}
