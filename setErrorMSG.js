/**
 * Sets an error message on a Notion page.
 * 
 * @param {string} pageId - The ID of the Notion page to update.
 * @param {object} notionClient - The Notion client instance used for API calls.
 */
const setErrorMSG = async (pageId, notionClient) => {
  try {
    // Define the update payload for the Notion page
    const notionUpdate = await notionClient.pages.update({
      page_id: pageId,
      properties: {
        // Update the 'Live Coin Status' property with a '❌' symbol
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
        // Update the 'Status' property with the 'Error' status
        'Status': {
            id: 'UA%7CV',
            type: 'select',
            select: { id: '}y<|', name: 'Error', color: 'yellow' }
        }
      },
    });

    // Log success message
    console.log('Set Error on Record completed Successfully for page ID:', pageId);
    
  } catch (error) {
    // Log error message
    console.log('Error Setting Error message on Notion Record');
  }
};

// Export the setErrorMSG function
module.exports = setErrorMSG;
