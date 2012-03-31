// +----------------------------------------------------------------------------
// | EntKind
EntKind = {
  PLAYER: 1,
  BMAN: 2,
  POS: 3
};

// +----------------------------------------------------------------------------
// | Game
function Game(level) {
  this.level_ = level;
  this.keyDown_ = {};
  this.keyDownCounts_ = {};
  this.player_ = new Player(this);

  this.ents_ = [this.player_];

  var ps = [
    new Possession(this, new geom.AABB(300, 150, 10, 15), 10)
  ];
  for (var i = 0; i < ps.length; ++i) {
    this.addEnt(ps[i]);
  }
  var bm =[
    new Bman(this, 145, 22)
  ];
  for (var i = 0; i < bm.length; ++i) {
    this.addEnt(bm[i]);
  }
};

Game.prototype.width = function() { return this.level_.width(); };
Game.prototype.height = function() { return this.level_.height(); };
Game.prototype.level = function() { return this.level_; };
Game.prototype.ents = function() { return this.ents_; };

Game.prototype.addEnt = function(ent) {
  for (var i = 0; i < this.ents_.length; ++i) {
    if (this.ents_[i] == null) {
      this.ents_[i] = ent;
      return;
    }
  }
  this.ents_.push(ent);
};

Game.prototype.removeEnt = function(ent) {
  for (var i = 0; i < this.ents_.length; ++i) {
    if (this.ents_[i] == ent) {
      this.ents_[i] = null;
      return;
    }
  }
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
  for (var i = this.ents_.length - 1; i >= 0; --i) {
    if (this.ents_[i]) {
      this.ents_[i].tick(t);
    }
  }
};

Game.prototype.render = function(renderer) {
  this.level_.render(renderer);
  for (var i = this.ents_.length - 1; i >= 0; --i) {
    if (this.ents_[i]) {
      this.ents_[i].render(renderer);
    }
  }
};

Game.prototype.onKeyDown = function(event) {
  this.keyDown_[event.keyCode] = true;
  event.preventDefault();
  return false;
};

Game.prototype.onKeyUp = function(event) {
  this.keyDown_[event.keyCode] = false;
  event.preventDefault();
  return false;
};

// +----------------------------------------------------------------------------
// | Collider
Collider = function(game, aabb, vx, vy, mass) {
  this.game = game;
  this.aabb = aabb;
  this.w_ = aabb.p2.x - aabb.p1.x;
  this.h_ = aabb.p2.y - aabb.p1.y;
  this.vx = vx;
  this.vy = vy;
  this.mass = mass;
  this.ignores = {};
};

Collider.fromCenter = function(game, x, y, w, h, vx, vy, mass) {
  var aabb = new geom.AABB(x - w / 2, y - w / 2, w, h);
  return new Collider(game, aabb, vx, vy, mass);
};

Collider.prototype.x = function() {
  return (this.aabb.p1.x + this.aabb.p2.x) / 2;
};

Collider.prototype.y = function() {
  return (this.aabb.p1.y + this.aabb.p2.y) / 2;
};

Collider.prototype.clampVx = function(v) {
  this.vx = Math.min(v, Math.max(-v, this.vx));
};

Collider.prototype.clampVy = function(v) {
  this.vy = Math.min(v, Math.max(-v, this.vy));
};

Collider.prototype.gravityAccel = function(t) {
  this.vy += this.mass * 9.8 * t;
};

Collider.prototype.collideOther = function(other, t) {
  var others = this.collideOthers([other], t);
  return others.xBlocks.length || others.yBlocks.length;
};

