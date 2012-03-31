FRAME_RATE = 60;

$(document).ready(function() {
  var gameElem = document.getElementById('game');
  var renderer = new Renderer(gameElem, 640, 480);
  var level = new Level(640, 480);

  // Obstacles.

  // +--------------------------------------------------------------------------
  // | House
  level.addBlock(new geom.AABB(740, 956, 84, 8),
                 Rgb.fromCss('#b22'));
  level.addBlock(new geom.AABB(742, 960, 80, 40),
                 Rgb.fromCss('#d2b48c'));

  // +--------------------------------------------------------------------------
  // | Skyscraper
  level.addBlock(new geom.AABB(100, 150, 100, 850), Rgb.fromCss('#abc'));

  // +--------------------------------------------------------------------------
  // | Border
  level.addBlock(new geom.AABB(0, 0, 1640, 10), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(0, 1000, 1640, 10), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(0, 0, 10, 1000), Rgb.fromCss('#abc'));
  level.addBlock(new geom.AABB(1630, 0, 10, 1000), Rgb.fromCss('#abc'));

  var game = new Game(level);

  $(gameElem).keydown(bind(game, game.onKeyDown));
  $(gameElem).keyup(bind(game, game.onKeyUp));

  var lastFrame = new Date().getTime();
  (function renderLoop() {

    var now = new Date().getTime();
    var numFrames = Math.floor((now - lastFrame) / (1000 / FRAME_RATE));
    lastFrame = lastFrame + numFrames * (1000 / FRAME_RATE);
    if (numFrames > 1) {
      window.console.log(now, lastFrame, numFrames);
    }
    for (var i = 0; i < numFrames; i++) {
      game.tick(1 / FRAME_RATE);
    }
    renderer.tick();
    renderer.render(game);
    requestAnimFrame(renderLoop, this.canvasElem_);
  })();
});
