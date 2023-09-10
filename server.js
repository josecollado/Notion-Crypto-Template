const express = require('express');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const fetchLivePricing = require('./fetchLivePricing');
const setErrorMSG = require('./setErrorMSG');

const app = express();
const port = 3000;

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_BUY_CRYPTO_DATABASE;

let recordCount = 0;
let debugCount = 0;

// Ensure environment variables are set
if (!process.env.NOTION_API_KEY || !process.env.NOTION_BUY_CRYPTO_DATABASE) {
  console.error('Please ensure NOTION_API_KEY and NOTION_BUY_CRYPTO_DATABASE are set in your .env file.');
  process.exit(1);
}

const countsAndDebugging = async () => {
  try {
    const response = await notion.databases.query({ database_id: databaseId });

    for (const result of response.results) {
      const liveCoinStatusEmoji = result.properties['Live Coin Status'].rich_text[0].plain_text;
      const pageId = result.id;
      const status = result.properties['Status'].select.name;

      if (liveCoinStatusEmoji === '❌' && debugCount < 5 && status !== 'Error') {
        fetchLivePricing('new');
        debugCount++;
      }

      if (debugCount > 5) {
        setErrorMSG(pageId);
        debugCount = 0;
      }
    }

    if (recordCount < response.results.length) {
      recordCount = response.results.length;
      fetchLivePricing('new');
    } else if (!response.results || response.results.length === 0) {
      recordCount = 0;
    }

    console.log('Current Debug Count:', debugCount);
    console.log('Current Record Count:', recordCount);
  } catch (error) {
    console.error('Error checking record count', error);
  }
};

// Refreshes every minute
setInterval(countsAndDebugging, 60 * 1000);

// Execute the function immediately upon server start
fetchLivePricing();

// Refreshes once a day
setInterval(() => fetchLivePricing('refresh'), 24 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
