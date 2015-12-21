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

// Global variables
var l = { rotation: [0x4460, 0x740, 0x6220, 0x02e0], color: ''};
var z = { rotation: [0x630, 0x2640, 0x630, 0x2640], color: ''};
var s = { rotation: [0x06c0, 0x4620, 0x06c0, 0x4620], color: ''};
var j = { rotation: [0x2260, 0x0470,0x6440, 0x0e20], color: ''};
var i = { rotation: [0x4444, 0x0f00, 0x4444, 0x0f00], color: ''};
var o = { rotation: [0xcc00, 0xcc00, 0xcc00, 0xcc00], color: ''};
var t = { rotation: [0x4640, 0x0e40, 0x4c40, 0x04e0], color: ''};
