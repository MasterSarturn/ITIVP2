const mongoose = require('mongoose');

async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}

function disconnectMongo() {
  return mongoose.disconnect();
}

module.exports = {
  connectMongo,
  disconnectMongo
};
