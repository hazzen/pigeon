// +----------------------------------------------------------------------------
// | Game
function Game() {
  this.keyDown_ = {};
  this.keyDownCounts_ = {};
};

Game.prototype.keyPressed = function(chr) {
  return this.keyDown(chr) == 1;
};

Game.prototype.keyDown = function(chr) {
  if (typeof(chr) == 'string') {
    return this.keyDownCounts_[chr.toUpperCase().charCodeAt(0)];
  } else {
    return this.keyDownCounts_[chr];
  }
};

Game.prototype.tickHandleInput_ = function(t) {
  $.each(this.keyDown_, bind(this, function(key, value) {
      if (this.keyDownCounts_[key]) {
        this.keyDownCounts_[key]++;
      } else {
        this.keyDownCounts_[key] = 1;
      }
  }));
  $.each(this.keyDownCounts_, bind(this, function(key, value) {
      if (!this.keyDown_[key]) {
        this.keyDownCounts_[key] = 0;
      }
  }));
};

Game.prototype.tick = function(t) {
  this.tickHandleInput_(t);

};

Game.prototype.render = function(renderer) {
  var ctx = renderer.context();
  var fillColor = 'rgb(255, 0, 255)';
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, 25, 25);
};

Game.prototype.onKeyDown = function(event) {
  this.keyDown_[event.keyCode] = true;
};

Game.prototype.onKeyUp = function(event) {
  this.keyDown_[event.keyCode] = false;
};
