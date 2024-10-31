// Import necessary modules
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT;

// Use CORS to allow cross-origin requests
app.use(cors());
app.use(express.json());
// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL database
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// API to filter videos by multiple channels
app.get('/api/videos', (req, res) => {
  const { channels } = req.query;
  const channelList = channels.split(',').map(Number);
  const query = `SELECT * FROM replayline WHERE channel IN (?)`;
  db.query(query, [channelList], (err, results) => {
    if (err) {
      console.error('Error fetching videos:', err);
      res.status(500).send('Error fetching videos');
      return;
    }
    res.json(results);
  });
});

// API to get a random video based on the filtered channels
app.get('/api/random-video', (req, res) => {
  const { channels } = req.query;
  const channelList = channels.split(',').map(Number);
  const query = `SELECT * FROM replayline WHERE channel IN (?) ORDER BY RAND() LIMIT 1`;
  db.query(query, [channelList], (err, results) => {
    if (err) {
      console.error('Error fetching random video:', err);
      res.status(500).send('Error fetching random video');
      return;
    }
    res.json(results[0]);
  });
});

// API to submit score
app.post('/api/submit-score', (req, res) => {
  const { username, score, channels } = req.body || {};
  if (!username || score === undefined || !channels) {
    return res.status(400).send('Username, score, and channels are required');
  }
  const query = `INSERT INTO scores (username, score, channels) VALUES (?, ?, ?)`;
  db.query(query, [username, score, JSON.stringify(channels)], (err, results) => {
    if (err) {
      console.error('Error submitting score:', err);
      res.status(500).send('Error submitting score');
      return;
    }
    res.status(201).send('Score submitted successfully');
  });
});

// API to get top 10 scores
app.get('/api/top-scores', (req, res) => {
  const query = `SELECT username, score, channels, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 100`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching top scores:', err);
      res.status(500).send('Error fetching top scores');
      return;
    }
    res.json(results);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});