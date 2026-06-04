<script setup>
import { ref, computed } from "vue";

const BOARD_SIZE = 15;
const CELL_SIZE = 32;

const board = ref(createEmptyBoard());
const currentPlayer = ref(1);
const winner = ref(null);
const winningCells = ref([]);

function createEmptyBoard() {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));
}

function resetGame() {
  board.value = createEmptyBoard();
  currentPlayer.value = 1;
  winner.value = null;
  winningCells.value = [];
}

function isWinningMove(row, col, player) {
  const directions = [
    [
      [0, 1],
      [0, -1],
    ], // 水平
    [
      [1, 0],
      [-1, 0],
    ], // 垂直
    [
      [1, 1],
      [-1, -1],
    ], // 对角线
    [
      [1, -1],
      [-1, 1],
    ], // 反对角线
  ];

  for (const [dir1, dir2] of directions) {
    const cells = [[row, col]];

    // 正方向检查
    let r = row + dir1[0];
    let c = col + dir1[1];
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board.value[r][c] === player) {
      cells.push([r, c]);
      r += dir1[0];
      c += dir1[1];
    }

    // 反方向检查
    r = row + dir2[0];
    c = col + dir2[1];
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board.value[r][c] === player) {
      cells.push([r, c]);
      r += dir2[0];
      c += dir2[1];
    }

    if (cells.length >= 5) {
      winningCells.value = cells;
      return true;
    }
  }
  return false;
}

function handleClick(row, col) {
  if (winner.value) return;
  if (board.value[row][col] !== 0) return;

  board.value[row][col] = currentPlayer.value;

  if (isWinningMove(row, col, currentPlayer.value)) {
    winner.value = currentPlayer.value;
  } else {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
  }
}

function isWinningCell(row, col) {
  return winningCells.value.some(([r, c]) => r === row && c === col);
}

const boardStyle = computed(() => ({
  width: `${BOARD_SIZE * CELL_SIZE + 20}px`,
  height: `${BOARD_SIZE * CELL_SIZE + 20}px`,
}));
</script>

<template>
  <div class="gomoku-container">
    <h2 class="game-title">五子棋</h2>

    <div class="game-info">
      <div class="current-player">
        <span>当前玩家:</span>
        <span :class="['player-indicator', { active: !winner }, currentPlayer === 1 ? 'black' : 'white']">
          {{ currentPlayer === 1 ? "黑棋" : "白棋" }}
        </span>
      </div>

      <div v-if="winner" class="winner">
        <span>🎉 获胜者:</span>
        <span :class="['player-indicator', winner === 1 ? 'black' : 'white']">
          {{ winner === 1 ? "黑棋" : "白棋" }}
        </span>
      </div>
    </div>

    <div class="board-container">
      <div class="board" :style="boardStyle">
        <!-- 网格线 -->
        <div class="grid-lines">
          <div v-for="i in BOARD_SIZE" :key="'h' + i" class="horizontal-line" :style="{ top: `${(i - 1) * CELL_SIZE + 10}px` }"></div>
          <div v-for="i in BOARD_SIZE" :key="'v' + i" class="vertical-line" :style="{ left: `${(i - 1) * CELL_SIZE + 10}px` }"></div>
        </div>

        <!-- 棋子 -->
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="cell"
            :style="{
              left: `${colIndex * CELL_SIZE + 10}px`,
              top: `${rowIndex * CELL_SIZE + 10}px`,
            }"
            @click="handleClick(rowIndex, colIndex)"
          >
            <div
              v-if="cell !== 0"
              class="piece"
              :class="[cell === 1 ? 'black-piece' : 'white-piece', isWinningCell(rowIndex, colIndex) ? 'winning' : '']"
            ></div>
          </div>
        </div>

        <!-- 星位点 -->
        <div class="star-points">
          <div class="star" :style="{ left: '120px', top: '120px' }"></div>
          <div class="star" :style="{ left: '360px', top: '120px' }"></div>
          <div class="star" :style="{ left: '120px', top: '360px' }"></div>
          <div class="star" :style="{ left: '360px', top: '360px' }"></div>
          <div class="star" :style="{ left: '240px', top: '240px' }"></div>
        </div>
      </div>
    </div>

    <button class="reset-btn" @click="resetGame">重新开始</button>

    <div class="rules">
      <h3>游戏规则</h3>
      <ul>
        <li>黑棋先行，双方轮流落子</li>
        <li>先将五枚棋子连成一线（横、竖、斜）的一方获胜</li>
        <li>点击棋盘交叉点落子</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

$board-bg: #deb887;
$board-border: #d4a574;
$grid-color: #5d4e37;
$black-piece: #1a1a1a;
$white-piece: #f0f0f0;
$reset-btn: #4caf50;
$reset-btn-hover: #45a049;

.gomoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.game-title {
  font-size: 2rem;
  color: $text-color-primary;
  margin-bottom: $spacing-lg;
}

.game-info {
  display: flex;
  gap: $spacing-xl;
  margin-bottom: $spacing-lg;
  font-size: 1.2rem;
}

.current-player,
.winner {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.player-indicator {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-weight: bold;
}

.player-indicator.black {
  background-color: $black-piece;
  color: $bg-color-page;
}

.player-indicator.white {
  background-color: $white-piece;
  color: $black-piece;
  border: 2px solid $border-color-light;
}

.player-indicator.active {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.board-container {
  background: linear-gradient(145deg, $board-bg, $board-border);
  padding: $spacing-md;
  border-radius: $radius-md;
  @include box-shadow(lg);
}

.board {
  position: relative;
  background-color: $board-bg;
  border-radius: $radius-sm;
}

.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
}

.horizontal-line {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 1px;
  background-color: $grid-color;
}

.vertical-line {
  position: absolute;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background-color: $grid-color;
}

.cell {
  position: absolute;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;

  &:hover::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.2);
  }
}

.piece {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  position: relative;
  z-index: 10;
  @include transition(transform, 0.1s);
}

.black-piece {
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a);
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.white-piece {
  background: radial-gradient(circle at 30% 30%, #ffffff, #d0d0d0);
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.piece.winning {
  animation: winPulse 0.5s ease-in-out infinite;
}

@keyframes winPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
}

.star-points {
  position: absolute;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: $grid-color;
  border-radius: 50%;
}

.reset-btn {
  margin-top: $spacing-lg;
  padding: $spacing-md $spacing-xl;
  font-size: 1rem;
  font-weight: bold;
  color: $bg-color-page;
  background-color: $reset-btn;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  @include transition(background-color, 0.3s);

  &:hover {
    background-color: $reset-btn-hover;
  }
}

.rules {
  margin-top: $spacing-xxl;
  padding: $spacing-xl;
  background-color: $bg-color-base;
  border-radius: $radius-md;
  max-width: 400px;

  h3 {
    margin-top: 0;
    color: $text-color-primary;
  }

  ul {
    margin: 0;
    padding-left: $spacing-lg;
    color: $text-color-regular;
    line-height: 1.8;
  }
}
</style>
