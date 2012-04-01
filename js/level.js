// +----------------------------------------------------------------------------
// | Level

BlockKind = {
  BASIC: 1,
  SKYSCRAPER: 2,
  HOME: 3,
  BACKGROUND: 4
};

function Level() {
  this.blocks_ = [];
};

Level.prototype.addBlock = function(aabb, color, opt_kind) {
  this.blocks_.push({
    bounds: aabb,
    color: color,
    kind: opt_kind || BlockKind.BASIC
  });
};

Level.prototype.addBackground

Level.prototype.render = function(renderer) {
  var ctx = renderer.context();
  for (var i = this.blocks_.length - 1; i >=0; --i) {
    var block = this.blocks_[i];
    var aabb = block.bounds;
    if (renderer.boxOnScreen(aabb)) {
      ctx.fillStyle = block.color.toRgbString();
      ctx.fillRect(aabb.p1.x, aabb.p1.y,
          aabb.p2.x - aabb.p1.x, aabb.p2.y - aabb.p1.y);
      if (block.kind == BlockKind.SKYSCRAPER) {
        ctx.fillStyle = 'rgba(60, 60, 100, 0.5)';
        for (var y = aabb.p1.y + 20; y < aabb.p2.y; y += 40) {
          ctx.fillRect(aabb.p1.x + 10, y, aabb.p2.x - aabb.p1.x - 20, 20);
        }
      }
    } else {
      var dir = sgn(aabb.p2.x - renderer.xOffset());
      var dist;
      if (dir == 1) {
        dist = aabb.p1.x - renderer.xOffset() - renderer.width();
      } else {
        dist = renderer.xOffset() - aabb.p2.x;
      }
      var d = 400;
      var w = 10;
      if (dist < d) {
        ctx.fillStyle = block.color.toRgbString();
        ctx.globalAlpha = (d - dist) / d;
        var x = dir == 1 ?
          renderer.xOffset() + renderer.width() - w : renderer.xOffset();
        ctx.fillRect(x, aabb.p1.y, w, aabb.p2.y - aabb.p1.y);
        ctx.globalAlpha = 1;
      }
    }
  }
};

Level.prototype.collides = function(aabb, dx, dy, ignoreBlocks) {
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
      var block = this.blocks_[i];
      var bound = block.bounds;
      if (block.kind == BlockKind.BACKGROUND) continue;
      if (ignoreBlocks && block.kind in ignoreBlocks) continue;
      if (bound.overlaps(aabb)) {
        var tx;
        if (dx > 0) {
          tx = (bound.p1.x - aabb.p2.x - EPSILON) / dx;
        } else {
          tx = (bound.p2.x - aabb.p1.x + EPSILON) / dx;
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
      var block = this.blocks_[i];
      var bound = block.bounds;
      if (block.kind == BlockKind.BACKGROUND) continue;
      if (ignoreBlocks && block.kind in ignoreBlocks) continue;
      if (bound.overlaps(aabb)) {
        var ty;
        if (dy > 0) {
          ty = (bound.p1.y - aabb.p2.y - EPSILON) / dy;
        } else {
          ty = (bound.p2.y - aabb.p1.y + EPSILON) / dy;
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

Level.prototype.indicesOfKinds = function(kinds) {
  var indices = [];
  for (var i = this.blocks_.length - 1; i >= 1; --i) {
    if (this.blocks_[i].kind in kinds) {
      indices.push(i);
    }
  }
  return indices;
};

Level.prototype.randomOfKind = function(kind) {
  var found = this.indicesOfKinds(makeSet(kind));
  if (found.length) {
    var randomIndex = randInt(found.length);
    return this.blocks_[found[randomIndex]].bounds.clone();
  }
  return null;
};
