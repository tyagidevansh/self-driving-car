const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 360;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2, carCanvas.width * 0.9);
let mutation = 0;
let generation = 1;
let maxScore = 0;
let score = 0;

if (localStorage.getItem("generation")) {
  generation = parseInt(localStorage.getItem("generation"), 10) + 1;
  if (isNaN(generation)) {
    generation = 1;
  }
} else {
  localStorage.setItem("generation", generation.toString());
}

if (localStorage.getItem("maxScore")) {
  maxScore = parseInt(localStorage.getItem("maxScore"), 10);
  if (isNaN(maxScore)) {
    maxScore = 1;
  }
} else {
  localStorage.setItem("maxScore", maxScore.toString());
}

localStorage.setItem("generation", generation.toString());

const maxScoreText = document.getElementById("maxScoreText");
const scoreText = document.getElementById("scoreText");
const carsRemainingText = document.getElementById("carsRemainingText");

document.addEventListener('DOMContentLoaded', (event) => {
  const automated = document.getElementById('automationSwitch');
  automated.addEventListener('change', () => {
    if (automated.checked) {
      console.log("automated!");
    } else {
      console.log("manual");
    }
  });

  const mutationInput = document.getElementById("mutationRange");
  const mutationValue = document.getElementById("mutationValue");

  mutationInput.value = mutation; 
  mutationValue.textContent = mutation;

  mutationInput.addEventListener('input', () => {
    mutationValue.textContent = mutationInput.value;
    mutation = mutationInput.value;
    console.log(mutationInput.value);
  });

  const generationText = document.getElementById("generationText");
  generationText.textContent = generation;
});

let cars = generateCars(100);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(
      localStorage.getItem("bestBrain")
    );
    if ( i != 0) {
      NeuralNetwork.mutate(cars[i].brain, mutation);
    }
  }
}

let traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2)
]

animate();

function save() {
  localStorage.setItem("bestBrain",
    JSON.stringify(bestCar.brain)
  );
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function reset() {
  score = 0;
  cars = generateCars(100);
  let bestCar = cars[0];
  if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(
        localStorage.getItem("bestBrain")
      );
      if ( i != 0) {
        NeuralNetwork.mutate(cars[i].brain, mutation);
      }
    }
    
  }
  traffic = [
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2)
  ]
  generation += 1;

  const generationText = document.getElementById("generationText");
  generationText.textContent = generation;

  localStorage.setItem("generation", generation.toString());
}

function generateCars(n) {
  const cars = [];
  for (let i = 1; i <= n; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }
  return cars;
}

function generateTraffic() {
  const location = bestCar.y;
  const visibleRange = window.innerHeight + 400;
  const minGap = 200;
  const laneCount = 3;
  const maxAttempts = 100;

  traffic = traffic.filter(car => Math.abs(car.y - location) <= visibleRange);

  while (traffic.length < 7) {
    let isValid = false;
    let lane, y;
    let attempts = 0;

    while (!isValid && attempts < maxAttempts) {
      lane = road.getLaneCenter(Math.floor(Math.random() * laneCount));
      y = location - visibleRange - Math.random() * 200;

      const tooClose = traffic.some(car => 
        Math.abs(car.y - y) < minGap || 
        (Math.abs(car.y - y) < 300 && Math.abs(car.x - lane) < 50)
      );

      const carsInRange = traffic.filter(car => Math.abs(car.y - y) < 100);
      const lanesTaken = new Set(carsInRange.map(car => Math.floor(car.x / (road.width / laneCount))));

      isValid = !tooClose && lanesTaken.size < laneCount;
      attempts++;
    }

    if (isValid) {
      traffic.push(new Car(lane, y, 30, 50, "DUMMY", 2));
    } else {
      console.log("Failed to place a car after maximum attempts");
      break;
    }
  }
}

function animate(time) {
  generateTraffic();
  score = Math.max(-bestCar.y, 0);
  if (score > maxScore) {
    maxScore = score;
  }
  scoreText.textContent = Math.floor(score / 10);
  maxScoreText.textContent = Math.floor(maxScore / 10);
  localStorage.setItem("maxScore", maxScore.toString());
  
  carsRemainingText.textContent = cars.filter(car => Math.abs(car.y - bestCar.y < window.innerHeight * 0.4)).length;
  
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  
  bestCar = cars.find(
    c => c.y == Math.min(
      ...cars.map(c=>c.y)
    )
  );

  carCanvas.height = window.innerHeight; //also clears the canvas lol
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y+carCanvas.height*0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }

  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx);
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, true);
  
  carCtx.restore();
  networkCtx.lineDashOffset = -time/50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}