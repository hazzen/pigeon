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

  var ndx = dx;
  if (dx != 0) {
    if (dx < 0) {
      aabb.p1.x += dx;
    } else {
      aabb.p2.x += dx;
    }
    for (var i = this.blocks_.length - 1; i >= 0; --i) {
      var block = this.blocks_[i].bounds;
      if (block.overlaps(aabb)) {
        xBlocks.push(block);
        if (dx > 0) {
          ndx = Math.min(ndx, block.p1.x - aabb.p2.x - EPSILON);
        } else {
          ndx = Math.max(ndx, block.p2.x - aabb.p1.x + EPSILON);
        }
      }
    }
    aabb.p1.x -= dx - ndx;
    aabb.p2.x -= dx - ndx;
  }

  var ndy = dy;
  if (dy != 0) {
    if (dy < 0) {
      aabb.p1.y += dy;
    } else {
      aabb.p2.y += dy;
    }
    for (var i = this.blocks_.length - 1; i >= 0; --i) {
      var block = this.blocks_[i].bounds;
      if (block.overlaps(aabb)) {
        yBlocks.push(block);
        if (dy > 0) {
          ndy = Math.min(ndy, block.p1.y - aabb.p2.y - EPSILON);
        } else {
          ndy = Math.max(ndy, block.p2.y - aabb.p1.y + EPSILON);
        }
      }
    }
  }

  collisions.xBlocks = xBlocks;
  collisions.yBlocks = yBlocks;
  collisions.dx = ndx;
  collisions.dy = ndy;
  return collisions;
};
