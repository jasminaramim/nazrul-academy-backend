import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  // Explicit configuration to ensure it never fails
  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbmnia6qh',
    api_key: process.env.CLOUDINARY_API_KEY || '511784252694518',
    api_secret: process.env.CLOUDINARY_API_SECRET || '8bWsPY1PL7S_CcC_JwORPYZ3iMg',
  });

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, message: 'কোনো ইমেজ দেওয়া হয়নি' });
    }

    // Check if it's a base64 string
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ success: false, message: 'ইমেজটি সঠিক ফরম্যাটে নেই (Base64 প্রয়োজন)' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'trishal_academy',
      resource_type: 'image',
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, message: 'ইমেজ আপলোড করতে সমস্যা হয়েছে: ' + err.message });
  }
};
