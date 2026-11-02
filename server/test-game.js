const assert = require('assert');
const { isValidBoard, evaluateBoard, validateBingoClaim } = require('./bingoValidator');
const GameManager = require('./gameManager');

console.log('🧪 Starting Bingo Game Engine Tests...\n');

// 1. Test Validator: Valid & Invalid Boards
console.log('--- Test 1: Board Structure Validation ---');
const valid5x5 = Array.from({ length: 25 }, (_, i) => i + 1);
assert.strictEqual(isValidBoard(valid5x5, 5), true, 'Valid 5x5 board should pass');

const duplicateBoard = [...valid5x5];
duplicateBoard[0] = duplicateBoard[1];
assert.strictEqual(isValidBoard(duplicateBoard, 5), false, 'Duplicate numbers should fail');

const shortBoard = valid5x5.slice(0, 24);
assert.strictEqual(isValidBoard(shortBoard, 5), false, 'Short board should fail');

const outOfRangeBoard = [...valid5x5];
outOfRangeBoard[0] = 26;
assert.strictEqual(isValidBoard(outOfRangeBoard, 5), false, 'Number > 25 should fail in 5x5');

const valid3x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
assert.strictEqual(isValidBoard(valid3x3, 3), true, 'Valid 3x3 board should pass');
console.log('✅ Board Structure Validation Passed!');

// 2. Test Validator: Line Evaluation
console.log('\n--- Test 2: Line Evaluation & Bingo Claims ---');
// Grid 5x5:
//  1  2  3  4  5
//  6  7  8  9 10
// 11 12 13 14 15
// 16 17 18 19 20
// 21 22 23 24 25

// Test Row 0
let called = [1, 2, 3, 4, 5];
let evalResult = evaluateBoard(valid5x5, called, 5);
assert.strictEqual(evalResult.count, 1, 'Row 0 should yield 1 line');
assert.deepStrictEqual(evalResult.completedRows, [0]);
assert.strictEqual(evalResult.isBingo, false, '1 line is not Bingo for 5x5');

// Complete Col 0 as well: [1, 6, 11, 16, 21]
called = [1, 2, 3, 4, 5, 6, 11, 16, 21];
evalResult = evaluateBoard(valid5x5, called, 5);
assert.strictEqual(evalResult.count, 2, 'Row 0 + Col 0 should yield 2 lines');
assert.deepStrictEqual(evalResult.completedRows, [0]);
assert.deepStrictEqual(evalResult.completedCols, [0]);

// Complete Main Diagonal: 1, 7, 13, 19, 25
called.push(7, 13, 19, 25);
evalResult = evaluateBoard(valid5x5, called, 5);
assert.strictEqual(evalResult.completedMainDiag, true, 'Main diagonal should be complete');
assert.strictEqual(evalResult.count, 3, 'Should have 3 lines now');

// Complete Anti-Diagonal: 5, 9, 13, 17, 21
called.push(9, 17);
evalResult = evaluateBoard(valid5x5, called, 5);
assert.strictEqual(evalResult.completedAntiDiag, true, 'Anti-diagonal should be complete');
assert.strictEqual(evalResult.count, 4, 'Should have 4 lines now');

// Complete Row 4: 21, 22, 23, 24, 25
called.push(22, 23, 24);
evalResult = evaluateBoard(valid5x5, called, 5);
assert.strictEqual(evalResult.count, 5, 'Should have 5 lines now');
assert.strictEqual(evalResult.isBingo, true, '5 lines in 5x5 should trigger isBingo');
assert.strictEqual(validateBingoClaim(valid5x5, called, 5), true, 'validateBingoClaim should be true');

// False claim check
assert.strictEqual(validateBingoClaim(valid5x5, [1, 2, 3], 5), false, 'Incomplete claim should be rejected');
console.log('✅ Line Evaluation and Bingo Claims Passed!');

// 3. Test GameManager: Room Lifecycle & Privacy Protection
console.log('\n--- Test 3: GameManager & Privacy Protection ---');

// Mock socket & io
const mockEvents = [];
const mockIo = {
  to: (room) => ({
    emit: (event, payload) => {
      mockEvents.push({ room, event, payload });
    }
  })
};

const gm = new GameManager(mockIo);
const socketHost = { id: 'sock_host_1', join: () => {} };
const socketP2 = { id: 'sock_p2_1', join: () => {} };