Collider.prototype.collideOthers = function(others, t) {
  var thisAabb = this.aabb.clone();
  var collisions = {};
  var xOthers = [];
  var yOthers = [];

  var dx = this.vx * t;
  var ntx = 1;
  if (dx != 0) {
    if (dx < 0) {
      thisAabb.p1.x += dx;
    } else {
      thisAabb.p2.x += dx;
    }
    for (var i = others.length - 1; i >= 0; --i) {
      var otherCollider = others[i].asCollider();
      if (otherCollider && !(getUid(otherCollider) in this.ignores) &&
          otherCollider != this) {
        var otherAabb = otherCollider.aabb;
        if (thisAabb.overlaps(otherAabb)) {
          var tx;
          xOthers.push(others[i]);
          if (dx > 0) {
            tx = (otherAabb.p1.x - thisAabb.p2.x - EPSILON) / dx;
          } else {
            tx = (otherAabb.p2.x - thisAabb.p1.x + EPSILON) / dx;
          }
          ntx = Math.min(tx, ntx);
          xOthers.push(others[i]);
        }
      }
    }
    thisAabb.p1.x -= dx - ntx * dx;
    thisAabb.p2.x -= dx - ntx * dx;
  }

  var dy = this.vy * t;
  var nty = 1;
  if (dy != 0) {
    if (dy < 0) {
      thisAabb.p1.y += dy;
    } else {
      thisAabb.p2.y += dy;
    }
    for (var i = others.length - 1; i >= 0; --i) {
      var otherCollider = others[i].asCollider();
      if (otherCollider && !(getUid(otherCollider) in this.ignores) &&
          otherCollider != this) {
        var otherAabb = otherCollider.aabb;
        if (thisAabb.overlaps(otherAabb)) {
          var ty;
          yOthers.push(others[i]);
          if (dy > 0) {
            ty = (otherAabb.p1.y - thisAabb.p2.y - EPSILON) / dy;
          } else {
            ty = (otherAabb.p2.y - thisAabb.p1.y + EPSILON) / dy;
          }
          nty = Math.min(ty, nty);
          yOthers.push(others[i]);
        }
      }
    }
  }

  collisions.xOthers = xOthers;
  collisions.yOthers = yOthers;
  collisions.dtx = ntx;
  collisions.dty = nty;
  return collisions;
};

Collider.prototype.tick = function(t) {
  var levelCollisions = this.game.level().collides(
      this.aabb.clone(), this.vx * t, this.vy * t);
  var gameCollisions = this.collideOthers(this.game.ents(), t);
  var dtx = Math.max(0, Math.min(levelCollisions.dtx, gameCollisions.dtx));
  var dty = Math.max(0, Math.min(levelCollisions.dty, gameCollisions.dty));
  var dx = dtx * t * this.vx;
  var dy = dty * t * this.vy;
  this.aabb.p1.x += dx;
  this.aabb.p2.x += dx;
  this.aabb.p1.y += dy;
  this.aabb.p2.y += dy;

  if (levelCollisions.xBlocks.length || gameCollisions.xOthers.length) {
    this.vx = 0;
  }
  if (levelCollisions.yBlocks.length || gameCollisions.yOthers.length) {
    this.vy = 0;
  }

  return {
    level: levelCollisions,
    game: gameCollisions,
    dtx: dtx,
    dty: dty,
    dx: dx,
    dy: dy
  };
};

// +----------------------------------------------------------------------------
// | Player
Player = function(game) {
  this.game_ = game;
  this.collider_ = Collider.fromCenter(
      game, 50, 50, Player.LENGTH, Player.STROKE, 0, 0, 10);
  this.flapAnim_ = 0;
  this.possession_ = null;
};

Player.MAX_V_X = 100;
Player.MAX_V_Y = 300;
Player.LENGTH = 20;
Player.STROKE = 5;

Player.prototype.getKind = function() {
  return EntKind.PLAYER;
};

