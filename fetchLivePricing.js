const { Client } = require('@notionhq/client');
require('dotenv').config();
const updatePricing = require('./updatePricing');

// Ensure environment variables are set
if (!process.env.NOTION_API_KEY || !process.env.NOTION_BUY_CRYPTO_DATABASE) {
    console.error('Ensure NOTION_API_KEY and NOTION_BUY_CRYPTO_DATABASE are set in your .env file.');
    process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_BUY_CRYPTO_DATABASE;

const fetchLivePricing = async (mode) => {
    try {
        const response = await notion.databases.query({ database_id: databaseId });

        for (const result of response.results) {
            const { name: coinStatus } = result.properties.Status.select;

            // Skip if coinStatus is 'Sold' or 'Error'
            if (coinStatus === 'Sold' || coinStatus === 'Error') continue;

            const pageId = result.id;
            const coinTitle = result.properties['Coin Ticker'].title[0].plain_text;

            // Update pricing based on mode and liveCoinStatusEmoji
            if (mode === 'new') {
                const liveCoinStatusEmoji = result.properties['Live Coin Status'].rich_text[0].plain_text;
                if (liveCoinStatusEmoji === '🔴' || liveCoinStatusEmoji === "❌") {
                    updatePricing(coinTitle, pageId);
                }
            } else if(mode === 'refresh') {
                updatePricing(coinTitle, pageId);
            }
        }
    } catch (error) {
        console.error('Error fetching data from Notion:');
    }
};

module.exports = fetchLivePricing;
