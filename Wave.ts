class Wave {
  static readonly initialDelay = 1000;

  readonly spawnList: SpawnInstruction[];
  readonly enemies: GameObject[] = [];

  duration = 0;

  constructor(readonly game: Game, readonly number: number){
    this.spawnList = [];
    const minimumSpawnDelay = 1000;
    const maximumSpawnDelay = 3000;
    const numberOfEnemies = 5;

    let spawnTime = Wave.initialDelay;

    while(this.spawnList.length < numberOfEnemies) {
      this.spawnList.push({ enemyType: SlidingThrowingEnemy, numberOfMoves: 10, spawnTime: spawnTime });
      spawnTime += minimumSpawnDelay + Math.random() * (maximumSpawnDelay - minimumSpawnDelay);
    }
  }

  tick(dt: number) {
    this.duration += dt;

    this.cullDeadEnemies();

    while(this.spawnList.length && this.spawnList[0].spawnTime < this.duration) {
      this.spawn(this.spawnList.shift()!);
    }
  }

  isComplete() {
    return this.spawnList.length === 0 && this.enemies.length === 0;
  }

  private cullDeadEnemies() {
    for(let i = this.enemies.length - 1; i >= 0; i--) {
      if(this.enemies[i].destroyed) this.enemies.splice(i, 1);
    }
  }

  private spawn(instruction: SpawnInstruction) {
    const spawnPoint = this.pickSpawnPoint(instruction.enemyType);
    this.enemies.push(new instruction.enemyType(this.game, spawnPoint));
  }

  private pickSpawnPoint(enemyType: EnemyType) {
    const centerOfMass = {x:0, y: 0};

    const enemies = this.game.getObjectsOfType(enemyType);
    for(const e of enemies) {
      centerOfMass.x += e.x / enemies.length;
      centerOfMass.y += e.y / enemies.length;
    }

    const spawnDirection = enemies.length
      ? direction(centerOfMass, this.game.center)
      : Math.random() * 2 * Math.PI;


    return {
      x: this.game.center.x + Math.cos(spawnDirection) * this.game.diagonalSize/2,
      y: this.game.center.y + Math.sin(spawnDirection) * this.game.diagonalSize/2
    };
  }
}

interface SpawnInstruction {
  spawnTime: number;
  numberOfMoves: number;
  enemyType: EnemyType;
}

interface EnemyType {
  new(game: Game, spawnPoint: Point): GameObject
}