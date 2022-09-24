const readline = require("readline");
const chalk = require("chalk");

const validWord = /^[a-zA-Z]+$/i;

const getWords = () => {
    return new Promise((resolve) => {
        const words = [];
        let longest = 0;
        let lineNumber = 0;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.on("line", (line) => {
            lineNumber++;
            if (lineNumber == 1) { longest = line; }
            else {
                if (validWord.test(line)) {
                    if (line.length > longest) {
                        longest = line.length;
                    }
                    words.push(line);
                } else {
                    console.log(chalk.red("Invalid word", line, "on line", lineNumber));
                    process.exit(1);
                }
            }
        });
        rl.on("close", () => {
            if (words.length === 0) {
                console.log(
                    chalk.red("No words parsed, check your input and try again.")
                );
                process.exit(1);
            }
            resolve([words, longest]);
        });
    });
};

const makeGrid = (gridSize) => {
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = " ";
        }
    }
    return grid;
};

const makeLettersOf = (words) => {
    const lettersOf = words.reduce((lettersOf, word) => {
        lettersOf[word] = Array.from(word);
        return lettersOf;
    }, {});
    return lettersOf;
};

// Define helper functions that map rows and columns to a position in the grid
// We will call these functions when looping over a word, placing each letter in the grid at the returned position [row, col]
const horizontal = ([row, col], i) => [row + 0, col + i];
const vertical = ([row, col], i) => [row + i, col + 0];
const diagonal = ([row, col], i) => [row + i, col + i];
const mirrorDiagonal = ([row, col], i) => [row + i, col - i];
const reversedHorizontal = ([row, col], i, wLen) => [row + 0, col + (wLen - 1) - i];
const reversedvertical = ([row, col], i, wLen) => [row + (wLen - 1) - i, col + 0];

// Define criteria for words to be placed in a certain direction
// A word fits in a certain direction if it won't overflow the grid
const fitsHorizontal = (gridSize, startColumn, wordLength) =>
    gridSize - startColumn >= wordLength;

const fitsVertical = (gridSize, startRow, wordLength) =>
    gridSize - startRow >= wordLength;

const fitsDiagonal = (gridSize, startRow, startColumn, wordLength) =>
    fitsHorizontal(gridSize, startColumn, wordLength) &&
    fitsVertical(gridSize, startRow, wordLength);

const fitsMirrorDiagonal = (gridSize, startRow, startColumn, wordLength) =>
    fitsVertical(gridSize, startRow, wordLength) && startColumn - wordLength >= 0;

const letterCanExistAtPosition = (grid, position, letter) => {
    const [row, col] = position;
    return grid[row][col] === " " || grid[row][col] === letter;
};



const mapPositionsForWord = (grid, gridSize, startPosition, word, lettersOf) => {
    const [row, col] = startPosition;
    const positionsArr = [
        (fitsHorizontal(gridSize, col, word.length) && [horizontal, 'horizontal']),
        (fitsVertical(gridSize, row, word.length) && [vertical, 'vertical']),
        (fitsDiagonal(gridSize, row, col, word.length) && [diagonal, 'diagonal']),
        (fitsMirrorDiagonal(gridSize, row, col, word.length) && [mirrorDiagonal, 'mirror diagonal']),
        (fitsHorizontal(gridSize, col, word.length) && [reversedHorizontal, 'reversed horizontal']),
        (fitsVertical(gridSize, row, word.length) && [reversedvertical, 'reversed vertical']),
    ];
    let [indexToPosition, layoutName] = (() => {
        let positionsCopy = [...positionsArr].map(fitFn => (() => fitFn));
        const getRandomLayout = [...Array(positionsCopy.length)]
            .map(l => {
                const fnIdx = random(0, positionsCopy.length - 1);
                const result = positionsCopy[fnIdx];
                positionsCopy = positionsCopy.filter((_, i) => i !== fnIdx);
                return result;
            }).find((fn, i) => fn());
        return getRandomLayout && getRandomLayout();
    })();

    if (typeof indexToPosition === "function") {
        const letters = lettersOf[word];
        const positions = letters.reduce((positions, letter, i) => {
            if (positions) {
                //! console.log('\nPOSITION === >>> ', startPosition, i);
                //! console.log('\nPOSITION === >>> ', indexToPosition);
                const position = indexToPosition(startPosition, i, word.length);
                if (letterCanExistAtPosition(grid, position, letter)) {
                    return positions.concat([position]);
                }
            }
            return false;
        }, []);
        return [positions, layoutName.slice()];
    }
    return false;
};

// Define a little helper function to produce a random integer.
const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const insertWordIntoGrid = (grid, positions, word, lettersOf) => {
    const letters = lettersOf[word];
    letters.forEach((letter, i) => {
        const [row, col] = positions[i];
        grid[row][col] = letter.toUpperCase();
    });
};

const placeWords = (grid, gridSize, words, lettersOf) => {
    // Limit the number of times we can attempt to randomly place a word
    const maxAttempts = gridSize * gridSize;
    let hints = words instanceof Array &&
        words.map(w => ({ word: w, pos: { x: '', y: '' }, layout: '' }));
    for (const word of words) {
        let attempts = 0;
        const crrHint = hints.find(h => h.word === word);

        while (attempts <= maxAttempts) {
            // Pick random row and col to place this word
            const row = random(0, gridSize - 1);
            const col = random(0, gridSize - 1);
            const startPosition = [row, col];

            const [positions, layoutName = ''] = mapPositionsForWord(
                grid,
                gridSize,
                startPosition,
                word,
                lettersOf
            );

            if (positions) {
                insertWordIntoGrid(grid, positions, word, lettersOf);
                if (crrHint) {
                    const [row, col] = positions[0];
                    crrHint.pos.x = row;
                    crrHint.pos.y = col;
                    crrHint.layout = layoutName
                }
                break;
            }
            attempts++;
        }
        if (attempts >= maxAttempts) {
            // Failed to find a placement for the current grid.
            return false;
        }
    }
    return { resGrid: grid, hints };
};

const fillInGridGaps = (grid) => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const filledGrid = grid.map((row) =>
        row.map((l) => (l === " " ? possible[random(0, possible.length - 1)] : l))
    );
    return filledGrid;
};

const printGrid = (filledGrid) => {
    console.log("\n")
    const str = filledGrid.map((row) => row.join(" ")).join("\n");
    console.log(str);
    return true;
};
const printHints = (hints) => {
    if (hints instanceof Array) {
        hints.forEach(({ word, pos, layout }) => {
            console.log(`Word: ${word.toUpperCase()}, Position: x=${pos.x} and y =${pos.y}, Layout: ${layout}`);
        });
    }
}
const main = async (pGridSize) => {
    const [words, longestLength] = await getWords();
    const lettersOf = makeLettersOf(words);
    // console.log("lettersOf ", longestLength);
    if (pGridSize < longestLength) {
        console.log('grid cannot be created');
        return;
    }
    let gridSize = pGridSize || longestLength;
    let grid = [];
    let result = false;
    let hints = false;
    do {
        grid = makeGrid(gridSize);
        const { resGrid, hints: resHints } = placeWords(grid, gridSize, words, lettersOf);
        hints = resHints;
        result = resGrid;
        gridSize++;
    } while (!result);

    // You can comment out this line to just view the placed words instead of the whole puzzle, helps with debugging
    //grid = fillInGridGaps(grid);
    console.log('\n');
    printHints(hints);
    printGrid(grid);
};

main(20);