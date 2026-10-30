/**
 * db.js
 * MongoDB Atlas Connection Configuration using Mongoose.
 * Reads MONGODB_URI from environment variables.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI is not set in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Failed:', error.message);
    return false;
  }
};

module.exports = connectDB;
