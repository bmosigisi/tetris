import { PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT, TETROMINO_CELL_WIDTH } from './modules/constants.js';

const game = function () {
  // Include request animation polyfill
  (function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
            callback(currTime + timeToCall);
          },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
  }());

  /** 
   * Tetrominoes block variables
   */
  var blocks = {
    l: {
      rotation: [0x4460, 0x0740, 0x6220, 0x02e0],
      color: 'orange'
    },
    z: {
      rotation: [0x0630, 0x2640, 0x0630, 0x2640],
      color: 'red'
    },
    s: {
      rotation: [0x06c0, 0x4620, 0x06c0, 0x4620],
      color: 'green'
    },
    j: {
      rotation: [0x2260, 0x0470, 0x6440, 0x0e20],
      color: 'blue'
    },
    i: {
      rotation: [0x4444, 0x0f00, 0x4444, 0x0f00],
      color: 'cyan'
    },
    o: {
      rotation: [0x0660, 0x0660, 0x0660, 0x0660],
      color: 'gold'
    },
    t: {
      rotation: [0x4640, 0x0e40, 0x4c40, 0x04e0],
      color: 'purple'
    }
  };

  // Pieces basket to improve random picking of pieces.
  var basket = {
    blocks: ['l', 'z', 's', 'j', 'i', 'o', 't'],
    frequency: [4, 4, 4, 4, 4, 4, 4]
  };

  var ctx = document.getElementById('canvas').getContext('2d');
  var ctxNext = document.getElementById('next-piece').getContext('2d');
  var beginningTime, actionChanged, currentPiece, nextPiece, nextChanged;
  // actions: up, right, left, down.
  var actions = new Array(4);
  var grid = new Array(18);
  var gridChanged = false;
  var persistentGrid = new Array(18);
  var persistentGridChanged = false;

  (function() {
    for (var i = 0; i < 18; i++) {
      grid[i] = new Array(10);
      persistentGrid[i] = new Array(10);
      for (var j = 0; j < 10; j++) {
        grid[i][j] = [0, ''];
        persistentGrid[i][j] = [0, ''];
      }
    }
  })();

  // Get a random block from the selection.
  var getRandomBlock = function() {
    var isEmpty = function() {
      for (var j = 0; j < 7; j++) {
        if (basket.frequency[j] !== 0) return false;
      }

      return true;
    };

    // Reset frequency if all pieces have been picked.
    if (isEmpty()) {
      for (var i = 0; i < 7; i++) {
        basket.frequency[i] = 4;
      }
    }

    var rand = Math.floor((Math.random() * 7));
    while (basket.frequency[rand] < 1) {
      rand = Math.floor((Math.random() * 7));
    }
    basket.frequency[rand]--;

    return blocks[basket.blocks[rand]];
  };

  document.getElementById('start-button').onclick = function() {
    init();
    beginningTime = performance.now();
    startGame(beginningTime);
  };

  /**
   * Initialize the game. 
   * Create a current and next piece.
   * Add keydown event listener.
   */
  function init() {
    currentPiece = getRandomBlock();
    // State property tracks the x, y positions and rotation index.
    currentPiece.state = [90, 0, 0];
    nextPiece = getRandomBlock();
    document.onkeydown = getPressedKey;
    actionChanged = false;
    initializeCurrent();
    drawNext();
  }

  function startGame(timeStamp) {
    if (actionChanged) {
      updateActions();
    }
    if (timeStamp - beginningTime >= 1000) {
      if (checkCollisions()) {
        beginningTime = timeStamp;
        drop();
      }
    }
    updateGrid();
    window.requestAnimationFrame(startGame);
  }

  // convert a piece representation in hex to 4 by 4 array
  function convertRepresentation(piece) {
    var pieceArray = new Array(4);
    var rotation = piece.rotation[piece.state[2]];
    var xcount = 0,
      ycount = 0;
    // initialize piece array to 0's.
    for (var i = 0; i < 4; i++) {
      pieceArray[i] = new Array(4);
      for (var j = 0; j < 4; j++) {
        pieceArray[i][j] = 0;
      }
    }
    while (rotation !== 0) {
      if (0x8000 & rotation) {
        pieceArray[ycount][xcount] = 1;
      }
      rotation = rotation << 1;
      xcount++;
      if (xcount === 4) {
        xcount = 0;
        ycount++;
      }
    }

    return pieceArray;
  }

  /**
   * Set the state of the current piece.
   * Ensures that all pieces start at the very top.
   */
  function initializeCurrent() {
    var pieceArray = convertRepresentation(currentPiece);
    // Find top-most piece.
    for (var i = 0; i < 4; i++) {
      if (pieceArray[i].indexOf(1) !== -1) {
        break;
      }
    }
    currentPiece.state = [90, 0 - (30 * i), 0];
    gridChanged = true;
  }

  /**
   * Get the keys pressed by the user, and update the actions
   * array.
   */
  function getPressedKey(e) {
    e = e || window.event;

    if (e.keyCode == '38') {
      // up arrow
      actions[0] = 1;
    } else if (e.keyCode == '40') {
      // down arrow
      actions[2] = 1;
    } else if (e.keyCode == '37') {
      // left arrow
      actions[3] = 1;
    } else if (e.keyCode == '39') {
      // right arrow
      actions[1] = 1;
    }
    actionChanged = true;
  }

  // Set all actions to 0.
  function resetActions() {
    for (var i = 0; i < 4; i++) {
      actions[i] = 0;
    }
  }

  /**
   * Receive the actions from the player and update
   * the current piece.
   */
  function updateActions() {
    // create a temporary copy of the current piece.
    var temp = currentPiece.state.slice(0, 4);
    // Loop through actions array and update current piece position.
    for (var i = 0; i < 4; i++) {
      if (actions[i]) {
        if (i === 0) {
          if (currentPiece.state[2] === 3) {
            currentPiece.state[2] = 0;
          } else {
            currentPiece.state[2]++;
          }
        } else if (i === 1) {
          currentPiece.state[0] += TETROMINO_CELL_WIDTH;
        } else if (i === 2 && checkBottomBounds()) {
          currentPiece.state[1] += TETROMINO_CELL_WIDTH;
        } else if (i === 3) {
          currentPiece.state[0] -= TETROMINO_CELL_WIDTH;
        }
      }
    }
    // also check if the new state causes collisions.
    if (!checkBounds()) {
      currentPiece.state = temp;
    }
    resetActions();
    actionChanged = false;
    gridChanged = true;
  }

  /**
   * Check whether the current piece is within the
   * bounds of the playing field.
   * Return true if piece is within bounds.
   */
  function checkBounds() {
    var pieceArray = convertRepresentation(currentPiece);
    rightMostIndex = 0;
    for (var m = 3; m >= 0; m--) {
      for (var n = 3; n >= 0; n--) {
        if (pieceArray[m][n] && n > rightMostIndex) {
          rightMostIndex = n;
        }
      }
    }
    if ((rightMostIndex * TETROMINO_CELL_WIDTH) + currentPiece.state[0] + TETROMINO_CELL_WIDTH > PLAYGROUND_WIDTH) {
      return false;
    }

    // get left most piece.
    leftMostIndex = 3;
    for (var i = 0; i < 4; i++) {
      if (pieceArray[i].indexOf(1) < leftMostIndex &&
        pieceArray[i].indexOf(1) !== -1) {
        leftMostIndex = pieceArray[i].indexOf(1);
      }
    }
    if ((leftMostIndex * TETROMINO_CELL_WIDTH) + currentPiece.state[0] < 0) {
      return false;
    }

    return true;
  }

  /**
   * Check bottom most bounds of current piece.
   * Returns true if piece is still within.
   */
  function checkBottomBounds() {
    var pieceArray = convertRepresentation(currentPiece);
    // get bottom most piece.
    for (i = 3; i >= 0; i--) {
      for (var j = 0; j < 4; j++) {
        // find the lowest cell in the piece
        if (pieceArray[i][j]) {
          // check if current cell is within field
          if ((i * TETROMINO_CELL_WIDTH) + currentPiece.state[1] > 480) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check whether the current piece is bound to collide
   * with an existing piece in the next drop.
   * Returns true if collision will occur.
   * Also swaps current with next piece incase of collision.
   */
  function checkCollisions() {
    if (checkBottomBounds()) {
      return true;
    }
    updatePersistentGrid();
    currentPiece = nextPiece;
    nextPiece = getRandomBlock();
    initializeCurrent();
    drawNext();
    return false;
  }

  /**
   * Drop the current piece down once.
   */
  function drop() {
    currentPiece.state[1] += TETROMINO_CELL_WIDTH;
    gridChanged = true;
  }

  // Draw a single block, somewhere on the grid.
  function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, 28, 28);
  }

  /**
   * Reset the grid.
   */
  function resetGrid() {
    for (var i = 0; i < 18; i++) {
      for (var j = 0; j < 10; j++) {
        grid[i][j] = [0, ''];
      }
    }
    return grid;
  }

  /**
   * Check whether the grid has changed. If it has, update it.
   */
  function updateGrid() {
    if (gridChanged) {
      var grid = resetGrid();
      // get current piece and update grid.
      var pieceArray = convertRepresentation(currentPiece);
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
          if (pieceArray[i][j]) {
            var x = (j * TETROMINO_CELL_WIDTH) + currentPiece.state[0];
            var y = (i * TETROMINO_CELL_WIDTH) + currentPiece.state[1];
            grid[(y / TETROMINO_CELL_WIDTH)][(x / TETROMINO_CELL_WIDTH)] = [1, currentPiece.color];
          }
        }
      }
      gridChanged = false;
      draw();
    }
  }

  function updatePersistentGrid() {
    // get current piece and update grid.
    var pieceArray = convertRepresentation(currentPiece);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        if (pieceArray[i][j]) {
          var x = (j * TETROMINO_CELL_WIDTH) + currentPiece.state[0];
          var y = (i * TETROMINO_CELL_WIDTH) + currentPiece.state[1];
          persistentGrid[(y / TETROMINO_CELL_WIDTH)][(x / TETROMINO_CELL_WIDTH)] = [1, currentPiece.color];
        }
      }
    }
  }

  /**
   * Draw the next piece.
   */
  function drawNext() {
    ctxNext.clearRect(0, 0, 196, 200);
    nextPiece.state = [30, 35, 0];
    var pieceArray = convertRepresentation(nextPiece);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        if (pieceArray[i][j]) {
          drawBlock(ctxNext, j * TETROMINO_CELL_WIDTH + nextPiece.state[0], i * TETROMINO_CELL_WIDTH + nextPiece.state[1], nextPiece.color);
        }
      }
    }
  }

  /**
   * Draw all the cells in the entire grid.
   * Draws both the main grid and the pieces.
   */
  function draw() {
    ctx.clearRect(0, 0, PLAYGROUND_WIDTH, PLAYGROUND_HEIGHT);
    for (var i = 0; i < 18; i++) {
      for (var j = 0; j < 10; j++) {
        if (persistentGrid[i][j][0]) {
          drawBlock(ctx, j * TETROMINO_CELL_WIDTH, i * TETROMINO_CELL_WIDTH, persistentGrid[i][j][1]);
        }
      }
    }
    for (var i = 0; i < 18; i++) {
      for (var j = 0; j < 10; j++) {
        if (grid[i][j][0]) {
          drawBlock(ctx, j * TETROMINO_CELL_WIDTH, i * TETROMINO_CELL_WIDTH, grid[i][j][1]);
        }
      }
    }
  }

}();

window.onload = (game());
