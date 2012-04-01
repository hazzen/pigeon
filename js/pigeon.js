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

IMG = {
  BMAN: 'res/bman.png',
  BMAN_THUMB: 'res/bman_thumb.png',
  HEART_THUMB: 'res/possession_thumb.png'
};

IMGS = {};

$(document).ready(function() {
  var gameElem = document.getElementById('game');
  var renderer = new Renderer(gameElem, 640, 480);
  var level = new Level(640, 480);

  var loader = new ImgLoader();
  for (var img in IMG) {
    loader.load(IMG[img])
  }
  // Obstacles.

  // +--------------------------------------------------------------------------
  // | House
  level.addBlock(new geom.AABB(740, 956, 84, 8),
                 Rgb.fromCss('#b22'),
                 BlockKind.HOME);
  level.addBlock(new geom.AABB(742, 960, 80, 40),
                 Rgb.fromCss('#d2b48c'),
                 BlockKind.HOME);

  // +--------------------------------------------------------------------------
  // | Skyscraper
  level.addBlock(new geom.AABB(100, 150, 100, 850),
                 Rgb.fromCss('#abc'),
                 BlockKind.SKYSCRAPER);

  // +--------------------------------------------------------------------------
  // | Border
  level.addBlock(new geom.AABB(0, 0, 1640, 10), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(0, 1000, 1640, 10), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(0, 0, 10, 1000), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(1630, 0, 10, 1000), Rgb.fromCss('#abc'));

  loader.whenDone(function(loaded) {
    IMGS = loaded;

    var game = new Game(level);
    $(gameElem).keydown(bind(game, game.onKeyDown));
    $(gameElem).keyup(bind(game, game.onKeyUp));

    $(gameElem).blur(function() {
      game.paused = true;
    });

    var lastFrame = new Date().getTime();
    (function renderLoop() {

      var now = new Date().getTime();
      var numFrames = Math.floor((now - lastFrame) / (1000 / FRAME_RATE));
      lastFrame = lastFrame + numFrames * (1000 / FRAME_RATE);
      if (numFrames > 1) {
        window.console.log(now, lastFrame, numFrames);
        if (numFrames > 5) {
          numFrames = 1;
        }
      }
      for (var i = 0; i < numFrames; i++) {
        game.tick(1 / FRAME_RATE);
      }
      if (!game.paused) {
        renderer.tick();
      }
      renderer.render(game);
      if (game.paused) {
        var ctx = renderer.context();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, renderer.width(), renderer.height());
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('P A U S E D', 50, 80);
        ctx.fillText('press z to continue', 50, 95);
        if (game.keyDown('z')) {
          game.paused = false;
        }
      }
      requestAnimFrame(renderLoop, this.canvasElem_);
    })();
  });
});
