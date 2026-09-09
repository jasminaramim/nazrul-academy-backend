import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'trishal-nazrul-academy-secret-key-2026';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'অনুমোদন প্রয়োজন (টোকেন পাওয়া যায়নি)' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'টোকেন অকার্যকর বা মেয়াদোত্তীর্ণ' });
    }
    req.user = decoded;
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'শুধুমাত্র অ্যাডমিনদের জন্য অনুমতি প্রাপ্ত' });
  }
};
