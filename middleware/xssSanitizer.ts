import { Request, Response, NextFunction } from 'express';

// Recursively sanitize strings to prevent Stored XSS attacks
function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    // If it's a data URL (like an uploaded image base64), preserve it
    if (val.startsWith('data:image/') || val.startsWith('data:application/pdf')) {
      return val;
    }

    return val
      // Strip script and dangerous tags
      .replace(/<\/?(script|iframe|object|embed|style|meta|link|svg|math|applet|form|button)[^>]*>/gi, '')
      // Strip dangerous attributes (onerror, onload, onclick, onmouseover, etc.)
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      // Strip javascript: pseudo-protocol
      .replace(/javascript\s*:/gi, '')
      .trim();
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }

  if (val !== null && typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = sanitizeValue(val[key]);
    }
    return cleaned;
  }

  return val;
}

export const xssSanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
