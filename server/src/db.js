const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        // Try connecting to default local first
        try {
             await mongoose.connect('mongodb://127.0.0.1:27017/hearth', {
                serverSelectionTimeoutMS: 2000
             });
             console.log('MongoDB Connected: Localhost');
             return;
        } catch (err) {
            console.log('Could not connect to localhost mongo, starting in-memory server...');
            mongoServer = await MongoMemoryServer.create();
            mongoUri = mongoServer.getUri();
            console.log(`In-memory MongoDB started at ${mongoUri}`);
        }
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
