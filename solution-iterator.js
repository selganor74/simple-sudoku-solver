
export class SolutionIterator {

    static RESULT = {
        foundSolution: "found solution",
        noMoreMoves: "no more moves"
    };

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
        this.currentAvailableValues.push([...nextCell.availableValues]);

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

    nextSolution() {
        let toReturn;
        
        do {
            toReturn = this.nextStep();
        } while(toReturn !== SolutionIterator.RESULT.foundSolution && toReturn !== SolutionIterator.RESULT.noMoreMoves);
        
        return toReturn;
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
