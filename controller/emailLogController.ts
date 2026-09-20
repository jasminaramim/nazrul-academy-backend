import { Request, Response } from 'express';
import { EmailLog } from '../model/emailLogModel';
import { resendEmailById } from '../utils/emailService';

// GET /api/emails/logs
export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const { status, type, search, limit = '100' } = req.query;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      query.$or = [
        { recipientEmail: { $regex: term, $options: 'i' } },
        { recipientName: { $regex: term, $options: 'i' } },
        { subject: { $regex: term, $options: 'i' } },
      ];
    }

    const logs = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10) || 100);

    res.json({
      success: true,
      data: logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/emails/stats
export const getEmailStats = async (_req: Request, res: Response) => {
  try {
    const total = await EmailLog.countDocuments();
    const sent = await EmailLog.countDocuments({ status: 'sent' });
    const failed = await EmailLog.countDocuments({ status: 'failed' });
    const pending = await EmailLog.countDocuments({ status: 'pending' });
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        pending,
        successRate,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/emails/logs/:id/resend
export const resendEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await resendEmailById(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: result.message,
      data: result.log,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/emails/logs/:id
export const deleteEmailLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await EmailLog.deleteOne({ id });
    res.json({ success: true, message: 'ইমেইল লগ সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
