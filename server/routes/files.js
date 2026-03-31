const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const db = require('../config/db');

dotenv.config();
const router = express.Router();

// Configure multer (temporary storage)
const upload = multer({ storage: multer.memoryStorage() });

// Configure Backblaze B2 (S3 compatible)
const s3 = new AWS.S3({
  endpoint: process.env.B2_ENDPOINT,
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APP_KEY,
  region: process.env.B2_REGION,
  signatureVersion: 'v4',
});

// ========================
// ROUTE 1 — Upload File
// POST /upload
// ========================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { iv, fileName, fileType, expiryHours, downloadLimit } = req.body;
    const fileId = uuidv4();
    const s3Key = `${fileId}.enc`;

    // Upload encrypted blob to Backblaze B2
    await s3.putObject({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: 'application/octet-stream',
    }).promise();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

    // Save metadata to MySQL
    const query = `
      INSERT INTO files 
      (id, s3_key, iv, file_name, file_type, expires_at, download_limit, download_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;

    db.query(query, [
      fileId,
      s3Key,
      iv,
      fileName,
      fileType,
      expiresAt,
      downloadLimit
    ]);

    res.json({ fileId });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ========================
// ROUTE 2 — Get File
// GET /file/:id
// ========================
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.query('SELECT * FROM files WHERE id = ?', [id], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = results[0];

      // Check if expired
      if (new Date() > new Date(file.expires_at)) {
        return res.status(404).json({ error: 'File has expired' });
      }

      // Check download limit
      if (file.download_count >= file.download_limit) {
        return res.status(404).json({ error: 'Download limit reached' });
      }

      try {
        // Fetch file FROM Backblaze on the server side
        const s3Object = await s3.getObject({
          Bucket: process.env.B2_BUCKET_NAME,
          Key: file.s3_key,
        }).promise();

        // Increment download count
        db.query(
          'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
          [id]
        );

        // Send everything to frontend
        res.json({
          // Send file as base64 string
          fileData: s3Object.Body.toString('base64'),
          iv: file.iv,
          fileName: file.file_name,
          fileType: file.file_type,
        });

      } catch (s3Error) {
        console.error('S3 fetch error:', s3Error);
        return res.status(500).json({ error: 'Failed to fetch file' });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;

