const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Household = require('../models/Household');
const Document = require('../models/Document');
const Asset = require('../models/Asset');
const Bill = require('../models/Bill');
const Health = require('../models/Health');
const EmergencyContact = require('../models/EmergencyContact');
const Vehicle = require('../models/Vehicle');
const Property = require('../models/Property');
const Subscription = require('../models/Subscription');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Get all data for the dashboard
router.get('/data', protect, async (req, res) => {
    try {
        const householdId = req.user.household;

        const household = await Household.findById(householdId); // Fetch household details

        const users = await User.find({ household: householdId }).select('-password');
        // Transform users to match frontend expected format {id, name, avatar}
        const formattedUsers = users.map(u => ({
            id: u._id.toString(),
            name: u.name,
            avatar: u.avatar
        }));

        // Add a 'family' user for shared items if not explicitly in DB
        formattedUsers.push({ id: 'family', name: 'Family', avatar: '🏠' });

        const docs = await Document.find({ householdId });
        // Map _id to id
        const formattedDocs = docs.map(d => ({
            ...d._doc,
            id: d._id.toString()
        }));

        const assets = await Asset.find({ householdId });
        const formattedAssets = assets.map(a => ({
            ...a._doc,
            id: a._id.toString()
        }));

        const bills = await Bill.find({ householdId });
        const formattedBills = bills.map(b => ({
            ...b._doc,
            id: b._id.toString()
        }));

        const health = await Health.find({ householdId });
        const formattedHealth = health.map(h => ({
            ...h._doc,
            id: h._id.toString()
        }));

        const contacts = await EmergencyContact.find({ householdId });

        const vehicles = await Vehicle.find({ householdId });
        const formattedVehicles = vehicles.map(v => ({
            ...v._doc,
            id: v._id.toString()
        }));

        const properties = await Property.find({ householdId });
        const formattedProperties = properties.map(p => ({
            ...p._doc,
            id: p._id.toString()
        }));

        const subscriptions = await Subscription.find({ householdId });
        const formattedSubscriptions = subscriptions.map(s => ({
            ...s._doc,
            id: s._id.toString()
        }));

        // We need insurance info. Let's assume it's stored as a document or a setting.
        // For now, I'll hardcode or maybe store it in Household model.
        // I will return a placeholder or fetch a specific doc tagged 'insurance'
        const insuranceDoc = formattedDocs.find(d => d.type.toLowerCase().includes('insurance'));
        const insurance = insuranceDoc ? insuranceDoc.number : 'No Insurance Record Found';

        res.json({
            householdName: household ? household.name : 'My Household',
            users: formattedUsers,
            docs: formattedDocs,
            assets: formattedAssets,
            bills: formattedBills,
            health: formattedHealth,
            emergency: {
                contacts,
                insurance
            },
            vehicles: formattedVehicles,
            properties: formattedProperties,
            subscriptions: formattedSubscriptions
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generic CRUD handlers could be useful, but let's be explicit for clarity.

// --- Documents ---
router.post('/documents', protect, async (req, res) => {
    try {
        if (req.body.secure && req.body.number) {
            const salt = await bcrypt.genSalt(10);
            req.body.number = await bcrypt.hash(req.body.number, salt);
        }

        const doc = await Document.create({
            ...req.body,
            householdId: req.user.household,
            userId: req.body.userId || req.user._id // Default to creator if not specified
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/documents/:id', protect, async (req, res) => {
    try {
        await Document.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Document removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/documents/:id', protect, async (req, res) => {
    try {
        if (req.body.secure && req.body.number && !req.body.number.startsWith('$2a$')) {
            const salt = await bcrypt.genSalt(10);
            req.body.number = await bcrypt.hash(req.body.number, salt);
        }
        const doc = await Document.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(doc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Assets ---
router.post('/assets', protect, async (req, res) => {
    try {
        const asset = await Asset.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/assets/:id', protect, async (req, res) => {
    try {
        await Asset.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Asset removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/assets/:id', protect, async (req, res) => {
    try {
        const asset = await Asset.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Bills ---
router.post('/bills', protect, async (req, res) => {
    try {
        const bill = await Bill.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(bill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/bills/:id', protect, async (req, res) => {
    try {
        await Bill.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Bill removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/bills/:id', protect, async (req, res) => {
    try {
        const bill = await Bill.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(bill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Health ---
router.post('/health', protect, async (req, res) => {
    try {
        const health = await Health.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(health);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/health/:id', protect, async (req, res) => {
    try {
        await Health.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Health record removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/health/:id', protect, async (req, res) => {
    try {
        const health = await Health.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(health);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Vehicles ---
router.post('/vehicles', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/vehicles/:id', protect, async (req, res) => {
    try {
        await Vehicle.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Vehicle removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/vehicles/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Properties ---
router.post('/properties', protect, async (req, res) => {
    try {
        const property = await Property.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/properties/:id', protect, async (req, res) => {
    try {
        await Property.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Property removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/properties/:id', protect, async (req, res) => {
    try {
        const property = await Property.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(property);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Subscriptions ---
router.post('/subscriptions', protect, async (req, res) => {
    try {
        const subscription = await Subscription.create({
            ...req.body,
            householdId: req.user.household
        });
        res.status(201).json(subscription);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/subscriptions/:id', protect, async (req, res) => {
    try {
        const subscription = await Subscription.findOneAndUpdate(
            { _id: req.params.id, householdId: req.user.household },
            req.body,
            { new: true }
        );
        res.json(subscription);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/subscriptions/:id', protect, async (req, res) => {
    try {
        await Subscription.findOneAndDelete({ _id: req.params.id, householdId: req.user.household });
        res.json({ message: 'Subscription removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Search ---
router.get('/search', protect, async (req, res) => {
    const query = req.query.q;
    const householdId = req.user.household;
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i');

    try {
        const docs = await Document.find({ householdId, title: regex });
        const assets = await Asset.find({ householdId, title: regex });
        const bills = await Bill.find({ householdId, title: regex });
        const vehicles = await Vehicle.find({ householdId, number: regex });
        const properties = await Property.find({ householdId, name: regex });
        const subscriptions = await Subscription.find({ householdId, name: regex });

        // Combine results
        const results = [
            ...docs.map(d => ({ ...d._doc, kind: 'document' })),
            ...assets.map(a => ({ ...a._doc, kind: 'asset' })),
            ...bills.map(b => ({ ...b._doc, kind: 'bill' })),
            ...vehicles.map(v => ({ ...v._doc, kind: 'vehicle', title: v.number })),
            ...properties.map(p => ({ ...p._doc, kind: 'property', title: p.name })),
            ...subscriptions.map(s => ({ ...s._doc, kind: 'subscription', title: s.name }))
        ];

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- Invitations ---
router.post('/invitations', protect, async (req, res) => {
    try {
        // Generate a random 6-character code
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();

        const invitation = await Invitation.create({
            code,
            householdId: req.user.household,
            inviterId: req.user._id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        });

        res.status(201).json({ code: invitation.code, expiresAt: invitation.expiresAt });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Join with Invite ---
router.post('/join-invite', async (req, res) => {
    const { inviteCode, username, password, name } = req.body;

    try {
        const invitation = await Invitation.findOne({ code: inviteCode, status: 'pending' });

        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired invite code' });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({ message: 'Invite code has expired' });
        }

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            username,
            password: hashedPassword,
            household: invitation.householdId,
            role: 'member',
            avatar: '👤'
        });

        // Mark invite as used (optional, or keep reusable until expiry?)
        // Let's keep it reusable for multiple family members until expiry for now, 
        // or maybe we want one-time use? The user didn't specify. 
        // Usually family invites are shared in a group chat, so reusable is better.
        // But for security, maybe one-time? Let's stick to reusable for 24h for simplicity.

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            household: user.household,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
