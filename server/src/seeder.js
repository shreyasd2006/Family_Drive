const mongoose = require('mongoose');
const User = require('./models/User');
const Household = require('./models/Household');
const Document = require('./models/Document');
const Asset = require('./models/Asset');
const Bill = require('./models/Bill');
const Health = require('./models/Health');
const EmergencyContact = require('./models/EmergencyContact');

const seedData = async () => {
    // Check if data exists
    const count = await User.countDocuments();
    if (count > 0) {
        console.log('Data already exists, skipping seed.');
        return;
    }

    console.log('Seeding data...');

    // Clear existing data just in case
    await User.deleteMany({});
    await Household.deleteMany({});
    await Document.deleteMany({});
    await Asset.deleteMany({});
    await Bill.deleteMany({});
    await Health.deleteMany({});
    await EmergencyContact.deleteMany({});

    // Create Household
    const household = await Household.create({
        name: 'The Smiths',
        housePassword: 'password123'
    });

    // Create Users
    const admin = await User.create({
        name: 'John Smith',
        username: 'john',
        password: 'password123',
        role: 'admin',
        avatar: '👨',
        household: household._id
    });

    const member = await User.create({
        name: 'Jane Smith',
        username: 'jane',
        password: 'password123',
        role: 'member',
        avatar: '👩',
        household: household._id
    });

    // Documents
    const docs = [
        {
            title: 'Home Insurance Policy',
            type: 'Insurance',
            tags: ['insurance', 'home', 'critical'],
            userId: 'family',
            householdId: household._id,
            expiry: new Date('2025-12-31'),
            location: 'Safe Box 1',
            secure: true,
            number: 'POL-99887766'
        },
        {
            title: 'John\'s Passport',
            type: 'Identity',
            tags: ['travel', 'id'],
            userId: admin._id,
            householdId: household._id,
            expiry: new Date('2028-05-20'),
            location: 'Drawer A',
            secure: true,
            number: 'A12345678'
        },
        {
            title: 'Jane\'s Driving License',
            type: 'Identity',
            tags: ['id', 'driving'],
            userId: member._id,
            householdId: household._id,
            expiry: new Date('2024-11-15'), // Soon to expire
            location: 'Wallet',
            secure: true,
            number: 'DL-555-444'
        }
    ];

    await Document.insertMany(docs);

    // Assets
    const assets = [
        {
            title: 'Refrigerator Samsung',
            purchaseDate: '2023-01-15',
            warrantyExpiry: '2026-01-15',
            serviceInterval: 365,
            userId: 'family',
            householdId: household._id,
            serviceHistory: [{ date: '2023-01-15', note: 'Installation' }]
        },
        {
            title: 'MacBook Pro',
            purchaseDate: '2022-06-01',
            warrantyExpiry: '2023-06-01', // Expired
            serviceInterval: 0,
            userId: admin._id,
            householdId: household._id
        }
    ];

    await Asset.insertMany(assets);

    // Bills
    const bills = [
        {
            title: 'Electricity Bill',
            amount: 1500,
            dueDate: '2023-11-05', // Past due if today is > Nov 5
            status: 'pending',
            user: 'family',
            householdId: household._id
        },
        {
            title: 'Netflix Subscription',
            amount: 199,
            dueDate: '2023-11-20',
            status: 'pending',
            user: 'family',
            householdId: household._id
        }
    ];

    await Bill.insertMany(bills);

    // Health
    const health = [
        {
            userId: admin._id,
            householdId: household._id,
            type: 'Blood Group',
            value: 'O+'
        },
        {
            userId: member._id,
            householdId: household._id,
            type: 'Blood Group',
            value: 'A-'
        },
        {
            userId: admin._id,
            householdId: household._id,
            type: 'Vaccination',
            value: 'Flu Shot',
            date: '2023-09-10',
            nextDue: '2024-09-10'
        }
    ];

    await Health.insertMany(health);

    // Emergency
    const contacts = [
        {
            name: 'Grandma',
            number: '555-0199',
            householdId: household._id
        },
        {
            name: 'Dr. House',
            number: '555-0100',
            householdId: household._id
        }
    ];

    await EmergencyContact.insertMany(contacts);

    console.log('Data seeded successfully');
};

module.exports = seedData;