Player.prototype.render = function(renderer) {
  var ctx = renderer.context();

  // Body.
  ctx.strokeStyle = 'rgb(128, 128, 128)';
  ctx.lineWidth = Player.STROKE;
  ctx.beginPath();
  ctx.moveTo(this.collider_.aabb.p1.x, this.collider_.y());
  ctx.lineTo(this.collider_.aabb.p2.x, this.collider_.y());
  ctx.stroke();

  // Wing.
  if (this.flapAnim_) {
    var dir = 1;
    if (this.collider_.vx > 0) {
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
    ctx.lineWidth = Player.STROKE;
    ctx.beginPath();
    ctx.moveTo(this.collider_.x(), this.collider_.y());
    ctx.lineTo(this.collider_.x() + xm * Player.LENGTH / 2 * dir,
               this.collider_.y() + ym * Player.LENGTH / 2);
    ctx.stroke();
  }
};

Player.prototype.asCollider = function() {
  return this.collider_;
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

  this.collider_.gravityAccel(t);
  this.collider_.vx += vdx;
  this.collider_.vy += vdy;
  var collisions = this.collider_.tick(t);

  if (this.possession_) {
    var pc = this.possession_.asCollider();
    var vx = collisions.dx / t;
    var vy = collisions.dy / t;
    pc.vx = vx;
    pc.vy = vy;
    var pcs = pc.tick(t);
    if (pcs.dtx != 1) {
      this.collider_.vx = 0;
      this.collider_.aabb.p1.x -= (t * vx - pcs.dx);
      this.collider_.aabb.p2.x -= (t * vx - pcs.dx);
    }
    if (pcs.dty != 1) {
      this.collider_.vy = 0;
      this.collider_.aabb.p1.y -= (t * vy - pcs.dy);
      this.collider_.aabb.p2.y -= (t * vy - pcs.dy);
    }
  } else {
    for (var i = 0; i < collisions.game.yOthers.length; ++i) {
      if (collisions.game.yOthers[i].getKind() == EntKind.POS) {
        this.possessionHit(collisions.game.yOthers[i]);
      }
    }
  }

  this.collider_.clampVx(Player.MAX_V_X);
  this.collider_.clampVy(Player.MAX_V_Y);
};

Player.prototype.possessionHit = function(possession) {
  var pickupZone = possession.asCollider().aabb.clone();
  var w = pickupZone.p2.x - pickupZone.p1.x;
  if (w > 10) {
    pickupZone.p1.x += (w - 10) / 2;
    pickupZone.p2.x -= (w - 10) / 2;
  }
  pickupZone.p1.y -= 5;
  pickupZone.p2.y = pickupZone.p1.y + 10;

  if (pickupZone.overlaps(this.collider_.aabb)) {
    this.possessionGet(possession);
  }
};

Player.prototype.possessionGet = function(possession) {
  this.possession_ = possession;

  possession.asCollider().ignores[getUid(this.collider_)] = true;
  this.collider_.ignores[getUid(possession.asCollider())] = true;

  possession.nabbed();
  this.collider_.mass = 10 + possession.asCollider().mass;
};

// +----------------------------------------------------------------------------
// | Possession
Possession = function(game, aabb, mass) {
  this.game_ = game;
  this.falling_ = true;
  this.collider_ = new Collider(game, aabb, 0, 0, mass);
};

Possession.prototype.asCollider = function() {
  return this.collider_;
};

Possession.prototype.tick = function(t) {
  if (this.falling_) {
    this.collider_.gravityAccel(t);
    this.collider_.tick(t);
  }
};

Possession.prototype.nabbed = function() {
  this.falling_ = false;
};

Possession.prototype.getKind = function() {
  return EntKind.POS;
};

Possession.prototype.render = function(renderer) {
  if (!renderer.boxOnScreen(this.collider_.aabb)) {
    renderer.drawIndicator(IMGS[IMG.HEART_THUMB],
        this.collider_.x(), this.collider_.y());
  } else {
    var ctx = renderer.context();
    ctx.fillStyle = 'rgb(34, 154, 28)';
    var x = this.collider_.aabb.p1.x;
    var y = this.collider_.aabb.p1.y;
    var w = this.collider_.aabb.p2.x - x;
    var h = this.collider_.aabb.p2.y - y;
    ctx.fillRect(x, y, w, h);
  }
};

// +----------------------------------------------------------------------------
// | Bman
Bman = function(game, x, y, opt_facing, opt_strength) {
  this.game_ = game;
  this.x_ = x;
  this.y_ = y;
  this.facing_ = opt_facing || Bman.Facing.RIGHT;
  this.initStrength_ = this.strength_ = opt_strength || 10;

  this.sprite_ = IMGS[IMG.BUSINESS_MAN];
};

Bman.Facing = {
  RIGHT: 1,
  LEFT: -1
};

Bman.prototype.setPossession = function(p) {
  this.possession_ = p;
};

Bman.prototype.asCollider = function() {
  if (this.falling_) {
    return this.falling_;
  }
  return null;
};

Bman.prototype.getKind = function() {
  return EntKind.BMAN;
};

Bman.prototype.render = function(renderer) {
  if (this.falling_) {
    renderer.drawSpriteOrThumb(
        this.falling_.aabb.p1.x, this.falling_.aabb.p1.y,
        this.sprite_, IMGS[IMG.BUSINESS_MAN_THUMB]);
  } else {
    renderer.drawSpriteOrThumb(
        this.x_, this.y_,
        this.sprite_, IMGS[IMG.BUSINESS_MAN_THUMB]);
  }
};

Bman.prototype.tick = function(t) {
  this.strength_ -= t;
  if (this.falling_) {
    this.falling_.gravityAccel(t);
    var collisions = this.falling_.tick(t);
  } else if (this.jumpFrame_) {
    if (this.jumpFrame_ > 30) {
      this.x_ += this.facing_ * this.sprite_.width;
      this.falling_ = new Collider(
          this.game_,
          new geom.AABB(this.x_, this.y_,
                        this.sprite_.width, this.sprite_.height),
          0, 0, 100);
    } else {
      this.jumpFrame_ += t * FRAME_RATE;
    }
  } else if (this.strength_ < 0) {
    this.jumpFrame_ = 1;
  }
};
