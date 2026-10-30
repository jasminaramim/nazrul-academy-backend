import rateLimit from 'express-rate-limit';

// Global API rate limiter - protects server from aggressive scraping or DDoS
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // 600 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'সার্ভারে অতিরিক্ত রিকোয়েস্ট পাঠানোর কারণে সাময়িক বিলম্ব হচ্ছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।',
  },
});

// Registration Rate Limiter - prevents automated bots from creating bulk fake accounts
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Maximum 5 registrations per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'অতিরিক্ত রেজিস্ট্রেশন চেষ্টার কারণে আপনার অনুরোধ সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});

// Login Rate Limiter - prevents brute-force password cracking attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 login attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'অতিরিক্ত ভুল বা বারবার লগইন চেষ্টার কারণে আপনার আইপি সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});

// Verification/OTP Rate Limiter - prevents spamming email/SMS gateways
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 OTP attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'অতিরিক্ত ভেরিফিকেশন কোড পাঠানোর অনুরোধ করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});
