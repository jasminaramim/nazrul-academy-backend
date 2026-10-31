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

    // 🔒 Anti-Webshell & Magic-Byte Validation (Binary Signature Verification)
    try {
      const base64Data = image.split(',')[1];
      if (base64Data) {
        const buffer = Buffer.from(base64Data.slice(0, 64), 'base64');
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
        const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

        if (!isJpeg && !isPng && !isPdf && !isWebp) {
          return res.status(400).json({
            success: false,
            message: 'ফাইলের বাইনারি সিগনেচার সঠিক নয়। কোনো ক্ষতিকর বা ছদ্মবেশী ফাইল আপলোড করা যাবে না।'
          });
        }
      }
    } catch (binErr) {
      return res.status(400).json({ success: false, message: 'ফাইল ফরম্যাট প্রসেস করতে ব্যর্থ হয়েছে।' });
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
