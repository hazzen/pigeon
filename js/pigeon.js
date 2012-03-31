$(document).ready(function() {
  var renderer = new Renderer(document.getElementById('game'), 640, 480);
  var game = new Game(640, 480);

  $(window).keydown(bind(game, game.onKeyDown));
  $(window).keyup(bind(game, game.onKeyUp));

  var lastFrame = new Date().getTime();
  (function renderLoop() {

    var now = new Date().getTime();
    var numFrames = Math.floor((now - lastFrame) / (1000 / 60));
    lastFrame = lastFrame + numFrames * (1000 / 60);
    if (numFrames > 1) {
      window.console.log(now, lastFrame, numFrames);
    }
    for (var i = 0; i < numFrames; i++) {
      game.tick(1 / 60.0);
    }
    renderer.render(game);
    requestAnimFrame(renderLoop, this.canvasElem_);
  })();
});
