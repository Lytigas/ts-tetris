import styles, { ScoringWidget } from "./style/index.css"

export default class Scoring {
    readonly root: HTMLDivElement;
    readonly scoreElem: HTMLDivElement;
    readonly levelElem: HTMLDivElement;
    readonly linesElem: HTMLDivElement;
    score: number;
    lines: number;
    level: number;

    constructor() {
        this.root = document.createElement("div");
        this.root.className = styles.ScoringWidget;

        this.scoreElem = document.createElement("div");
        this.root.insertAdjacentElement('beforeend', this.scoreElem);
        this.linesElem = document.createElement("div");
        this.root.insertAdjacentElement('beforeend', this.linesElem);
        this.levelElem = document.createElement("div");
        this.root.insertAdjacentElement('beforeend', this.levelElem);

        this.score = 0;
        this.level = 0;
        this.lines = 0;
        this.rerender();
    }

    updateScore(linesCleared: number) {
        this.lines += linesCleared;
        this.score += [0, 40, 100, 300, 1200][linesCleared]*(this.level+1);
        this.level = Math.floor(this.lines / 10);
        this.rerender();
    }

    rerender() {
        this.scoreElem.textContent = "Score: " + this.score;
        this.linesElem.textContent = "Lines: " + this.lines;
        this.levelElem.textContent = "Level: " + this.level;
    }

    dropDelay() {
        return Math.max(1000 - this.level * 75, 100);
    }
}
