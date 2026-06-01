const express = require('express');
const router = express.Router();
const { executeTrade, getPrices } = require('../services/derivService');

// Get current prices
router.get('/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    const prices = await getPrices(symbols?.split(',') || []);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute trade
router.post('/execute', async (req, res) => {
  try {
    const { symbol, type, amount, duration } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const result = await executeTrade(token, {
      symbol,
      type,
      amount,
      duration
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
