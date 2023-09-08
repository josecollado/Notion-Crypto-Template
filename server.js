const express = require('express');
const fetchLivePricing = require('./fetchLivePricing');
require('dotenv').config();
const { Client } = require('@notionhq/client');
const app = express();
const port = 3000;
let recordCount = 0

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
    if(recordCount < response.results.length){
      recordCount = response.results.length
      fetchLivePricing('new');
    }else if(response.results.length === 0) recordCount = 0
    console.log(recordCount)
  } catch (error) {
    console.error('error checking record count', error)
  }
}

setInterval(recordEntryCounts, 60 * 1000);

// Execute the function immediately upon server start
fetchLivePricing();

// Set an interval to execute the function once a day
setInterval(() => fetchLivePricing('refresh'), 24 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
