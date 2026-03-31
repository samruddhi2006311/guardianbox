const cron = require('node-cron');
const AWS = require('aws-sdk');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

// Configure Backblaze B2
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APP_KEY,
  region: process.env.B2_REGION,
  signatureVersion: 'v4',
});

// Runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running cleanup job...');

  // Find all expired files
  const query = `
    SELECT * FROM files 
    WHERE expires_at < NOW() 
    OR download_count >= download_limit
  `;

  db.query(query, async (err, expiredFiles) => {
    if (err) {
      console.error('Cleanup error:', err);
      return;
    }

    if (expiredFiles.length === 0) {
      console.log('No expired files found');
      return;
    }

    // Delete each expired file
    for (const file of expiredFiles) {
      try {
        // Delete from Backblaze B2
        await s3.deleteObject({
          Bucket: process.env.B2_BUCKET_NAME,
          Key: file.s3_key,
        }).promise();

        // Delete from MySQL
        db.query(
          'DELETE FROM files WHERE id = ?',
          [file.id]
        );

        console.log(`Deleted expired file: ${file.id} ✅`);

      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }
  });
});

console.log('Cleanup cron job scheduled ✅');