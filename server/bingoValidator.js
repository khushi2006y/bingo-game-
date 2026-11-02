/**
 * Bingo Validation Logic
 * Handles line calculation, board validation, and win verification for N x N boards.
 */

/**
 * Validates whether a board configuration is legal for size N.
 * A legal board must have exactly N*N numbers, containing integers 1..N*N without duplicates.
 * 
 * @param {Array<number>} board - 1D array of length N*N representing the grid row-by-row
 * @param {number} size - Board dimension N
 * @returns {boolean}
 */
function isValidBoard(board, size) {
  if (!Array.isArray(board)) return false;
  const totalCells = size * size;
  if (board.length !== totalCells) return false;

  const seen = new Set();
  for (const num of board) {
    const val = Number(num);
    if (!Number.isInteger(val) || val < 1 || val > totalCells) {
      return false;
    }
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
  }

  return seen.size === totalCells;
}

/**
 * Computes completed lines for a given board and list of called numbers.
 * 
 * @param {Array<number>} board - 1D array of length N*N
 * @param {Set<number>|Array<number>} calledNumbers - Numbers called so far
 * @param {number} size - Board dimension N
 * @returns {Object} {
 *   count: number,
 *   linesNeeded: number,
 *   isBingo: boolean,
 *   completedRows: number[],
 *   completedCols: number[],
 *   completedMainDiag: boolean,
 *   completedAntiDiag: boolean,
 *   markedCellIndices: number[]
 * }
 */
function evaluateBoard(board, calledNumbers, size) {
  const calledSet = calledNumbers instanceof Set ? calledNumbers : new Set(calledNumbers);
  const totalCells = size * size;
  const linesNeeded = size; // N lines needed to win (5 for 5x5 classic)

  const completedRows = [];
  const completedCols = [];
  let completedMainDiag = false;
  let completedAntiDiag = false;

  // Track marked cell indices (0 to N*N-1)
  const markedCellIndices = [];
  for (let i = 0; i < totalCells; i++) {
    if (calledSet.has(board[i])) {
      markedCellIndices.push(i);
    }
  }

  // Helper to check cell at row r, col c
  const isMarked = (r, c) => calledSet.has(board[r * size + c]);

  // 1. Check Rows
  for (let r = 0; r < size; r++) {
    let rowFull = true;
    for (let c = 0; c < size; c++) {
      if (!isMarked(r, c)) {
        rowFull = false;
        break;
      }
    }
    if (rowFull) {
      completedRows.push(r);
    }
  }

  // 2. Check Columns
  for (let c = 0; c < size; c++) {
    let colFull = true;
    for (let r = 0; r < size; r++) {
      if (!isMarked(r, c)) {
        colFull = false;
        break;
      }
    }
    if (colFull) {
      completedCols.push(c);
    }
  }

  // 3. Main Diagonal (top-left to bottom-right: r === c)
  let mainDiagFull = true;
  for (let i = 0; i < size; i++) {
    if (!isMarked(i, i)) {
      mainDiagFull = false;
      break;
    }
  }
  if (mainDiagFull) {
    completedMainDiag = true;
  }

  // 4. Anti-Diagonal (top-right to bottom-left: r === size - 1 - c)
  let antiDiagFull = true;
  for (let i = 0; i < size; i++) {
    if (!isMarked(i, size - 1 - i)) {
      antiDiagFull = false;
      break;
    }
  }
  if (antiDiagFull) {
    completedAntiDiag = true;
  }

  const count = completedRows.length +
    completedCols.length +
    (completedMainDiag ? 1 : 0) +
    (completedAntiDiag ? 1 : 0);

  return {
    count,
    linesNeeded,
    isBingo: count >= linesNeeded,
    completedRows,
    completedCols,
    completedMainDiag,
    completedAntiDiag,
    markedCellIndices
  };
}

/**
 * Validates a BINGO claim made by a player.
 * 
 * @param {Array<number>} board - Player's board
 * @param {Set<number>|Array<number>} calledNumbers - Numbers called so far
 * @param {number} size - Board dimension
 * @returns {boolean} True if claim is valid (count >= size)
 */
function validateBingoClaim(board, calledNumbers, size) {
  const result = evaluateBoard(board, calledNumbers, size);
  return result.isBingo;
}

module.exports = {
  isValidBoard,
  evaluateBoard,
  validateBingoClaim
};

