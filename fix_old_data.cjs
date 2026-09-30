require('dotenv').config();
const mongoose = require('mongoose');

async function fixOldData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.zox4j.mongodb.net/nazrul-academy?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to DB');

    const Reunion = mongoose.model('Reunion', new mongoose.Schema({ id: String, isActive: Boolean }, { strict: false }));
    const Student = mongoose.model('Student', new mongoose.Schema({ id: String, reunionId: String }, { strict: false }));
    const Donor = mongoose.model('Donor', new mongoose.Schema({ id: String, reunionId: String }, { strict: false }));

    const activeReunion = await Reunion.findOne({ isActive: true });
    
    if (!activeReunion) {
      console.log('No active reunion found');
      process.exit(1);
    }
    
    const rId = activeReunion.id;
    console.log(`Active Reunion ID is: ${rId}`);

    // Update students
    const studentRes = await Student.updateMany(
      { $or: [{ reunionId: { $exists: false } }, { reunionId: null }, { reunionId: "" }] },
      { $set: { reunionId: rId } }
    );
    console.log(`Updated ${studentRes.modifiedCount} old students with reunionId`);

    // Update donors
    const donorRes = await Donor.updateMany(
      { $or: [{ reunionId: { $exists: false } }, { reunionId: null }, { reunionId: "" }] },
      { $set: { reunionId: rId } }
    );
    console.log(`Updated ${donorRes.modifiedCount} old donors with reunionId`);

    console.log('Done!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fixOldData();
