const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Endpoint to initialize gameStats.txt if it doesn't exist
app.post('/initStats', (req, res) => {
  const statsFilePath = path.join(__dirname, 'gameStats.txt');
  fs.access(statsFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, so create it.
      fs.writeFile(statsFilePath, '', (err) => {
        if (err) {
          console.error('Error creating gameStats.txt:', err);
          return res.status(500).json({ error: 'Error creating gameStats.txt' });
        }
        console.log('gameStats.txt created');
        return res.json({ success: true, message: 'gameStats.txt created' });
      });
    } else {
      res.json({ success: true, message: 'gameStats.txt already exists' });
    }
  });
});

// Endpoint to update game stats (e.g., on restart)
app.post('/updateStats', (req, res) => {
  const { handsPlayed, currentBalance } = req.body;
  const data = `Hands played = ${handsPlayed} ; Current Balance = ${currentBalance}\n`;
  
  fs.writeFile(path.join(__dirname, 'gameStats.txt'), data, (err) => {
    if (err) {
      console.error('Error updating stats:', err);
      return res.status(500).json({ error: 'Error updating stats' });
    }
    console.log('Game stats updated:', data);
    res.json({ success: true });
  });
});

// Endpoint to log game events (plain text, no timestamp)
app.post('/logGameEvent', (req, res) => {
  const { message } = req.body;
  const logMessage = message + "\n";
  
  fs.appendFile(path.join(__dirname, 'gameStats.txt'), logMessage, (err) => {
    if (err) {
      console.error('Error logging game event:', err);
      return res.status(500).json({ error: 'Error logging game event' });
    }
    console.log('Game event logged:', logMessage);
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});