const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');
const seedData = require('./seeder');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');
const path = require('path');

dotenv.config();

// Connect to database and seed if necessary
connectDB().then(() => {
    seedData();
});

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Serve static files if in production (or for this setup)
// app.use(express.static(path.join(__dirname, '../../client/dist')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
