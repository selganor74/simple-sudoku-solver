class Cell {

    row = 0;
    column = 0;
    quadrant = 0;

    selector = "";

    __currentValid = "";
    get currentValid() { return this.__currentValid }
    set currentValid(value) {
        if (value === this.__currentValid) return;
        this.__currentValid = value;
        this.__onChangedHandlers.forEach(h => h(this));
    }

    availableValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    __isFreezed = false;
    get isFreezed() { return this.__isFreezed; }
    set isFreezed(value) {
        if (value === this.__isFreezed) return;
        this.__isFreezed = value;
        this.__onChangedHandlers.forEach(h => h(this));
    }

    __allLinkedCells = [];
    get allLinkedCells() {
        if (this.__allLinkedCells.length) return this.__allLinkedCells;

        const cellsInRow = this.gameBoard.allRows[this.row];
        const cellsInColumn = this.gameBoard.allColumns[this.column];
        const cellsInQuadrant = this.gameBoard.allQuadrants[this.quadrant];
        [...cellsInRow, ...cellsInColumn, ...cellsInQuadrant].forEach(c => {
            if (this.__allLinkedCells.includes(c))
                return;

            this.__allLinkedCells.push(c);
        });
        return this.__allLinkedCells;
    };

    __onChangedHandlers = [];
    onChanged(handler) {
        if (!handler) return;
        this.__onChangedHandlers.push(handler)
    }

    constructor(gBoard, row, column, quadrant) {
        this.gameBoard = gBoard;
        this.row = row;
        this.column = column;
        this.quadrant = quadrant;

        this.selector = ".r" + row + " .c" + column + " .q" + quadrant;
    }

    reset() {
        this.clear();
        this.isFreezed = false;
        this.availableValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    }

    /** clears the cell value */
    clear() {
        const oldValid = this.currentValid;

        this.currentValid = "";

        if (oldValid) {
            this.allLinkedCells.forEach(c => {
                c.addToAvailables(oldValid);
            });
        }
    }

    trySetValue(value) {
        if (!this.availableValues.includes(value)) {
            console.log("trySetValue: Can't set " + this.selector + " to " + value + " because it's not in availableValue list ", this.availableValues);
            return false;
        }

        // Once everything works fine, this check can be skipped
        // as the availableValues are constantly kept in sync.
        //
        // if (!this.valueExistsInLinkedCell(value)) {
        //     console.log("Cell.trySetValue: Can't set " + this.selector + " to " + value + " because cell is set somewhere else");
        //     return false;
        // }

        // Clear also restores the old value to the availables, if needed
        this.clear();

        // Every check has succeded. 
        // Let's remove the value from other cells' availableValues
        this.allLinkedCells.forEach(c => {
            c.removeFromAvailable(value);
        });

        this.currentValid = value;
        return true;
    }

    addToAvailables(value) {
        if (this.isFreezed)
            return;

        if (this.availableValues.includes(value)) {
            // console.warn("Can't add " + value + " to " + this.selector + " availableValues because it's already there!", this.availableValues);
            return;
        }

        if (!this.valueExistsInLinkedCell(value)) {
            // the value is blocked by some other cell, so we can't set it to available!
            console.log("Cell.trySetValue: Can't add " + value + " to " + this.selector + " availables because of some cell blocking it");
            return;
        }

        this.availableValues.push(value);
        this.availableValues.sort((a, b) => a < b ? -1 : 1);
    }

    removeFromAvailable(value) {
        if (this.isFreezed)
            return

        const position = this.availableValues.findIndex(v => v === value);
        if (position === -1) {
            // console.warn("Can't remove " + value + " from availableValues of " + this.selector + " as it is not present! ", this.availableValues);
            return;
        }

        this.availableValues.splice(position, 1);
    }


    /** returns true if check succedes and no linked cell is set to the required value */
    valueExistsInLinkedCell(value) {
        let someCellsWithSameValueFound = false;

        this.allLinkedCells.filter(c => c !== this).forEach(c => {
            someCellsWithSameValueFound = someCellsWithSameValueFound || (c.currentValid == value);
            if (c.currentValid == value)
                console.log(this.selector + ": value " + value + " found in " + c.selector);
        });

        return !someCellsWithSameValueFound;
    }

    freeze() {
        this.availableValues = [];
        this.isFreezed = true;
    }
}

