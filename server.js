// Import required modules
const express = require('express');
const axios = require('axios');
const { Client } = require('@notionhq/client');
require('dotenv').config();
const fetchLivePricing = require('./fetchLivePricing');
const setErrorMSG = require('./setErrorMSG');
const { monitor } = require('./monitor');

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;


// Initialize Express app
const app = express();

// Define the server's listening port
const port = 3000;

// Global variable to store the list of coins
let globalCoinList;

// Initialize the Notion client using the API key from environment variables
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Define a map for Notion databases to track debug counts and record counts
let dbMap = [
  {
    id: process.env.NOTION_BUY_CRYPTO_DATABASE,
    debugCount: 0,
    recordCount: 0,
  },
  {
    id: process.env.NOTION_BUY_CRYPTO_FINANCE_DATABASE,
    debugCount: 0,
    recordCount: 0,
  },
];

// Check if essential environment variables are set
if (
  !process.env.NOTION_API_KEY ||
  !process.env.NOTION_BUY_CRYPTO_DATABASE ||
  !process.env.NOTION_BUY_CRYPTO_FINANCE_DATABASE
) {
  console.error(
    'Please ensure NOTION_API_KEY, NOTION_BUY_CRYPTO_DATABASE, and NOTION_BUY_CRYPTO_FINANCE_DATABASE are set in your .env file.'
  );
  process.exit(1);
}

/**
 * Function to handle counts and debugging for Notion databases.
 * @param {Object} databaseObj - The database object containing ID, debugCount, and recordCount.
 */
const countsAndDebugging = async (databaseObj) => {
  let { id, debugCount, recordCount } = databaseObj;

  try {
    const response = await notion.databases.query({ database_id: id });

    for (const result of response.results) {
      const liveCoinStatusEmoji = result.properties['Live Coin Status'].rich_text[0].plain_text;
      const pageId = result.id;
      const status = result.properties['Status'].select.name;

      if (liveCoinStatusEmoji === '❌' && debugCount < 5 && status !== 'Error') {
        debugCount++;
        fetchLivePricing('new', id, globalCoinList, notion);
      }

      if (debugCount === 5) {
        debugCount = 0;
        setErrorMSG(pageId, notion);
      }
    }

    if (recordCount < response.results.length) {
      recordCount = response.results.length;
      fetchLivePricing('new', id, globalCoinList, notion);
    }

    if (response.results.length < recordCount) recordCount = response.results.length;
    else if (!response.results || response.results.length === 0) recordCount = 0;

    console.log(`
      Database Id: ${id}  
      Current Debug count: ${debugCount}
      Current Record Count: ${recordCount}
    `);
    dbMap = [...dbMap.filter(value => value.id !== id), { id, debugCount, recordCount }];

  } catch (error) {
    console.error('Error checking record count', error);
  }
};

// Monitor server health and check database counts/debugging every minute
setInterval(() => {
  monitor();
  dbMap.forEach(countsAndDebugging);
}, 60 * 1000);

// Refresh coin pricing for the databases every day
setInterval(() => {
  axios.post(DISCORD_WEBHOOK_URL, {
    content: '==============COMPLETING DAILY PRICE FETCH======================'
  });
  console.log('==============COMPLETING DAILY PRICE FETCH======================')
  dbMap.forEach(value => fetchLivePricing('refresh', value.id, globalCoinList, notion));
}, 24 * 60 * 60 * 1000);

// Endpoint to check server status
app.get('/status', (req, res) => {
  res.statusCode = 200;
  res.json({ message: 'Server is running OK!' });
});

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/list', {
      headers: { accept: 'application/json' },
    });
    globalCoinList = await response.data;
    axios.post(DISCORD_WEBHOOK_URL, {
      content: '=========STARTING SERVER==========='
    });
  } catch (err) {
    console.error('Error fetching coin list', err);
  }

  // Refresh pricing on server start
  dbMap.forEach(async value => {
    fetchLivePricing('refresh', value.id, await globalCoinList, notion);
  });
});
