import styles from "./style/index.css"
import {Piece, BOARD_WIDTH, PLAY_START_IDX, PLAY_END_IDX, BOARD_HEIGHT } from "./GameModel"

enum Color {
    Red,
    Blue,
    Yellow,
    Orange,
    Green,
    Purple,
    DarkBlue,
}

function getClass(c: Color): string {
    switch (c) {
        case Color.Red:
            return styles.Red;
        case Color.Blue:
            return styles.Blue;
        case Color.Yellow:
            return styles.Yellow;
        case Color.Orange:
            return styles.Orange;
        case Color.Green:
            return styles.Green;
        case Color.Purple:
            return styles.Purple;
        case Color.DarkBlue:
            return styles.DarkBlue;
        }
}

export class GridSquare {
    readonly elem: HTMLElement
    private currentColor: Color | null
    private lastRenderedColor: Color | null;
    private isDropTarget: boolean;
    private lastRenderedDropTarget: boolean;

    constructor() {
        this.elem = document.createElement("td");
        this.currentColor = null;
        this.lastRenderedColor = null;
        this.isDropTarget = false;
        this.lastRenderedDropTarget = false;
        this.rerender();
    }

    rerender() {
        if (this.currentColor != this.lastRenderedColor) {
            this.elem.classList.add(getClass(this.currentColor));
            this.elem.classList.remove(getClass(this.lastRenderedColor));
            this.lastRenderedColor = this.currentColor;
        }
        if (this.isDropTarget != this.lastRenderedDropTarget) {
            if (this.isDropTarget) {
                this.elem.classList.add(styles.dropTarget)
            } else {
                this.elem.classList.remove(styles.dropTarget)
            }

            this.lastRenderedDropTarget = this.isDropTarget;
        }
    }

    setColor(c: Color | null) {
        this.currentColor = c;
    }

    setDropTarget(d: boolean) {
        this.isDropTarget = d;
    }
}

export function getColor(p: Piece): Color | null {
    switch (p) {
        case Piece.I:
            return Color.Blue;
        case Piece.O:
            return Color.Yellow;
        case Piece.T:
            return Color.Purple;
        case Piece.J:
            return Color.DarkBlue;
        case Piece.L:
            return Color.Orange;
        case Piece.S:
            return Color.Red;
        case Piece.Z:
            return Color.Green;
        default:
            return null;
    }
}

export default class TetrisBoard {
    readonly root: HTMLElement;
    private board: Array<GridSquare>

    constructor() {
        this.board = new Array(BOARD_WIDTH*BOARD_HEIGHT).fill(null);
        for (let i = PLAY_START_IDX; i <= PLAY_END_IDX; i++) {
            for (let j = 1; j <= 10; j++) {
                let idx = i*BOARD_WIDTH + j;
                this.board[idx] = new GridSquare();
            }
        }
        this.root = document.createElement("table");
        this.root.className = styles.tetrisBoard;
        for (let row = PLAY_START_IDX; row <= PLAY_END_IDX; row++) {
            let tr = document.createElement("tr");
            for (let col = 1; col <= 10; col++) {
                tr.insertAdjacentElement('beforeend', this.board[row*BOARD_WIDTH + col].elem);
            }
            this.root.insertAdjacentElement('beforeend', tr);
        }
    }

    forEachSquare(fn: (sq: GridSquare, idx: number) => void) {
        for (let row = PLAY_START_IDX; row <= PLAY_END_IDX; row++) {
            for (let col = 1; col <= 10; col++) {
                let idx = row*BOARD_WIDTH + col;
                console.assert(this.board[idx] !== null, "NULL SQUARE HIT IN NON-NULL SLOT")
                fn(this.board[idx], idx);
            }
        }
    }

    dropTarget(sqs: number[]) {
        this.forEachSquare((sq) => sq.setDropTarget(false));
        sqs.forEach(element => {
            this.board[element].setDropTarget(true);
        });
    }

    drawBoard(board: Piece[]) {
        this.forEachSquare((sq, idx) => {
            sq.setColor(getColor(board[idx]));
        });
    }

    drawPiece(p: Piece, sqs: number[]) {
        sqs.forEach((sq) => this.board[sq].setColor(getColor(p)));
    }

    doRender() {
        this.forEachSquare((sq) => sq.rerender())
    }

    showGameOverScreen() {
        let splash = document.createElement("div");
        splash.className = styles.gameOverSplash;

        let txt = document.createElement("div");
        txt.textContent = "Game Over.";
        splash.insertAdjacentElement("beforeend", txt);

        let btn = document.createElement("button");
        btn.addEventListener('click', () => location.reload());
        btn.textContent = "Play Again"
        splash.insertAdjacentElement("beforeend", btn);

        this.root.insertAdjacentElement("beforeend", splash);
    }
}
