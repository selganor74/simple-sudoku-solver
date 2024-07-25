import { GameBoard } from "./game-board.js";
import { SolutionIterator } from "./solution-iterator.js";

const game = new GameBoard();
game.bindToElementId("game-board");
// game.newGame();

let iterator = game.solve();

const output = document.getElementById("output");
document.getElementById("solve-btn").addEventListener("click", (ev) => {
    ev.target.disabled = true;
    const step = () => {
        const stepResult = iterator.nextStep();
        output.innerHTML = "<p>" + stepResult + "</p>" + output.innerHTML;

        if (stepResult === SolutionIterator.RESULT.foundSolution || stepResult === SolutionIterator.RESULT.noMoreMoves) {
            ev.target.disabled = false;
            return;
        }

        setTimeout(() => step(), 0)
    }
    setTimeout(() => step(), 0);
});

document.getElementById("new-game-btn").addEventListener("click", () => {
    game.newGame();
    iterator = game.solve();
    output.innerHTML = "";
})