const express = require('express');
const router = express.Router();
const { getAccountBalance, getOpenPositions } = require('../services/derivService');

router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch portfolio data from Deriv
    const balance = await getAccountBalance(token);
    const positions = await getOpenPositions(token);

    const totalProfit = positions.reduce((sum, p) => sum + (p.profit || 0), 0);
    const openTrades = positions.length;
    const winRate = positions.length > 0 
      ? (positions.filter(p => (p.profit || 0) > 0).length / positions.length) * 100 
      : 0;

    res.json({
      balance,
      totalProfit,
      openTrades,
      winRate,
      positions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
