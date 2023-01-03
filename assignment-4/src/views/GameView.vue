<template>
  <div>
    <h4>Game</h4>
    <button v-if="!board" @click="showBoard" class="btn btn-primary">Generate game</button>
    <div v-if="board">
      <div class="text-center">
        <div>Score: {{score}}</div>
        <div>Remaining moves: {{maxMoves - currentMove}}</div>
        <button @click="showBoard" class="btn btn-primary">Reset game</button>
      </div>
      <table class="mx-auto position-relative">
        <tbody>
            <tr v-for="(row, index) in getRows()" :key="'row'+index">
              <td v-for="(tilePiece, index) in row" :key="'tilePiece'+index" @click="selectTilePiece(tilePiece)" :class="isSelectedTilePiece(tilePiece) ? 'tilePiece-selected' : ''" class="tilePiece" :style="'background-color:'+tilePiece.value"></td>
            </tr>
        </tbody>
        <div v-if="completed" class="endgame">
            <div>Oops! You ran out of moves. Score: {{score}}</div>
            <div>
            <button @click="showBoard" class="btn btn-primary">Try again</button>    
            </div>
        </div>
      </table>
    </div>
    <div>
      <button v-if="selectedTilePiece" @click="resetMove" class="btn btn-secondary">Reset move</button>
    </div>
  </div>
</template>

<script>
  import { create, initial, movePossible, move, updateGame, createGame, saveGameId, getGame } from '@/services/game.service'
  import { RandomColorGenerator } from '@/utils/generator'

  export default {
    data() {
      return {
        // rows: [],
        selectedTilePiece: undefined,
        board: undefined,
        generator: undefined,
        score: 0,
        currentMove: 0,
        maxMoves: 7,
        completed: false,
        gameId: undefined,
      }
    },
    methods: {
      async showBoard() {
        this.emptyBoard()
        const initBoard = create(this.generator, 4, 4);
        this.board = initial(this.generator, initBoard).board;

        const result = await createGame(JSON.parse(localStorage.getItem(`user`)).userId);
        updateGame(result.id, { board: this.board });
        saveGameId(result.id);
        this.gameId = result.id; 
      },
      selectTilePiece(tilePiece) {
        if(!this.selectedTilePiece) {
          this.selectedTilePiece = tilePiece;
          updateGame(this.gameId, { firstSelectedItem: tilePiece });
          return;
        }

        if (!movePossible(this.board, this.selectedTilePiece.position, tilePiece.position)) {
          return;
        }

        const result = move(this.generator, this.board, this.selectedTilePiece.position, tilePiece.position);

        const tileMatches = result.effects.filter((effect) => {
        return effect.kind === `Match`;
        });

        tileMatches.forEach(() => {
            this.score += 17;
        })
        this.board = result.board;
        this.selectedTilePiece = undefined;
        this.currentMove += 1;

        updateGame(this.gameId, {
          score: this.score,
          board: this.board,
          firstSelectedItem: null,
          currentMove: this.currentMove,
        });

        if (this.currentMove === this.maxMoves) {
          this.endGame();
        }
      },
      isSelectedTilePiece(tilePiece) {
        return this.selectedTilePiece?.position.col === tilePiece.position.col && this.selectedTilePiece?.position.row === tilePiece.position.row;  
      },
      getRows() {
        const rows = [];
        for (let i = 0; i < this.board.tilePieces.length; i +=  this.board.width) {
            rows.push(this.board.tilePieces.slice(i, i +  this.board.width));
        }
        return rows;
      },
      endGame() {
          this.completed = true;
          updateGame(this.gameId, { completed: true });
      },
      emptyBoard() {
        this.board = undefined;
        this.currentMove = 0;
        this.completed = false;
        this.score = 0;
        this.rows = [];
      },
      resetMove() {
        this.selectedTilePiece = undefined;
        updateGame(this.gameId, { firstSelectedItem: undefined });
      }
    },
    beforeMount() {
      this.generator = new RandomColorGenerator();
      if (localStorage.getItem(`currentGameId`)) {
        getGame(localStorage.getItem(`currentGameId`)).then((game) => {
          this.board = game.board;
          this.score = game.score;
          this.gameId = game.id;
          this.currentMove = game.currentMove;
          this.selectedTilePiece = game.firstSelectedItem;
          this.completed = game.completed;
        });
      }
    },
  }
</script>
<style>
  .tilePiece {
    width: 100px;
    height: 100px;
    border: 1px solid black;
    cursor: pointer;
  }

  .tilePiece-selected {
    border: 5px solid black;
  }

  .endgame {
    background-color: white;
    border-radius: 6px;
    padding: 10px;
    position: absolute;
    margin-left: 55px;
    border: 1px solid black;
  }

  .game-box {
    width: 401px;
    position: relative;
  }

  .title {
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
}

</style>
