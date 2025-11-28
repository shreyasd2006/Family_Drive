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
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generic CRUD handlers could be useful, but let's be explicit for clarity.

// --- Documents ---
router.post('/documents', protect, async (req, res) => {
    try {
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

        // Combine results
        const results = [
            ...docs.map(d => ({ ...d._doc, kind: 'document' })),
            ...assets.map(a => ({ ...a._doc, kind: 'asset' })),
            ...bills.map(b => ({ ...b._doc, kind: 'bill' }))
        ];

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
