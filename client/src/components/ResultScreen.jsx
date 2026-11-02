import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, CheckCircle, Users } from 'lucide-react';
import { sounds } from '../audio';

export default function ResultScreen({
  gameState,
  myPlayer,
  onRematch,
  onExit
}) {
  const winner = gameState.winner;
  const isWinner = winner?.id === myPlayer?.id;
  const calledCount = gameState.calledNumbers?.length || 0;
  const players = gameState.players || [];

  useEffect(() => {
    // Trigger confetti fireworks
    sounds.playBingoWin();

    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#800020', '#2D6A4F', '#FFD700', '#FF8A80', '#E8F5E9']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#800020', '#2D6A4F', '#FFD700', '#FF8A80', '#E8F5E9']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center animate-pop-in text-center">
      {/* Trophy & Winner Badge */}
      <div className="relative my-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-500 p-1 shadow-2xl flex items-center justify-center animate-bounce-gentle border-4 border-yellow-200">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            {winner?.avatar || '🏆'}
          </div>
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-burgundy-700 text-yellow-300 font-display font-black text-xs uppercase px-3 py-1 rounded-full shadow-md border border-yellow-300 tracking-wider">
          WINNER!
        </div>
      </div>

      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-burgundy-700 tracking-tight mt-2">
        {isWinner ? '🎉 YOU WON BINGO! 🎉' : `${winner?.name || 'Player'} Won!`}
      </h1>
      <p className="text-stone-600 text-xs sm:text-sm font-medium mt-1">
        {isWinner
          ? 'Fantastic board layout and lightning calls! You are the champion!'
          : 'A spirited and well-played match! Ready for a rematch?'}
      </p>

      {/* Match Stats Card */}
      <div className="w-full bg-white rounded-3xl border-2 border-burgundy-700/20 shadow-xl p-5 my-5 text-left">
        <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-800 mb-3 flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Match Summary</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-cream-50 p-3 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Numbers Called
            </span>
            <span className="font-display font-bold text-2xl text-burgundy-700">
              {calledCount}
            </span>
          </div>
          <div className="bg-cream-50 p-3 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Lines Needed
            </span>
            <span className="font-display font-bold text-2xl text-emerald-sage">
              {gameState.linesNeeded || 5}
            </span>
          </div>
        </div>

        {/* Players final lines overview */}
        <span className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 block">
          Final Standings
        </span>
        <div className="space-y-2">
          {players.map((p) => {
            const isMe = p.id === myPlayer?.id;
            const isMatchWinner = p.id === winner?.id;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isMatchWinner
                    ? 'bg-amber-50/80 border-amber-300'
                    : isMe
                    ? 'bg-burgundy-50/70 border-burgundy-200'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl select-none">{p.avatar}</span>
                  <div>
                    <span className="font-bold text-xs text-stone-800">
                      {p.name} {isMe && '(You)'}
                    </span>
                    {isMatchWinner && (
                      <span className="text-[10px] text-amber-700 font-semibold block">
                        👑 Champion
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-stone-700">
                    {p.linesCompleted || 0} / {gameState.linesNeeded || 5} lines
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rematch & Exit Buttons */}
      <div className="w-full space-y-2.5">
        <button
          onClick={() => {
            sounds.playTap();
            onRematch();
          }}
          className="w-full py-4 px-6 bg-emerald-sage hover:bg-emerald-accent active:bg-emerald-800 text-white font-display font-bold text-lg rounded-2xl shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2 animate-pulse-glow"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Rematch</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            onExit();
          }}
          className="w-full py-3 px-6 bg-cream-50 hover:bg-stone-100 text-stone-700 font-display font-semibold text-sm rounded-2xl border border-stone-300 shadow-sm transition flex items-center justify-center space-x-2"
        >
          <Home className="w-4 h-4 text-stone-500" />
          <span>Back to Main Menu</span>
        </button>
      </div>
    </div>
  );
}

