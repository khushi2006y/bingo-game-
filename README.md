# 🎲 Bingo Blitz - Real-Time Multiplayer Bingo

A responsive, mobile-first multiplayer Bingo game that runs on **localhost** and is instantly playable across phones, tablets, and computers on your local Wi-Fi.

Built with **React**, **Vite**, **Tailwind CSS**, and a **Node.js + Express + Socket.IO** real-time backend.

---

## ✨ Features

- **📱 Mobile-First & PWA Ready**: Installable on phones as a standalone web app with touch-friendly layout and portrait optimization.
- **⚡ Real-Time Multiplayer**: Instant turn updates, called numbers, and line completions powered by Socket.IO.
- **📶 Instant Local Wi-Fi Play**:
  - Automatically detects your computer's local Wi-Fi IP address.
  - **Prints an ASCII QR code in the terminal on startup** for quick phone camera scanning.
  - **In-app QR Code Modal** so friends can scan your desktop screen to join.
- **📏 Customizable Board Sizes**:
  - Classic **5×5** (1–25, 5 lines to win).
  - Quick **3×3**, **4×4**, or epic **6×6**, **7×7**, **8×8** grids with dynamic line calculations.
- **✏️ Interactive Board Setup**:
  - **Manual placement**: Tap any cell and pick numbers from your palette.
  - **Shuffle / Auto-Fill**: One-tap instant random permutation.
  - **Clear board**: Start fresh anytime before locking in.
- **🔒 Anti-Cheat & Privacy**:
  - **Complete Board Privacy**: The server **never** sends other players' boards.
  - **Server-Side Validation**: All numbers, turns, board validity, and BINGO claims are verified on the backend. False claims are rejected.
- **⏱️ Turn Timer**:
  - Optional countdown (10s, 15s, 20s default, 30s, 45s).
  - Automatically calls a random uncalled number from the active player's board if time expires.
- **🎉 Victory Celebration**: Confetti fireworks, match stats, and seamless 1-tap rematching.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)

### 1. Install Dependencies
In the root directory, run:
```bash
npm install
```
*(This automatically installs dependencies for both `server` and `client` via npm workspaces).*

### 2. Build & Run (Single Command)
```bash
npm start
```
This builds the client and launches the server on port `3000`.

### 3. Or Run in Development Mode (Hot-Reload)
```bash
npm run dev
```
Runs both the backend server (port 3000) and the Vite frontend (port 5173 with auto-proxy) concurrently.

---

## 📱 Playing on Phones (Same Wi-Fi)

1. Make sure your computer and your phone are connected to the **same Wi-Fi network**.
2. Run `npm start`.
3. In your terminal, you will see:
   ```
   ========================================================
      🎲 MULTIPLAYER BINGO GAME SERVER IS RUNNING! 🎲
   ========================================================
     > Local:   http://localhost:3000
     > Network: http://192.168.x.x:3000 (Wi-Fi for Phones)
   ========================================================
     📱 Scan this QR code on your phone to open the game:
   --------------------------------------------------------
     [ TERMINAL QR CODE ]
   ========================================================
   ```
4. Point your phone's camera at the terminal QR code, or open `http://<your-ip>:3000` in Safari/Chrome.
5. In the lobby, click the **QR Code** button to display a high-resolution QR code directly on your monitor for other players to scan.

---

## 🎮 How to Play

1. **Create or Join a Room**:
   - Host clicks **Create Room**, picks a nickname and avatar.
   - Friends join by typing the 6-character room code or clicking the shared link / scanning the QR code.
2. **Lobby & Settings**:
   - The host chooses the **Board Size** (default 5×5) and **Turn Timer** (ON/OFF, duration).
   - Once at least 2 players are in the lobby, the host clicks **Start Game Setup**.
3. **Board Setup**:
   - Fill your $N \times N$ board with numbers $1$ to $N^2$.
   - Tap **Shuffle / Auto-Fill** or manually place your numbers.
   - Click **I'm Ready! Lock In Board**. When all players are ready, the match begins!
4. **Turn-Based Game**:
   - Players take turns calling an uncalled number from their own board.
   - When a number is called, it is crossed out with a bold burgundy **X** on **every** player's board.
   - Completed rows, columns, and diagonals advance your line progress (**B-I-N-G-O** letters).
5. **Winning BINGO**:
   - When you complete $N$ lines, the **CLAIM BINGO!** button glows and unlocks.
   - Tap it to claim victory! The server validates your lines, triggers the winner celebration, and allows a rematch.

---

## 📁 Project Architecture

```
bingo game/
├── package.json              # Monorepo workspaces & root scripts
├── README.md                 # Setup guide and documentation
├── server/
│   ├── package.json          # Express, Socket.IO, qrcode-terminal
│   ├── index.js              # Server entry, IP detection, terminal QR code, Socket handlers
│   ├── gameManager.js        # Room state, turns, timers, reconnect tokens, privacy filters
│   └── bingoValidator.js     # Row, column, diagonal line evaluation & win validation
└── client/
    ├── index.html            # PWA shell, meta tags, fonts
    ├── vite.config.js        # Vite config with backend proxy
    ├── tailwind.config.js    # Burgundy, Emerald, & Cream design palette
    ├── public/
    │   ├── manifest.json     # PWA manifest
    │   ├── favicon.svg       # Custom app icon
    │   └── mascot.png        # (Optional) Drop custom mascot image here
    └── src/
        ├── App.jsx           # Main state machine, screen routing, socket listeners
        ├── socket.js         # Socket client, persistent player identity
        ├── audio.js          # Web Audio API synthesizer for sound effects
        └── components/
            ├── Header.jsx           # Top navigation, room code, sound & mascot toggles
            ├── HomeScreen.jsx       # Nickname, avatar picker, create/join room
            ├── LobbyScreen.jsx      # Players list, board size & timer settings, invite links
            ├── BoardSetupScreen.jsx # Interactive N×N board builder, shuffle, number picker
            ├── GameScreen.jsx       # Turn indicator, timer, B-I-N-G-O progress, game board
            ├── ResultScreen.jsx     # Winner showcase, confetti fireworks, rematch button
            ├── Companion.jsx        # Mascot character with speech bubbles & mood animations
            ├── QrModal.jsx          # Screen QR code modal for mobile scanning
            └── Toast.jsx            # In-game notification banner
```

---

## 🛠️ Scripts Reference

- `npm install`: Installs dependencies for server and client.
- `npm start`: Builds the frontend and starts the Express production server.
- `npm run dev`: Runs Vite dev server and Node backend concurrently with hot reloading.
- `npm run build`: Compiles the React frontend into `client/dist`.

