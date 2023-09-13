const updatePricing = require('./updatePricing');

// Function to handle coin not found
const coinNotFound = async (pageId, notionClient) => {

  try {
    
    // Update page to show error
    const response = await notionClient.pages.update({
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
          ]
        }
      }
    });
    
    // Log success
    console.log(`Changes made to page id:${pageId} to show error`)
    
  } catch (error) {
    console.log("Error at Coin Not Found Function", error)
  }
};

// Fetch live pricing from API 
const fetchLivePricing = async (mode, databaseId, list, notionClient) => {

  try {

    // Query database
    const response = await notionClient.databases.query({database_id: databaseId});

    // Loop through results
    for (const result of response.results) {

      // Get coin status and page ID
      const { name: coinStatus } = result.properties.Status.select;
      const pageId = result.id;

      // Skip if sold or error
      if (coinStatus === 'Sold' || coinStatus === 'Error') continue;

      // Get coin title
      const coinTitle = result.properties['Coin Ticker'].title[0].plain_text;

      // Find coin in list
      let coinSearch = list.find(
        value => value.symbol === coinTitle.toLowerCase()
      );

      // If not found, handle error
      if(!coinSearch) return coinNotFound(pageId, notionClient);

      // Update pricing
      if (mode === 'new') {
        
        // Get status emoji
        const liveCoinStatusEmoji = result.properties['Live Coin Status'].rich_text[0].plain_text;
        
        // Update if error or red icon
        if (liveCoinStatusEmoji === '🔴' || liveCoinStatusEmoji === '❌') {
          updatePricing(coinSearch.id, pageId, notionClient);
        }

      } else if (mode === 'refresh') {
        updatePricing(coinSearch.id, pageId, notionClient);
      }

    }

  } catch (error) {
    console.error('Error fetching data from Notion for databaseID: ', databaseId);
  }

};

module.exports = fetchLivePricing;