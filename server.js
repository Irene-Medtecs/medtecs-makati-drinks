/**
 * Medtecs Makati AI Workshop — Drink Ordering Web Server
 * Static file server & local test runner
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicit Organizer route
app.get('/organizer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'organizer.html'));
});

// Explicit Colleague Ordering route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: 'Medtecs Makati AI Workshop',
    googleSheetId: '1l42PZv0x3kDcH4AO0hyjcY974C1yuyLA32xLjL3DP0g',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Medtecs Makati AI Workshop Drink Break Server`);
  console.log(`  Public Ordering Page : http://localhost:${PORT}/`);
  console.log(`  Organizer Dashboard  : http://localhost:${PORT}/organizer`);
  console.log(`======================================================\n`);
});

module.exports = app;
