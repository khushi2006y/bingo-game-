/**
 * Multiplayer Bingo Game Server
 * Express + Socket.IO with LAN IP detection and terminal QR code.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const cors = require('cors');
const qrcodeTerminal = require('qrcode-terminal');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io);

// Determine local LAN IPv4 address (e.g. 192.168.x.x)
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  let candidate = '127.0.0.1';

  // Check interface priority (Wi-Fi, Ethernet, etc.)
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4
      const isIpv4 = net.family === 'IPv4' || net.family === 4;
      if (isIpv4 && !net.internal) {
        // Prefer Wi-Fi or Ethernet
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan') || name.toLowerCase().includes('eth')) {
          return net.address;
        }
        candidate = net.address;
      }
    }
  }
  return candidate;
}

const PORT = process.env.PORT || 3000;
const localIp = getLocalIpAddress();

// API endpoint to return server LAN details for frontend QR modal & share links
app.get('/api/network-info', (req, res) => {
  res.json({
    localIp,
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${localIp}:${PORT}`
  });
});

// Serve frontend static build if available
const clientDist = path.join(__dirname, '../client/dist');
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));
app.use(express.static(clientDist));

// SPA fallback
app.get('*', (req, res) => {
  const distIndex = path.join(clientDist, 'index.html');
  const publicIndex = path.join(publicDir, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else if (fs.existsSync(publicIndex)) {
    res.sendFile(publicIndex);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Bingo Game Server</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#FAF7F2; color:#800020;">
          <h1>🎲 Bingo Game Server is Running!</h1>
          <p>Local URL: <b>http://localhost:${PORT}</b></p>
          <p>Network URL: <b>http://${localIp}:${PORT}</b></p>
          <p>Build the frontend with <code>npm run build</code> or run <code>npm run dev</code> for hot-reload.</p>
        </body>
      </html>
    `);
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  // 1. Create Room
  socket.on('createRoom', ({ playerId, name, avatar }, callback) => {
    try {
      const result = gameManager.createRoom(socket, { playerId, name, avatar });
      if (callback) callback({ success: true, roomCode: result.roomCode, player: result.player });
      gameManager.broadcastState(result.roomCode);
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 2. Join Room
  socket.on('joinRoom', ({ roomCode, playerId, name, avatar }, callback) => {
    try {
      const result = gameManager.joinRoom(socket, { roomCode, playerId, name, avatar });
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true, roomCode: result.roomCode, player: result.player, reconnected: result.reconnected });
      gameManager.broadcastState(result.roomCode);
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 3. Update Settings (Lobby)
  socket.on('updateSettings', ({ roomCode, playerId, settings }, callback) => {
    try {
      const result = gameManager.updateSettings(roomCode, playerId, settings);
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true, settings: result.settings });
      gameManager.broadcastState(roomCode);
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 4. Start Setup Phase (Host only)
  socket.on('startSetup', ({ roomCode, playerId }, callback) => {
    try {
      const result = gameManager.startSetup(roomCode, playerId);
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true });
      gameManager.broadcastState(roomCode);
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 5. Submit Board (Setup Phase)
  socket.on('submitBoard', ({ roomCode, playerId, board }, callback) => {
    try {
      const result = gameManager.submitBoard(roomCode, playerId, board);
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true });

      // If all ready, automatically transition to Playing
      if (result.allReady) {
        gameManager.startPlaying(roomCode);
      }

      gameManager.broadcastState(roomCode);
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 6. Force Start Playing (Host can start if players ready)
  socket.on('startPlaying', ({ roomCode, playerId }, callback) => {
    try {
      const room = gameManager.rooms.get(roomCode);
      if (!room) return callback && callback({ error: 'Room not found' });
      if (room.hostId !== playerId) return callback && callback({ error: 'Host only' });

      gameManager.startPlaying(roomCode);
      gameManager.broadcastState(roomCode);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 7. Call Number (Turn-based)
  socket.on('callNumber', ({ roomCode, playerId, number }, callback) => {
    try {
      const result = gameManager.callNumber(roomCode, playerId, number);
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true, number: result.number });
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 8. Claim BINGO
  socket.on('claimBingo', ({ roomCode, playerId }, callback) => {
    try {
      const result = gameManager.claimBingo(roomCode, playerId);
      if (result.error) {
        if (callback) callback({ error: result.error, linesCount: result.linesCount, linesNeeded: result.linesNeeded });
        return;
      }
      if (callback) callback({ success: true, winner: result.winner });
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 9. Rematch
  socket.on('requestRematch', ({ roomCode, playerId }, callback) => {
    try {
      const result = gameManager.requestRematch(roomCode, playerId);
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }
      if (callback) callback({ success: true, votes: result.votes });
    } catch (err) {
      if (callback) callback({ error: err.message });
    }
  });

  // 10. Reconnect / Request Sync
  socket.on('requestStateSync', ({ roomCode, playerId }, callback) => {
    const state = gameManager.getSanitizedStateForPlayer(roomCode, playerId);
    if (state) {
      socket.emit('gameState', state);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ error: 'Room not found' });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    gameManager.handleDisconnect(socket.id);
  });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://${localIp}:${PORT}`;

  console.log('\n========================================================');
  console.log('   🎲 MULTIPLAYER BINGO GAME SERVER IS RUNNING! 🎲');
  console.log('========================================================');
  console.log(`  > Local:   \x1b[36m${localUrl}\x1b[0m`);
  console.log(`  > Network: \x1b[32m${networkUrl}\x1b[0m (Wi-Fi for Phones)`);
  console.log('========================================================');
  console.log('  📱 Scan this QR code on your phone to open the game:');
  console.log('--------------------------------------------------------');

  // Print QR Code in terminal
  try {
    qrcodeTerminal.generate(networkUrl, { small: true }, (qrcode) => {
      console.log(qrcode);
      console.log('========================================================\n');
    });
  } catch (e) {
    console.log(`  Open ${networkUrl} on your mobile browser.`);
    console.log('========================================================\n');
  }
});

