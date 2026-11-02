import React, { useState, useEffect } from 'react';
import { Shuffle, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { sounds } from '../audio';

export default function BoardSetupScreen({
  gameState,
  myPlayer,
  onSubmitBoard
}) {
  const size = gameState.settings?.boardSize || 5;
  const totalCells = size * size;

  // Board state: array of totalCells numbers (or null if empty)
  const [board, setBoard] = useState(() => {
    if (myPlayer?.board && myPlayer.board.length === totalCells) {
      return [...myPlayer.board];
    }
    return Array(totalCells).fill(null);
  });

  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(myPlayer?.isReady));

  // Numbers 1 to totalCells
  const allNumbers = Array.from({ length: totalCells }, (_, i) => i + 1);

  // Set of placed numbers
  const placedNumbersSet = new Set(board.filter((n) => n !== null));
  const remainingNumbers = allNumbers.filter((n) => !placedNumbersSet.has(n));
  const isComplete = placedNumbersSet.size === totalCells;

  // Auto-fill / Shuffle
  const handleShuffle = () => {
    sounds.playTap();
    const shuffled = [...allNumbers].sort(() => Math.random() - 0.5);
    setBoard(shuffled);
    setSelectedCellIndex(null);
  };

  // Clear Board
  const handleClear = () => {
    sounds.playTap();
    setBoard(Array(totalCells).fill(null));
    setSelectedCellIndex(null);
  };

  // Cell click
  const handleCellClick = (index) => {
    if (submitted) return;
    sounds.playTap();

    if (selectedCellIndex === index) {
      // Toggle off or clear cell
      if (board[index] !== null) {
        const next = [...board];
        next[index] = null;
        setBoard(next);
      }
      setSelectedCellIndex(null);
    } else {
      setSelectedCellIndex(index);
    }
  };

  // Pick number from palette
  const handlePickNumber = (num) => {
    if (submitted) return;
    sounds.playTap();

    let targetIdx = selectedCellIndex;

    // If no cell selected, find the first empty cell
    if (targetIdx === null || board[targetIdx] !== null) {
      targetIdx = board.findIndex((val) => val === null);
    }

    if (targetIdx !== -1) {
      const next = [...board];
      next[targetIdx] = num;
      setBoard(next);

      // Auto-advance to the next empty cell
      const nextEmpty = next.findIndex((val) => val === null);
      setSelectedCellIndex(nextEmpty !== -1 ? nextEmpty : null);
    }
  };

  // Submit board
  const handleSubmit = () => {
    if (!isComplete || submitted) return;
    sounds.playLineComplete();
    setIsSubmitting(true);
    setSubmitted(true);
    onSubmitBoard(board);
  };

  // Responsive grid style
  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`
  };

  // Player readiness list
  const players = gameState.players || [];
  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-5 flex flex-col items-center animate-pop-in">
      {/* Title & Setup Progress */}
      <div className="w-full text-center mb-3">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-burgundy-700">
          Setup Your Board
        </h2>
        <p className="text-xs text-stone-600 mt-0.5">
          Fill cells with numbers 1 to {totalCells}. Tap a cell and pick a number, or Shuffle!
        </p>

        {/* Progress bar */}
        <div className="mt-2.5 max-w-xs mx-auto">
          <div className="flex justify-between text-xs font-bold text-burgundy-800 mb-1">
            <span>Placed: {placedNumbersSet.size} / {totalCells}</span>
            <span>{isComplete ? 'Ready to lock in! 🎉' : `${remainingNumbers.length} remaining`}</span>
          </div>
          <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-sage transition-all duration-300"
              style={{ width: `${(placedNumbersSet.size / totalCells) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons: Shuffle & Clear */}
      {!submitted && (
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={handleShuffle}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs font-bold shadow transition active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle / Auto-Fill</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-600 text-xs font-semibold border border-stone-200 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Bingo Board Grid */}
      <div
        className="w-full max-w-[380px] sm:max-w-[440px] aspect-square bg-white p-2 sm:p-3 rounded-3xl border-4 border-burgundy-700 shadow-2xl grid gap-1.5 sm:gap-2 mb-4"
        style={gridStyle}
      >
        {board.map((num, idx) => {
          const row = Math.floor(idx / size);
          const col = idx % size;
          // Alternating checkerboard tints: soft pink vs soft mint
          const isMint = (row + col) % 2 === 0;
          const isSelected = selectedCellIndex === idx;

          return (
            <button
              key={idx}
              type="button"
              disabled={submitted}
              onClick={() => handleCellClick(idx)}
              className={`relative rounded-xl font-display font-bold text-base sm:text-xl transition flex items-center justify-center border-2 select-none active:scale-95 ${
                isSelected
                  ? 'bg-amber-100 border-amber-500 text-amber-900 ring-4 ring-amber-300 z-10 scale-105'
                  : isMint
                  ? 'bg-emerald-tint/70 border-emerald-300/60 text-emerald-accent hover:border-emerald-500'
                  : 'bg-pink-tint/80 border-pink-border/70 text-burgundy-800 hover:border-burgundy-400'
              } ${submitted ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
            >
              {num !== null ? (
                <span className="animate-pop-in">{num}</span>
              ) : (
                <span className="text-stone-300 text-xs sm:text-sm font-sans font-normal">
                  {idx + 1}
                </span>
              )}

              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Number Palette (Remaining Numbers to pick) */}
      {!submitted && remainingNumbers.length > 0 && (
        <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-2.5 shadow-sm mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-2">
            <span>Tap to place {selectedCellIndex !== null ? `in cell #${selectedCellIndex + 1}` : 'in next open cell'}:</span>
            <span className="text-burgundy-700 font-bold">{remainingNumbers.length} left</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
            {remainingNumbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePickNumber(num)}
                className="w-8 h-8 rounded-lg bg-cream-100 hover:bg-burgundy-100 active:bg-burgundy-700 active:text-white border border-stone-200 font-bold text-xs text-stone-800 transition flex items-center justify-center shrink-0"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ready Button & Status */}
      <div className="w-full max-w-md">
        {!submitted ? (
          <button
            disabled={!isComplete || isSubmitting}
            onClick={handleSubmit}
            className={`w-full py-3.5 rounded-2xl font-display font-bold text-lg shadow-xl transition flex items-center justify-center space-x-2 ${
              isComplete
                ? 'bg-emerald-sage hover:bg-emerald-accent text-white active:scale-98 animate-pulse-glow'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>I'm Ready! Lock In Board</span>
          </button>
        ) : (
          <div className="bg-emerald-tint border-2 border-emerald-sage p-3.5 rounded-2xl text-center shadow">
            <div className="flex items-center justify-center space-x-2 text-emerald-accent font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Board Locked! You're ready to play!</span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Waiting for other players ({readyCount} / {players.length} ready)...
            </p>
          </div>
        )}

        {/* Players Readiness Pill List */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                p.isReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-stone-100 text-stone-500 border-stone-200'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="truncate max-w-[80px]">{p.name}</span>
              {p.isReady ? (
                <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>
              ) : (
                <span className="text-[10px] text-stone-400">Placing...</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

