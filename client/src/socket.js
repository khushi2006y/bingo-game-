import { io } from 'socket.io-client';

// Generate or retrieve persistent player ID
export function getPlayerId() {
  let id = localStorage.getItem('bingo_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('bingo_player_id', id);
  }
  return id;
}

export function getPlayerProfile() {
  const defaultNames = ['Lucky Fox', 'Star Tiger', 'Bingo Bear', 'Speedy Panda', 'Clever Cat'];
  const avatars = ['🦁', '🦊', '🐻', '🐼', '🐱', '🐶', '🐰', '🐯', '🐵', '🐨'];

  let name = localStorage.getItem('bingo_player_name');
  if (!name) {
    name = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    localStorage.setItem('bingo_player_name', name);
  }

  let avatar = localStorage.getItem('bingo_player_avatar');
  if (!avatar) {
    avatar = avatars[Math.floor(Math.random() * avatars.length)];
    localStorage.setItem('bingo_player_avatar', avatar);
  }

  return { id: getPlayerId(), name, avatar };
}

export function savePlayerProfile(name, avatar) {
  if (name) localStorage.setItem('bingo_player_name', name.trim());
  if (avatar) localStorage.setItem('bingo_player_avatar', avatar);
}

// Socket connection: uses current origin or localhost in dev
const serverUrl = window.location.port === '5173'
  ? `http://${window.location.hostname}:3000`
  : window.location.origin;

export const socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

