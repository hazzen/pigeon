function Renderer(attachTo, width, height) {
  $(attachTo).width(width);
  this.canvasElem_ = $('<canvas />')
      .attr('width', width)
      .attr('height', height)
      .appendTo(attachTo)
      .get(0);
  this.context_ = this.canvasElem_.getContext('2d');
  this.w_ = this.canvasElem_.width;
  this.h_ = this.canvasElem_.height;
  this.xv_ = 0;
  this.yv_ = 0;
  this.xt_ = undefined;
  this.yt_ = undefined;
  this.xOff_ = 0;
  this.yOff_ = 0;
  this.aabb_ = new geom.AABB(0, 0, this.w_, this.h_);
}

Renderer.prototype.focusOn = function(x, y) {
  this.xt_ = x;
  this.yt_ = y;
};

Renderer.prototype.xOffset = function() {
  return this.xOff_;
};

Renderer.prototype.yOffset = function() {
  return this.yOff_;
};

Renderer.prototype.width = function() {
  return this.w_;
};

Renderer.prototype.height = function() {
  return this.h_;
};

Renderer.prototype.context = function() {
  return this.context_;
};

Renderer.prototype.boxOnScreen = function(aabb) {
  return this.aabb_.overlaps(aabb);
};

Renderer.prototype.pointOnScreen = function(x, y) {
  return this.aabb_.contains(x, y);
};

Renderer.prototype.drawSpriteOrThumb = function(x, y, sprite, thumb, hl) {
  var cx = x + sprite.width / 2;
  var cy = y + sprite.height / 2;
  if (!this.pointOnScreen(cx, cy)) {
    this.drawIndicator(thumb, cx, cy, hl);
  }
  if (this.boxOnScreen(new geom.AABB(x, y, sprite.width, sprite.height))) {
    this.context_.drawImage(sprite, x, y);
  }
};

Renderer.prototype.drawIndicator = function(img, tx, ty, hl) {
  if (tx < this.xOff_) {
    tx = this.xOff_;
  } else if (tx + img.width > this.xOff_ + this.w_) {
    tx = this.xOff_ + this.w_ - img.width;
  }
  if (ty < this.yOff_) {
    ty = this.yOff_;
  } else if (ty + img.height > this.yOff_ + this.h_) {
    ty = this.yOff_ + this.h_ - img.height;
  }
  this.context_.lineWidth = hl ? 12 : 6;
  this.context_.strokeStyle = hl ? 'rgb(197, 153, 64)' : 'rgb(0, 0, 0)';
  this.context_.strokeRect(tx, ty, img.width, img.height);
  this.context_.drawImage(img, tx, ty);
};

Renderer.prototype.tick = function() {
  if (this.xt_ == undefined) return;

  var cx = this.xOff_ + this.w_ / 2;
  var ncx = Math.abs(this.xt_ - cx) < this.w_ / 8;
  var ex1d = (this.xt_ - this.w_ / 6) - this.xOff_;
  var ex2d = -(this.xt_ + this.w_ / 6) + (this.xOff_ + this.w_);
  if (ex1d < 0) {
    this.xv_ = ex1d;
  } else if (ex2d < 0) {
    this.xv_ = -ex2d;
  }
  if (ncx) {
    this.xv_ = 0;
  }

  var cy = this.yOff_ + this.h_ / 2;
  var ncy = Math.abs(this.yt_ - cy) < this.h_ / 8;
  var ey1d = (this.yt_ - this.h_ / 6) - this.yOff_;
  var ey2d = -(this.yt_ + this.h_ / 6) + (this.yOff_ + this.h_);
  if (ey1d < 0) {
    this.yv_ = ey1d;
  } else if (ey2d < 0) {
    this.yv_ = -ey2d;
  }
  if (ncy) {
    this.yv_ = 0;
  }

  this.xOff_ += this.xv_;
  this.yOff_ += this.yv_;
  this.xv_ -= sgn(this.xv_) * 0.15
  this.yv_ -= sgn(this.yv_) * 0.15

  this.aabb_.p1.x = this.xOff_;
  this.aabb_.p1.y = this.yOff_;
  this.aabb_.p2.x = this.xOff_ + this.w_;
  this.aabb_.p2.y = this.yOff_ + this.h_;
};

SPEED_GRID = [
  [10, 14], [26, 12], [36,  0], [50,  8], [80, 20],
  [ 5, 39], [32, 26], [42, 42], [63, 38], [95, 50],
  [27, 63], [47, 86], [83, 75], [99, 73]
];

Renderer.prototype.render = function(game) {
  this.focusOn(game.player.asCollider().cx(),
               game.player.asCollider().cy());

  this.context_.clearRect(0, 0, this.w_, this.h_);
  this.context_.fillStyle = 'rgb(50, 50, 40)';
  this.context_.fillRect(0, 0, this.w_, this.h_);

  this.context_.save();
  this.context_.translate(-Math.round(this.xOff_) + 0.5,
                          -Math.round(this.yOff_) + 0.5);

  // Draw a grid to see motion speed.
  this.context_.fillStyle = 'rgb(128, 128, 128)';
  var ox = this.xOff_ % this.w_;
  var oy = this.yOff_ % this.h_;
  for (var i = SPEED_GRID.length - 1; i >= 0; --i) {
    var tx = this.w_ * SPEED_GRID[i][0] / 100;
    var ty = this.h_ * SPEED_GRID[i][1] / 100;
    if (tx < ox) {
      tx += this.w_;
    }
    if (ty < oy) {
      ty += this.h_;
    }
    tx += this.xOff_ - ox;
    ty += this.yOff_ - oy;
    if (tx >= 0 && tx <= game.width() && ty >= 0 && ty <= game.height()) {
      this.context_.fillRect(tx, ty, 5, 5);
    }
  }

  game.render(this);
  this.context_.restore();

  // Draw UI.
  this.context_.font = 'bold 12px sans-serif';
  // Time to deliver.
  var curPossession = game.player.possession();
  if (curPossession) {
    this.context_.strokeStyle = 'rgb(255, 255, 255)';
    this.context_.fillStyle = 'rgb(15, 128, 5)';
    this.context_.lineWidth = 2;
    this.context_.fillRect(50, 20, this.w_ - 100, 20);
    this.context_.strokeRect(50, 20, this.w_ - 100, 20);

    var ratio = curPossession.owner().strengthLeft();
    this.context_.fillStyle = 'rgb(23, 200, 45)';
    this.context_.fillRect(50, 20, ratio * (this.w_ - 100), 20);

    this.context_.fillStyle = '#444';
    this.context_.fillText('M I R T H', this.w_ / 2 - 50, 35);
  }

  // Sadness bar.
  this.context_.strokeStyle = 'rgb(255, 255, 255)';
  this.context_.fillStyle = 'rgb(0, 0, 25)';
  this.context_.lineWidth = 2;
  this.context_.fillRect(50, this.h_ - 40, this.w_ - 100, 20);
  this.context_.strokeRect(50, this.h_ - 40, this.w_ - 100, 20);

  var ratio = game.sadnessToGo();
  this.context_.fillStyle = 'rgb(128, 23, 45)';
  this.context_.fillRect(50, this.h_ - 40, ratio * (this.w_ - 100), 20);

  this.context_.fillStyle = '#ccc';
  this.context_.fillText('W O R L D    S A D N E S S',
      this.w_ / 2 - 90, this.h_ - 25);
};
