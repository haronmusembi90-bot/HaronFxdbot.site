const WebSocket = require('ws');
let ws;
let messageId = 1;
const pendingRequests = {};

const DERIV_API_URL = process.env.REACT_APP_DERIV_API_URL || 'wss://ws.deriv.com/websockets/v3';
const APP_ID = process.env.REACT_APP_DERIV_APP_ID || '1089';

function connectDerivAPI() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(`${DERIV_API_URL}?app_id=${APP_ID}`);

  ws.on('open', () => {
    console.log('✅ Connected to Deriv API');
  });

  ws.on('message', (data) => {
    const response = JSON.parse(data);
    const id = response.req_id;

    if (pendingRequests[id]) {
      pendingRequests[id](response);
      delete pendingRequests[id];
    }
  });

  ws.on('close', () => {
    console.log('❌ Disconnected from Deriv API');
    setTimeout(() => connectDerivAPI(), 3000);
  });

  ws.on('error', (error) => {
    console.error('Deriv API error:', error);
  });
}

function sendRequest(payload) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket is not connected'));
    }

    const id = messageId++;
    payload.req_id = id;

    pendingRequests[id] = (response) => {
      if (response.error) {
        reject(new Error(response.error.message));
      } else {
        resolve(response);
      }
    };

    ws.send(JSON.stringify(payload));

    setTimeout(() => {
      if (pendingRequests[id]) {
        delete pendingRequests[id];
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

async function getAccountBalance(token) {
  try {
    const response = await sendRequest({
      authorize: token
    });
    return response.authorize?.balance || 0;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

async function getOpenPositions(token) {
  try {
    await sendRequest({
      authorize: token
    });

    const response = await sendRequest({
      portfolio: 1
    });

    return response.portfolio?.positions || [];
  } catch (error) {
    console.error('Error getting positions:', error);
    return [];
  }
}

async function getPrices(symbols) {
  try {
    const promises = symbols.map(symbol => 
      sendRequest({
        ticks: symbol,
        subscribe: 1
      })
    );

    const responses = await Promise.all(promises);
    return responses.map(r => ({
      symbol: r.tick?.symbol,
      price: r.tick?.quote,
      time: r.tick?.time
    }));
  } catch (error) {
    console.error('Error getting prices:', error);
    return [];
  }
}

async function executeTrade(token, tradeData) {
  try {
    await sendRequest({
      authorize: token
    });

    const response = await sendRequest({
      buy: 1,
      price: tradeData.amount,
      parameters: {
        contract_type: tradeData.type,
        currency: 'USD',
        symbol: tradeData.symbol,
        duration: tradeData.duration,
        duration_unit: 'm'
      }
    });

    return response.buy || { error: 'Trade failed' };
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
}

module.exports = {
  connectDerivAPI,
  getAccountBalance,
  getOpenPositions,
  getPrices,
  executeTrade,
  sendRequest
};
