const { Client } = require('@notionhq/client');
require('dotenv').config();
// Ensure environment variables are set
if (!process.env.NOTION_API_KEY || !process.env.NOTION_BUY_CRYPTO_DATABASE) {
  console.error(
    'Please ensure NOTION_API_KEY and NOTION_BUY_CRYPTO_DATABASE are set in your .env file.'
  );
  process.exit(1);
}// 

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const setErrorMSG = async (pageId) => {
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
        'Status': {
            id: 'UA%7CV',
            type: 'select',
            select: { id: '}y<|', name: 'Error', color: 'yellow' }
          }
      },
    });
  };



  module.exports = setErrorMSG