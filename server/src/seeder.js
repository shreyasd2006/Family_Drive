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
    // Create Users
    const admin = await User.create({
        name: 'Deepak N',
        username: 'deepak',
        password: 'password123',
        avatar: '👨',
        household: household._id
    });

    const member = await User.create({
        name: 'Sreevalli Prakash',
        username: 'sreevalli',
        password: 'password123',
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
            title: 'Property Deed',
            type: 'Property',
            tags: ['home', 'legal'],
            userId: 'family',
            householdId: household._id,
            location: 'Bank Locker',
            secure: true
        },
        {
            title: 'Car Insurance (Honda)',
            type: 'Insurance',
            tags: ['car', 'insurance'],
            userId: 'family',
            householdId: household._id,
            expiry: new Date('2024-08-15'),
            location: 'Glove Box',
            number: 'CAR-112233'
        },
        {
            title: 'Deepak\'s Passport',
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
            title: 'Deepak\'s Aadhaar',
            type: 'Identity',
            tags: ['id', 'government'],
            userId: admin._id,
            householdId: household._id,
            location: 'Wallet',
            secure: true,
            number: '1234-5678-9012'
        },
        {
            title: 'Deepak\'s PAN Card',
            type: 'Identity',
            tags: ['id', 'tax'],
            userId: admin._id,
            householdId: household._id,
            location: 'Wallet',
            secure: true,
            number: 'ABCDE1234F'
        },
        {
            title: 'Sreevalli\'s Driving License',
            type: 'Identity',
            tags: ['id', 'driving'],
            userId: member._id,
            householdId: household._id,
            expiry: new Date('2024-11-15'), // Soon to expire
            location: 'Wallet',
            secure: true,
            number: 'DL-555-444'
        },
        {
            title: 'Sreevalli\'s Passport',
            type: 'Identity',
            tags: ['travel', 'id'],
            userId: member._id,
            householdId: household._id,
            expiry: new Date('2029-01-10'),
            location: 'Safe Box 1',
            secure: true,
            number: 'Z98765432'
        },
        {
            title: 'Marriage Certificate',
            type: 'Legal',
            tags: ['legal', 'family'],
            userId: 'family',
            householdId: household._id,
            location: 'Safe Box 1'
        },
        {
            title: 'Wifi Contract',
            type: 'Utility',
            tags: ['utility', 'home'],
            userId: 'family',
            householdId: household._id,
            expiry: new Date('2025-01-01')
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
            title: 'Washing Machine LG',
            purchaseDate: '2022-11-20',
            warrantyExpiry: '2024-11-20',
            serviceInterval: 180,
            userId: 'family',
            householdId: household._id
        },
        {
            title: 'Sony Bravia TV',
            purchaseDate: '2021-05-10',
            warrantyExpiry: '2024-05-10', // Expiring soon
            userId: 'family',
            householdId: household._id
        },
        {
            title: 'Deepak\'s MacBook Pro',
            purchaseDate: '2022-06-01',
            warrantyExpiry: '2023-06-01', // Expired
            serviceInterval: 0,
            userId: admin._id,
            householdId: household._id
        },
        {
            title: 'Deepak\'s iPhone 14',
            purchaseDate: '2022-10-01',
            warrantyExpiry: '2023-10-01',
            userId: admin._id,
            householdId: household._id
        },
        {
            title: 'Sreevalli\'s iPad Air',
            purchaseDate: '2023-03-15',
            warrantyExpiry: '2024-03-15',
            userId: member._id,
            householdId: household._id
        },
        {
            title: 'Dyson Vacuum',
            purchaseDate: '2023-07-01',
            warrantyExpiry: '2025-07-01',
            userId: 'family',
            householdId: household._id
        },
        {
            title: 'Coffee Maker',
            purchaseDate: '2020-12-25',
            warrantyExpiry: '2021-12-25', // Expired
            userId: 'family',
            householdId: household._id
        }
    ];

    await Asset.insertMany(assets);

    // Bills
    const bills = [
        {
            title: 'Electricity Bill',
            amount: 1500,
            dueDate: '2023-11-05', // Past due
            status: 'pending',
            user: 'family',
            householdId: household._id
        },
        {
            title: 'Water Bill',
            amount: 450,
            dueDate: '2023-11-10',
            status: 'paid',
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
        },
        {
            title: 'Internet Bill',
            amount: 999,
            dueDate: '2023-11-01',
            status: 'paid',
            user: 'family',
            householdId: household._id
        },
        {
            title: 'Deepak\'s Credit Card',
            amount: 12500,
            dueDate: '2023-11-15',
            status: 'pending',
            user: admin._id,
            householdId: household._id
        },
        {
            title: 'Sreevalli\'s Phone Bill',
            amount: 699,
            dueDate: '2023-11-12',
            status: 'paid',
            user: member._id,
            householdId: household._id
        },
        {
            title: 'House Maintenance',
            amount: 2500,
            dueDate: '2023-12-01',
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
        },
        {
            userId: admin._id,
            householdId: household._id,
            type: 'Prescription',
            title: 'Vitamin D',
            dosage: '1000IU Daily',
            notes: 'Take with food'
        },
        {
            userId: member._id,
            householdId: household._id,
            type: 'Vaccination',
            value: 'Tetanus',
            date: '2020-05-15',
            nextDue: '2030-05-15'
        },
        {
            userId: member._id,
            householdId: household._id,
            type: 'Prescription',
            title: 'Iron Supplement',
            dosage: '1 Tablet Daily',
            notes: 'Morning'
        },
        {
            userId: 'family', // General kit info maybe? Or just assign to someone. Let's assign to admin for now or keep as family if schema allows (schema usually links to user, but let's see)
            // Actually Health usually is personal. I'll assign these to admin/member.
            // But let's add a family one if supported, or just more personal ones.
            // I'll stick to personal for health as it makes more sense.
            householdId: household._id,
            type: 'Allergy',
            value: 'Peanuts (Deepak)',
            notes: 'Severe'
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
        },
        {
            name: 'Fire Station',
            number: '101',
            householdId: household._id
        },
        {
            name: 'Police',
            number: '100',
            householdId: household._id
        }
    ];

    await EmergencyContact.insertMany(contacts);

    console.log('Data seeded successfully');
};

module.exports = seedData;
