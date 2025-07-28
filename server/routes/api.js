const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const History = require('../models/History');
const router = express.Router();

// --- Auth Routes ---

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = { user: { id: user.id, name: user.name, email: user.email } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};


// --- History Routes ---

// Get History
router.get('/history', auth, async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id });
    res.json(history);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Add History
router.post('/history', auth, async (req, res) => {
  const { fileName, date, xAxis, yAxis, chartType } = req.body;
  try {
    const newHistory = new History({
      userId: req.user.id,
      fileName,
      date,
      xAxis,
      yAxis,
      chartType
    });
    const history = await newHistory.save();
    res.json(history);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;