import axios from "axios";
import { getAuthHeader } from "../utils/auth-header";

export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export enum DIRECTIONS {
  LEFT = `Left`,
  RIGHT = `Right`,
  TOP = `Top`,
  DOWN = `Down`,
}

export type Match<T> = {
  matched: T;
  positions: Position[];
};

// ! Q3 (generic)
export type TilePiece<T> = {
  value: T;
  position: Position;
};

export type Board<T> = {
  width: number;
  height: number;
  tilePieces: TilePiece<T>[];
};

export type Effect<T> = {
  kind: string;
  board?: Board<T>;
  match?: Match<T>;
};

export type MatchResult<T> = {
  effects: Effect<T>[];
  tileMatches: TilePiece<T>[];
};

export type MoveResult<T> = {
  board: Board<T>;
  effects: Effect<T>[];
};

const API_URL = "http://localhost:9090/";

/* ---------------------------- API COMMUNICATION --------------------------- */

export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("currentGameId");
}

export function getGames() {
  return axios.get(API_URL + "games", {
    params: {
      ...getAuthHeader(),
    },
  });
}

export async function createGame(userId: number) {
  return axios
    .post(
      API_URL + "games",
      {
        user: {
          id: userId,
        },
      },
      {
        params: {
          ...getAuthHeader(),
        },
      }
    )
    .then((response: any) => {
      if (response.data.id) {
        localStorage.setItem(`currentGameId`, response.data.id);
      }
      return response.data;
    });
}

export function updateGame(id: number, body: any) {
  axios.patch(
    API_URL + `games/${id}`,
    {
      ...body,
    },
    {
      params: {
        ...getAuthHeader(),
      },
    }
  );
}

export function saveGameId(id: number) {
  localStorage.setItem("currentGameId", id.toString());
}

export function clearCurrent() {
  localStorage.removeItem("currentGameId");
}

export async function getGame(id: number) {
  return axios
    .get(API_URL + `games/${id}`, {
      params: {
        ...getAuthHeader(),
      },
    })
    .then((response) => {
      return response.data;
    });
}

/* ----------------------------- GIVEN FUNCTIONS ---------------------------- */

export function create<T>(
  generator: Generator<T>,
  width: number,
  height: number
): Board<T> {
  return {
    width,
    height,
    tilePieces: initialBoardFill(generator, height, width),
  };
}

// ! Q3 (Function and union)
export function tilePiece<T>(board: Board<T>, p: Position): T | undefined {
  if (!isTilePositionNotValid(board, p)) {
    return undefined;
  }
  return findTilePieceOnCertainPosition(board, p)?.value;
}

export function movePossible<T>(
  board: Board<T>,
  originalPosition: Position,
  newPosition: Position
): boolean {
  return isMovePossible(board, originalPosition, newPosition);
}

export function initial<T>(generator: Generator<T>, board: Board<T>) {
  const effects: any = [];
  autoMatch(board, generator, effects);

  return {
    board,
    effects,
  };
}

export function move<T>(
  generator: Generator<T>,
  board: Board<T>,
  originalPosition: Position,
  newPosition: Position
): MoveResult<T> {
  if (isMovePossible(board, originalPosition, newPosition)) {
    switchTilePieces(board, originalPosition, newPosition);
    const effects: any = [];
    autoMatch(board, generator, effects);

    return {
      board,
      effects,
    };
  }

  return {
    board,
    effects: [],
  };
}

/* -------------------------------------------------------------------------- */
/*                          MOVING AND REFILING PART                          */
/* -------------------------------------------------------------------------- */

/* ----------------------- COLUMN MATCHES WITH RECURSTION ---------------------- */

/**
 * Searchs for tileMatches in all rows of the board.
 * @param board the given board
 * @returns tileMatches with all occured effects
 */
function getColumnsToMatch<T>(board: Board<T>): MatchResult<T> {
  let tileMatches: TilePiece<T>[] = [];
  let effects: Effect<T>[] = [];
  for (let i = board.width; i >= 0; i--) {
    const checkedValues: T[] = [];
    const tilePiecesInColumn = getAllTilePiecesInColumn(board, i);
    for (const tilePiece of tilePiecesInColumn) {
      if (!checkedValues.includes(tilePiece.value)) {
        checkedValues.push(tilePiece.value);
        const result = columnNeighbourCheck(board, tilePiece);
        tileMatches = tileMatches.concat(result.tileMatches);
        effects = effects.concat(result.effects);
      }
    }
  }
  return {
    tileMatches,
    effects,
  };
}
/**
 * Searches for tileMatches on the top and bottom of the given tilePiece. And fires event when enabled.
 * @param board
 * @param startPiece the given start tilePiece
 * @returns tileMatches with effects
 */
