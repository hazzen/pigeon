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
  this.player = new Player(this);
  this.elapsedTime_ = 0;
  this.nextSpawn_ = 5;
  this.globalSadness_ = 10;

  this.ents_ = [this.player];
};

Game.prototype.width = function() { return this.level_.width(); };
Game.prototype.height = function() { return this.level_.height(); };
Game.prototype.level = function() { return this.level_; };
Game.prototype.ents = function() { return this.ents_; };
Game.prototype.sadness = function() { return this.globalSadness_; };

Game.prototype.addSadness = function(diff) {
  this.globalSadness_ += diff;
  this.globalSadness_ = Math.max(0, this.globalSadness_);
  return this.globalSadness_;
};

Game.prototype.setSadness = function(sad) {
  return (this.globalSadness_ = sad);
};

Game.prototype.sadnessToGo = function() {
  return this.globalSadness_ / 100;
};

Game.prototype.addEnt = function(ent) {
  for (var i = 0; i < this.ents_.length; ++i) {
    if (this.ents_[i] == null) {
      this.ents_[i] = ent;
      return;
    }
  }
  this.ents_.push(ent);
};

Game.prototype.removeEnt = function(ent, opt_poof) {
  if (ent.dead) { return; }
  ent.dead = true;
  if (opt_poof) {
    this.addEnt(new Poof(this, opt_poof));
  }
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
  if (this.paused) return;

  this.elapsedTime_ += t;
  for (var i = this.ents_.length - 1; i >= 0; --i) {
    if (this.ents_[i]) {
      this.ents_[i].tick(t);
    }
  }

  var INC_RATE_SEC = 5;
  var START_D = 30;
  if (this.keyPressed('p') ||
      this.nextSpawn_ < this.elapsedTime_) {
    var d = Math.floor(Math.max(5, START_D - this.elapsedTime_ / INC_RATE_SEC));
    this.nextSpawn_ = this.elapsedTime_ + randFlt(1 + d / 2, 1 + d);
    var ss = this.level_.randomOfKind(BlockKind.SKYSCRAPER);
    var home = this.level_.randomOfKind(BlockKind.HOME);

    var facing = Math.random() < 0.5 ? Bman.Facing.LEFT : Bman.Facing.RIGHT;
    var x = ss.p1.x - 3;
    if (facing == Bman.Facing.RIGHT) {
      x = ss.p2.x - IMGS[IMG.BMAN].width + 3;
    }
    var y = ss.p1.y;
    y -= IMGS[IMG.BMAN].height;
    var bman = new Bman(this, x, y, facing, 30);

    var p = Possession.randomPossession(
        this, randInt(home.p1.x, home.p2.x), home.p1.y - 2,
        randFlt(2, 10 + START_D - d));

    bman.setPossession(p);

    this.addEnt(p);
    this.addEnt(bman);
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
  this.ovx = vx;
  this.ovy = vy;
  this.mass = mass;
  this.ignores = {};
  this.ignoreBlocks = {};
};

Collider.fromCenter = function(game, x, y, w, h, vx, vy, mass) {
  var aabb = new geom.AABB(x - w / 2, y - w / 2, w, h);
  return new Collider(game, aabb, vx, vy, mass);
};

Collider.prototype.x = function() {
  return this.aabb.p1.x;
};

Collider.prototype.y = function() {
  return this.aabb.p1.y;
};


Collider.prototype.cx = function() {
  return (this.aabb.p1.x + this.aabb.p2.x) / 2;
};

Collider.prototype.cy = function() {
  return (this.aabb.p1.y + this.aabb.p2.y) / 2;
};

Collider.prototype.w = function() {
  return this.w_;
};

Collider.prototype.h = function() {
  return this.h_;
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
      if (others[i] == null) continue;
      var otherCollider = others[i].asCollider();
      if (otherCollider && !(getUid(otherCollider) in this.ignores) &&
          otherCollider != this) {
        var otherAabb = otherCollider.aabb;
        if (thisAabb.overlaps(otherAabb)) {
          var tx;
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
      if (others[i] == null) continue;
      var otherCollider = others[i].asCollider();
      if (otherCollider && !(getUid(otherCollider) in this.ignores) &&
          otherCollider != this) {
        var otherAabb = otherCollider.aabb;
        if (thisAabb.overlaps(otherAabb)) {
          var ty;
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
  this.ovx = this.vx;
  this.ovy = this.vy;
  var levelCollisions = this.game.level().collides(
      this.aabb.clone(), this.vx * t, this.vy * t, this.ignoreBlocks);
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
  if (levelCollisions.yBlocks.length) {
    this.vy = 0;
    this.vx *= 0.9;
  } else if (gameCollisions.yOthers.length) {
    for (var i = gameCollisions.yOthers.length - 1; i >= 0; --i) {
      var oc = gameCollisions.yOthers[i].asCollider();
      if (this.vy != 0 && sgn(oc.vy) == sgn(this.vy)) {
        if (this.vy > 0 && this.aabb.p1.y < oc.aabb.p1.y) {
          this.vy = oc.vy;
        } else if (this.vy < 0 && this.aabb.p1.y > oc.aabb.p1.y) {
          oc.vy = this.vy;
        }
      } else {
        this.vy = 0;
        gameCollisions.yOthers[i].asCollider.vy = 0;
      }
    }
    this.vx *= 0.9;
  }

  var maxHitXv = levelCollisions.xBlocks.length ? Math.abs(this.ovx) : 0;
  for (var i = 0; i < gameCollisions.xOthers.length; ++i) {
    var other = gameCollisions.xOthers[i];
    maxHitXv = Math.max(maxHitXv, Math.abs(this.ovx - other.ovx));
  }

  var maxHitYv = levelCollisions.yBlocks.length ? Math.abs(this.ovy) : 0;
  for (var i = 0; i < gameCollisions.yOthers.length; ++i) {
    var other = gameCollisions.yOthers[i];
    maxHitYv = Math.max(maxHitYv, Math.abs(this.ovy - other.ovy));
  }

  return {
    level: levelCollisions,
    game: gameCollisions,
    hitLevel: levelCollisions.yBlocks.length || levelCollisions.xBlocks.length,
    hitGame: gameCollisions.yOthers.length || gameCollisions.xOthers.length,
    hitX: levelCollisions.xBlocks.length || gameCollisions.xOthers.length,
    hitY: levelCollisions.yBlocks.length || gameCollisions.yOthers.length,
    hitXv: maxHitXv,
    hitYv: maxHitYv,
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

Player.MAX_V_X = 900;
Player.MAX_V_Y = 4800;
Player.LENGTH = 20;
Player.STROKE = 5;

Player.prototype.kind = EntKind.PLAYER;

Player.prototype.render = function(renderer) {
  var ctx = renderer.context();

  // Body.
  ctx.strokeStyle = 'rgb(128, 128, 128)';
  ctx.lineWidth = Player.STROKE;
  ctx.beginPath();
  ctx.moveTo(this.collider_.aabb.p1.x, this.collider_.cy());
  ctx.lineTo(this.collider_.aabb.p2.x, this.collider_.cy());
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
    ctx.moveTo(this.collider_.cx(), this.collider_.cy());
    ctx.lineTo(this.collider_.cx() + xm * Player.LENGTH / 2 * dir,
               this.collider_.cy() + ym * Player.LENGTH / 2);
    ctx.stroke();
  }
};

Player.prototype.asCollider = function() {
  return this.collider_;
};

Player.prototype.tick = function(t) {
  if (!this.game_.keyDown('z')) {
    this.justDropped_ = false;
  }
  var vdx = 0;
  var vdy = 0;
  if (this.game_.keyDown(Keys.LEFT)) {
    vdx -= 290;
  }
  if (this.game_.keyDown(Keys.RIGHT)) {
    vdx += 290;
  }
  if (this.game_.keyPressed(Keys.UP)) {
    vdy -= Player.MAX_V_Y / 2;
    this.flapAnim_ = 1;
  } else if (this.game_.keyDown(Keys.DOWN)) {
    if (this.collider_.vy < -5) {
      vdy += 500;
    } else {
      vdy += 250;
    }
  }
  if (this.flapAnim_) {
    this.flapAnim_ += t * FRAME_RATE;
  }

  this.collider_.gravityAccel(t);
  this.collider_.vx += t * vdx;
  this.collider_.vy += t * vdy;
  var cs = this.collider_.tick(t);

  if (this.possession_ && !this.possession_.dead) {
    var pc = this.possession_.asCollider();
    var vx = cs.dx / t;
    var vy = cs.dy / t;
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

    var owner = this.possession_.owner();
    var collideXv = Math.max(pcs.hitXv, cs.hitXv);
    var collideYv = Math.max(pcs.hitYv, cs.hitYv);
    var magPlayer = this.collider_.mass * t * Math.sqrt(
        collideXv * collideXv + collideYv * collideYv);
    if (magPlayer > 40) {
      this.possessionDrop();
    } else if (owner && owner.acceptDelivery(this.possession_)) {
      this.possession_ = null;
    } else if (this.game_.keyPressed('z')) {
      this.possessionDrop();
    }
  } else {
    this.possession_ = null;
    for (var i = 0; i < this.game_.ents().length; ++i) {
      if (this.game_.ents()[i] && this.game_.ents()[i].kind == EntKind.POS) {
        this.possessionHit(this.game_.ents()[i]);
      }
    }
  }

  this.collider_.clampVx(Player.MAX_V_X);
  this.collider_.clampVy(Player.MAX_V_Y);
};

Player.prototype.possessionHit = function(possession) {
  var pickupZone = possession.asCollider().aabb.clone();
  pickupZone.p1.y -= 5;
  pickupZone.p2.y = pickupZone.p1.y + 10;

  if (pickupZone.overlaps(this.collider_.aabb)) {
    possession.glow();
    if (this.game_.keyDown('z') && !this.justDropped_) {
      this.possessionGet(possession);
    }
  }
};

Player.prototype.possessionGet = function(possession) {
  this.possession_ = possession;

  possession.asCollider().ignores[getUid(this.collider_)] = true;
  this.collider_.ignores[getUid(possession.asCollider())] = true;

  possession.nabbed();
  this.collider_.mass = 10 + possession.asCollider().mass;
};

Player.prototype.possessionDrop = function() {
  this.justDropped_ = this.possession_;
  var possession = this.possession_;

  delete possession.asCollider().ignores[getUid(this.collider_)];
  delete this.collider_.ignores[getUid(possession.asCollider())];
  this.collider_.mass = 10;
  possession.collider_.vx = this.collider_.vx;
  possession.collider_.vy = this.collider_.vy;
  possession.dropped();

  this.possession_ = null;
};

Player.prototype.possession = function() {
  return this.possession_;
};

// +----------------------------------------------------------------------------
// | Possession
Possession = function(game, aabb, mass) {
  this.game_ = game;
  this.falling_ = true;
  this.collider_ = new Collider(game, aabb, 0, 0, mass);
  this.glowing_ = 0;
};

Possession.PICTURE_FRAME = {};
Possession.PICTURE_FRAME.COLORS = [
  Rgb.fromCss('#745520').toRgbString(),
  Rgb.fromCss('#92b273').toRgbString()
];
Possession.PICTURE_FRAME.rndr = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = this.color_;
  var c = this.collider_;
  ctx.fillRect(c.x(), c.y(), c.w(), c.h());
  if (this.glowing_ > 0) {
    this.renderBoxGlow_(renderer);
  }
};
Possession.PICTURE_FRAME.ctor = function(game, x, y, mass) {
  var w = randInt(5, 10);
  var h = randInt(10, 15);
  var c = pick(Possession.PICTURE_FRAME.COLORS);
  var pos = new Possession(game, new geom.AABB(x - w, y - h, w, h), mass);
  pos.color_ = c;
  pos.renderImpl_ = Possession.PICTURE_FRAME.rndr;
  return pos;
};

Possession.FLOWERS = {};
Possession.FLOWERS.COLORS = [
  Rgb.fromCss('#f0e').toRgbString(),
  Rgb.fromCss('#09f').toRgbString(),
  Rgb.fromCss('#f21').toRgbString()
];
Possession.FLOWERS.rndr = function(renderer) {
  var ctx = renderer.context();
  var c = this.collider_;
  ctx.fillStyle = 'rgb(200, 100, 50)';
  ctx.beginPath();
  ctx.moveTo(c.x() + c.w() * 0.2, c.y() + c.h());
  ctx.lineTo(c.x(), c.y() + c.h() * 0.5);
  ctx.lineTo(c.x() + c.w(), c.y() + c.h() * 0.5);
  ctx.lineTo(c.x() + c.w() * 0.8, c.y() + c.h());
  ctx.fill();

  for (var i = this.flowers_.length - 1; i >= 0; --i) {
    var flw = this.flowers_[i];
    ctx.fillStyle = flw.color;
    ctx.fillRect(c.x() + flw.x, c.y() + flw.y, c.h() * 0.3, c.h() * 0.3);
  }
  if (this.glowing_ > 0) {
    this.renderBoxGlow_(renderer);
  }
};
Possession.FLOWERS.ctor = function(game, x, y, mass) {
  var w = 8;
  var h = 14;
  var pos = new Possession(game, new geom.AABB(x - w, y - h, w, h), mass);
  var c = pick(Possession.FLOWERS.COLORS);
  var numFlowers = randInt(1, 4);
  pos.flowers_ = [];
  for (var i = 0; i < numFlowers; ++i) {
    pos.flowers_.push({
      color: pick(Possession.FLOWERS.COLORS),
      x: randFlt(0, w),
      y: randFlt(0, h * 0.3)
    });
  }
  pos.renderImpl_ = Possession.FLOWERS.rndr;
  return pos;
};

Possession.ImgHelper = {};
Possession.ImgHelper.rndr = function(renderer) {
  var ctx = renderer.context();
  var c = this.collider_;
  ctx.drawImage(this.sprite_, c.x(), c.y());

  if (this.glowing_ > 0) {
    this.renderBoxGlow_(renderer);
  }
};

Possession.ImgHelper.ctor = function(spriteKey) {
  return function(game, x, y, mass) {
    var sprite = IMGS[spriteKey];
    var w = sprite.width;
    var h = sprite.height;
    var pos = new Possession(game, new geom.AABB(x - w / 2, y - h, w, h), mass);
    pos.renderImpl_ = Possession.CAT.rndr;
    pos.sprite_ = sprite;
    return pos;
  };
};

Possession.ImgHelper.make = function(spriteKey) {
  var struct = {};
  struct.rndr = Possession.ImgHelper.rndr;
  struct.ctor = Possession.ImgHelper.ctor(spriteKey);
  return struct;
};

Possession.CAT = Possession.ImgHelper.make(IMG.CAT);
Possession.DOG_SMALL = Possession.ImgHelper.make(IMG.DOG_SMALL);
Possession.BABY = Possession.ImgHelper.make(IMG.BABY);
Possession.DOG_LARGE = Possession.ImgHelper.make(IMG.DOG_LARGE);
Possession.PIANO = Possession.ImgHelper.make(IMG.PIANO);
Possession.ELEPHANT = Possession.ImgHelper.make(IMG.ELEPHANT);

Possession.WEIGHTS = [
  {minMass:  0, maxMass:  5, obj: Possession.PICTURE_FRAME},
  {minMass:  0, maxMass:  5, obj: Possession.FLOWERS},
  {minMass:  5, maxMass: 10, obj: Possession.CAT},
  {minMass:  5, maxMass: 10, obj: Possession.DOG_SMALL},
  {minMass:  5, maxMass: 15, obj: Possession.BABY},
  {minMass: 10, maxMass: 15, obj: Possession.DOG_LARGE},
  {minMass: 10, maxMass: 25, obj: Possession.PIANO}
  {minMass: 15, maxMass: 35, obj: Possession.ELEPHANT}
];

Possession.randomPossession = function(game, x, y, maxMass) {
  var possibles = [];
  for (var i = Possession.WEIGHTS.length - 1; i >= 0; --i) {
    var pos = Possession.WEIGHTS[i];
    if (pos.maxMass >= maxMass && !(pos.minMass && pos.minMass >= maxMass)) {
      possibles.push(pos.obj);
    }
  }
  return pick(possibles).ctor(game, x, y, maxMass);
};

Possession.prototype.asCollider = function() {
  return this.collider_;
};

Possession.prototype.tick = function(t) {
  if (this.falling_) {
    this.collider_.gravityAccel(t);
    this.collider_.tick(t);
  }
  this.glowing_ -= t;
};

Possession.prototype.owner = function() {
  return this.owner_;
};

Possession.prototype.setOwner = function(bman) {
  this.owner_ = bman;
};

Possession.prototype.nabbed = function() {
  this.glowing_ = 0;
  this.falling_ = false;
  this.nabbed_ = true;
};

Possession.prototype.dropped = function() {
  this.falling_ = true;
  this.nabbed_ = false;
};

Possession.prototype.kind = EntKind.POS;

Possession.prototype.glow = function(on) {
  this.glowing_ = 0.2;
};

Possession.prototype.renderBoxGlow_ = function(renderer) {
  // dxhr, baby.
  var ctx = renderer.context();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgb(197, 153, 64)';
  var c = this.collider_;
  ctx.strokeRect(c.x(), c.y(), c.w(), c.h());
};

Possession.prototype.renderImpl_ = function(renderer) {
  var ctx = renderer.context();
  ctx.fillStyle = 'rgb(145, 180, 134)';
  var c = this.collider_;
  ctx.fillRect(c.x(), c.y(), c.w(), c.h());
  if (this.glowing_ > 0) {
    this.renderBoxGlow_(renderer);
  }
};

Possession.prototype.render = function(renderer) {
  if (!renderer.boxOnScreen(this.collider_.aabb)) {
    renderer.drawIndicator(IMGS[IMG.HEART_THUMB],
        this.collider_.cx(), this.collider_.cy());
  } else {
    this.renderImpl_(renderer);
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

  this.sprite_ = this.getSprite_();
  this.aabb_ = new geom.AABB(x, y, this.sprite_.width, this.sprite_.height);
};

Bman.FLIPPED_ = null;

Bman.Facing = {
  RIGHT: 1,
  LEFT: -1
};

Bman.prototype.getSprite_ = function() {
  if (this.facing_ == Bman.Facing.RIGHT) {
    return IMGS[IMG.BMAN];
  } else if (Bman.FLIPPED_) {
    return Bman.FLIPPED_;
  } else {
    var spr = IMGS[IMG.BMAN];
    var offscreen = document.createElement('canvas');
    offscreen.width = spr.width;
    offscreen.height = spr.height;
    var ctx = offscreen.getContext('2d');
    ctx.scale(-1, 1);
    ctx.drawImage(spr, -spr.width, 0);
    Bman.FLIPPED_ = offscreen;
    return offscreen;
  }
};

Bman.prototype.strengthLeft = function() {
  if (this.strength_ > 0) {
    return this.strength_ / this.initStrength_;
  } else {
    return 0;
  }
};

Bman.prototype.setPossession = function(p) {
  this.possession_ = p;
  p.setOwner(this);
};

Bman.prototype.asCollider = function() {
  if (this.falling_) {
    return this.falling_;
  }
  return null;
};

Bman.prototype.acceptDelivery = function(p) {
  if (this.possession_ != p) {
    return false;
  }
  if (this.falling_) {
    return false;
  }
  var good = this.aabb_.overlaps(p.asCollider().aabb);
  if (good) {
    this.game_.addSadness(-1);
    this.game_.removeEnt(this, new geom.AABB(
          this.x_, this.y_, this.sprite_.width, this.sprite_.height));
    this.game_.removeEnt(p, p.asCollider().aabb);
  }
  return good;
};

Bman.prototype.kind = EntKind.BMAN;

Bman.prototype.render = function(renderer) {
  var nabbed = this.possession_.nabbed_;
  if (this.falling_) {
    renderer.drawSpriteOrThumb(
        this.falling_.aabb.p1.x, this.falling_.aabb.p1.y,
        this.sprite_, IMGS[IMG.BMAN_THUMB],
        nabbed);
  } else {
    renderer.drawSpriteOrThumb(
        this.x_, this.y_,
        this.sprite_, IMGS[IMG.BMAN_THUMB],
        nabbed);
  }
};

Bman.prototype.tick = function(t) {
  this.strength_ -= t;
  if (this.falling_) {
    this.falling_.gravityAccel(t);
    var collisions = this.falling_.tick(t);
    if (collisions.hitY) {
      this.game_.addSadness(5);
      this.game_.removeEnt(this, this.falling_.aabb);
      this.game_.removeEnt(
          this.possession_, this.possession_.asCollider().aabb);
    }
  } else if (this.jumpFrame_) {
    if (this.jumpFrame_ > 30) {
      this.x_ += this.facing_ * this.sprite_.width;
      this.falling_ = new Collider(
          this.game_,
          new geom.AABB(this.x_, this.y_,
                        this.sprite_.width, this.sprite_.height),
          0, 0, 100);
      this.falling_.ignoreBlocks = makeSet(BlockKind.SKYSCRAPER);
    } else {
      this.jumpFrame_ += t * FRAME_RATE;
    }
  } else if (this.strength_ < 0) {
    this.jumpFrame_ = 1;
  }
};

// +----------------------------------------------------------------------------
// | Poof
Poof = function(game, aabb, opt_t) {
  this.game = game;
  this.x = aabb.p1.x;
  this.y = aabb.p1.y;
  this.w = aabb.p2.x - aabb.p1.x;
  this.h = aabb.p2.y - aabb.p1.y;
  this.t = opt_t || 2;
  this.dx1 = randInt(-5, 5);
  this.dy1 = -3 - randInt(7);
  this.dx2 = randInt(-5, 5);
  this.dy2 = -3 - randInt(7);
  this.sx1 = this.w / 3 + randInt(this.w) / 3;
  this.sy1 = this.h / 3 + randInt(this.h) / 3;
  this.sx2 = this.w / 3 + randInt(this.w) / 3;
  this.sy2 = this.h / 3 + randInt(this.h) / 3;
  this.c1 = pick(Poof.COLORS);
  this.c2 = pick(Poof.COLORS);
};

Poof.COLORS = [
  Rgb.fromCss('#ccc').toRgbString(),
  Rgb.fromCss('#dcd').toRgbString(),
  Rgb.fromCss('#ecf').toRgbString(),
  Rgb.fromCss('#ccd').toRgbString()
];

Poof.prototype.asCollider = function() { return null; }

Poof.prototype.tick = function(t) {
  this.t -= t;
  if (this.t < 0) {
    this.game.removeEnt(this);
  }
};

Poof.prototype.render = function(renderer) {
  var ctx = renderer.context();
  var step = this.t < 2 ? (2 - this.t) / 2 : 0;
  ctx.globalAlpha = 1 - step;

  ctx.fillStyle = this.c1;
  ctx.fillRect(
      this.x + step * this.dx1,
      this.y + step * this.dy1,
      this.sx1, this.sy1);
  ctx.fillStyle = this.c2;
  ctx.fillRect(
      this.x + this.sx2 + step * this.dx2,
      this.y + this.sy2 + step * this.dy2,
      this.w - this.sx2, this.h - this.sy2);

  ctx.globalAlpha = 1;
};
