const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2, carCanvas.width * 0.9);
const car = new Car(road.getLaneCenter(1), 100, 30, 50, "KEYS");
const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2)
];

animate();

function animate() {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  
  car.update(road.borders, traffic);
  carCanvas.height = window.innerHeight; //also clears the canvas lol
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -car.y+carCanvas.height*0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }
  car.draw(carCtx);

  carCtx.restore();
  Visualizer.drawNetwork(networkCtx, car.brain);
  requestAnimationFrame(animate);
}