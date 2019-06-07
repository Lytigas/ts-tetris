import { GameState, DOWN, LEFT, RIGHT } from "./GameModel";

export default function createGlobalController(model: GameState) {
    document.addEventListener("keydown", (event) => {
        if (model.isGameOver) {
            return;
        }
        switch (event.key) {
            case "ArrowUp":
            model.rotatePiece(-1);
                break;
            case "ArrowLeft":
                model.handlePieceMovement(LEFT);
                break;
            case "ArrowRight":
                model.handlePieceMovement(RIGHT);
                break;
            case "ArrowDown":
                model.handlePieceMovement(DOWN);
                break;
            case " ":
                model.hardDrop();
                break;
            case "c":
                model.trySwap();
                break;
            default:
                break;
        }
    });
}
