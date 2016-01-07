window.onload = (function() {

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

  // Tetrominoes block variables
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

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var ctxNext = document.getElementById('next-piece').getContext('2d');
  var grid = new Array(18);
  var beginningTime, actionChanged, currentPiece, nextPiece;
  // actions: up, right, left, down.
  var actions = new Array(4);

  (function() {
    for (var i = 0; i < 18; i++) {
      grid[i] = new Array(10);
      for (var j = 0; j < 10; j++) {
        grid[i][j] = 0;
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
    var beginningTime = perfomance.now();
    startGame(beginningTime);
  };

  /**
   * Initialize the game. 
   * Create a current and next piece.
   * Add keydown event listener.
   */
  function init() {
    currentPiece = getRandomBlock();
    nextPiece = getRandomBlock();
    document.onkeydown = getPressedKey;
    actionChanged = false;
  }

  function startGame(timeStamp) {
    updateActions();
    if (timeStamp - beginningTime >= 1000) {
      var prompt = checkCollisions();
      if (prompt) {
        drop();
      }
    }
    draw();
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

  function drawPiece(context, piece, pieceArray) {
    rotation = piece.rotation[piece.state[2]];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        if (pieceArray[i][j]) {
          x = (j * 30) + piece.state[0];
          y = (i * 30) + piece.state[1];
          drawBlock(context, x, y, piece.color);
        }
      }
    }
  }

  // Draw a single block, somewhere on the grid.
  function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, 28, 28)
  }

  /**
   * Get the keys pressed by the user, and update the actions
   * array.
   */
  function getPressedKey(e) {
    e = e || window.event;

    if (e.keyCode == '38') {
      actions[0] = 1;
    } else if (e.keyCode == '40') {
      actions[2] = 1;
    } else if (e.keyCode == '37') {
      actions[3] = 1;
    } else if (e.keyCode == '39') {
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
    if (actionChanged) {
      // Loop through actions array and update current piece.
      resetActions();
      actionChanged = false;
    }
  }

  /**
   * Check whether the current piece is bound to collide
   * with an existing piece in the next drop.
   * Returns true if collision will occur.
   */
  function checkCollisions() {

  }

  /**
   * Draw all the cells in the entire grid.
   * Draws both the main grid and the pieces.
   */
  function draw() {

  }

}());
