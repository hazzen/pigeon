// +----------------------------------------------------------------------------
// | Level
function Level(width, height) {
  this.width_ = width;
  this.height_ = height;
  this.blocks_ = [];
};

Level.prototype.width = function() { return this.width_; };
Level.prototype.height = function() { return this.height_; };

Level.prototype.addBlock = function(aabb, color) {
  this.blocks_.push({bounds: aabb, color: color});
};

Level.prototype.render = function(renderer) {
  var ctx = renderer.context();
  for (var i = this.blocks_.length - 1; i >=0; --i) {
    var block = this.blocks_[i];
    var aabb = block.bounds;
    ctx.fillStyle = block.color.toRgbString();
    ctx.fillRect(aabb.p1.x, aabb.p1.y,
                 aabb.p2.x - aabb.p1.x, aabb.p2.y - aabb.p1.y);
  }
};

Level.prototype.collides = function(aabb, dx, dy) {
  var collisions = {};
  var xBlocks = [];
  var yBlocks = [];

  var ntx = 1;
  if (dx != 0) {
    if (dx < 0) {
      aabb.p1.x += dx;
    } else {
      aabb.p2.x += dx;
    }
    for (var i = this.blocks_.length - 1; i >= 0; --i) {
      var block = this.blocks_[i].bounds;
      if (block.overlaps(aabb)) {
        var tx;
        if (dx > 0) {
          tx = (block.p1.x - aabb.p2.x - EPSILON) / dx;
        } else {
          tx = (block.p2.x - aabb.p1.x + EPSILON) / dx;
        }
        xBlocks.push(block);
        ntx = Math.min(tx, ntx);
      }
    }
    aabb.p1.x -= dx - ntx * dx;
    aabb.p2.x -= dx - ntx * dx;
  }

  var nty = 1;
  if (dy != 0) {
    if (dy < 0) {
      aabb.p1.y += dy;
    } else {
      aabb.p2.y += dy;
    }
    for (var i = this.blocks_.length - 1; i >= 0; --i) {
      var block = this.blocks_[i].bounds;
      if (block.overlaps(aabb)) {
        var ty;
        if (dy > 0) {
          ty = (block.p1.y - aabb.p2.y - EPSILON) / dy;
        } else {
          ty = (block.p2.y - aabb.p1.y + EPSILON) / dy;
        }
        yBlocks.push(block);
        nty = Math.min(ty, nty);
      }
    }
  }

  collisions.xBlocks = xBlocks;
  collisions.yBlocks = yBlocks;
  collisions.dtx = ntx;
  collisions.dty = nty;
  return collisions;
};
