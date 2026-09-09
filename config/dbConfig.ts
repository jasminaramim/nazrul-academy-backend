import mongoose from 'mongoose';

export const DEFAULT_MONGODB_URI = process.env.MONGODB_URI || '';

export function cleanMongoUri(inputUri: string): string {
  if (!inputUri) return '';
  let uri = inputUri.trim();

  const match = uri.match(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    const protocol = match[1] ? 'mongodb+srv' : 'mongodb';
    let user = match[2].trim();
    let pass = match[3].trim();
    let rest = match[4].trim();

    if (user.startsWith('<') && user.endsWith('>')) user = user.slice(1, -1);
    if (pass.startsWith('<') && pass.endsWith('>')) pass = pass.slice(1, -1);

    try {
      if (decodeURIComponent(pass) === pass) pass = encodeURIComponent(pass);
    } catch {
      pass = encodeURIComponent(pass);
    }

    let hostPart = rest;
    let queryPart = '';
    if (rest.includes('?')) {
      const qSplit = rest.split('?');
      hostPart = qSplit[0];
      queryPart = '?' + qSplit[1];
    }

    if (!hostPart.includes('/')) {
      hostPart = `${hostPart}/trishal_nazrul_academy`;
    } else if (hostPart.endsWith('/')) {
      hostPart = `${hostPart}trishal_nazrul_academy`;
    }

    return `${protocol}://${user}:${pass}@${hostPart}${queryPart}`;
  }

  return uri;
}

export const connectDB = async (uri?: string) => {
  try {
    const finalUri = uri || process.env.MONGODB_URI || '';
    const cleanUri = cleanMongoUri(finalUri);
    if (!cleanUri) throw new Error('MongoDB URI not provided');
    
    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Successfully connected to Mongoose`);
    return { success: true, message: 'MongoDB connected via Mongoose' };
  } catch (error: any) {
    console.error(`[MongoDB] Connection error:`, error.message);
    return { success: false, message: `MongoDB Error: ${error.message}` };
  }
};
