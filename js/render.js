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

Renderer.prototype.tick = function() {
  if (this.xt_ == undefined) return;

  if (this.xt_ - 150 < this.xOff_) {
    if (this.xv_ >= 0) {
      this.xv_ = -0.25;
    }
    this.xv_ -= 0.25;
  } else if (this.xt_ + 150 > this.xOff_ + this.w_) {
    if (this.xv_ <= 0) {
      this.xv_ = 0.25;
    }
    this.xv_ += 0.25;
  }
  this.xv_ = Math.max(-10, Math.min(10, this.xv_));
  this.xv_ -= sgn(this.xv_) * 0.15
  if (Math.abs(this.xv_) <= 0.3) {
    this.xv_ = 0;
  }

  if (this.yt_ - 150 < this.yOff_) {
    if (this.yv_ >= 0) {
      this.yv_ = -0.25;
    }
    this.yv_ -= 0.25;
  } else if (this.yt_ + 150 > this.yOff_ + this.h_) {
    if (this.yv_ <= 0) {
      this.yv_ = 0.25;
    }
    this.yv_ += 0.25;
  }
  this.yv_ = Math.max(-10, Math.min(10, this.yv_));
  this.yv_ -= sgn(this.yv_) * 0.15
  if (Math.abs(this.yv_) <= 0.3) {
    this.yv_ = 0;
  }

  this.xOff_ += this.xv_;
  this.yOff_ += this.yv_;
};

Renderer.prototype.render = function(game) {
  this.focusOn(game.player_.asCollider().x(),
               game.player_.asCollider().y());

  this.context_.clearRect(0, 0, this.w_, this.h_);
  this.context_.fillStyle = 'rgb(0, 0, 0)';
  this.context_.fillRect(0, 0, this.w_, this.h_);

  this.context_.save();
  this.context_.translate(-Math.round(this.xOff_) + 0.5,
                          -Math.round(this.yOff_) + 0.5);
  game.render(this);
  this.context_.restore();
};
