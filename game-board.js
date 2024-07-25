import { Cell } from "./cell.js";
import { SolutionIterator } from "./solution-iterator.js";

export class GameBoard {
    /** a linear array containing all the 81 cells */
    allCells = [];

    /** an array containing 9 arrays, one for each row */
    allRows = [];

    /** an array containing 9 arrays, one for each column */
    allColumns = [];

    /** an array containing 9 arrays, one for each quadrant */
    allQuadrants = [];

    constructor() {

        for (let col = 1; col <= 9; col++) {
            for (let row = 1; row <= 9; row++) {
                const quadrant = this.computeQuadrant(row, col);
                const cell = new Cell(this, row, col, quadrant);

                this.allCells.push(cell);

                this.allRows[row] = this.allRows[row] || [];
                this.allColumns[col] = this.allColumns[col] || [];
                this.allQuadrants[quadrant] = this.allQuadrants[quadrant] || [];

                this.allRows[row].push(cell);
                this.allColumns[col].push(cell);
                this.allQuadrants[quadrant].push(cell);
            }
        }
    }

    newGame() {
        do {
            this.resetAll();

            this.allCells.forEach(c => {
                const chance = Math.random() * 10;
                if (chance > 1.666) return;
                if (!c.availableValues.length) return;

                const numberToSelect = Math.floor(Math.random() * c.availableValues.length);
                c.trySetValue(c.availableValues[numberToSelect]);
                c.freeze();
            });

        } while (this.solve().nextSolution() !== SolutionIterator.RESULT.foundSolution)
    }

    resetAll() {
        this.allCells.forEach(c => {
            c.reset();
        });
    }

    /**
     *   computes the 1 <= sudoku quadrant <= 9
     *   given a 1 <= row <= 9 and a 1 <= column <= 9
     */
    computeQuadrant(r, c) {
        const qc = Math.floor((r - 1) / 3);
        const qr = Math.floor((c - 1) / 3);
        const q = 3 * qc + qr + 1;
        return q;
    }

    solve() {
        this.allCells.filter(c => !c.isFreezed).forEach(c => c.clear());
        return new SolutionIterator(this.allCells);
    }

    bindToElementId(elementId) {
        const gameBoardElement = document.getElementById(elementId);
        if (!gameBoardElement) {
            console.error("Couldn't find element with id " + elementId);
            return;
        }

        for (let r = 1; r <= 9; r++) {
            for (let c = 1; c <= 9; c++) {
                const cell = document.createElement("div");
                const q = this.computeQuadrant(r, c);
                cell.classList.add(["game-cell"]);
                cell.classList.add(["r" + r]);
                cell.classList.add(["c" + c]);
                cell.classList.add(["q" + q]);

                const ip = document.createElement("input");
                ip.setAttribute("type", "number");
                ip.setAttribute("min", "0");
                ip.setAttribute("max", "9");
                // ip.value = Math.floor( Math.random() * 9 ) + 1;
                ip.sudokuCell = this.allCells.find(sc => sc.row === r && sc.column === c && sc.quadrant === q);
                ip.value = ip.sudokuCell.currentValid;
                ip.sudokuCell.onChanged(suCell => {
                    ip.value = suCell.currentValid;
                    if (suCell.isFreezed) {
                        cell.classList.add(["highlight"]);
                    } else {
                        cell.classList.remove(["highlight"]);
                    }
                });
                ip.addEventListener("change", (ev) => {
                    const sudokuCell = ev.target.sudokuCell;
                    if (!sudokuCell) {
                        console.error("Something bad happened!");
                    }

                    if (!ev.target.value) {
                        sudokuCell.clear();
                        return;
                    }

                    if (!sudokuCell.trySetValue(ev.target.value)) {
                        ev.target.value = sudokuCell.currentValid;
                    }
                });

                cell.appendChild(ip);
                gameBoardElement.appendChild(cell);
            }
        }


        this.resetAll();
    }
}
