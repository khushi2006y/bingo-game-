import React, { useState, useEffect } from 'react';

/**
 * Animated SVG Mascot Character ("Kiran the Bingo Companion")
 * With dynamic moods: normal, cheer, encourage, celebrate, comfort, thinking
 */
function MascotSVG({ mood = 'normal' }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md select-none">
      <defs>
        <radialGradient id="faceGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE0B2" />
          <stop offset="100%" stopColor="#F57C00" />
        </radialGradient>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
      </defs>

      {/* Ears */}
      <circle cx="28" cy="28" r="14" fill="#E65100" />
      <circle cx="28" cy="28" r="8" fill="#FFCCBC" />
      <circle cx="72" cy="28" r="14" fill="#E65100" />
      <circle cx="72" cy="28" r="8" fill="#FFCCBC" />

      {/* Head */}
      <circle cx="50" cy="50" r="32" fill="url(#faceGrad)" stroke="#800020" strokeWidth="2.5" />

      {/* Rosy Cheeks */}
      <ellipse cx="32" cy="58" rx="6" ry="4" fill="#FF8A80" opacity="0.8" />
      <ellipse cx="68" cy="58" rx="6" ry="4" fill="#FF8A80" opacity="0.8" />

      {/* Snout */}
      <ellipse cx="50" cy="56" rx="13" ry="10" fill="#FFF8E1" />
      {/* Cute Nose */}
      <path d="M47 52 Q50 55 53 52 Q50 58 47 52 Z" fill="#4A148C" />

      {/* Eyes based on mood */}
      {mood === 'celebrate' || mood === 'cheer' ? (
        // Happy arch eyes ^^
        <>
          <path d="M33 46 Q40 38 43 46" fill="none" stroke="#263238" strokeWidth="3" strokeLinecap="round" />
          <path d="M57 46 Q60 38 67 46" fill="none" stroke="#263238" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : mood === 'comfort' ? (
        // Gentle empathetic eyes
        <>
          <circle cx="38" cy="45" r="4.5" fill="#263238" />
          <circle cx="39.5" cy="43.5" r="1.5" fill="#FFFFFF" />
          <circle cx="62" cy="45" r="4.5" fill="#263238" />
          <circle cx="63.5" cy="43.5" r="1.5" fill="#FFFFFF" />
          <path d="M32 40 Q38 42 42 39" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 39 Q62 42 68 40" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        // Normal wide sparkling eyes with reflections
        <>
          <circle cx="38" cy="45" r="5" fill="#263238" />
          <circle cx="36.5" cy="43.5" r="2" fill="#FFFFFF" />
          <circle cx="40" cy="47" r="1" fill="#FFFFFF" />
          
          <circle cx="62" cy="45" r="5" fill="#263238" />
          <circle cx="60.5" cy="43.5" r="2" fill="#FFFFFF" />
          <circle cx="64" cy="47" r="1" fill="#FFFFFF" />
        </>
      )}

      {/* Mouth based on mood */}
      {mood === 'celebrate' || mood === 'cheer' ? (
        // Wide open happy smile
        <path d="M44 60 Q50 68 56 60 Z" fill="#D81B60" stroke="#800020" strokeWidth="1.5" />
      ) : mood === 'comfort' ? (
        // Small gentle smile
        <path d="M46 61 Q50 64 54 61" fill="none" stroke="#263238" strokeWidth="2" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        // Curious mouth
        <circle cx="50" cy="62" r="2" fill="#263238" />
      ) : (
        // Default warm smile
        <path d="M45 59 Q50 64 55 59" fill="none" stroke="#263238" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Celebration Crown & Stars */}
      {(mood === 'celebrate' || mood === 'cheer') && (
        <g className="animate-bounce">
          <path d="M35 24 L42 12 L50 20 L58 12 L65 24 Z" fill="#FFD700" stroke="#800020" strokeWidth="1.5" />
          <circle cx="42" cy="12" r="2" fill="#E91E63" />
          <circle cx="50" cy="20" r="2" fill="#2D6A4F" />
          <circle cx="58" cy="12" r="2" fill="#800020" />
        </g>
      )}

      {/* Little paws holding bottom */}
      <ellipse cx="38" cy="78" rx="6" ry="4" fill="#FFE0B2" stroke="#800020" strokeWidth="1.5" />
      <ellipse cx="62" cy="78" rx="6" ry="4" fill="#FFE0B2" stroke="#800020" strokeWidth="1.5" />
    </svg>
  );
}

export default function Companion({
  gameState,
  myPlayer,
  calledNumbers = [],
  linesCompleted = 0,
  linesNeeded = 5,
  isMyTurn = false,
  isWinner = false,
  isLoser = false,
  onToggle = null,
  visible = true
}) {
  const [speech, setSpeech] = useState("Hi! I'm Kiran, your Bingo buddy! 🍀");
  const [mood, setMood] = useState('normal'); // 'normal' | 'cheer' | 'encourage' | 'celebrate' | 'comfort' | 'thinking'
  const [customImageError, setCustomImageError] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  // Dynamic reactions to game state changes
  useEffect(() => {
    if (!gameState) {
      setSpeech("Welcome to Bingo Blitz! Create or join a room!");
      setMood('normal');
      return;
    }

    if (gameState.state === 'lobby') {
      if (gameState.isHost) {
        setSpeech("You're the host! Choose board size and start when friends join!");
      } else {
        setSpeech("Waiting for the host to start the game! Get ready!");
      }
      setMood('normal');
      return;
    }

    if (gameState.state === 'setup') {
      if (myPlayer?.isReady) {
        setSpeech("Great board! Waiting for other players to finish!");
        setMood('normal');
      } else {
        setSpeech("Place your lucky numbers or tap Shuffle for instant fun!");
        setMood('cheer');
      }
      return;
    }

    if (gameState.state === 'playing') {
      // Check win condition
      if (linesCompleted >= linesNeeded) {
        setSpeech("🌟 BINGO READY!! Hit that BINGO button right now! 🌟");
        setMood('celebrate');
        return;
      }

      // Check turn
      if (isMyTurn) {
        setSpeech("🎯 Your turn! Tap an uncalled number on your board!");
        setMood('cheer');
        return;
      }

      // Lines milestone
      if (linesCompleted === linesNeeded - 1) {
        setSpeech("🔥 ONE LINE AWAY!! Just 1 more line to BINGO!");
        setMood('cheer');
        return;
      }

      if (linesCompleted > 0) {
        const encouragements = [
          `Woohoo! You have ${linesCompleted} full line${linesCompleted > 1 ? 's' : ''}! Keep it up! 🍀`,
          "Awesome line! We're making solid progress!",
          "That was a great call! The board is lighting up!"
        ];
        setSpeech(encouragements[linesCompleted % encouragements.length]);
        setMood('cheer');
        return;
      }

      // If opponents have lines and player has 0
      const otherPlayers = gameState.players?.filter(p => p.id !== myPlayer?.id) || [];
      const leaderLines = Math.max(0, ...otherPlayers.map(p => p.linesCompleted || 0));

      if (leaderLines >= 2 && linesCompleted === 0) {
        setSpeech("Hang in there! Luck can turn on a single call! 💫");
        setMood('encourage');
        return;
      }

      // Default playing comment
      setSpeech("Keep your eyes on the board! Next call is coming...");
      setMood('thinking');
    }

    if (gameState.state === 'ended') {
      if (isWinner) {
        setSpeech("🎉 WE DID IT!! YOU ARE THE BINGO CHAMPION!! 🏆👑");
        setMood('celebrate');
      } else {
        setSpeech("Aww, close game! You played brilliantly! Let's rematch! 💪");
        setMood('comfort');
      }
    }
  }, [gameState?.state, isMyTurn, linesCompleted, linesNeeded, isWinner, isLoser, myPlayer?.isReady]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none">
      {/* Speech Bubble */}
      {bubbleVisible && (
        <div className="pointer-events-auto relative max-w-[220px] sm:max-w-[270px] bg-white border-2 border-burgundy-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl mb-2 text-xs sm:text-sm text-burgundy-950 font-medium leading-snug animate-pop-in">
          <span>{speech}</span>
          
          {/* Close tiny speech button */}
          <button
            onClick={() => setBubbleVisible(false)}
            aria-label="Dismiss speech"
            className="absolute -top-1.5 -left-1.5 bg-burgundy-100 hover:bg-burgundy-200 text-burgundy-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-burgundy-300 pointer-events-auto"
          >
            ×
          </button>

          {/* Speech Bubble Tail */}
          <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-burgundy-700/80" />
          <div className="absolute -bottom-1.5 right-8 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white" />
        </div>
      )}

      {/* Mascot Avatar Container */}
      <div className="pointer-events-auto relative group">
        <div
          onClick={() => setBubbleVisible(!bubbleVisible)}
          title="Click to toggle speech bubble"
          className="w-16 h-16 sm:w-20 sm:h-20 bg-cream-50 rounded-full p-1.5 shadow-xl border-2 border-burgundy-600 cursor-pointer transform transition-transform duration-200 hover:scale-105 active:scale-95 animate-bounce-gentle overflow-hidden flex items-center justify-center"
        >
          {/* If custom image /mascot.png exists and hasn't errored */}
          {!customImageError ? (
            <img
              src="/mascot.png"
              alt="Bingo Mascot"
              className="w-full h-full object-contain"
              onError={() => setCustomImageError(true)}
            />
          ) : (
            <MascotSVG mood={mood} />
          )}
        </div>

        {/* Small floating mood badge */}
        <div className="absolute -top-1 -right-1 bg-emerald-sage text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow border border-white">
          {mood === 'celebrate' ? '🎉' : mood === 'cheer' ? '🌟' : mood === 'encourage' ? '💪' : mood === 'comfort' ? '💖' : '🎲'}
        </div>
      </div>
    </div>
  );
}

