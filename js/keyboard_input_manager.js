function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

// TODO: Edit this
KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  function mov(dir) {
    return function() {
      self.emit("move", dir);
    };
  }

  Voice4Game.init({
    'up': mov(0),
    'right': mov(1),
    'down': mov(2)
  }, true);

  // Potential "up"
  Voice4Game.registerVoiceCmd('hot', mov(0));
  Voice4Game.registerVoiceCmd('how', mov(0));
  Voice4Game.registerVoiceCmd('top', mov(0));
  Voice4Game.registerVoiceCmd('app', mov(0));
  Voice4Game.registerVoiceCmd('how', mov(0));
  Voice4Game.registerVoiceCmd('pop', mov(0));

  // Potential "left"
  Voice4Game.registerVoiceCmd('black', mov(3));
  Voice4Game.registerVoiceCmd('blast', mov(3));
  Voice4Game.registerVoiceCmd('flash', mov(3));
  Voice4Game.registerVoiceCmd('last', mov(3));
  Voice4Game.registerVoiceCmd('left', mov(3));

  Voice4Game.registerVoiceCmd('go down over', function(result) {
      var durationMatches = result.match(/[0-9]+$/);
      if (durationMatches.length > 0) {
         var duration = parseInt(durationMatches[0]);
         $('html, body').animate({
           'scrollTop': $(document).height()
         }, duration);
      }
  });
  Voice4Game.registerVoiceCmd('go up over', function(result) {
      var durationMatches = result.match(/[0-9]+$/);
      if (durationMatches.length > 0) {
         var duration = parseInt(durationMatches[0]);
         $('html, body').animate({
           'scrollTop': 0
         }, duration);
      }
  });
  Voice4Game.registerVoiceCmd('go down by', function(result) {
      var offsetMatches = result.match(/[0-9]+$/);
      if (offsetMatches.length > 0) {
         var offset = parseInt(offsetMatches[0]);
         $('html, body').animate({
           'scrollTop': window.scrollY + offset
         }, offset);
      }
  });
  Voice4Game.registerVoiceCmd('go up by', function(result) {
      var offsetMatches = result.match(/[0-9]+$/);
      if (offsetMatches.length > 0) {
         var offset = parseInt(offsetMatches[0]);
         $('html, body').animate({
           'scrollTop': window.scrollY - offset
         }, offset);
      }
  });

 /* Voice commands for page zoom control
    1. Zoom in/out by the default 10% or a specified offset
    2. Zoom to a specified absolute percentage
    3. Reset zoom to 100% */
 var zoomFunc = function(result) {
  var curZoom = parseFloat(document.body.style.zoom);
     var zoomStep = 10;               // 10% step by default
     var numericMatches = result.match(/[0-9]+$/);

     if (isNaN(curZoom)) {
        curZoom = 1.0;
     }
     if (numericMatches != null && numericMatches.length > 0) {
        zoomStep = parseFloat(numericMatches[0]);
     }

     if (result.indexOf("in") > -1) { // Zoom in
        curZoom += zoomStep / 100;
     }
     else {                           // Zoom out
        curZoom -= zoomStep / 100;
     }
     // alert("zooming to " + curZoom);
     document.body.style.zoom = curZoom;
 };
 Voice4Game.registerVoiceCmd('zoom in', zoomFunc);
 Voice4Game.registerVoiceCmd('zoom out', zoomFunc);
 Voice4Game.registerVoiceCmd('set zoom', function(result) {
     var numericMatches = result.match(/[0-9]+$/);
     if (numericMatches.length > 0) {
        var newZoom = parseFloat(numericMatches[0]);
        // alert("zooming to " + newZoom);
        document.body.style.zoom = newZoom / 100;
     }
     else {
        alert("set zoom: must specify percentage to zoom to");
     }
 });
 Voice4Game.registerVoiceCmd('reset zoom', function() {
     // alert("resetting zoom to 100%")
     document.body.style.zoom = 1.0;
 });

 /* Voice commands for scrolling control
    1. Scroll to top of the game container */
 Voice4Game.registerVoiceCmd('scroll to game', function() {
     var gameContainer = document.getElementsByClassName("game-container")[0];
     var gameContainerY = gameContainer.getBoundingClientRect().top;
     $('html, body').animate({
        'scrollTop': gameContainerY
     });
 });

  document.getElementById('button-play-ws').addEventListener('click', Voice4Game.start);

  document.getElementById('button-stop-ws').addEventListener('click', Voice4Game.stop);

  document.getElementById('clear-all').addEventListener('click', function() {
    transcription.textContent = '';
    log.textContent = '';
  });

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    // Ignore the event if it's happening in a text field
    if (self.targetIsInput(event)) return;

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1 ||
        self.targetIsInput(event)) {
      return; // Ignore if touching with more than 1 finger or touching input
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0 ||
        self.targetIsInput(event)) {
      return; // Ignore if still touching with one or more fingers or input
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.targetIsInput = function (event) {
  return event.target.tagName.toLowerCase() === "input";
};
