import mongoose from 'mongoose';
import { connectDB } from './config/dbConfig';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const backendEnv = path.resolve(process.cwd(), 'backend', '.env');
const rootEnv = path.resolve(process.cwd(), '.env');

if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else {
  dotenv.config({ path: rootEnv });
}


import {
  initialGlobalConfig,
  initialHeroSlides,
  initialTeacherMessages,
  initialStatsData,
  initialStudents,
  initialFinanceSummary,
  initialNotices,
  initialSchedule,
  initialCulturalSchedule,
  initialDonors,
  initialGallery,
  initialMagazineArticles,
  initialAdminInfo,
} from '../src/shared/data/initialData';

async function seedAll() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('Seeding Global Config...');
  await db.collection('globalconfigs').deleteMany({});
  await db.collection('globalconfigs').insertOne(initialGlobalConfig);

  console.log('Seeding Hero Slides...');
  await db.collection('heroslides').deleteMany({});
  await db.collection('heroslides').insertMany(initialHeroSlides);

  console.log('Seeding Teacher Messages...');
  await db.collection('teachers').deleteMany({});
  await db.collection('teachers').insertMany(initialTeacherMessages);

  console.log('Seeding Stats...');
  await db.collection('stats').deleteMany({});
  await db.collection('stats').insertOne(initialStatsData);

  console.log('Seeding Students...');
  await db.collection('students').deleteMany({});
  await db.collection('students').insertMany(initialStudents);

  console.log('Seeding Finance...');
  await db.collection('finances').deleteMany({});
  await db.collection('finances').insertOne(initialFinanceSummary);

  console.log('Seeding Notices...');
  await db.collection('notices').deleteMany({});
  await db.collection('notices').insertMany(initialNotices);

  console.log('Seeding Schedule...');
  await db.collection('schedules').deleteMany({});
  await db.collection('schedules').insertMany(initialSchedule);

  console.log('Seeding Cultural Schedule...');
  await db.collection('culturalschedules').deleteMany({});
  await db.collection('culturalschedules').insertMany(initialCulturalSchedule);

  console.log('Seeding Donors...');
  await db.collection('donors').deleteMany({});
  await db.collection('donors').insertMany(initialDonors);

  console.log('Seeding Gallery...');
  await db.collection('galleries').deleteMany({});
  await db.collection('galleries').insertMany(initialGallery);

  console.log('Seeding Magazine...');
  await db.collection('magazines').deleteMany({});
  await db.collection('magazines').insertMany(initialMagazineArticles);

  console.log('Seeding Admin Info...');
  await db.collection('admininfos').deleteMany({});
  await db.collection('admininfos').insertOne(initialAdminInfo);

  console.log('All data seeded successfully using direct collection insertion!');
  process.exit(0);
}

seedAll().catch(err => {
  console.error(err);
  process.exit(1);
});
