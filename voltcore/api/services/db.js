const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/voltcore';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDb };
