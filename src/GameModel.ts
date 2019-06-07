import _ from "lodash";
import TetrisBoard from "./TetrisBoardView";
import Scoring from "./ScoringWidget";
import PieceQueue from "./PieceQueue";

export enum Piece {
    I,
    O,
    T,
    J,
    L,
    S,
    Z,
    Boundary,
    Empty,
}


export function getRasterIndices(p: Piece): number[] {
    switch (p) {
    case Piece.I:
        return [LEFT, 0, RIGHT, 2*RIGHT];
    case Piece.O:
        return [0, RIGHT, DOWN, DOWN+RIGHT];
    case Piece.T:
        return [LEFT, 0, RIGHT, DOWN];
    case Piece.J:
        return [UP, 0, DOWN, DOWN+LEFT];
    case Piece.L:
        return [UP, 0, DOWN, DOWN+RIGHT];
    case Piece.S:
        return [LEFT + DOWN, DOWN, 0, RIGHT];
    case Piece.Z:
        return [RIGHT + DOWN, DOWN, 0, LEFT];
    default:
        throw "UNREACHABLE";
    }
}

export function rotateCoordinate(n: number, rots: number): number {
    rots = ((rots % 4) + 4) % 4;
    let col = n % 12;
    if (col > 6) {
        col -= 12;
    } else if (col < -6) {
        col += 12;
    }
    let row = Math.round(n / 12);
    switch (rots) {
        case 0:
            return n;
        case 1:
            return row + -col*12;
        case 2:
            return -col + -row*12;
        case 3:
            return -row + col*12;
        default:
            throw "UNREACHABLE"
    }
}

export const DOWN = 12;
export const UP = -12;
export const LEFT = -1;
export const RIGHT = 1;
export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 23;
export const PLAY_START_IDX = 2;
export const PLAY_END_IDX = 21;
const STARTING_PIECE_POS = RIGHT * 5 + DOWN;
// represents the game in one tick of play
export class GameState {
    placedPieces: Array<Piece | null>;
    fallingPiece: Piece;
    fallingPiecePosition: number;
    fallingPieceRotation: number;
    tickDelayMs: number;
    loopHandle: number | null;
    isGameOver: boolean;
    scoring: Scoring;
    q: PieceQueue;
    view: TetrisBoard;

    constructor(view: TetrisBoard, scoring: Scoring, q: PieceQueue) {
        this.fallingPiece = q.getNextPeice();
        this.fallingPiecePosition = STARTING_PIECE_POS;
        this.fallingPieceRotation = 0;
        this.placedPieces = _.cloneDeep(STARTING_BOARD);
        this.loopHandle = null;
        this.isGameOver = false;
        this.scoring = scoring;
        this.q = q;
        this.view = view;
    }

    kickoffGameLoop() {
        this.loopHandle = setTimeout(() => this.gameLoop(), 0);
    }

    private gameLoop() {
        this.handleInevitableDrop();
        if (!this.isGameOver) {
            this.loopHandle = setTimeout(() => this.gameLoop(), this.scoring.dropDelay());
        }
    }

    handleInevitableDrop() {
        let nextPosition = this.fallingPiecePosition + DOWN;
        let isValidNext =
        getRasterIndices(this.fallingPiece)
        .map((n) => nextPosition + rotateCoordinate(n, this.fallingPieceRotation))
        .every((i) => this.placedPieces[i] === Piece.Empty)
        if (!isValidNext) {
            this.hardDrop(); // extra CPU but whatever tbh
            return;
        }
        this.fallingPiecePosition += DOWN;
        this.rerender();
    }

    solveHardDropPositions(): number[] {
        let searchPosition = this.fallingPiecePosition + DOWN;
        let indices = getRasterIndices(this.fallingPiece)
        .map((n) => searchPosition + rotateCoordinate(n, this.fallingPieceRotation));
        while (true) {
            let isValidPosition =
            indices
            .every((i) => this.placedPieces[i] === Piece.Empty)
            if (!isValidPosition) {
                break;
            }
            indices = indices.map(pos => pos + DOWN);
        }
        indices = indices.map(pos => pos - DOWN);
        return indices;
    }

    hardDrop() {
        let locations = this.solveHardDropPositions();
        locations.forEach((idx) => this.placedPieces[idx] = this.fallingPiece);
        if (locations.some(pos => Math.trunc(pos / 12) < PLAY_START_IDX)) {
            this.rerender();
            this.handleGameOver();
            return;
        }
        this.doLineClearing();
        this.getNextPiece();
        this.rerender();
    }