function columnNeighbourCheck<T>(
  board: Board<T>,
  startTilePiece: TilePiece<T>
): MatchResult<T> {
  const nextTopPosition = findNextTilePiecePosition(
    startTilePiece,
    DIRECTIONS.TOP
  );
  const tilePieceOnNextTopPosition = findTilePieceOnCertainPosition(board, nextTopPosition);
  const topTilePieces = neighourCheck(
    board,
    tilePieceOnNextTopPosition,
    [],
    startTilePiece.value,
    DIRECTIONS.TOP
  );
  const downTilePieces = neighourCheck(
    board,
    findTilePieceOnCertainPosition(
      board,
      findNextTilePiecePosition(startTilePiece, DIRECTIONS.DOWN)
    ),
    [],
    startTilePiece.value,
    DIRECTIONS.DOWN
  );

  if (topTilePieces.length + downTilePieces.length + 1 >= 3) {
    const matchedTilePieces = [...topTilePieces, startTilePiece, ...downTilePieces];
    return generateMatchEffect(matchedTilePieces);
  }

  return {
    effects: [],
    tileMatches: [],
  };
}

function fillBoard<T>(
  board: Board<T>,
  generator: Generator<T>,
  effects: Effect<T>[]
) {
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const foundTilePiece = findTilePieceOnCertainPosition(board, { row, col });
      if (!foundTilePiece) {
        return;
      }
      if (foundTilePiece?.value === undefined) {
        switchTilePiecesInColumn(
          board,
          foundTilePiece.position.row,
          foundTilePiece.position.col
        );
        const result = findTilePieceOnCertainPosition(board, {
          row: 0,
          col: foundTilePiece.position.col,
        });

        if (result) {
          result.value = generator.next();
        }
      }
    }
  }
  effects.push({
    kind: `Refill`,
    board,
  });

  autoMatch(board, generator, effects);
}

function switchTilePiecesInColumn<T>(
  board: Board<T>,
  fromRow: number,
  col: number
): void {
  for (let row = fromRow; row > 0; row--) {
    switchTilePieces(board, { row, col }, { row: row - 1, col });
  }
}

/**
 * Return the position of the next tilePiece based on the given direction and given tilePiece
 * @param currentTilePiece the tilePiece to compare with
 * @param direction the direction to find next tilePiece
 * @returns the postion of the found next tilePiece
 */
function findNextTilePiecePosition<T>(
  currentTilePiece: TilePiece<T>,
  direction: DIRECTIONS
) {
  const position: Position = {
    row: currentTilePiece.position.row,
    col: currentTilePiece.position.col,
  };
  if (direction === DIRECTIONS.DOWN) {
    position.row += 1;
  }

  if (direction === DIRECTIONS.TOP) {
    position.row -= 1;
  }

  if (direction === DIRECTIONS.LEFT) {
    position.col -= 1;
  }

  if (direction === DIRECTIONS.RIGHT) {
    position.col += 1;
  }
  return position;
}

/* ----------------------- ROW MATCHES WITH RECURSTION ---------------------- */

/**
 * Searchs for tileMatches in all rows of the board.
 * @returns the array with all found tileMatches
 */
function getRowsToMatch<T>(board: Board<T>): MatchResult<T> {
  let tileMatches: TilePiece<T>[] = [];
  let effects: Effect<T>[] = [];
  for (let i = 0; i < board.height; i++) {
    const checkedValues: T[] = [];
    const tilePiecesInRow = getAllTilePiecesInRow(board, i);
    for (const tilePiece of tilePiecesInRow) {
      if (!checkedValues.includes(tilePiece.value)) {
        checkedValues.push(tilePiece.value);
        const result = rowNeighbourCheck(board, tilePiece);
        tileMatches = tileMatches.concat(result.tileMatches);
        effects = effects.concat(result.effects);
      }
    }
  }
  return {
    tileMatches,
    effects,
  };
}

/**
 * Searches for tileMatches on the left and right of the given tilePiece. And fires event when enabled.
 * @param startTilePiece the given start tilePiece
 * @returns the empty array or array with all matched tilePieces
 */
