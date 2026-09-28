const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  username: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'alumni' },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect('mongodb+srv://Trishal:Ele%2FSq9%3FuA.d3Z%236%21yR@cluster0.ssmpl.mongodb.net/trishal_nazrul_academy');
  const admins = await User.find({ role: { $in: ['admin', 'super-admin', 'super_admin'] } });
  
  for (const admin of admins) {
    if (admin.id === 'usr-admin-jasmin' || admin.name.includes('Jasmin')) {
       admin.name = '(প্রধান প্রশাসক)';
       if(admin.role === 'super_admin') admin.role = 'super-admin';
       await admin.save();
       console.log('Jasmin fixed.');
    }
    if (admin.name.includes('Rofikul')) {
       admin.role = 'admin';
       await admin.save();
       console.log('Rofikul fixed.');
    }
    console.log('ID:', admin.id, 'Role:', admin.role);
  }

  mongoose.disconnect();
}
run().catch(console.error);
