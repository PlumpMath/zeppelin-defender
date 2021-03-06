/// <reference path="GameObject.ts"/>

@queryable
class Player extends GameObject {
  readonly velocity = {x: 0, y: 0, z: 0};
  z = 0;
  direction = 0;

  @bindToAxis(0)
  moveX = 0;

  @bindToAxis(1)
  moveY = 0;

  platform: Platform|null;

  radius = 12;

  shield: Shield|null = null;

  ammo = 6;

  fireCooldown = 0;

  lifetime = 0;

  invincible = false;

  static readonly reloadTime = 1000;

  @fillWithImage('images/player.png')
  private playerImage : HTMLImageElement;

  constructor(readonly game: Game) {
    super(game);
  }

  tick(dt: number) {
    this.lifetime += dt;

    if(this.lifetime > 3000) this.invincible = false;

    if(!this.shield && Math.max(Math.abs(this.moveX), Math.abs(this.moveY)) > 0) {
      this.direction = Math.atan2(this.moveY, this.moveX);
    }

    this.velocity.z -= 9.8;

    this.x += this.velocity.x * dt/1000;
    this.y += this.velocity.y * dt/1000;
    this.z += this.velocity.z * dt/1000;

    this.doPlatformInteraction();

    this.doCableInteraction();

    this.doBulletInteraction();

    this.positionShield();

    if(this.z < -200) {
      this.game.playSound(Player.fallingSoundBuffer);
      this.destroy();
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
  }

  draw(context: CanvasRenderingContext2D) {
    //draw shadow
    context.save();
    context.beginPath();
    for(let p of this.game.getObjectsOfType(Platform)) {
      if(p.z > this.z) continue;
      context.rect(p.x - (p.scale * p.width/2), p.y - (p.scale * p.height/2), p.scale * p.width, p.scale * p.height);
    }
    context.clip();
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    const platformDistanceBelow = this.platform ? this.platform.z : 0;
    const platformScale = this.platform ? this.platform.scale : 1;
    context.arc(this.x, this.y - platformDistanceBelow/2, this.radius * platformScale, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    if(this.invincible && Math.floor(this.lifetime / 125) % 2) return;
    //draw player
    context.translate(this.x, this.y - this.z/2);
    const scale = Math.max(0, 1 + this.z/200);
    context.scale(scale, scale);
    context.rotate(this.direction);
    context.drawImage(this.playerImage, -12, -12, 24, 24);
  /*  context.beginPath();
    context.fillStyle = 'red';
    context.arc(0, 0, this.radius, 0, 2 * Math.PI);
    context.fill();

    context.beginPath();
    context.strokeStyle = 'black';
    context.moveTo(0, 0);
    context.lineTo(this.radius, 0);
    context.stroke()
    */
  }

  @bindTo('FIRE', 'press')
  fireProjectile() {
    if(this.ammo <= 0 || this.fireCooldown > 0) return;
    this.invincible = false;
    this.ammo--;
    this.fireCooldown = Player.reloadTime;
    const projectile = new Projectile(this.game, this.x, this.y, this.direction);
    projectile.team = 'PLAYER';
  }

  @bindTo('JUMP', 'press')
  jump() {
    if(!this.platform) return;
    this.velocity.x += this.platform.velocity.x;
    this.velocity.y += this.platform.velocity.y;
    this.velocity.z = 300;
    this.removeFromPlatform();
  }

  @bindTo('BLOCK', 'press')
  block() {
    if(this.shield) return;
    this.shield = new Shield(this.game);
    this.positionShield();
  }

  @bindTo('BLOCK', 'release')
  stopBlocking() {
    if(this.shield) this.shield.destroy();
    this.shield = null;
  }

  destroy() {
    if(this.shield) this.shield.destroy();
    this.removeFromPlatform();
    this.game.remove(this);
  }

  isInvincible() {
    return this.lifetime < 3000;
  }

  private positionShield() {
    if(!this.shield) return;
    this.shield.x = this.x + (1.1 * this.radius + this.shield.thickness/2) * Math.cos(this.direction);
    this.shield.y = this.y + (1.1 * this.radius + this.shield.thickness/2) * Math.sin(this.direction);
    this.shield.direction = this.direction;
  }

  @fillWithAudioBuffer('sounds/ohno.wav')
  private static deathSoundBuffer: AudioBuffer;

  @fillWithAudioBuffer('sounds/Wilhelm_Scream.ogg')
  private static fallingSoundBuffer: AudioBuffer;


  private doPlatformInteraction() {
    if(this.platform) {
      if(!this.platform.occludes(this)) {
        this.removeFromPlatform();
      } else {
        const oldVelocity = {x: this.velocity.x, y: this.velocity.y};

        const walkSpeed = this.shield ? 100 : 200;
        this.velocity.x = this.moveX * walkSpeed;
        this.velocity.y = this.moveY * walkSpeed;

        const dv = {
          x: this.velocity.x - oldVelocity.x,
          y: this.velocity.y - oldVelocity.y,
        };

        this.platform.velocity.x += dv.x/-3;
        this.platform.velocity.y += dv.y/-3;
        if(this.z <= this.platform.z + 1) {
          this.velocity.z = Math.max(0, this.velocity.z);
          this.z = this.platform.z + 1;
        }
      }
    } else {
      for(const p of this.game.getObjectsOfType(Platform)) {
        if(!p.occludes(this)) continue;
        this.platform = p;
        p.addContents(this);
        break;
      }
    }
  }

  private doCableInteraction() {
    for(const cable of this.game.getObjectsOfType(Cable)) {
      const distSquared = distanceSquared(this, cable);
      if(distSquared < Math.pow(this.radius + cable.radius, 2)) {
        const dir = direction(cable, this);
        const dist = this.radius + cable.radius;
        this.x = cable.x + dist * Math.cos(dir);
        this.y = cable.y + dist * Math.sin(dir);
      }
    }
  }

  private doBulletInteraction() {
    if(this.invincible) return;
    for(const projectile of this.game.getObjectsOfType(Projectile)) {
      if(projectile.team === 'PLAYER') continue;
      if(distanceSquared(this, projectile) < Math.pow(this.radius, 2)) {
        this.destroy();
        this.game.playSound(Player.deathSoundBuffer);
      }
    }
  }

  private removeFromPlatform() {
    if(!this.platform) return;
    this.platform.removeContents(this);
    this.platform = null;
  }
}
