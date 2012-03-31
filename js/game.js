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
  this.flapAnim_ = 0;
};

Player.MAX_V_X = 100;
Player.MAX_V_Y = 100;

Player.prototype.render = function(renderer) {
  var ctx = renderer.context();

  // Body.
  ctx.strokeStyle = 'rgb(128, 128, 128)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(this.x_ - 10, this.y_);
  ctx.lineTo(this.x_ + 10, this.y_);
  ctx.stroke();

  // Wing.
  if (this.flapAnim_) {
    var dir = 1;
    if (this.vx_ > 0) {
      dir = -1;
    }
    if (this.game_.keyDown(Keys.LEFT)) {
      dir = 1;
    } else if (this.game_.keyDown(Keys.RIGHT)) {
      dir = -1;
    }
    var theta = 0;
    if (this.flapAnim_ < 10) {
      theta = (this.flapAnim_ / 10) * (Math.PI / 3);
    } else if (this.flapAnim_ < 15) {
      theta = ((this.flapAnim_ - 15) / (10 - 15)) * (Math.PI / 3);
    } else {
      this.flapAnim_ = 0;
    }
    var xm = Math.cos(theta);
    var ym = Math.sin(theta);

    ctx.strokeStyle = 'rgb(96, 96, 96)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.x_, this.y_);
    ctx.lineTo(this.x_ + xm * 10 * dir, this.y_ + ym * 10);
    ctx.stroke();
  }
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
    this.flapAnim_ = 1;
  }
  if (this.flapAnim_) {
    this.flapAnim_ += t * FRAME_RATE;
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
