const axios = require('axios');
const { Client } = require('@notionhq/client');
require('dotenv').config();
// Ensure environment variables are set
if (!process.env.NOTION_API_KEY || !process.env.NOTION_BUY_CRYPTO_DATABASE) {
  console.error(
    'Please ensure NOTION_API_KEY and NOTION_BUY_CRYPTO_DATABASE are set in your .env file.'
  );
  process.exit(1);
} //

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const coinNotFound = async (pageId) => {
  const notionUpdate = await notion.pages.update({
    page_id: pageId,
    properties: {
      'Live Coin Status': {
        id: '%60K%5CD',
        type: 'rich_text',
        rich_text: [
          {
            type: 'text',
            text: { content: '❌', link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: '❌',
            href: null,
          },
        ],
      },
    },
  });
};

const updatePricing = async (coin, pageId) => {
  const coinSearch = await axios
    .get('https://api.coingecko.com/api/v3/coins/list', {
      headers: { accept: 'application/json' },
    })
    .then((response) =>
      response.data.find((value) => value.symbol === coin.toLowerCase())
    )
    .catch((err) => console.log('Error fetching coin list'));

  if (!coinSearch) return coinNotFound(pageId);

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: coinSearch.id,
          vs_currencies: 'usd',
        },
        headers: { accept: 'application/json' },
      }
    );

    const coinPrice = Object.values(response.data)[0].usd;

    const notionUpdate = await notion.pages.update({
      page_id: pageId,
      properties: {
        'Live Coin Status': {
          id: '%60K%5CD',
          type: 'rich_text',
          rich_text: [
            {
              type: 'text',
              text: { content: '🟢', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: '🟢',
              href: null,
            },
          ],
        },
        'Live Coin Price': {
          id: '~%7Bv%5B',
          type: 'number',
          number: coinPrice,
        },
      },
    });

    console.log(
      `Change made to page id:${pageId} for the ${coinSearch.symbol} coin record`
    );
  } catch (error) {
    console.error('Error fetching Coin Price');
  }
};

module.exports = updatePricing;
