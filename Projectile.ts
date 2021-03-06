@queryable
class Projectile extends GameObject {
  z = 0;
  speed = 400;

  team: 'PLAYER' | 'ENEMY' = 'ENEMY';

  constructor(readonly game: Game, public x: number, public y: number, public direction: number) {
    super(game);
    this.game.playSound(this.fireSoundBuffer);
  }

  tick(dt: number) {
    this.x += Math.cos(this.direction) * this.speed * dt / 1000;
    this.y += Math.sin(this.direction) * this.speed * dt / 1000;

    if(!this.game.isInBounds(this)) this.destroy();
  }

  draw(context: CanvasRenderingContext2D) {
    context.translate(this.x, this.y);
    context.rotate(this.direction);

    context.beginPath();
    context.moveTo(-4, -2);
    context.lineTo(4, -2);
    context.lineTo(14, 0);
    context.lineTo(4, 2);
    context.lineTo(-4, 2);
    context.closePath();

    context.fillStyle = 'yellow';
    context.strokeStyle = 'black';
    context.fill();
    context.stroke();
  }

  @fillWithAudioBuffer('sounds/pew.wav')
  protected fireSoundBuffer: AudioBuffer;
}

@queryable
class Buzzsaw extends Projectile {
  readonly HEIGHT = 20;
  readonly WIDTH = 20;
  readonly ROTATIONAL_SPEED = 10;
  dir = 0;
  speed = 200;

  @fillWithImage('images/buzzsaw.png')
  private static buzzsawImage : HTMLImageElement;

  @fillWithAudioBuffer('sounds/buzz.wav')
  protected fireSoundBuffer: AudioBuffer;

  tick(dt: number) {
    super.tick(dt);
    this.dir += (dt * this.ROTATIONAL_SPEED);
  }

  draw(context: CanvasRenderingContext2D) {
    context.translate(this.x, this.y)
    context.rotate(this.dir);
    context.drawImage(
      Buzzsaw.buzzsawImage, 
      0 - (this.WIDTH / 2), 
      0 - (this.HEIGHT / 2), 
      this.WIDTH, 
      this.HEIGHT
    );
  }
}