function rowNeighbourCheck<T>(
  board: Board<T>,
  startTilePiece: TilePiece<T>
): MatchResult<T> {
  const leftSideTilePieces = neighourCheck(
    board,
    findTilePieceOnCertainPosition(
      board,
      findNextTilePiecePosition(startTilePiece, DIRECTIONS.LEFT)
    ),
    [],
    startTilePiece.value,
    DIRECTIONS.LEFT
  );
  const rightSideTilePieces = neighourCheck(
    board,
    findTilePieceOnCertainPosition(
      board,
      findNextTilePiecePosition(startTilePiece, DIRECTIONS.RIGHT)
    ),
    [],
    startTilePiece.value,
    DIRECTIONS.RIGHT
  );

  if (leftSideTilePieces.length + rightSideTilePieces.length + 1 >= 3) {
    const matchedTilePieces = [
      ...leftSideTilePieces,
      startTilePiece,
      ...rightSideTilePieces,
    ];
    return generateMatchEffect(matchedTilePieces);
  }

  return {
    effects: [],
    tileMatches: [],
  };
}

/**
 * A recursive function that goes to the given direction of the given tilePiece and compares its value.
 * When values are the same it is added to the given array and the process repeats until invalid value or end of the board reached.
 * @param currentTilePiece the current checking tilePiece
 * @param matchingTilePieces the array with all found tileMatches until now
 * @param value the given value to compare with
 * @param checkDirection the checking process direction
 * @returns the array with all found tileMatches
 */
function neighourCheck<T>(
  board: Board<T>,
  currentTilePiece: TilePiece<T> | undefined,
  matchingTilePieces: TilePiece<T>[],
  value: T,
  checkDirection: DIRECTIONS
) {
  if (!currentTilePiece) {
    return matchingTilePieces;
  }
  if (currentTilePiece.value === value) {
    matchingTilePieces.push(currentTilePiece);
    const nextTilePiece = findTilePieceOnCertainPosition(
      board,
      findNextTilePiecePosition(currentTilePiece, checkDirection)
    );
    neighourCheck(board, nextTilePiece, matchingTilePieces, value, checkDirection);
  }
  return matchingTilePieces;
}

/**
 * Searchs for tileMatches in all rows of the board.
 * @returns the array with all found tileMatches
 */
function getAllTilePiecesInRow<T>(board: Board<T>, rowIndex: number) {
  return board.tilePieces.filter((tilePiece) => {
    return tilePiece.position.row === rowIndex;
  });
}

/**
 * Returns all tilePieces for the given column
 * @param columnIndex The column index from which tilePieces will be returned
 * @returns All the tilePieces in the given column
 */
