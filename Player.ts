@queryable
class Player implements GameObject {
  x: number;
  y: number;
  readonly velocity = {x: 0, y: 0, z: 0};
  z = 0;
  direction = 0;

  @bindToAxis(0)
  moveX = 0;

  @bindToAxis(1)
  moveY = 0;

  platform: Platform|null;

  constructor(readonly game: Game) {
    // Whoa this seems fragile.
    this.platform = game.getObjectsOfType(Platform)[0];
    this.x = this.platform.x;
    this.y = this.platform.y;
    this.z = this.platform.z + 1;
    this.platform.addContents(this);
  }

  tick(dt: number) {
    if(Math.max(Math.abs(this.moveX), Math.abs(this.moveY)) > 0) {
      this.direction = Math.atan2(this.moveY, this.moveX);
    }

    this.velocity.z -= 9.8;

    this.x += this.velocity.x * dt/1000;
    this.y += this.velocity.y * dt/1000;
    this.z += this.velocity.z * dt/1000;

    this.doPlatformInteraction();


    if(this.z < -200) {
      this.destroy();
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const radius = 12;
    //draw shadow
    context.save();
    context.beginPath();
    for(let p of this.game.getObjectsOfType(Platform).filter(p => this.z > p.z)) {
      context.rect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
    }
    context.clip();
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.arc(this.x, this.y, radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    //draw player
    context.translate(this.x, this.y - this.z/2);
    const scale = Math.max(0, 1 + this.z/200);
    context.scale(scale, scale);
    context.rotate(this.direction);
    context.beginPath();
    context.fillStyle = 'red';
    context.arc(0, 0, radius, 0, 2 * Math.PI);
    context.fill();

    context.beginPath();
    context.strokeStyle = 'black';
    context.moveTo(0, 0);
    context.lineTo(radius, 0);
    context.stroke()
  }

  @bindTo('press', {button: 2})
  fireProjectile() {
    this.game.add(new Projectile(this.game, this.x, this.y, this.direction));
  }

  @bindTo('press', {button: 0})
  jump() {
    if(!this.platform) return;
    this.velocity.x += this.platform.velocity.x;
    this.velocity.y += this.platform.velocity.y;
    this.velocity.z = 250;
    this.removeFromPlatform();
  }

  destroy() {
    this.removeFromPlatform();
    this.game.remove(this);
  }

  private doPlatformInteraction() {
    if(this.platform) {
      if(!this.platform.occludes(this)) {
        this.removeFromPlatform();
      } else {
        const oldVelocity = {x: this.velocity.x, y: this.velocity.y};

        this.velocity.x = this.moveX * 200;
        this.velocity.y = this.moveY * 200;

        const dv = {
          x: this.velocity.x - oldVelocity.x,
          y: this.velocity.y - oldVelocity.y,
        };

        this.platform.velocity.x += dv.x/-5;
        this.platform.velocity.y += dv.y/-5;
        if(this.z <= this.platform.z + 1) {
          this.velocity.z = Math.max(0, this.velocity.z);
          this.z = this.platform.z + 1;
        }
      }
    } else {
      const occludingPlatforms = this.game.getObjectsOfType(Platform).filter(p => p.occludes(this));
      if(occludingPlatforms[0]) {
        this.platform = occludingPlatforms[0];
        occludingPlatforms[0].addContents(this);
      }
    }
  }

  private removeFromPlatform() {
    if(!this.platform) return;
    this.platform.removeContents(this);
    this.platform = null;
  }
}

