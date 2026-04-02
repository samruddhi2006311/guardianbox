const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileRoutes = require('./routes/files');
require('./cron/cleanup'); // ← this is the new line

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', fileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GuardianBox server running on port ${PORT}`);
});