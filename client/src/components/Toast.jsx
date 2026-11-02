import React from 'react';
import { AlertCircle, CheckCircle2, Info, Bell } from 'lucide-react';

export default function Toast({ toasts = [] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-2.5 rounded-2xl shadow-xl border flex items-center space-x-2.5 text-xs sm:text-sm font-semibold animate-pop-in ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toast.type === 'call'
              ? 'bg-burgundy-700 text-white border-burgundy-900 shadow-burgundy-900/30'
              : 'bg-white text-stone-800 border-stone-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Bell className="w-4 h-4 text-amber-300 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

