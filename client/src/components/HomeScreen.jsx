import React, { useState, useEffect } from 'react';
import { Sparkles, Users, ArrowRight, Dices, Play } from 'lucide-react';
import { sounds } from '../audio';
import { savePlayerProfile } from '../socket';

const AVATARS = ['🦁', '🦊', '🐻', '🐼', '🐱', '🐶', '🐰', '🐯', '🐵', '🐨', '🦉', '🦄'];

export default function HomeScreen({
  player,
  setPlayer,
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = ''
}) {
  const [name, setName] = useState(player?.name || '');
  const [avatar, setAvatar] = useState(player?.avatar || '🦁');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [mode, setMode] = useState(initialRoomCode ? 'join' : 'create'); // 'create' | 'join'
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.toUpperCase());
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      sounds.playError();
      return;
    }
    setError('');
    sounds.playTap();
    savePlayerProfile(name, avatar);
    setPlayer({ ...player, name: name.trim(), avatar });
    onCreateRoom({ name: name.trim(), avatar });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      sounds.playError();
      return;
    }
    if (!roomCodeInput.trim() || roomCodeInput.trim().length < 4) {
      setError('Please enter a valid 6-character room code');
      sounds.playError();
      return;
    }
    setError('');
    sounds.playTap();
    savePlayerProfile(name, avatar);
    setPlayer({ ...player, name: name.trim(), avatar });
    onJoinRoom({ roomCode: roomCodeInput.trim().toUpperCase(), name: name.trim(), avatar });
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Title & Banner */}
      <div className="text-center my-4 sm:my-6 animate-pop-in">
        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-burgundy-700 text-cream-50 shadow-xl mb-3 border-4 border-burgundy-900">
          <Dices className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse-glow" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-burgundy-700 tracking-tight">
          BINGO BLITZ
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm font-medium mt-1">
          Real-time live multiplayer Bingo with friends
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full bg-white rounded-3xl border-2 border-burgundy-700/20 shadow-xl p-5 sm:p-6 mb-6">
        {/* Name input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-burgundy-800 uppercase tracking-wider mb-1.5">
            Your Nickname
          </label>
          <input
            type="text"
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lucky Fox"
            className="w-full px-4 py-3 rounded-2xl bg-cream-50 border-2 border-stone-200 focus:border-burgundy-600 focus:outline-none font-semibold text-stone-800 text-base transition"
          />
        </div>

        {/* Avatar selection */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-burgundy-800 uppercase tracking-wider mb-1.5">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-6 gap-2 bg-cream-50 p-2 rounded-2xl border border-stone-200">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => {
                  setAvatar(av);
                  sounds.playTap();
                }}
                className={`text-2xl p-2 rounded-xl transition transform active:scale-90 flex items-center justify-center ${
                  avatar === av
                    ? 'bg-burgundy-700 text-white shadow-md scale-110 ring-2 ring-burgundy-400'
                    : 'hover:bg-cream-200'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switch: Create vs Join */}
        <div className="flex bg-cream-100 p-1 rounded-2xl border border-stone-200 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
              sounds.playTap();
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-1.5 ${
              mode === 'create'
                ? 'bg-burgundy-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setError('');
              sounds.playTap();
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-1.5 ${
              mode === 'join'
                ? 'bg-burgundy-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Mode specific form action */}
        {mode === 'create' ? (
          <div>
            <p className="text-xs text-stone-500 mb-4 text-center">
              Host a new room! You can customize the board size (3×3 up to 10×10) and turn timer.
            </p>
            <button
              onClick={handleCreate}
              className="w-full py-3.5 px-4 bg-burgundy-700 hover:bg-burgundy-800 active:bg-burgundy-900 text-white font-display font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>Create New Game</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                Enter Room Code
              </label>
              <input
                type="text"
                value={roomCodeInput}
                maxLength={6}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 7X9K2B"
                className="w-full px-4 py-3 rounded-2xl bg-cream-50 border-2 border-stone-200 focus:border-burgundy-600 focus:outline-none font-mono font-bold text-xl text-center tracking-widest text-burgundy-800 uppercase transition"
              />
            </div>
            <button
              onClick={handleJoin}
              className="w-full py-3.5 px-4 bg-emerald-sage hover:bg-emerald-accent text-white font-display font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>Enter Room</span>
              <Play className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Play Info */}
      <div className="text-center text-xs text-stone-500 max-w-xs space-y-1">
        <p>📱 Play seamlessly on phones and computers on the same Wi-Fi!</p>
        <p>✨ Classic 5×5 (numbers 1–25) or customizable sizes!</p>
      </div>
    </div>
  );
}

