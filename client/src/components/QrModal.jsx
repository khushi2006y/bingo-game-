import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, Smartphone, Wifi } from 'lucide-react';
import { sounds } from '../audio';

export default function QrModal({ roomCode, isOpen, onClose }) {
  const [networkUrl, setNetworkUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch network IP info from backend
    fetch('/api/network-info')
      .then(res => res.json())
      .then(data => {
        if (data.networkUrl) {
          setNetworkUrl(`${data.networkUrl}?room=${roomCode || ''}`);
        } else {
          setNetworkUrl(`${window.location.origin}?room=${roomCode || ''}`);
        }
      })
      .catch(() => {
        setNetworkUrl(`${window.location.origin}?room=${roomCode || ''}`);
      });
  }, [isOpen, roomCode]);

  if (!isOpen) return null;

  const fullJoinUrl = networkUrl || `${window.location.origin}?room=${roomCode || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullJoinUrl);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-cream-50 border-2 border-burgundy-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-pop-in text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-burgundy-700 hover:bg-burgundy-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center space-x-2 text-burgundy-700 mb-1">
          <Smartphone className="w-6 h-6" />
          <h2 className="font-display font-bold text-xl sm:text-2xl">Join from Phone</h2>
        </div>
        <p className="text-xs text-stone-600 mb-4 flex items-center justify-center space-x-1">
          <Wifi className="w-3.5 h-3.5 text-emerald-sage inline" />
          <span>Connect phone to the same Wi-Fi and scan:</span>
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-inner border border-stone-200 inline-block mb-4">
          <QRCodeSVG
            value={fullJoinUrl}
            size={200}
            level="M"
            includeMargin={true}
            fgColor="#800020"
          />
        </div>

        {/* Room Code Badge */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Room Code
          </span>
          <span className="text-2xl font-mono font-extrabold text-burgundy-700 tracking-widest bg-burgundy-50 px-4 py-1 rounded-xl border border-burgundy-200 inline-block">
            {roomCode}
          </span>
        </div>

        {/* URL and Copy Link */}
        <div className="flex items-center bg-stone-100 rounded-xl p-1.5 border border-stone-200 mb-4 text-left">
          <input
            type="text"
            readOnly
            value={fullJoinUrl}
            className="bg-transparent text-xs text-stone-700 font-mono w-full px-2 outline-none select-all truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 bg-burgundy-700 hover:bg-burgundy-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-emerald-sage hover:bg-emerald-accent text-white shadow transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}

