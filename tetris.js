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
      rotation: [0xcc00, 0xcc00, 0xcc00, 0xcc00],
      color: 'yellow'
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
  var gameScenes = ['control', 'play', 'pause', 'end'];
  var currentGameScene = gameScenes[0];
  var currentPiece, nextPiece;

  var suspendGameArea = function() {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, 300, 540);
  };

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
    // start game here
    init();
    startGame();
  };

  function init() {
    currentPiece = getRandomBlock();
    nextPiece = getRandomBlock();
  }

  function startGame(timeStamp) {
    drawNext(nextPiece);
    window.requestAnimationFrame(startGame);
  }

  function drawNext(nextPiece) {
    var ctx = document.getElementById('next-piece').getContext('2d');
    drawPiece(ctx, nextPiece, 20, 20, 0);
  }

  function drawPiece(context, piece, x, y, rotation_index) {
    // Draws a piece in a 120*120 grid, in a certain orientation.
    rindex = 0;
    // default rotation index is 0.
    if (rotation_index) {
      rindex = rotation_index;
    }

    drawBlock(context, 40, 40, piece.color);
  }

  function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x+1, y+1, 28, 28)
  }

}());
