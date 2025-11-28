const mongoose = require('mongoose');
const seedData = require('./seeder');
require('dotenv').config();

const forceSeed = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/hearth');
        console.log('Connected to MongoDB');

        // Force clear and seed
        await mongoose.connection.db.dropDatabase();
        console.log('Database cleared');

        await seedData();
        console.log('Database re-seeded');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

forceSeed();
