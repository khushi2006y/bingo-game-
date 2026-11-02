import React from 'react';
import { Crown, Users, Clock, Grid3X3, Play, QrCode, Copy, Check, LogOut } from 'lucide-react';
import { sounds } from '../audio';

export default function LobbyScreen({
  gameState,
  myPlayer,
  onUpdateSettings,
  onStartSetup,
  onLeaveRoom,
  onOpenQr
}) {
  const [copied, setCopied] = React.useState(false);

  const isHost = gameState.isHost;
  const settings = gameState.settings || { boardSize: 5, timerEnabled: true, turnDuration: 20 };
  const players = gameState.players || [];
  const minPlayers = 2;
  const canStart = isHost && players.length >= minPlayers;

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSizeChange = (size) => {
    if (!isHost) return;
    sounds.playTap();
    onUpdateSettings({ boardSize: size });
  };

  const handleTimerToggle = () => {
    if (!isHost) return;
    sounds.playTap();
    onUpdateSettings({ timerEnabled: !settings.timerEnabled });
  };

  const handleDurationChange = (dur) => {
    if (!isHost) return;
    sounds.playTap();
    onUpdateSettings({ turnDuration: dur });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 animate-pop-in">
      {/* Lobby Header Card */}
      <div className="bg-white rounded-3xl border-2 border-burgundy-700/20 shadow-xl p-5 sm:p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-burgundy-800">
              Room Lobby
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-burgundy-700 tracking-wider">
                {gameState.roomCode}
              </span>
              <button
                onClick={handleCopyLink}
                title="Copy Invite Link"
                className="p-2 rounded-xl bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-800 border border-burgundy-200 transition"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={onOpenQr}
                title="Show QR Code for phones"
                className="p-2 rounded-xl bg-emerald-tint hover:bg-emerald-100 text-emerald-sage border border-emerald-300 transition"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Share the code or scan the QR code from mobile devices to join!
            </p>
          </div>

          <button
            onClick={onLeaveRoom}
            className="flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>

        {/* Players List Grid */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center space-x-1">
              <Users className="w-4 h-4 text-burgundy-700" />
              <span>Players ({players.length})</span>
            </span>
            <span className="text-xs text-stone-500">Min 2 players required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p) => {
              const isMe = p.id === myPlayer?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isMe
                      ? 'bg-burgundy-50/80 border-burgundy-300 shadow-sm'
                      : 'bg-cream-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl select-none">{p.avatar}</span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-stone-800">
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-burgundy-700 text-white px-1.5 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {p.isDisconnected ? '⚠️ Reconnecting...' : 'Ready in lobby'}
                      </span>
                    </div>
                  </div>

                  {p.isHost && (
                    <span className="flex items-center space-x-1 text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-xl border border-amber-300">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Host</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Settings Card */}
      <div className="bg-white rounded-3xl border-2 border-burgundy-700/20 shadow-xl p-5 sm:p-6 mb-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-800 mb-4 flex items-center space-x-2">
          <Grid3X3 className="w-4 h-4 text-burgundy-700" />
          <span>Game Rules & Settings {isHost ? '(Host Controls)' : '(Configured by Host)'}</span>
        </h3>

        {/* Board Size Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-stone-700 mb-2">
            Board Size: <span className="text-burgundy-700 font-extrabold">{settings.boardSize}×{settings.boardSize}</span> ({settings.boardSize * settings.boardSize} numbers, {settings.boardSize} lines to win)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[3, 4, 5, 6, 7, 8].map((size) => {
              const active = settings.boardSize === size;
              return (
                <button
                  key={size}
                  disabled={!isHost}
                  onClick={() => handleSizeChange(size)}
                  className={`py-2 px-3 rounded-xl font-bold text-sm border transition flex flex-col items-center justify-center ${
                    active
                      ? 'bg-burgundy-700 text-white border-burgundy-900 shadow-md scale-102'
                      : 'bg-cream-50 text-stone-700 border-stone-200 hover:bg-cream-100 disabled:opacity-60'
                  }`}
                >
                  <span>{size}×{size}</span>
                  {size === 5 && (
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold ${active ? 'text-amber-300' : 'text-emerald-sage'}`}>
                      Classic
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn Timer Toggle and Duration */}
        <div className="bg-cream-50 p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-burgundy-700" />
              <div>
                <span className="text-xs font-bold text-stone-800 block">Turn Countdown Timer</span>
                <span className="text-[11px] text-stone-500">Auto-calls a random number if time expires</span>
              </div>
            </div>

            <button
              disabled={!isHost}
              onClick={handleTimerToggle}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                settings.timerEnabled
                  ? 'bg-emerald-sage text-white border-emerald-800'
                  : 'bg-stone-200 text-stone-600 border-stone-300 disabled:opacity-60'
              }`}
            >
              {settings.timerEnabled ? 'TIMER ON' : 'TIMER OFF'}
            </button>
          </div>

          {settings.timerEnabled && (
            <div className="pt-2 border-t border-stone-200">
              <span className="text-xs text-stone-600 font-semibold mb-2 block">
                Turn Time Limit:
              </span>
              <div className="flex flex-wrap gap-2">
                {[10, 15, 20, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    disabled={!isHost}
                    onClick={() => handleDurationChange(sec)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                      settings.turnDuration === sec
                        ? 'bg-burgundy-700 text-white border-burgundy-900 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 disabled:opacity-60'
                    }`}
                  >
                    {sec}s {sec === 20 && '★'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Button / Waiting Banner */}
      {isHost ? (
        <div className="space-y-2">
          <button
            disabled={!canStart}
            onClick={() => {
              sounds.playTap();
              onStartSetup();
            }}
            className={`w-full py-4 px-6 rounded-2xl font-display font-bold text-xl shadow-xl transition flex items-center justify-center space-x-2 ${
              canStart
                ? 'bg-emerald-sage hover:bg-emerald-accent text-white active:scale-98 cursor-pointer'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            <span>Start Game Setup</span>
          </button>
          {!canStart && (
            <p className="text-center text-xs text-stone-500">
              Waiting for at least 1 more player to join before starting...
            </p>
          )}
        </div>
      ) : (
        <div className="bg-cream-100 border-2 border-dashed border-burgundy-300 p-4 rounded-2xl text-center">
          <span className="text-sm font-semibold text-burgundy-800">
            ⏳ Waiting for the host to start the game...
          </span>
          <p className="text-xs text-stone-500 mt-1">
            Get your lucky numbers ready!
          </p>
        </div>
      )}
    </div>
  );
}

