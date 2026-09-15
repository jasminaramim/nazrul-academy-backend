const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/nazrul-academy').then(async () => {
  const Stats = mongoose.connection.collection('stats');
  const res = await Stats.updateOne({}, { $pull: { customStats: { id: 'cstat-4' } } });
  console.log(res);
  process.exit(0);
}).catch(console.error);
