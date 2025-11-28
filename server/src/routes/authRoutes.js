const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Household = require('../models/Household');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// Register a new household and admin user
router.post('/register-household', async (req, res) => {
  const { householdName, housePassword, adminName, username, password } = req.body;

  try {
    const household = await Household.create({
      name: householdName,
      housePassword
    });

    const user = await User.create({
      name: adminName,
      username,
      password,
      role: 'admin',
      household: household._id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      householdId: user.household,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Register a user to an existing household
router.post('/register-user', async (req, res) => {
  const { name, username, password, housePassword } = req.body;

  try {
    // Find household by checking password against all households (inefficient but simple for now,
    // ideally we would ask for Household Name or ID. Let's assume user provides Household Name too?
    // Or just iterates? Let's ask for Household Name).
    // Wait, let's change the request to include householdName
  } catch (err) {}
});

// Let's refine the Register User logic.
// User must provide Household Name and House Password to join.
router.post('/join-household', async (req, res) => {
    const { householdName, housePassword, name, username, password, avatar } = req.body;

    try {
        const household = await Household.findOne({ name: householdName });
        if (!household) {
            return res.status(404).json({ message: 'Household not found' });
        }

        if (await household.checkPassword(housePassword)) {
            const user = await User.create({
                name,
                username,
                password,
                household: household._id,
                avatar: avatar || '👤'
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                householdId: user.household,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid House Password' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.checkPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        householdId: user.household,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
