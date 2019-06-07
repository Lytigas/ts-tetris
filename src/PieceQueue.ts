import { RIGHT, DOWN, Piece, BOARD_WIDTH, getRasterIndices } from "./GameModel"
import styles from "./style/index.css"
import { GridSquare, getColor } from "./TetrisBoardView";
import _ from "lodash";

function getRandomPiece(): Piece {
    let idx = Math.floor(7 * Math.random());
    return [
        Piece.I,
        Piece.O,
        Piece.T,
        Piece.J,
        Piece.L,
        Piece.S,
        Piece.Z,
    ][idx];
}

export default class PieceQueue {
    readonly root: HTMLDivElement;


    nextPeice: Piece;
    swapPiece: Piece | null;
    hasSwapped: boolean;

    next: Array<GridSquare>
    swap: Array<GridSquare>


    constructor() {
        this.root = document.createElement("div");
        this.root.className = styles.pieceQueue;

        let hdg1 = document.createElement("h4");
        hdg1.textContent = "Swap";
        this.root.insertAdjacentElement('beforeend', hdg1)

        this.swap = new Array(BOARD_WIDTH*4).fill(null);
        let swapTable = document.createElement("table");
        swapTable.className = styles.tetrisBoard;
        for (let row = 0; row < 4; row++) {
            let tr = document.createElement("tr");
            for (let col = 0; col < 4; col++) {
                this.swap[row*BOARD_WIDTH + col] = new GridSquare();
                tr.insertAdjacentElement('beforeend', this.swap[row*BOARD_WIDTH + col].elem);
            }
            swapTable.insertAdjacentElement('beforeend', tr);
        }
        this.root.insertAdjacentElement('beforeend', swapTable);


        let hdg2 = document.createElement("h4");
        hdg2.textContent = "Next";
        this.root.insertAdjacentElement('beforeend', hdg2)

        this.next = new Array(BOARD_WIDTH*4).fill(null);
        let nextTable = document.createElement("table");
        nextTable.className = styles.tetrisBoard;
        for (let row = 0; row < 4; row++) {
            let tr = document.createElement("tr");
            for (let col = 0; col < 4; col++) {
                this.next[row*BOARD_WIDTH + col] = new GridSquare();
                tr.insertAdjacentElement('beforeend', this.next[row*BOARD_WIDTH + col].elem);
            }
            nextTable.insertAdjacentElement('beforeend', tr);
        }
        this.root.insertAdjacentElement('beforeend', nextTable);

        this.nextPeice = getRandomPiece();
        this.swapPiece = null;
        this.rerender();
    }


    getNextPeice() {
        let p = this.nextPeice;
        this.nextPeice = getRandomPiece();
        this.hasSwapped = false;
        this.rerender();
        return p;
    }

    canSwap(): boolean {
        return !this.hasSwapped;
    }

    pieceSwap(p: Piece): Piece {
        this.hasSwapped = true;
        let ret: Piece;
        if (this.swapPiece != null) {
            ret = this.swapPiece;
        } else {
            ret = this.nextPeice;
            this.nextPeice = getRandomPiece();
        }
        this.swapPiece = p;
        this.rerender();
        return ret;
    }

    rerender() {
        let render = (p: Piece, arr: Array<GridSquare>) => {
            let position = RIGHT + DOWN;
            _.range(4).forEach(row => {
                _.range(4).forEach(col => {
                    arr[row*BOARD_WIDTH + col].setColor(null);
                });
            });
            if (p !== null) {
                getRasterIndices(p).map(n => n + position)
                .forEach(n => arr[n].setColor(getColor(p)));
            }
            _.range(4).forEach(row => {
                _.range(4).forEach(col => {
                    arr[row*BOARD_WIDTH + col].rerender();
                });
            });
        }
        render(this.swapPiece, this.swap);
        render(this.nextPeice, this.next);
    }
}
