const pm2 = require('pm2');
const axios = require('axios');

// Define constant for Discord Webhook URL from environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Define constant for Express server URL
const EXPRESS_SERVER_URL = 'http://localhost:3000/status';

/**
 * Check the status of all PM2 processes.
 * Rejects if any PM2 process is not online.
 * @returns {Promise} Resolves if all PM2 processes are online.
 */
function checkPM2Status() {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) {
        console.log('Error connecting to PM2');
        reject('Error connecting to PM2');
        return;
      }

      pm2.list((err, processes) => {
        pm2.disconnect();
        
        if (err) {
          console.log('Error fetching PM2 processes');
          reject('Error fetching PM2 processes');
          return;
        }

        for (let process of processes) {
          if (process.pm2_env.status !== 'online') {
            console.log(`PM2 process ${process.name} is not online`);
            reject(`PM2 process ${process.name} is not online`);
            return;
          }
        }

        resolve();
      });
    });
  });
}

/**
 * Check the status of the Express server.
 * Throws an error if the server does not respond with a 200 status code.
 */
async function checkExpressServerStatus() {
  const response = await axios.get(EXPRESS_SERVER_URL);
  if (response.status !== 200) {
    throw new Error('Express server is not responding correctly');
  }
}

/**
 * Send an alert message to a Discord channel via a webhook.
 * @param {string} message - The message to send to the Discord channel.
 */
async function sendDiscordAlert(message) {
  await axios.post(DISCORD_WEBHOOK_URL, {
    content: message
  });
}

/**
 * Monitor both PM2 processes and the Express server.
 * If there is any error in either check, send an alert to the Discord channel.
 */
async function monitor() {
  console.log('================MONITORING SERVER======================\n');
  
  try {
    await Promise.all([
      checkPM2Status(),
      checkExpressServerStatus()
    ]);
  } catch (error) {
    await sendDiscordAlert(`@here -- Alert: ${error.message}`);
  }
}

module.exports = {
  monitor
};
