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

app.listen(5000, () => {
  console.log('GuardianBox server running on http://localhost:5000');
});