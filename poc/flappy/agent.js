function mutate(x) {
  if (Math.random() < 0.1) {
    let offset = randomGaussian() * 0.5;
    let newX = x + offset;
    return newX;
  } else {
    return x;
  }
}

// Random gaussian variables. This function is not mine, is from p5.js
let previous = false;
let y2 = 0;


function randomGaussian(mean, sd){
  let y1, x1, x2, w;
  if (previous) {
    y1 = y2;
    previous = false;
  } else {
    do {
      x1 = Math.random() * 2 - 1;
      x2 = Math.random() * 2 - 1;
      w = x1 * x1 + x2 * x2;
    } while (w >= 1);
    w = Math.sqrt(-2 * Math.log(w) / w);
    y1 = x1 * w;
    y2 = x2 * w;
    previous = true;
  }

  let m = mean || 0;
  let s = sd || 1;
  return y1 * s + m;
}

class Agent {
  constructor(brain){
    if (brain instanceof NeuralNetwork){

      this.x = 64;
      this.y = GAME_HEIGHT / 2;
      this.r = 12;

      // Gravity, lift and velocity
      this.gravity = 0.8;
      this.lift = -12;
      this.velocity = 0;

      this.brain = brain.copy();
      this.brain.mutate(mutate);
    } else {
      let inputLayers = Number.parseInt($('#inputLayers').val());
      let hiddenLayers = Number.parseInt($('#hiddenLayers').val());
      this.brain = new NeuralNetwork(inputLayers, hiddenLayers, 2);
    }
    this.mathInputs = [];

    for (let i = 0; i < userInputs.length; i++){
      this.mathInputs.push(math.parse(userInputs[i]).compile());
    }

    this.score = 0;
    this.fitness = 0;
  }

  copy(){
    return new Agent(this.brain);
  }

  // Display the bird
  show(game) {
    game.fill(255, 100);
    game.stroke(255);
    game.ellipse(this.x, this.y, this.r * 2, this.r * 2);
  }

  think(){

    // First find the closest pipe
    let closest = null;
    let record = Infinity;
    for (let i = 0; i < pipes.length; i++) {
      let diff = pipes[i].x - this.x;
      if (diff > 0 && diff < record) {
        record = diff;
        closest = pipes[i];
      }
    }

    if (closest != null) {
      // Now create the inputs to the neural network
      let inputs = [];

      this.scope = {
        birdX: this.x,
        birdY: this.y,
        birdVelocity: this.velocity,
        birdMinVelocity: -5,
        birdMaxVelocity: 5,
        pipesClosestX: closest.x,
        pipesClosestTop: closest.top,
        pipesClosestBottom: closest.bottom,
        gameHeight: GAME_HEIGHT,
        gameWidth: GAME_WIDTH
      };

      for (let i = 0; i < this.mathInputs.length; i++){
        inputs[i] = this.mathInputs[i].eval(this.scope);
      }
      // x position of closest pipe
      //inputs[0] = closest.x / GAME_WIDTH; // map(closest.x, this.x, width, 0, 1);
      // top of closest pipe opening
      //inputs[1] = closest.top / GAME_HEIGHT; //map(closest.top, 0, GAME_HEIGHT, 0, 1);
      // bottom of closest pipe opening
      //inputs[2] = closest.bottom / GAME_HEIGHT;// map(closest.bottom, 0, GAME_HEIGHT, 0, 1);
      // bird's y position
      //inputs[3] = this.y / GAME_HEIGHT; //map(this.y, 0, GAME_HEIGHT, 0, 1);
      // bird's y velocity
      //inputs[4] = this.velocity / 5; //map(this.velocity, -5, 5, 0, 1);

      // Get the outputs from the network
      let action = this.brain.predict(inputs);
      // Decide to jump or not!
      if (action[1] > action[0]) {
        this.up();
      }
    }

  }

  // Jump up
  up() {
    this.velocity += this.lift;
  }

  bottomTop() {
    // Bird dies when hits bottom?
    return (this.y > GAME_HEIGHT || this.y < 0);
  }

  // Update bird's position based on velocity, gravity, etc.
  update() {
    this.velocity += this.gravity;
    // this.velocity *= 0.9;
    this.y += this.velocity;

    // Every frame it is alive increases the score
    this.score++;
  }

}