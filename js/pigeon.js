FRAME_RATE = 60;

function ImgLoader() {
  this.images_ = [];
  this.done_ = 0;
  this.allLoaded_ = function() {};
  this.loaded_ = {};
};

ImgLoader.prototype.load = function(src) {
  var img = new Image();
  this.images_.push(img);
  img.onload = bind(this, this.oneLoaded_, img, src);
  img.src = src;
};

ImgLoader.prototype.whenDone = function(fn) {
  this.allLoaded_ = fn;
  if (this.done_ == this.images_.length && this.images_.length) {
    fn(this.loaded_);
  }
};

ImgLoader.prototype.oneLoaded_ = function(img, src) {
  this.done_++;
  this.loaded_[src] = img;
  if (this.done_ == this.images_.length) {
    this.allLoaded_(this.loaded_);
  }
};

var genLevel = function(levelWidth, levelHeight) {
  var level = new Level(levelWidth, levelHeight);

  var SS_WIDTH_MIN = 50;
  var SS_WIDTH_MAX = 150;
  var HOME_WIDTH_MIN = 50;
  var HOME_WIDTH_MAX = 100;
  var HOME_SPACE_WIDTH = 256;
  var TOP_SPACE = 256;
  var SS_COLORS = [
    Rgb.fromCss('#abc'),
    Rgb.fromCss('#cbc'),
    Rgb.fromCss('#cce')
  ];
  var HOME_COLORS = [
    Rgb.fromCss('#d2b48c')
  ];
  var HOME_ROOF_COLORS = [
    Rgb.fromCss('#b22')
  ];
  var numScrapers = Math.floor(levelWidth / SS_WIDTH_MAX / 4);
  var numHomes = Math.floor(levelWidth / HOME_WIDTH_MAX / 4);
  if (numScrapers < 1 || numHomes < 1) {
    abortabortabort;
  }

  var taken = [];
  var place = function(w) {
    for (var tries = 0; tries < 100; ++tries) {
      var tx = randInt(levelWidth - w);
      var bad = false;
      for (var i = taken.length - 1; i >= 0; --i) {
        var b = taken[i];
        if (!(b[0] > tx + w || b[1] < tx)) {
          bad = true;
          break;
        }
      }
      if (!bad) {
        return tx;
      }
    }
    return -1;
  }
  for (var i = 0; i < numScrapers; ++i) {
    var w = randInt(SS_WIDTH_MIN, SS_WIDTH_MAX);
    var x = place(w);
    if (x == -1) {
      if (DEBUG) {
        window.console.log('Whoops, couldnt place ith ss: ' + i);
      }
    } else {
      taken.push([x, x + w]);
      var h = randInt(levelHeight * 0.5, levelHeight - TOP_SPACE);
      level.addBlock(new geom.AABB(x, levelHeight - h, w, h),
                     pick(SS_COLORS),
                     BlockKind.SKYSCRAPER);
    }
  }
  for (var i = 0; i < numHomes; ++i) {
    var w = randInt(HOME_WIDTH_MIN, HOME_WIDTH_MAX);
    var x = place(w + HOME_SPACE_WIDTH);
    if (x == -1) {
      if (DEBUG) {
        window.console.log('Whoops, couldnt place ith home: ' + i);
      }
    } else {
      taken.push([x, x + w + HOME_SPACE_WIDTH]);
      var h = randInt(levelHeight * 0.1, levelHeight * 0.2);
      level.addBlock(
          new geom.AABB(x + HOME_SPACE_WIDTH / 2, levelHeight - h, w, h),
          pick(HOME_COLORS),
          BlockKind.BASIC);
      level.addBlock(
          new geom.AABB(x + HOME_SPACE_WIDTH / 2, levelHeight - h - 8, w, 8),
          pick(HOME_ROOF_COLORS),
          BlockKind.HOME);
    }
  }

  var bc = Rgb.fromCss('#abc');
  level.addBlock(new geom.AABB(0, -10, levelWidth, 10), bc);
  level.addBlock(new geom.AABB(0, levelHeight, levelWidth, 10), bc);
  level.addBlock(new geom.AABB(-10, 0, 10, levelHeight), bc);
  level.addBlock(new geom.AABB(levelWidth, 0, 10, levelHeight), bc);

  return level;
};

$(document).ready(function() {
  var gameElem = document.getElementById('game');
  var renderer = new Renderer(gameElem, 640, 480);

  var loader = new ImgLoader();
  for (var img in IMG) {
    loader.load(IMG[img])
  }

  loader.whenDone(function(loaded) {
    for (var path in loaded) {
      IMGS[path] = loaded[path];
    }

    var level = genLevel(5000, 1000);
    var game = new Game(level);
    $(gameElem).keydown(KB.onKeyDown);
    $(gameElem).keyup(KB.onKeyUp);

    $(gameElem).blur(function() {
      game.paused = true;
    });

    game.gameOver();

    var lastFrame = new Date().getTime();
    (function renderLoop() {

      var now = new Date().getTime();
      var numFrames = Math.floor((now - lastFrame) / (1000 / FRAME_RATE));
      lastFrame = lastFrame + numFrames * (1000 / FRAME_RATE);
      if (numFrames > 1) {
        if (DEBUG) {
          window.console.log(now, lastFrame, numFrames);
        }
        if (numFrames > 5) {
          numFrames = 1;
        }
      }
      KB.tickHandleInput_();
      if (!game.isOver()) {
        if (DEBUG && KB.keyPressed('q')) {
          game.gameOver();
        }
        for (var i = 0; i < numFrames; i++) {
          game.tick(1 / FRAME_RATE);
          if (i) KB.tickHandleInput_();
        }
        if (!game.paused) {
          renderer.tick();
        }
        renderer.render(game);
        if (game.sadnessToGo() > 1) {
          game.gameOver();
        }
      } else {
        var ctx = renderer.context();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, renderer.width(), renderer.height());
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Y O U   L O S E', 50, 125);
        var txt = 'the world is sad';
        if (game.delivered) {
          txt += ' only ' + game.delivered + (game.delivered == 1 ? ' happiness unit delivered' : ' happiness units delivered');
        }
        ctx.fillText(txt, 50, 140);
        ctx.fillText('press x to try to make the world happy', 50, 155);
        ctx.fillText('to make the world a happy place, make businessmen feel loved', 50, 185);
        ctx.fillText('by bringing them items from their home', 50, 200);
        ctx.fillText('this is hard becaues you are a pigeon', 50, 230);
        ctx.fillText('left and right arrows to steer left/right, down to dive', 50, 260);
        ctx.fillText('a/s to flap (pound both to really fly)', 50, 275);
        ctx.fillText('z to pick up/drop items', 50, 290);
        ctx.fillText('your bird-dar lets you know of men in need and where to find their love', 50, 320);
        if (KB.keyDown('x')) {
          game.newGame(genLevel(5000, 1000));
        }
      }

      if (game.paused) {
        var ctx = renderer.context();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, renderer.width(), renderer.height());
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('P A U S E D', 50, 80);
        ctx.fillText('press x to continue', 50, 95);
        if (KB.keyPressed('x')) {
          game.paused = false;
        }
      }
      requestAnimFrame(renderLoop, this.canvasElem_);
    })();
  });
});