function getAllTilePiecesInColumn<T>(board: Board<T>, columnIndex: number) {
  return board.tilePieces.filter((tilePiece) => {
    return tilePiece.position.col === columnIndex;
  });
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS / UTILS                              */
/* -------------------------------------------------------------------------- */

/**
 * Scans the board to find all tileMatches, removes them and calls a recursive refill function
 */
function autoMatch<T>(
  board: Board<T>,
  generator: Generator<T>,
  effects: Effect<T>[]
): void {
  const rowTilePiecesMatchResults = getRowsToMatch(board);
  const columnTilePiecesMatchResults = getColumnsToMatch(board);
  effects.push(...rowTilePiecesMatchResults.effects);
  effects.push(...columnTilePiecesMatchResults.effects);
  if (rowTilePiecesMatchResults.tileMatches.length || columnTilePiecesMatchResults.tileMatches.length) {
    removeMatchingTilePieces(rowTilePiecesMatchResults.tileMatches, columnTilePiecesMatchResults.tileMatches);
    fillBoard(board, generator, effects);
  }
}

/**
 *
 * @param matchedTilePieces Generates move effect based on given tileTilePieces
 * @returns Generated effect
 */
function generateMatchEffect<T>(matchedTilePieces: TilePiece<T>[]) {
  return {
    effects: [
      {
        kind: `Match`,
        match: {
          matched: { ...matchedTilePieces[0] }.value,
          positions: matchedTilePieces.map((match) => match.position),
        },
      },
    ],
    tileMatches: matchedTilePieces,
  };
}

/**
 * For each matched tilePieces sets value as undefined
 * @param tileMatchesRows matched tilePieces in rows
 * @param tileMatchesColumn matched tilePieces in columns
 */
function removeMatchingTilePieces<T>(
  tileMatchesRows: TilePiece<T>[],
  tileMatchesColumn: TilePiece<T>[]
): void {
  tileMatchesRows.forEach((match: any) => {
    match.value = undefined;
  });
  tileMatchesColumn.forEach((match: any) => {
    match.value = undefined;
  });
}

/**
 * Checks if move is legal according to the game rules
 * @param originalPosition the postion of the originalPosition tilePiece
 * @param newPosition the position of the newPosition tilePiece
 * @returns boolean value based on the move legal state
 */
function isMovePossible<T>(
  board: Board<T>,
  originalPosition: Position,
  newPosition: Position
): boolean {
  if (
    !isTilePositionNotValid(board, originalPosition) ||
    !isTilePositionNotValid(board, newPosition)
  ) {
    return false;
  }
  if (
    originalPosition.col === newPosition.col &&
    originalPosition.row === newPosition.row
  ) {
    return false;
  }

  if (
    originalPosition.col !== newPosition.col &&
    originalPosition.row !== newPosition.row
  ) {
    return false;
  }

  switchTilePieces(board, originalPosition, newPosition);
  const tileMatchesInRows = getRowsToMatch(board);
  const tileMatchesInColumns = getColumnsToMatch(board);
  switchTilePieces(board, originalPosition, newPosition);

  if (!tileMatchesInRows.tileMatches.length && !tileMatchesInColumns.tileMatches.length) {
    return false;
  }
  return true;
}

/**
 * Checks is the given postion is outside of the generated board
 * @param p the given position
 * @returns boolean value based on the check state
 */
function isTilePositionNotValid<T>(board: Board<T>, p: Position): boolean {
  if (p.col >= board.width || p.col < 0) {
    return false;
  }

  if (p.row >= board.height || p.row < 0) {
    return false;
  }
  return true;
}

/**
 * Finds tilePieces on given position and swaps their values based on the fuction patched to tilePieces array
 * @param originalPosition position of the originalPosition tilePiece
 * @param newPosition position of th newPosition tilePiece
 */
function switchTilePieces<T>(board: Board<T>, originalPosition: Position, newPosition: Position) {
  const originalTilePiece = findTilePieceOnCertainPosition(board, originalPosition);
  const newTilePiece = findTilePieceOnCertainPosition(board, newPosition);

  if (!originalTilePiece || !newTilePiece) {
    return;
  }

  const originalIndex = board.tilePieces.indexOf(originalTilePiece);
  const newIndex = board.tilePieces.indexOf(newTilePiece);

  if (!(board.tilePieces as any).swapProperties) {
    (board.tilePieces as any).swapProperties = (
      originalIndex: number,
      newIndex: number,
      propertyToSwap: string
    ) => {
      const originalPieceValue = (board.tilePieces as any)[originalIndex][propertyToSwap];
      const newPieceValue = (board.tilePieces as any)[newIndex][
        propertyToSwap
      ];
      (board.tilePieces as any)[originalIndex][propertyToSwap] = newPieceValue;
      (board.tilePieces as any)[newIndex][propertyToSwap] = originalPieceValue;
    };
  }

  (board.tilePieces as any).swapProperties(originalIndex, newIndex, `value`);
}

function findTilePieceOnCertainPosition<T>(board: Board<T>, position: Position) {
  return board.tilePieces.find((tilePiece) => {
    return (
      tilePiece.position.col === position.col &&
      tilePiece.position.row === position.row
    );
  });
}

/**
 * Fills the board with inital values given by the generator
 */
function initialBoardFill<T>(
  generator: Generator<T>,
  height: number,
  width: number
): TilePiece<T>[] {
  const tilePieces: TilePiece<T>[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      tilePieces.push({
        value: generator.next(),
        position: {
          row,
          col,
        },
      });
    }
  }

  // Monkey patched function to tilePieces object
  (tilePieces as any).swapProperties = (
    originalIndex: number,
    newIndex: number,
    propertyToSwap: string
  ) => {
    const originalTilePieceValue = (tilePieces as any)[originalIndex][propertyToSwap];
    const newTilePieceValue = (tilePieces as any)[newIndex][propertyToSwap];
    (tilePieces as any)[originalIndex][propertyToSwap] = newTilePieceValue;
    (tilePieces as any)[newIndex][propertyToSwap] = originalTilePieceValue;
  };

  return tilePieces;
}