class GameBoard {
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
        this.resetAll();

        this.allCells.forEach(c => {
            const chance = Math.random() * 10;
            if (chance > 1.666) return;
            if (!c.availableValues.length) return;

            const numberToSelect = Math.floor(Math.random() * c.availableValues.length);
            c.trySetValue(c.availableValues[numberToSelect]);
            c.freeze();
        })
        console.log(
            this.allCells.filter(c => !c.freezed)
                .every(c => c.availableValues.length >= 1)
        );
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
                    ip.value = suCell.currentValid
                    if (suCell.isFreezed) {
                        cell.classList.add(["highlight"]);
                    } else {
                        cell.classList.remove(["highlight"]);
                    }
                });
                ip.addEventListener("change", (ev) => {
                    const newValue = ev.target.value;

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

class SolutionIterator {

    static RESULT = {
        foundSolution: "found solution",
        noMoreMoves: "no more moves"
    }

    /** all the cells we can set of the game (no freezed!) */
    allUnfreezedCells = [];

    /** an array of arrays containing the cells to complete the solution */
    remainingStack = [];

    /** the current cell foreach remaining stack */
    currentStack = [];

    /** an array of arrays containing the values "to try" for the current cell */
    currentAvailableValues = [];

    get stackIndex() { return this.currentStack.length - 1; };

    constructor(allCells) {
        this.allUnfreezedCells.push(...allCells);
        this.allUnfreezedCells = this.allUnfreezedCells.filter(c => !c.isFreezed);

        this.pushOneDepthLevel(this.allUnfreezedCells);
    }

    /** returns true if there il lastLevelRemaining has elements */
    pushOneDepthLevel(lastLevelRemaining) {
        /** copies the input array to avoid modifications of the original */
        const remaining = [...lastLevelRemaining];
        if (!remaining.length)
            return false;

        /** starts with those that have less valid values */
        remaining.sort((a, b) => a.availableValues.length - b.availableValues.length);

        const nextCell = remaining.shift();

        this.remainingStack.push(remaining);
        this.currentStack.push(nextCell);
        this.currentAvailableValues.push([...nextCell.availableValues])

        return true;
    }

    popOneDepthLevel() {
        this.remainingStack.pop();
        this.currentStack.pop();
        this.currentAvailableValues.pop();
    }

    get currentCell() {
        return this.currentStack[this.stackIndex];
    }

    get availableValuesForCurrentCell() {
        return this.currentAvailableValues[this.stackIndex];
    }

    getNextValueForCurrentCell() {
        return this.availableValuesForCurrentCell.shift();
    }

    nextStep() {
        if (this.stackIndex === -1)
            return SolutionIterator.RESULT.noMoreMoves;

        const nextValue = this.getNextValueForCurrentCell();
        if (!nextValue) {
            // we exhausted all the tries for this stack level,
            // we need to back track!
            this.currentCell.clear();

            const message = "(" + this.stackIndex + ") cleared " + this.currentCell.selector + " cell and backtracking because of exhausted tries at depth level " + (this.stackIndex + 1);

            this.popOneDepthLevel();

            return message;
        }

        const result = this.currentCell.trySetValue(nextValue);
        if (!result) throw new Error("Can'set value on cell this can't happen !!!");
        const previousCell = this.currentCell;

        const hasMore = this.pushOneDepthLevel(this.remainingStack[this.stackIndex]);
        if (!hasMore) {
            // We reached the last cell of the game.
            // We cannot add another level of depth
            // We should check if the sudoku is solved !
            if (this.allUnfreezedCells.every(c => c.currentValid)) {
                return SolutionIterator.RESULT.foundSolution;
            }
            return "last level of depth reached. Sudoku not solved!";
        }

        return "(" + this.stackIndex + ") set " + previousCell.currentValid + " in " + previousCell.selector;
    }
}

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

        requestAnimationFrame(() => step())
    }
    requestAnimationFrame(() => step());
});

document.getElementById("new-game-btn").addEventListener("click", () => {
    game.newGame();
    iterator = game.solve();
    output.innerHTML = "";
})