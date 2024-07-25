export class Cell {

    row = 0;
    column = 0;
    quadrant = 0;

    selector = "";

    __currentValid = "";
    get currentValid() { return this.__currentValid; }
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
        this.__onChangedHandlers.push(handler);
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
            return;

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
