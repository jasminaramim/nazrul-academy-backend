import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  // Explicit configuration to ensure it never fails
  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'zscxtz3w',
    api_key: process.env.CLOUDINARY_API_KEY || '994778253158233',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'rCk6zXVwh-66-Md8zmC2ZqIxwlo',
  });

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, message: 'কোনো ইমেজ দেওয়া হয়নি' });
    }

    // Strict MIME whitelist validation for file uploads
    const allowedMimePrefixes = [
      'data:image/jpeg',
      'data:image/jpg',
      'data:image/png',
      'data:image/webp',
      'data:application/pdf'
    ];
    const isAllowed = allowedMimePrefixes.some(prefix => image.startsWith(prefix));
    if (!isAllowed) {
      return res.status(400).json({ 
        success: false, 
        message: 'শুধুমাত্র নিরাপদ ছবি (JPG, PNG, WebP) অথবা PDF ফাইল আপলোড করা যাবে।' 
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'trishal_academy',
      resource_type: 'auto',
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, message: 'ইমেজ আপলোড করতে সমস্যা হয়েছে: ' + err.message });
  }
};