// Create room
const hostRes = gm.createRoom(socketHost, { playerId: 'host123', name: 'Alice', avatar: '🦁' });
assert.ok(hostRes.roomCode, 'Room code should be generated');
const code = hostRes.roomCode;

// Join room
const p2Res = gm.joinRoom(socketP2, { roomCode: code, playerId: 'player456', name: 'Bob', avatar: '🦊' });
assert.strictEqual(p2Res.player.name, 'Bob');

// Host updates settings
const settingRes = gm.updateSettings(code, 'host123', { boardSize: 5, timerEnabled: true, turnDuration: 15 });
assert.strictEqual(settingRes.success, true);
assert.strictEqual(gm.rooms.get(code).settings.turnDuration, 15);

// Non-host attempts setting change (should fail)
const badSetting = gm.updateSettings(code, 'player456', { boardSize: 4 });
assert.ok(badSetting.error, 'Non-host should not be able to change settings');

// Start setup
gm.startSetup(code, 'host123');
assert.strictEqual(gm.rooms.get(code).state, 'setup');

// Boards
const aliceBoard = Array.from({ length: 25 }, (_, i) => i + 1);
const bobBoard = Array.from({ length: 25 }, (_, i) => 25 - i); // Reversed order

// Submit Alice board
const submitAlice = gm.submitBoard(code, 'host123', aliceBoard);
assert.strictEqual(submitAlice.allReady, false, 'Not all ready yet');

// Submit Bob board
const submitBob = gm.submitBoard(code, 'player456', bobBoard);
assert.strictEqual(submitBob.allReady, true, 'All players ready now');

// Room should now have transitioned to 'playing'
assert.strictEqual(gm.rooms.get(code).state, 'playing');

// CRITICAL PRIVACY TEST (Rule 9)
console.log('\n--- Test 4: Privacy Check: Ensure no board leakage ---');
const stateForAlice = gm.getSanitizedStateForPlayer(code, 'host123');
const stateForBob = gm.getSanitizedStateForPlayer(code, 'player456');

// Alice should see her own board
assert.deepStrictEqual(stateForAlice.me.board, aliceBoard, 'Alice must receive her own board');
// Bob should see his own board
assert.deepStrictEqual(stateForBob.me.board, bobBoard, 'Bob must receive his own board');

// In public players array, board MUST BE UNDEFINED!
for (const p of stateForAlice.players) {
  assert.strictEqual(p.board, undefined, `Player ${p.name}'s board MUST NOT be visible in public players list!`);
}
for (const p of stateForBob.players) {
  assert.strictEqual(p.board, undefined, `Player ${p.name}'s board MUST NOT be visible in public players list!`);
}
console.log('✅ Privacy Protection Verified: No opponent board data sent!');

// Turn management
console.log('\n--- Test 5: Turn-Based Gameplay & Win Validation ---');
const activePlayerId = gm.rooms.get(code).turnPlayerId;
const nonActivePlayerId = activePlayerId === 'host123' ? 'player456' : 'host123';

// Non-active player calling out of turn (should fail)
const outOfTurnCall = gm.callNumber(code, nonActivePlayerId, 7);
assert.ok(outOfTurnCall.error, 'Calling out of turn must be blocked');

// Active player calls valid number
const activeBoard = activePlayerId === 'host123' ? aliceBoard : bobBoard;
const numToCall = activeBoard[0];
const validCall = gm.callNumber(code, activePlayerId, numToCall);
assert.strictEqual(validCall.success, true);
assert.strictEqual(gm.rooms.get(code).calledNumbers.includes(numToCall), true);

// Next turn should belong to the other player
assert.strictEqual(gm.rooms.get(code).turnPlayerId, nonActivePlayerId);

// Test False Bingo Claim
const falseClaim = gm.claimBingo(code, nonActivePlayerId);
assert.ok(falseClaim.error, 'False Bingo claim must be rejected by server');

console.log('✅ Turn-Based Gameplay & Server Anti-Cheat Win Validation Passed!');

// Clean up active turn timer so process exits immediately
if (gm.rooms.get(code).turnTimer) {
  clearTimeout(gm.rooms.get(code).turnTimer);
}

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎲\n');
process.exit(0);
