document.addEventListener('DOMContentLoaded', () => {
    const gridDisplay = document.querySelector('.grid');
    const gridContainer = document.querySelector('.grid-container'); // Get container for class changes
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score'); // Get best score element
    const gameOverDisplay = document.getElementById('game-over');
    const restartButton = document.getElementById('restart-button');
    const restartButtonGameOver = document.getElementById('restart-button-gameover');
    const sizeButtons = document.querySelectorAll('.size-button'); // Get size buttons
    let currentGridSize = 4; // Default size, now dynamic
    let board = [];
    let score = 0;
    let isGameOver = false;
    let tileElements = []; // Keep track of the DOM elements for tiles

    // --- Local Storage Helper ---
    function getHighScore(size) {
        return parseInt(localStorage.getItem(`highScore-${size}`) || '0');
    }

    function setHighScore(size, score) {
        localStorage.setItem(`highScore-${size}`, score);
    }

    // --- Game Initialization ---
    function createBoard(size) {
        currentGridSize = size; // Set the current grid size

        // Update active button style
        sizeButtons.forEach(button => {
            if (parseInt(button.dataset.size) === size) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update grid container class for styling
        gridContainer.classList.remove('size-8', 'size-10'); // Changed 16 to 10
        if (size === 8) gridContainer.classList.add('size-8');
        if (size === 10) gridContainer.classList.add('size-10'); // Changed 16 to 10


        // Clear previous grid elements if any
        gridDisplay.innerHTML = '';
        tileElements = [];
        board = Array(currentGridSize).fill(null).map(() => Array(currentGridSize).fill(0));
        score = 0;
        isGameOver = false;
        scoreDisplay.textContent = score;
        bestScoreDisplay.textContent = getHighScore(currentGridSize); // Display high score for this size
        gameOverDisplay.style.display = 'none';

        // Set grid CSS dynamically
        gridDisplay.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
        gridDisplay.style.gridTemplateRows = `repeat(${currentGridSize}, 1fr)`;
        // Adjust gap based on size? Optional.
        // gridDisplay.style.gap = currentGridSize > 8 ? '10px' : '15px';


        // Create visual tiles
        for (let r = 0; r < currentGridSize; r++) {
            tileElements[r] = [];
            for (let c = 0; c < currentGridSize; c++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                // Store the element in our 2D array for easy access
                tileElements[r][c] = tile;
                gridDisplay.appendChild(tile);
            }
        }
        // Add two initial numbers
        generateNumber();
        generateNumber();
        updateDisplay();
    }

    // --- Generate a number (2 or 4) in a random empty spot ---
    function generateNumber() {
        if (isBoardFull()) {
            return; // No space left
        }
        let added = false;
        while (!added) {
            // Use currentGridSize for random generation
            const r = Math.floor(Math.random() * currentGridSize);
            const c = Math.floor(Math.random() * currentGridSize);
            if (board[r][c] === 0) {
                // 90% chance of 2, 10% chance of 4
                board[r][c] = Math.random() < 0.9 ? 2 : 4;
                // Add animation class to the new tile
                if (tileElements[r][c]) {
                    tileElements[r][c].classList.add('tile-new');
                    // Remove the class after animation completes
                    setTimeout(() => {
                        tileElements[r][c].classList.remove('tile-new');
                    }, 200); // Match animation duration
                }
                added = true;
            }
        }
    }

    // --- Check if the board is full ---
    function isBoardFull() {
        for (let r = 0; r < currentGridSize; r++) {
            for (let c = 0; c < currentGridSize; c++) {
                if (board[r][c] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // --- Update the visual display based on the board state ---
    function updateDisplay() {
        for (let r = 0; r < currentGridSize; r++) {
            for (let c = 0; c < currentGridSize; c++) {
                // Ensure tile element exists (might not during resize transition)
                if (!tileElements[r] || !tileElements[r][c]) continue;
                const tile = tileElements[r][c];
                const value = board[r][c];
                tile.textContent = value === 0 ? '' : value;
                // Update classes for styling
                tile.className = 'tile'; // Reset classes
                if (value !== 0) {
                    let tileClass = value <= 2048 ? `tile-${value}` : 'tile-higher';
                    tile.classList.add(tileClass);
                }
            }
        }
        scoreDisplay.textContent = score;
    }

    // --- Movement Logic Helpers ---

    // Filter out zeros (compress)
    function filterZeros(row) {
        return row.filter(num => num !== 0);
    }

    // Slide and merge logic for one row (move left)
    function slideAndMerge(row) {
        // 1. Remove zeros
        row = filterZeros(row);

        // 2. Merge identical neighbors
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                score += row[i]; // Update score

                // Check and update high score
                const currentHighScore = getHighScore(currentGridSize);
                if (score > currentHighScore) {
                    setHighScore(currentGridSize, score);
                    bestScoreDisplay.textContent = score; // Update display immediately
                }

                row[i + 1] = 0; // Mark the merged tile as 0
                // Add merged animation class (find the corresponding tile element)
                // Note: Finding the exact tile after moves can be tricky.
                // A simpler approach might be to apply animation during updateDisplay if needed.
            }
        }

        // 3. Remove zeros created by merging
        row = filterZeros(row);

        // 4. Pad with zeros to the right
        while (row.length < currentGridSize) {
            row.push(0);
        }
        return row;
    }

    // Rotate the board 90 degrees clockwise
    function rotateBoard(matrix) {
        // Use currentGridSize for rotation logic
        const newMatrix = Array(currentGridSize).fill(null).map(() => Array(currentGridSize).fill(0));
        for (let r = 0; r < currentGridSize; r++) {
            for (let c = 0; c < currentGridSize; c++) {
                newMatrix[c][currentGridSize - 1 - r] = matrix[r][c];
            }
        }
        return newMatrix;
    }

    // --- Main Movement Functions ---

    function moveLeft() {
        let changed = false;
        for (let r = 0; r < currentGridSize; r++) { // Use currentGridSize
            const originalRow = [...board[r]]; // Copy original row
            const newRow = slideAndMerge(board[r]);
            board[r] = newRow;
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
                changed = true;
            }
        }
        return changed;
    }

    function moveRight() {
        let changed = false;
        // Reverse each row, slide left, then reverse back
        for (let r = 0; r < currentGridSize; r++) { // Use currentGridSize
            const originalRow = [...board[r]];
            let row = board[r].reverse();
            row = slideAndMerge(row);
            board[r] = row.reverse();
             if (JSON.stringify(originalRow) !== JSON.stringify(board[r])) {
                changed = true;
            }
        }
        return changed;
    }

    function moveUp() {
         // Rotate, move left, rotate back 3 times
        board = rotateBoard(board);
        board = rotateBoard(board);
        board = rotateBoard(board);
        const changed = moveLeft();
        board = rotateBoard(board); // Rotate back
        return changed;
    }

    function moveDown() {
        // Rotate, move left, rotate back
        board = rotateBoard(board);
        const changed = moveLeft();
        board = rotateBoard(board);
        board = rotateBoard(board);
        board = rotateBoard(board); // Rotate back
        return changed;
    }

    // --- Check for Game Over ---
    function checkGameOver() {
        if (!isBoardFull()) {
            return false; // Not over if there are empty spaces
        }

        // Check for possible horizontal merges
        for (let r = 0; r < currentGridSize; r++) { // Use currentGridSize
            for (let c = 0; c < currentGridSize - 1; c++) { // Use currentGridSize
                if (board[r][c] === board[r][c + 1]) {
                    return false; // Can merge horizontally
                }
            }
        }

        // Check for possible vertical merges
        for (let c = 0; c < currentGridSize; c++) { // Use currentGridSize
            for (let r = 0; r < currentGridSize - 1; r++) { // Use currentGridSize
                if (board[r][c] === board[r + 1][c]) {
                    return false; // Can merge vertically
                }
            }
        }

        // If full and no merges possible
        isGameOver = true;
        gameOverDisplay.style.display = 'flex'; // Show game over message
        return true;
    }


    // --- Control Function ---
    function control(event) {
        if (isGameOver) return; // Don't allow moves if game is over

        let moved = false;
        let validKeyPress = false; // Flag for background feedback

        switch (event.key) {
            case 'ArrowUp':
            case 'w': // Allow WASD keys
                moved = moveUp();
                validKeyPress = true;
                break;
            case 'ArrowDown':
            case 's':
                moved = moveDown();
                validKeyPress = true;
                break;
            case 'ArrowLeft':
            case 'a':
                moved = moveLeft();
                validKeyPress = true;
                break;
            case 'ArrowRight':
            case 'd':
                moved = moveRight();
                validKeyPress = true;
                break;
            default:
                return; // Ignore other keys
        }

        // Background feedback effect
        if (validKeyPress) {
            document.body.classList.add('background-feedback');
            setTimeout(() => {
                document.body.classList.remove('background-feedback');
            }, 100); // Duration of the feedback effect
        }


        if (moved) {
            generateNumber();
            updateDisplay(); // Update display before checking game over
            checkGameOver(); // Check game over after move and generation
        }
    }

    // --- Event Listeners ---
    document.addEventListener('keydown', control);

    // Restart buttons restart with the CURRENT size
    restartButton.addEventListener('click', () => createBoard(currentGridSize));
    restartButtonGameOver.addEventListener('click', () => createBoard(currentGridSize));

    // Size selection buttons start a new game with the SELECTED size
    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const size = parseInt(button.dataset.size);
            createBoard(size);
        });
    });

    // --- Initial Setup ---
    createBoard(4); // Start with 4x4 grid

}); // End DOMContentLoaded
