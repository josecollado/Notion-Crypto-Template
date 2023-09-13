// Required dependencies
const axios = require('axios');

/**
 * Updates the pricing of a given coin on a Notion page.
 *
 * @param {string} coin - The name of the coin to fetch the price for.
 * @param {string} pageId - The ID of the Notion page to update.
 * @param {Object} notionClient - The Notion client instance to use for updating the page.
 */
const updatePricing = async (coin, pageId, notionClient) => {
  try {
    // Fetch the current price of the coin in USD from the CoinGecko API
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: coin,
          vs_currencies: 'usd',
        },
        headers: { accept: 'application/json' },
      }
    );

    // Extract the coin price from the response
    const coinPrice = Object.values(response.data)[0].usd;

    // Update the Notion page with the coin's live status and price
    await notionClient.pages.update({
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

    // Log the successful update
    console.log(`Changes made to page id: ${pageId} for the ${coin} coin record`);
  } catch (error) {
    // Log any errors that occur during the fetch or update process
    console.error('Error fetching Coin Price');
  }
};

// Export the updatePricing function for use in other modules
module.exports = updatePricing;
