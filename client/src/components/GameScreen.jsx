import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, Check, AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import { sounds } from '../audio';

export default function GameScreen({
  gameState,
  myPlayer,
  onCallNumber,
  onClaimBingo
}) {
  const size = gameState.settings?.boardSize || 5;
  const board = myPlayer?.board || [];
  const calledNumbers = gameState.calledNumbers || [];
  const calledSet = new Set(calledNumbers);
  const evaluation = myPlayer?.evaluation || { count: 0, completedRows: [], completedCols: [], completedMainDiag: false, completedAntiDiag: false };
  const linesCompleted = evaluation.count || 0;
  const linesNeeded = gameState.linesNeeded || size;
  const isBingoReady = linesCompleted >= linesNeeded;

  const isMyTurn = gameState.turnPlayerId === myPlayer?.id;
  const activeTurnPlayer = gameState.players?.find((p) => p.id === gameState.turnPlayerId);

  // Turn timer countdown calculation
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerEnabled = gameState.settings?.timerEnabled;

  useEffect(() => {
    if (!timerEnabled || !gameState.turnDeadline) {
      setSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const remainingMs = gameState.turnDeadline - Date.now();
      const sec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(sec);

      // Audio tick during last 3 seconds of active turn
      if (isMyTurn && sec <= 3 && sec > 0) {
        sounds.playTimerTick();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState.turnDeadline, timerEnabled, isMyTurn]);

  // Handle cell click to call number
  const handleCellClick = (num) => {
    if (!isMyTurn) {
      sounds.playError();
      return;
    }
    if (calledSet.has(num)) {
      sounds.playError();
      return;
    }

    sounds.playTap();
    onCallNumber(num);
  };

  // Check if cell is in a completed line for celebratory highlight
  const isInCompletedLine = (idx) => {
    const row = Math.floor(idx / size);
    const col = idx % size;

    if (evaluation.completedRows?.includes(row)) return true;
    if (evaluation.completedCols?.includes(col)) return true;
    if (evaluation.completedMainDiag && row === col) return true;
    if (evaluation.completedAntiDiag && row === size - 1 - col) return true;

    return false;
  };

  // Bingo letter badges for classic 5x5 or dynamic for N
  const letters = size === 5 ? ['B', 'I', 'N', 'G', 'O'] : Array.from({ length: size }, (_, i) => `L${i + 1}`);

  // Grid column template
  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`
  };

  // Recent called numbers (up to last 10)
  const recentCalled = [...calledNumbers].reverse().slice(0, 8);
  const latestNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

  return (
    <div className="w-full max-w-lg mx-auto p-2 sm:p-4 flex flex-col items-center">
      {/* Top Status: Turn Indicator & Timer */}
      <div className="w-full mb-3">
        <div
          className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-300 shadow-md flex items-center justify-between ${
            isMyTurn
              ? 'bg-burgundy-700 text-white border-burgundy-900 ring-2 ring-burgundy-400 animate-pulse-glow'
              : 'bg-white text-stone-800 border-stone-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl select-none">
              {isMyTurn ? '👉' : activeTurnPlayer?.avatar || '⏳'}
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold text-sm sm:text-base leading-tight">
                  {isMyTurn ? 'YOUR TURN TO CALL!' : `${activeTurnPlayer?.name || 'Someone'}'s Turn`}
                </span>
              </div>
              <span className={`text-[11px] block ${isMyTurn ? 'text-burgundy-100' : 'text-stone-500'}`}>
                {isMyTurn ? 'Tap an uncalled number on your board' : 'Waiting for number to be called...'}
              </span>
            </div>
          </div>

          {/* Countdown Clock */}
          {timerEnabled && secondsLeft !== null && (
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                secondsLeft <= 5
                  ? 'bg-rose-500 text-white border-rose-700 animate-bounce'
                  : isMyTurn
                  ? 'bg-burgundy-800 text-amber-300 border-burgundy-600'
                  : 'bg-stone-100 text-stone-700 border-stone-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Progress Tracker: B-I-N-G-O letters */}
      <div className="w-full bg-white rounded-2xl border border-stone-200 p-2 sm:p-2.5 shadow-sm mb-3">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-burgundy-800 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Line Progress</span>
          </span>
          <span className="text-xs font-extrabold text-stone-700 bg-cream-100 px-2 py-0.5 rounded-lg border border-stone-200">
            Lines: {linesCompleted} / {linesNeeded}
          </span>
        </div>

        {/* Letters Badges */}
        <div className="grid grid-flow-col auto-cols-fr gap-1.5">
          {letters.map((letter, idx) => {
            const isCompleted = idx < linesCompleted;
            return (
              <div
                key={letter}
                className={`py-1.5 sm:py-2 rounded-xl text-center font-display font-extrabold text-sm sm:text-base transition-all duration-300 border flex flex-col items-center justify-center ${
                  isCompleted
                    ? 'bg-emerald-sage text-white border-emerald-800 shadow-md scale-102 ring-2 ring-emerald-300'
                    : 'bg-cream-50 text-stone-400 border-stone-200'
                }`}
              >
                <span>{letter}</span>
                {isCompleted && <span className="text-[9px] text-amber-300">★</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bingo Board Grid */}
      <div
        className="w-full max-w-[370px] sm:max-w-[430px] aspect-square bg-white p-2 sm:p-2.5 rounded-3xl border-4 border-burgundy-700 shadow-2xl grid gap-1.5 sm:gap-2 mb-3 select-none"
        style={gridStyle}
      >
        {board.map((num, idx) => {
          const row = Math.floor(idx / size);
          const col = idx % size;
          const isMint = (row + col) % 2 === 0;
          const isCalled = calledSet.has(num);
          const inLine = isInCompletedLine(idx);

          // Clickable if my turn and not yet called
          const canCallThis = isMyTurn && !isCalled;

          return (
            <button
              key={idx}
              type="button"
              disabled={!canCallThis}
              onClick={() => handleCellClick(num)}
              className={`relative rounded-xl font-display font-extrabold transition-all duration-200 flex items-center justify-center border-2 overflow-hidden ${
                isCalled
                  ? inLine
                    ? 'bg-emerald-100 border-emerald-500 shadow-inner'
                    : 'bg-emerald-50/70 border-emerald-300 shadow-inner'
                  : isMint
                  ? 'bg-emerald-tint/60 border-emerald-200/80 text-emerald-accent'
                  : 'bg-pink-tint/70 border-pink-border/60 text-burgundy-900'
              } ${
                canCallThis
                  ? 'cursor-pointer hover:scale-105 active:scale-95 hover:border-burgundy-500 ring-2 ring-burgundy-300 ring-opacity-60'
                  : 'cursor-default'
              } ${
                inLine ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              {/* Cell Number */}
              <span
                className={`text-sm sm:text-lg transition-opacity ${
                  isCalled ? 'opacity-35 text-stone-500' : 'opacity-100 font-bold'
                }`}
              >
                {num}
              </span>

              {/* Bold Burgundy X Mark when called */}
              {isCalled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-stamp-x">
                  <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10 text-burgundy-700 drop-shadow">
                    <line
                      x1="8"
                      y1="8"
                      x2="32"
                      y2="32"
                      stroke="currentColor"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="32"
                      y1="8"
                      x2="8"
                      y2="32"
                      stroke="currentColor"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}

              {/* Subtle line glow star */}
              {inLine && (
                <span className="absolute top-0.5 right-1 text-[8px] text-emerald-600 font-bold">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BINGO Button */}
      <div className="w-full max-w-[370px] sm:max-w-[430px] mb-3">
        <button
          disabled={!isBingoReady}
          onClick={() => {
            sounds.playBingoWin();
            onClaimBingo();
          }}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-display font-extrabold text-xl tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl ${
            isBingoReady
              ? 'bg-gradient-to-r from-amber-500 via-burgundy-600 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-white border-2 border-yellow-300 animate-pulse-glow cursor-pointer scale-102 active:scale-95'
              : 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed opacity-75'
          }`}
        >
          <Trophy className="w-6 h-6" />
          <span>{isBingoReady ? '🎉 CLAIM BINGO! 🎉' : `BINGO (${linesCompleted}/${linesNeeded} Lines)`}</span>
        </button>
      </div>

      {/* Called Numbers Ticker / Recent Drawer */}
      <div className="w-full bg-white rounded-2xl border border-stone-200 p-2.5 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Called Numbers ({calledNumbers.length})
          </span>
          {latestNumber && (
            <span className="text-xs font-bold text-burgundy-700 bg-burgundy-50 px-2 py-0.5 rounded-lg border border-burgundy-200">
              Latest: #{latestNumber}
            </span>
          )}
        </div>

        {calledNumbers.length === 0 ? (
          <div className="text-center py-2 text-xs text-stone-400 italic">
            No numbers called yet. Let the game begin!
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-thin">
            {recentCalled.map((num, idx) => (
              <span
                key={`${num}-${idx}`}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 border ${
                  idx === 0
                    ? 'bg-burgundy-700 text-white border-burgundy-900 shadow-sm'
                    : 'bg-cream-100 text-stone-700 border-stone-300'
                }`}
              >
                {num}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

