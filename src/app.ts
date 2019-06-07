import TetrisBoard from "./TetrisBoardView";
import { GameState } from "./GameModel";
import createController from "./Controller"
import Scoring from "./ScoringWidget";
import styles from "./style/index.css"
import PieceQueue from "./PieceQueue";

function main() {
    let container = document.createElement("div");
    container.className = styles.AppContainer;
    document.body.insertAdjacentElement("afterbegin", container);

    let boardView = new TetrisBoard();
    container.insertAdjacentElement('afterbegin', boardView.root);

    let sidebar = document.createElement("div");
    container.insertAdjacentElement("beforeend", sidebar);

    let q = new PieceQueue();
    sidebar.insertAdjacentElement('beforeend', q.root);

    let scoring = new Scoring();
    sidebar.insertAdjacentElement('beforeend', scoring.root);

    let model = new GameState(boardView, scoring, q);
    createController(model);
    model.rerender();
    model.kickoffGameLoop();
}
window.onload = main
