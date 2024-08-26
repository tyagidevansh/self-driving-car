const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 360;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2, carCanvas.width * 0.9);
let mutation = 0.1;
let trainingStartTime = new Date().getTime();
let trainingDuration = 60000;
let maxIterations = 100;
let generation = 1;
let maxScore = 0;
let score = 0;
let isAutomated = false;
let isBrainLoaded = false;
let loadedBrain; 
let numberOfCars = 100;

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
  isAutomated = automated.checked;  
  automated.addEventListener('change', () => {
    isAutomated = automated.checked; 
    if (isAutomated) {
      trainingStartTime = new Date().getTime();
    }
  });

  const mutationInput = document.getElementById("mutationRange");
  const mutationValue = document.getElementById("mutationValue");

  mutationInput.value = mutation; 
  mutationValue.textContent = mutation;

  mutationInput.addEventListener('input', () => {
    mutationValue.textContent = mutationInput.value;
    mutation = mutationInput.value;
  });

  const generationText = document.getElementById("generationText");
  generationText.textContent = generation;

  const sensorRange = document.getElementById("sensorRange");
  const sensorValue = document.getElementById("sensorValue");
  const angleRange = document.getElementById("angleRange");
  const angleValue = document.getElementById("angleValue");

  sensorRange.value = 10;
  angleRange.value = 120;
  sensorValue.textContent = sensorRange.value;
  angleRange.value = angleRange.value;
  const rayCount = parseInt(sensorRange.value);
  sensorValue.textContent = rayCount;
  cars.forEach(car => car.sensor.setRayCount(rayCount));
  const angle = parseInt(angleRange.value);
  angleValue.textContent = angle;
  cars.forEach(car => car.sensor.setRaySpread(angle));

  sensorRange.addEventListener('input', () => {
    const rayCount = parseInt(sensorRange.value);
    sensorValue.textContent = rayCount;
    cars.forEach(car => car.sensor.setRayCount(rayCount));
  });

  angleRange.addEventListener('input', () => {
    const angle = parseInt(angleRange.value);
    angleValue.textContent = angle;
    cars.forEach(car => car.sensor.setRaySpread(angle));
  })

  const carRange = document.getElementById("carRange");
  const carValue = document.getElementById("carValue");

  carRange.value = numberOfCars;
  carValue.textContent = carRange.value;

  carRange.addEventListener('input', () => {
    numberOfCars = carRange.value;
    carValue.textContent = carRange.value;
  });
  
});

let cars = generateCars(numberOfCars);
let bestCar = cars[0];

if (localStorage.getItem("loadedBrain")) {
  loadedBrain = JSON.parse(localStorage.getItem("loadedBrain"));
  isBrainLoaded = true;
  applyLoadedBrain(loadedBrain);
} else if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(
      localStorage.getItem("bestBrain")
    );
    if (i != 0) {
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
  
  if (isAutomated) {
    const sortedCars = cars.sort((a, b) => b.fitness - a.fitness);
    cars = generateNextGeneration(sortedCars);
  } else {
    cars = generateCars(numberOfCars);
  }
  
  bestCar = cars[0];

  if (isBrainLoaded && loadedBrain) {
    applyLoadedBrain(loadedBrain);
  } else if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(
        localStorage.getItem("bestBrain")
      );
      if (i != 0) {
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
  ];

  generation += 1;

  const generationText = document.getElementById("generationText");
  generationText.textContent = generation;

  localStorage.setItem("generation", generation.toString());

  if (isAutomated) {
    trainingStartTime = new Date().getTime();
  }

  const rayCount = parseInt(document.getElementById('sensorRange').value);
  const raySpread = parseInt(document.getElementById('angleRange').value);

  cars.forEach(car => {
    car.sensor.setRayCount(rayCount);
    car.sensor.setRaySpread(raySpread);
  });
}

function loadBrain(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const brain = JSON.parse(e.target.result);
        resolve(brain);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
});
}

document.getElementById('brainLoader').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      loadedBrain = await loadBrain(file);
      isBrainLoaded = true;
      localStorage.setItem("loadedBrain", JSON.stringify(loadedBrain));
      applyLoadedBrain(loadedBrain);
    } catch (error) {
      console.error('Error loading brain:', error);
    }
  }
});

function applyLoadedBrain(loadedBrain) {
  cars.forEach((car, index) => {
    car.brain = JSON.parse(JSON.stringify(loadedBrain));
    if (index !== 0) {
      NeuralNetwork.mutate(car.brain, mutation);
    }
  });
  console.log('Brain loaded and applied successfully');
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
      break;
    }
  }
}

function calculateFitness(car) {
  const distanceScore = -car.y * 2; 
  const speedScore = car.speed * 20; 
  const trafficClearedScore = car.trafficCleared * 5000; 
  //const laneCenteringScore = 1 - (Math.abs(car.x - road.getLaneCenter(Math.floor(car.x / (road.width / 3)))) / (road.width / 6));
  const laneCenteringScore = 0;
  const collisionPenalty = car.damaged ? 2000 : 0; 
  
  return distanceScore + speedScore + trafficClearedScore + laneCenteringScore * 100 - collisionPenalty;
}

function generateNextGeneration(sortedCars) {
  const newCars = [];
  const topPerformers = sortedCars.slice(0, Math.ceil(cars.length * 0.2)); // top 20%

  for (let i = 0; i < numberOfCars; i++) {
    if (i < topPerformers.length) {
      newCars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
      newCars[i].brain = JSON.parse(JSON.stringify(topPerformers[i].brain));
    } else {
      const parentBrain = topPerformers[Math.floor(Math.random() * topPerformers.length)].brain;
      newCars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
      newCars[i].brain = JSON.parse(JSON.stringify(parentBrain));
      NeuralNetwork.mutate(newCars[i].brain, mutation);
    }
  }
  return newCars;
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
  
  const aliveCars = cars.filter(car => !car.damaged);
  carsRemainingText.textContent = aliveCars.length;

  if (isAutomated) {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - trainingStartTime;

    if (elapsedTime >= trainingDuration || aliveCars.length === 0) {
      const sortedCars = cars.sort((a, b) => b.fitness - a.fitness);
      const topPerformer = sortedCars[0];

      if (topPerformer.fitness > bestCar.fitness) {
        bestCar = topPerformer;
        save();
        maxScore = score;
        localStorage.setItem("maxScore", maxScore.toString());
      }

      generation++;
      cars = generateNextGeneration(sortedCars);
      reset();
    } else {
      cars.forEach(car => {
        if (car.speed < 1 && elapsedTime > 5000 || car.y > bestCar.y + 300) {
          car.damaged = true;
        }
      });
    }
  }
  
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  
  cars.forEach(car => {
    car.fitness = calculateFitness(car);
  });

  bestCar = cars.reduce((best, car) => (car.fitness > best.fitness ? car : best), cars[0]);

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

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
  networkCtx.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}