    handleGameOver() {
        this.isGameOver = true;
        clearTimeout(this.loopHandle);
        this.view.showGameOverScreen();
    }

    getNextPiece() {
        this.fallingPiece = this.q.getNextPeice();
        this.fallingPiecePosition = STARTING_PIECE_POS;
        this.fallingPieceRotation = 0;
    }

    trySwap() {
        if (this.q.canSwap()) {
            this.fallingPiece = this.q.pieceSwap(this.fallingPiece);
            let col = this.fallingPiecePosition % 12;
            this.fallingPiecePosition = Math.floor(STARTING_PIECE_POS / 12) + col;
            this.fallingPieceRotation = 0;
            this.rerender()
        }
    }

    handlePieceMovement(direction: number) {
        let oldPosition = this.fallingPiecePosition;
        switch (direction) {
            case DOWN:
                this.handleInevitableDrop();
                return;
            case LEFT:
                this.fallingPiecePosition += LEFT;
                break;
            case RIGHT:
                this.fallingPiecePosition += RIGHT;
                break;
            default:
                return;
        }
        this.movePieceInBounds();
        if (this.isPieceColliding()) {
            this.fallingPiecePosition = oldPosition;
        }
        this.rerender();
    }

    rotatePiece(direction: number) {
        if (this.fallingPiece === Piece.O) {
            return;
        }
        let oldRot = this.fallingPieceRotation;
        let oldPos = this.fallingPiecePosition;
        this.fallingPieceRotation += direction;

        this.movePieceInBounds();
        if (this.isPieceColliding()) {
            this.fallingPieceRotation = oldRot;
            this.fallingPiecePosition = oldPos;
        }
        this.rerender();
    }

    isPieceColliding(): boolean {
        return !(getRasterIndices(this.fallingPiece)
        .map((n) => this.fallingPiecePosition + rotateCoordinate(n, this.fallingPieceRotation))
        .every((i) => this.placedPieces[i] === Piece.Empty))
    }

    // if the falling piece is out of bounds, recenter it
    // called after rotation or left / right movement
    // returns if movement was performed
    movePieceInBounds(): boolean {
        let didMoveFlag = false;
        let indices = getRasterIndices(this.fallingPiece)
        .map(n => this.fallingPiecePosition + rotateCoordinate(n, this.fallingPieceRotation));
        let outOfBoundsLeft = indices.some(pos => pos % 12 < 1);
        let outOfBoundsRight = indices.some(pos => pos % 12 > 10);
        if (outOfBoundsLeft && outOfBoundsRight) {
            // I piece edge rotation edge case
            let direction = this.fallingPiecePosition % 12 > 6 ? LEFT : RIGHT;
            this.fallingPiecePosition += direction * 2;
        } else if (outOfBoundsRight) {
            this.fallingPiecePosition += LEFT;
            didMoveFlag = true;
        } else if (outOfBoundsLeft) {
            this.fallingPiecePosition += RIGHT;
            didMoveFlag = true;
        }
        // special I piece edge case
        let outOfBoundsUp = indices.some(pos => pos < 0);
        if (outOfBoundsUp) {
            this.fallingPiecePosition += DOWN;
            didMoveFlag = true;
        }
        return didMoveFlag;
    }

    doLineClearing() {
        let rowToClear = PLAY_END_IDX;
        let numCleared = 0;
        while (rowToClear >= PLAY_START_IDX) {
            let isFull = _.range(10)
            .map(n => n + rowToClear*BOARD_WIDTH + RIGHT)
            .map(n => this.placedPieces[n])
            .every(p => p !== Piece.Empty);
            if (!isFull) {
                rowToClear--;
                continue;
            }
            numCleared++;
            for (let row = rowToClear; row > 0; row--) {
                for (let col = 1; col <= 10; col++) {
                    this.placedPieces[row*BOARD_WIDTH + col] = this.placedPieces[(row-1)*BOARD_WIDTH + col];
                }
            }
        }
        this.scoring.updateScore(numCleared);
    }

    rerender() {
        this.view.drawBoard(this.placedPieces);
        this.view.drawPiece(
            this.fallingPiece,
            getRasterIndices(this.fallingPiece)
            .map((n) => this.fallingPiecePosition + rotateCoordinate(n, this.fallingPieceRotation))
            .filter(n => Math.trunc(n/12) >= PLAY_START_IDX)
        );
        this.view.dropTarget(this.solveHardDropPositions().filter(n => Math.trunc(n/12) >= PLAY_START_IDX));
        this.view.doRender();
    }
}


const STARTING_BOARD: Piece[] =
[
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Boundary,
    Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary, Piece.Boundary,
];
