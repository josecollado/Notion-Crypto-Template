const express = require('express');
const fetchLivePricing = require('./fetchLivePricing');
const setErrorMSG = require('./setErrorMSG')
require('dotenv').config();
const { Client } = require('@notionhq/client');
const app = express();
const port = 3000;
let recordCount = 0
let debugCount = 0

// Ensure environment variables are set
if (!process.env.NOTION_API_KEY || !process.env.NOTION_BUY_CRYPTO_DATABASE) {
  console.error(
    'Please ensure NOTION_API_KEY and NOTION_BUY_CRYPTO_DATABASE are set in your .env file.'
  );
  process.exit(1);
}// 
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_BUY_CRYPTO_DATABASE;
const recordEntryCounts = async () => {
  try {
    const response = await notion.databases.query({ database_id: databaseId });
    for (const result of response.results) {
      const liveCoinStatusEmoji = result.properties['Live Coin Status'].rich_text[0].plain_text;
      const pageId = result.id
      const status = result.properties['Status'].select.name
      if(liveCoinStatusEmoji === '❌' && debugCount < 10 && status != "Error" ) fetchLivePricing(), debugCount++ 
      if(debugCount > 10) setErrorMSG(pageId), debugCount = 0
    }
    if(recordCount < response.results.length){
      recordCount = response.results.length
      fetchLivePricing('new');
    }else if(response.results.length === 0 || !response.results) recordCount = 0
    console.log('Current Debug Count -- > ', debugCount)
    console.log("Current Record Count -- > ", recordCount)
  } catch (error) {
    console.error('error checking record count', error)
  }
}

setInterval(recordEntryCounts, 60 * 1000); // refreshes every minute

// Execute the function immediately upon server start
fetchLivePricing();

// Set an interval to execute the function once a day
setInterval(() => fetchLivePricing('refresh'), 24 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
