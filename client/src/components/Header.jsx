import React from 'react';
import { Volume2, VolumeX, Sparkles, QrCode, Copy, Check } from 'lucide-react';
import { sounds } from '../audio';

export default function Header({
  roomCode,
  player,
  companionVisible,
  onToggleCompanion,
  soundEnabled,
  onToggleSound,
  onOpenQr
}) {
  const [copied, setCopied] = React.useState(false);

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-burgundy-700 text-cream-50 px-3 sm:px-6 py-2.5 sm:py-3 shadow-md flex items-center justify-between z-30">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cream-100 text-burgundy-700 flex items-center justify-center font-display font-bold text-xl sm:text-2xl shadow-inner border border-burgundy-900">
          B
        </div>
        <div>
          <h1 className="font-display font-bold text-lg sm:text-xl tracking-wide leading-none text-cream-50">
            Bingo Blitz
          </h1>
          <span className="text-[10px] sm:text-xs text-burgundy-200 font-medium">
            Multiplayer Live
          </span>
        </div>
      </div>

      {/* Center: Room Code (if active) */}
      {roomCode && (
        <div className="flex items-center bg-burgundy-800/80 rounded-xl px-2.5 py-1 border border-burgundy-600/50 space-x-1.5 shadow-sm">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-burgundy-200 font-semibold">
            Room:
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-yellow-300 tracking-wider">
            {roomCode}
          </span>
          <button
            onClick={copyRoomCode}
            title="Copy room code"
            className="p-1 text-cream-100 hover:text-white hover:bg-burgundy-700 rounded-lg transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onOpenQr && (
            <button
              onClick={onOpenQr}
              title="Show QR Code for phones"
              className="p-1 text-cream-100 hover:text-white hover:bg-burgundy-700 rounded-lg transition"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Right Controls: Sound, Mascot toggle, Player Badge */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="p-1.5 sm:p-2 rounded-xl bg-burgundy-800/60 hover:bg-burgundy-800 text-cream-100 hover:text-white transition border border-burgundy-600/40"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
          ) : (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
          )}
        </button>

        {/* Mascot Toggle */}
        <button
          onClick={onToggleCompanion}
          title={companionVisible ? 'Hide mascot' : 'Show mascot'}
          className={`p-1.5 sm:p-2 rounded-xl border transition ${
            companionVisible
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-burgundy-800/60 text-stone-400 border-burgundy-600/40'
          }`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Player Profile Pill */}
        {player && (
          <div className="flex items-center bg-burgundy-900/80 rounded-xl px-2 py-1 border border-burgundy-800 space-x-1.5">
            <span className="text-base sm:text-lg select-none">{player.avatar}</span>
            <span className="text-xs sm:text-sm font-semibold max-w-[70px] sm:max-w-[100px] truncate text-cream-100">
              {player.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

