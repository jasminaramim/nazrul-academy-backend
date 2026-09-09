import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { HeroSlide } from './model/miscModel';
import { connectDB } from './config/dbConfig';

const backendEnv = path.resolve(process.cwd(), 'backend', '.env');
const rootEnv = path.resolve(process.cwd(), '.env');

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else {
  dotenv.config({ path: rootEnv });
}

const seedData = [
  {
    id: 'hero-1',
    title: 'ত্রিশাল সরকারি নজরুল একাডেমি পুনর্মিলনী ২০২৬',
    subtitle: 'শতবর্ষের স্মৃতিবিজড়িত নজরুল আঙিনায় ফিরে দেখার আনন্দ মিলনমেলা',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
    order: 1,
  },
  {
    id: 'hero-2',
    title: 'নজরুলের স্মৃতিধন্য বিদ্যাপীঠ আমাদের অহংকার',
    subtitle: '১৯১৩ সালে প্রতিষ্ঠিত প্রাচীন ঐতিহ্যবাহী নজরুল একাডেমি প্রাঙ্গণে সকল প্রাক্তনদের সাদর আমন্ত্রণ',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80',
    order: 2,
  },
  {
    id: 'hero-3',
    title: 'এসো মিলি প্রাণের টানে, শেকড়ের জয়গানে',
    subtitle: 'সহপাঠী, বন্ধু ও শ্রদ্ধেয় শিক্ষকদের সান্নিধ্যে এক অবিস্মরণীয় সোনালী মুহূর্ত',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    order: 3,
  },
];

async function seedHeroSlides() {
  try {
    await connectDB();
    
    // Clear existing slides
    await HeroSlide.deleteMany({});
    console.log('Existing hero slides removed.');

    // Insert new slides
    await HeroSlide.insertMany(seedData);
    console.log('Hero slides successfully seeded.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding hero slides:', error);
    process.exit(1);
  }
}

seedHeroSlides();
