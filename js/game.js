// +----------------------------------------------------------------------------
// | Game
function Game() {
  this.keyDown_ = {};
  this.keyDownCounts_ = {};
  this.player_ = new Player();
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
  if (this.keyDown(Keys.LEFT)) {
    this.player_.x_ -= 2;
  }
  if (this.keyDown(Keys.RIGHT)) {
    this.player_.x_ += 2;
  }
  if (this.keyDown(Keys.UP)) {
    this.player_.y_ -= 2;
  }
  if (this.keyDown(Keys.DOWN)) {
    this.player_.y_ += 2;
  }
};

Game.prototype.render = function(renderer) {
  this.player_.render(renderer);
};

Game.prototype.onKeyDown = function(event) {
  this.keyDown_[event.keyCode] = true;
};

Game.prototype.onKeyUp = function(event) {
  this.keyDown_[event.keyCode] = false;
};

// +----------------------------------------------------------------------------
// | Player
Player = function() {
  this.x_ = 50;
  this.y_ = 50;
};

Player.prototype.render = function(renderer) {
  var ctx = renderer.context();

  ctx.strokeStyle = 'rgb(128, 128, 128)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(this.x_ - 10, this.y_);
  ctx.lineTo(this.x_ + 10, this.y_);
  ctx.stroke();
};
