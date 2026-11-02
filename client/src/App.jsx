import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import BoardSetupScreen from './components/BoardSetupScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import Companion from './components/Companion';
import QrModal from './components/QrModal';
import Toast from './components/Toast';

import { socket, getPlayerProfile } from './socket';
import { sounds } from './audio';

export default function App() {
  const [player, setPlayer] = useState(getPlayerProfile());
  const [gameState, setGameState] = useState(null);
  const [companionVisible, setCompanionVisible] = useState(() => {
    return localStorage.getItem('bingo_companion_enabled') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // URL room code (e.g. ?room=XYZ123)
  const [urlRoomCode, setUrlRoomCode] = useState('');

  // Previous lines count ref to detect new completed lines
  const prevLinesRef = useRef(0);

  // Helper to trigger toast
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = sounds.toggleSound();
    setSoundEnabled(next);
    showToast(next ? 'Sound On 🔊' : 'Sound Muted 🔇', 'info', 1500);
  };

  // Toggle companion
  const handleToggleCompanion = () => {
    const next = !companionVisible;
    setCompanionVisible(next);
    localStorage.setItem('bingo_companion_enabled', next ? 'true' : 'false');
    sounds.playTap();
  };

  // Extract ?room=CODE from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setUrlRoomCode(code.toUpperCase().trim());
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    const onGameState = (state) => {
      setGameState((prevState) => {
        // Check if player's lines increased
        const currentLines = state.me?.evaluation?.count || 0;
        if (state.state === 'playing' && currentLines > prevLinesRef.current) {
          sounds.playLineComplete();
          showToast(`🌟 Line Complete! (${currentLines}/${state.linesNeeded})`, 'success', 2500);
        }
        prevLinesRef.current = currentLines;
        return state;
      });
    };

    const onNumberCalled = ({ number, calledBy, isAutoCall }) => {
      sounds.playNumberCalled();
      const byName = calledBy?.name || 'Someone';
      showToast(
        isAutoCall ? `⏰ Timer expired! Auto-called #${number}` : `📢 ${byName} called #${number}!`,
        'call',
        2500
      );
    };

    const onGameEnded = ({ winner }) => {
      sounds.playBingoWin();
      showToast(`🏆 ${winner.name} won the BINGO match!`, 'success', 4000);
    };

    const onRematchStarted = () => {
      showToast('🔄 Rematch started! Set up your boards!', 'info', 2500);
    };

    socket.on('gameState', onGameState);
    socket.on('numberCalled', onNumberCalled);
    socket.on('gameEnded', onGameEnded);
    socket.on('rematchStarted', onRematchStarted);

    // Auto-reconnect handling
    socket.on('connect', () => {
      const storedRoom = sessionStorage.getItem('bingo_current_room');
      if (storedRoom && player.id) {
        socket.emit('requestStateSync', { roomCode: storedRoom, playerId: player.id });
      }
    });

    return () => {
      socket.off('gameState', onGameState);
      socket.off('numberCalled', onNumberCalled);
      socket.off('gameEnded', onGameEnded);
      socket.off('rematchStarted', onRematchStarted);
    };
  }, [player.id]);

  // Create Room
  const handleCreateRoom = ({ name, avatar }) => {
    socket.emit('createRoom', { playerId: player.id, name, avatar }, (res) => {
      if (res.error) {
        showToast(res.error, 'error');
        sounds.playError();
      } else {
        sessionStorage.setItem('bingo_current_room', res.roomCode);
        showToast(`Created room ${res.roomCode}!`, 'success');
      }
    });
  };

  // Join Room
  const handleJoinRoom = ({ roomCode, name, avatar }) => {
    socket.emit('joinRoom', { roomCode, playerId: player.id, name, avatar }, (res) => {
      if (res.error) {
        showToast(res.error, 'error');
        sounds.playError();
      } else {
        sessionStorage.setItem('bingo_current_room', res.roomCode);
        showToast(`Joined room ${res.roomCode}!`, 'success');
      }
    });
  };

  // Update Settings
  const handleUpdateSettings = (settings) => {
    if (!gameState) return;
    socket.emit('updateSettings', {
      roomCode: gameState.roomCode,
      playerId: player.id,
      settings
    }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  };

  // Start Setup (Host)
  const handleStartSetup = () => {
    if (!gameState) return;
    socket.emit('startSetup', {
      roomCode: gameState.roomCode,
      playerId: player.id
    }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  };

  // Submit Board
  const handleSubmitBoard = (board) => {
    if (!gameState) return;
    socket.emit('submitBoard', {
      roomCode: gameState.roomCode,
      playerId: player.id,
      board
    }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  };

  // Call Number
  const handleCallNumber = (number) => {
    if (!gameState) return;
    socket.emit('callNumber', {
      roomCode: gameState.roomCode,
      playerId: player.id,
      number
    }, (res) => {
      if (res?.error) {
        sounds.playError();
        showToast(res.error, 'error');
      }
    });
  };

  // Claim BINGO
  const handleClaimBingo = () => {
    if (!gameState) return;
    socket.emit('claimBingo', {
      roomCode: gameState.roomCode,
      playerId: player.id
    }, (res) => {
      if (res?.error) {
        sounds.playError();
        showToast(res.error, 'error', 4000);
      }
    });
  };

  // Rematch
  const handleRematch = () => {
    if (!gameState) return;
    socket.emit('requestRematch', {
      roomCode: gameState.roomCode,
      playerId: player.id
    }, (res) => {
      if (res?.error) showToast(res.error, 'error');
    });
  };

  // Exit Room
  const handleExitRoom = () => {
    sessionStorage.removeItem('bingo_current_room');
    setGameState(null);
    sounds.playTap();
    window.location.search = '';
  };

  // Calculations for companion
  const linesCompleted = gameState?.me?.evaluation?.count || 0;
  const linesNeeded = gameState?.linesNeeded || gameState?.settings?.boardSize || 5;
  const isMyTurn = gameState?.state === 'playing' && gameState.turnPlayerId === player.id;
  const isWinner = gameState?.winner?.id === player.id;
  const isLoser = Boolean(gameState?.winner && !isWinner);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-between font-sans selection:bg-burgundy-200 selection:text-burgundy-900 pb-16">
      {/* Toast Notifications */}
      <Toast toasts={toasts} />

      {/* Navigation Header */}
      <Header
        roomCode={gameState?.roomCode}
        player={player}
        companionVisible={companionVisible}
        onToggleCompanion={handleToggleCompanion}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenQr={() => setIsQrModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 px-2 sm:px-4">
        {!gameState ? (
          <HomeScreen
            player={player}
            setPlayer={setPlayer}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            initialRoomCode={urlRoomCode}
          />
        ) : gameState.state === 'lobby' ? (
          <LobbyScreen
            gameState={gameState}
            myPlayer={gameState.me}
            onUpdateSettings={handleUpdateSettings}
            onStartSetup={handleStartSetup}
            onLeaveRoom={handleExitRoom}
            onOpenQr={() => setIsQrModalOpen(true)}
          />
        ) : gameState.state === 'setup' ? (
          <BoardSetupScreen
            gameState={gameState}
            myPlayer={gameState.me}
            onSubmitBoard={handleSubmitBoard}
          />
        ) : gameState.state === 'playing' ? (
          <GameScreen
            gameState={gameState}
            myPlayer={gameState.me}
            onCallNumber={handleCallNumber}
            onClaimBingo={handleClaimBingo}
          />
        ) : gameState.state === 'ended' ? (
          <ResultScreen
            gameState={gameState}
            myPlayer={gameState.me}
            onRematch={handleRematch}
            onExit={handleExitRoom}
          />
        ) : null}
      </main>

      {/* Companion Character Mascot */}
      <Companion
        gameState={gameState}
        myPlayer={gameState?.me}
        calledNumbers={gameState?.calledNumbers || []}
        linesCompleted={linesCompleted}
        linesNeeded={linesNeeded}
        isMyTurn={isMyTurn}
        isWinner={isWinner}
        isLoser={isLoser}
        visible={companionVisible}
        onToggle={handleToggleCompanion}
      />

      {/* QR Code Modal for Mobile Join */}
      <QrModal
        roomCode={gameState?.roomCode}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}

