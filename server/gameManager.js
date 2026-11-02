/**
 * Bingo Game Manager
 * Manages game rooms, turn cycles, server-side timers, player boards, and validation.
 */

const { isValidBoard, evaluateBoard, validateBingoClaim } = require('./bingoValidator');

class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> Room Object
    this.playerToRoom = new Map(); // socketId -> { roomCode, playerId }
    this.playerTokens = new Map(); // playerId -> { roomCode, socketId, lastSeen }
  }

  /**
   * Generates a unique 6-character room code.
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a new game room.
   */
  createRoom(socket, { playerId, name, avatar }) {
    const roomCode = this.generateRoomCode();
    const player = {
      id: playerId,
      socketId: socket.id,
      name: (name || 'Player 1').trim().slice(0, 16),
      avatar: avatar || '🦁',
      isHost: true,
      isReady: false,
      board: null,
      linesCompleted: 0,
      isDisconnected: false,
      connectedAt: Date.now()
    };

    const room = {
      code: roomCode,
      hostId: playerId,
      state: 'lobby', // 'lobby' | 'setup' | 'playing' | 'ended'
      settings: {
        boardSize: 5,       // default 5x5 classic
        timerEnabled: true, // turn timer ON/OFF
        turnDuration: 20    // 20 seconds default
      },
      players: new Map([[playerId, player]]),
      playerOrder: [playerId],
      turnIndex: 0,
      turnPlayerId: null,
      turnDeadline: null,
      turnTimer: null,
      calledNumbers: [],
      winner: null,
      createdAt: Date.now(),
      rematchVotes: new Set()
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(socket.id, { roomCode, playerId });
    this.playerTokens.set(playerId, { roomCode, socketId: socket.id, lastSeen: Date.now() });

    socket.join(roomCode);
    return { roomCode, player };
  }

  /**
   * Joins an existing room or reconnects a returning player.
   */
  joinRoom(socket, { roomCode, playerId, name, avatar }) {
    const code = (roomCode || '').toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { error: 'Room not found. Please check the room code.' };
    }

    // Check if player is reconnecting
    let player = room.players.get(playerId);
    if (player) {
      // Reconnection
      const oldSocketId = player.socketId;
      if (oldSocketId && oldSocketId !== socket.id) {
        this.playerToRoom.delete(oldSocketId);
      }
      player.socketId = socket.id;
      player.isDisconnected = false;
      player.lastSeen = Date.now();
      if (name) player.name = name.trim().slice(0, 16);
      if (avatar) player.avatar = avatar;

      this.playerToRoom.set(socket.id, { roomCode: code, playerId });
      this.playerTokens.set(playerId, { roomCode: code, socketId: socket.id, lastSeen: Date.now() });
      socket.join(code);

      return { roomCode: code, player, reconnected: true };
    }

    // New player joining
    if (room.state !== 'lobby') {
      return { error: 'Game is already in progress or completed in this room.' };
    }

    if (room.players.size >= 12) {
      return { error: 'Room is full (max 12 players).' };
    }

    player = {
      id: playerId,
      socketId: socket.id,
      name: (name || `Player ${room.players.size + 1}`).trim().slice(0, 16),
      avatar: avatar || '🦊',
      isHost: false,
      isReady: false,
      board: null,
      linesCompleted: 0,
      isDisconnected: false,
      connectedAt: Date.now()
    };

    room.players.set(playerId, player);
    room.playerOrder.push(playerId);
    this.playerToRoom.set(socket.id, { roomCode: code, playerId });
    this.playerTokens.set(playerId, { roomCode: code, socketId: socket.id, lastSeen: Date.now() });
    socket.join(code);

    return { roomCode: code, player, reconnected: false };
  }

  /**
   * Updates room settings (host only, lobby only).
   */
  updateSettings(roomCode, requesterId, newSettings) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can adjust settings' };
    if (room.state !== 'lobby') return { error: 'Cannot change settings after game started' };

    if (newSettings.boardSize !== undefined) {
      const size = parseInt(newSettings.boardSize, 10);
      if (size >= 3 && size <= 10) {
        room.settings.boardSize = size;
      }
    }

    if (newSettings.timerEnabled !== undefined) {
      room.settings.timerEnabled = Boolean(newSettings.timerEnabled);
    }

    if (newSettings.turnDuration !== undefined) {
      const dur = parseInt(newSettings.turnDuration, 10);
      if (dur >= 5 && dur <= 60) {
        room.settings.turnDuration = dur;
      }
    }

    return { success: true, settings: room.settings };
  }

  /**
   * Host starts the Board Setup phase.
   */
  startSetup(roomCode, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can start the game' };
    if (room.players.size < 2) return { error: 'At least 2 players are required to start' };

    room.state = 'setup';
    room.calledNumbers = [];
    room.winner = null;
    room.rematchVotes.clear();

    // Reset readiness and boards for setup
    for (const player of room.players.values()) {
      player.isReady = false;
      player.board = null;
      player.linesCompleted = 0;
    }

    return { success: true };
  }

  /**
   * Player submits their filled board during Setup.
   */
  submitBoard(roomCode, playerId, board) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.state !== 'setup') return { error: 'Room is not in setup phase' };

    const player = room.players.get(playerId);
    if (!player) return { error: 'Player not found in room' };

    const size = room.settings.boardSize;
    if (!isValidBoard(board, size)) {
      return { error: `Invalid board! Must contain numbers 1 through ${size * size} with no duplicates.` };
    }

    player.board = board.map(Number);
    player.isReady = true;

    // Check if all connected players are ready
    const connectedPlayers = Array.from(room.players.values()).filter(p => !p.isDisconnected);
    const allReady = connectedPlayers.length >= 2 && connectedPlayers.every(p => p.isReady);

    if (allReady) {
      this.startPlaying(roomCode);
    }

    return {
      success: true,
      playerReady: true,
      allReady
    };
  }

  /**
   * Transitions from Setup to Playing once players are ready.
   */
  startPlaying(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.state = 'playing';
    room.calledNumbers = [];
    room.winner = null;

    // Filter to active players who submitted boards
    const activeOrder = room.playerOrder.filter(id => {
      const p = room.players.get(id);
      return p && p.board && !p.isDisconnected;
    });

    if (activeOrder.length < 2) {
      // Revert to setup if not enough players
      room.state = 'setup';
      return;
    }

    room.playerOrder = activeOrder;
    // Pick first turn randomly or start with host
    room.turnIndex = 0;
    room.turnPlayerId = room.playerOrder[0];

    this.startTurnTimer(room);
  }

  /**
   * Starts turn timer if enabled in room settings.
   */
  startTurnTimer(room) {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }

    if (!room.settings.timerEnabled || room.state !== 'playing') {
      room.turnDeadline = null;
      return;
    }

    const duration = room.settings.turnDuration || 20;
    room.turnDeadline = Date.now() + duration * 1000;

    room.turnTimer = setTimeout(() => {
      this.handleTurnTimeout(room.code);
    }, duration * 1000);
  }

  /**
   * Called when turn timer expires: automatically calls a random uncalled number from current player's board.
   */
  handleTurnTimeout(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'playing') return;

    const currentPlayer = room.players.get(room.turnPlayerId);
    if (!currentPlayer || !currentPlayer.board) {
      this.advanceTurn(room);
      this.broadcastState(room.code);
      return;
    }

    // Find uncalled numbers on the current player's board
    const calledSet = new Set(room.calledNumbers);
    const uncalledNumbers = currentPlayer.board.filter(num => !calledSet.has(num));

    if (uncalledNumbers.length > 0) {
      // Randomly pick one
      const randomIndex = Math.floor(Math.random() * uncalledNumbers.length);
      const chosenNumber = uncalledNumbers[randomIndex];

      this.callNumber(room.code, currentPlayer.id, chosenNumber, true);
    } else {
      // Advance if all numbers on board somehow called
      this.advanceTurn(room);
      this.broadcastState(room.code);
    }
  }

  /**
   * Current player calls a number.
   */
  callNumber(roomCode, playerId, number, isAutoCall = false) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.state !== 'playing') return { error: 'Game is not currently active' };

    if (room.turnPlayerId !== playerId) {
      return { error: "It is not your turn to call a number!" };
    }

    const num = Number(number);
    const totalCells = room.settings.boardSize * room.settings.boardSize;
    if (!Number.isInteger(num) || num < 1 || num > totalCells) {
      return { error: `Number must be between 1 and ${totalCells}` };
    }

    if (room.calledNumbers.includes(num)) {
      return { error: `Number ${num} has already been called!` };
    }

    const player = room.players.get(playerId);
    if (!player || !player.board || !player.board.includes(num)) {
      return { error: `Number ${num} must be on your board!` };
    }

    // Add to called numbers
    room.calledNumbers.push(num);

    // Re-evaluate line progress for all players
    const size = room.settings.boardSize;
    for (const p of room.players.values()) {
      if (p.board) {
        const evalResult = evaluateBoard(p.board, room.calledNumbers, size);
        p.linesCompleted = evalResult.count;
      }
    }

    // Advance to next player's turn
    this.advanceTurn(room);

    // Notify room of called number
    this.io.to(roomCode).emit('numberCalled', {
      number: num,
      calledBy: {
        id: player.id,
        name: player.name
      },
      isAutoCall,
      calledNumbers: room.calledNumbers
    });

    // Broadcast updated state (maintaining privacy)
    this.broadcastState(roomCode);

    return { success: true, number: num };
  }

  /**
   * Advances turn index to next connected player.
   */
  advanceTurn(room) {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }

    if (room.state !== 'playing') return;

    const activePlayers = room.playerOrder.filter(id => {
      const p = room.players.get(id);
      return p && !p.isDisconnected;
    });

    if (activePlayers.length === 0) return;

    let nextIdx = (room.turnIndex + 1) % activePlayers.length;
    room.turnIndex = nextIdx;
    room.turnPlayerId = activePlayers[nextIdx];

    this.startTurnTimer(room);
  }

  /**
   * Player claims BINGO win!
   */
  claimBingo(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.state !== 'playing') return { error: 'Game is not currently active' };

    const player = room.players.get(playerId);
    if (!player || !player.board) {
      return { error: 'Player board not found' };
    }

    const size = room.settings.boardSize;
    const isValidClaim = validateBingoClaim(player.board, room.calledNumbers, size);

    if (!isValidClaim) {
      const evalResult = evaluateBoard(player.board, room.calledNumbers, size);
      return {
        error: `Invalid BINGO claim! You currently have ${evalResult.count} of ${size} lines needed.`,
        linesCount: evalResult.count,
        linesNeeded: size
      };
    }

    // Valid BINGO win!
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }

    room.state = 'ended';
    room.winner = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      lines: player.linesCompleted
    };

    this.io.to(roomCode).emit('gameEnded', {
      winner: room.winner,
      calledNumbersCount: room.calledNumbers.length
    });

    this.broadcastState(roomCode);
    return { success: true, winner: room.winner };
  }

  /**
   * Request rematch.
   */
  requestRematch(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };

    room.rematchVotes.add(playerId);

    // If at least half the connected players want a rematch, or host triggers it
    const connectedCount = Array.from(room.players.values()).filter(p => !p.isDisconnected).length;
    const isHost = room.hostId === playerId;

    if (isHost || room.rematchVotes.size >= Math.ceil(connectedCount / 2)) {
      room.state = 'setup';
      room.calledNumbers = [];
      room.winner = null;
      room.rematchVotes.clear();

      for (const p of room.players.values()) {
        p.isReady = false;
        p.linesCompleted = 0;
        // Keep their board as starting point, but they can edit or re-shuffle and click Ready
      }

      this.io.to(roomCode).emit('rematchStarted');
      this.broadcastState(roomCode);
      return { success: true };
    }

    this.io.to(roomCode).emit('rematchVoted', {
      votes: room.rematchVotes.size,
      needed: Math.ceil(connectedCount / 2)
    });

    return { success: true, votes: room.rematchVotes.size };
  }

  /**
   * Handles player disconnection.
   */
  handleDisconnect(socketId) {
    const info = this.playerToRoom.get(socketId);
    if (!info) return;

    const { roomCode, playerId } = info;
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isDisconnected = true;
    player.disconnectTime = Date.now();
    this.playerToRoom.delete(socketId);

    // If game in progress and it was disconnected player's turn, advance turn
    if (room.state === 'playing' && room.turnPlayerId === playerId) {
      this.advanceTurn(room);
    }

    // If host disconnected, assign host to first available connected player
    if (room.hostId === playerId) {
      const nextHost = Array.from(room.players.values()).find(p => !p.isDisconnected && p.id !== playerId);
      if (nextHost) {
        room.hostId = nextHost.id;
        nextHost.isHost = true;
      }
    }

    // Check if room completely empty for cleanup after 15 minutes
    const anyConnected = Array.from(room.players.values()).some(p => !p.isDisconnected);
    if (!anyConnected) {
      setTimeout(() => {
        const stillRoom = this.rooms.get(roomCode);
        if (stillRoom && !Array.from(stillRoom.players.values()).some(p => !p.isDisconnected)) {
          if (stillRoom.turnTimer) clearTimeout(stillRoom.turnTimer);
          this.rooms.delete(roomCode);
        }
      }, 15 * 60 * 1000);
    }

    this.broadcastState(roomCode);
  }

  /**
   * Sanitizes room state for a specific player (respecting privacy: NEVER sending other players' boards).
   */
  getSanitizedStateForPlayer(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(playerId);
    const size = room.settings.boardSize;

    // Map public player info (NO OTHER BOARDS!)
    const publicPlayers = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === room.hostId,
      isReady: p.isReady,
      linesCompleted: p.linesCompleted || 0,
      isDisconnected: p.isDisconnected,
      isTurn: room.state === 'playing' && room.turnPlayerId === p.id
    }));

    // Player's own board evaluation if board exists
    let myEvaluation = null;
    if (player && player.board) {
      myEvaluation = evaluateBoard(player.board, room.calledNumbers, size);
    }

    return {
      roomCode: room.code,
      state: room.state,
      settings: room.settings,
      players: publicPlayers,
      isHost: room.hostId === playerId,
      me: player ? {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        isHost: player.id === room.hostId,
        isReady: player.isReady,
        board: player.board, // ONLY SEND TO OWNER
        evaluation: myEvaluation
      } : null,
      turnPlayerId: room.turnPlayerId,
      turnDeadline: room.turnDeadline,
      calledNumbers: room.calledNumbers,
      winner: room.winner,
      linesNeeded: size
    };
  }

  /**
   * Broadcasts sanitized state individually to each player in the room.
   */
  broadcastState(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    for (const player of room.players.values()) {
      if (!player.isDisconnected && player.socketId) {
        const state = this.getSanitizedStateForPlayer(roomCode, player.id);
        if (state) {
          this.io.to(player.socketId).emit('gameState', state);
        }
      }
    }
  }
}

module.exports = GameManager;
