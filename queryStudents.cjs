const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://jasminaramim:jasmin321@cluster0.zox2s.mongodb.net/nazrul-academy?retryWrites=true&w=majority');
  
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const students = await Student.find({});
  console.log("Total students:", students.length);
  students.forEach(s => {
    console.log(s.name, s.status, "Fee:", s.registrationFee, typeof s.registrationFee, "ReunionId:", s.reunionId);
  });
  process.exit(0);
}

run();
