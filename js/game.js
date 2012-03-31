// +----------------------------------------------------------------------------
// | Game
function Game(width, height) {
  this.width_ = width;
  this.height_ = height;
  this.keyDown_ = {};
  this.keyDownCounts_ = {};
  this.player_ = new Player(this);
};

Game.prototype.width = function() { return this.width_; };
Game.prototype.height = function() { return this.height_; };

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
  this.player_.tick(t);
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
Player = function(game) {
  this.game_ = game;
  this.x_ = 50;
  this.y_ = 50;
  this.vx_ = 0;
  this.vy_ = 0;
  this.mass_ = 10;
};

Player.MAX_V_X = 100;
Player.MAX_V_Y = 100;

Player.prototype.render = function(renderer) {
  var ctx = renderer.context();

  ctx.strokeStyle = 'rgb(128, 128, 128)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(this.x_ - 10, this.y_);
  ctx.lineTo(this.x_ + 10, this.y_);
  ctx.stroke();
};

Player.prototype.tick = function(t) {
  var vdx = 0;
  var vdy = 0;
  if (this.game_.keyDown(Keys.LEFT)) {
    vdx -= 2;
  }
  if (this.game_.keyDown(Keys.RIGHT)) {
    vdx += 2;
  }
  if (this.game_.keyPressed(Keys.UP)) {
    vdy -= 50;
  }

  this.vx_ += vdx;
  this.vy_ += vdy;

  this.x_ += this.vx_ * t;
  this.y_ += this.vy_ * t;
  this.vy_ += this.mass_ * 9.8 * t;

  if (this.x_ < 0) {
    this.x_ = 0;
    this.vx_ = 0;
  } else if (this.x_ > this.game_.width()) {
    this.x_ = this.game_.width();
    this.vx_ = 0;
  }
  if (this.y_ < 0) {
    this.y_ = 0;
    this.vy_ = 0;
  } else if (this.y_ > this.game_.height()) {
    this.y_ = this.game_.height();
    this.vy_ = 0;
  }

  this.vx_ = Math.min(Player.MAX_V_X, Math.max(-Player.MAX_V_X, this.vx_));
  this.vy_ = Math.min(Player.MAX_V_Y, Math.max(-Player.MAX_V_Y, this.vy_));
};
