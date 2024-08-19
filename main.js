const canvas = document.getElementById("myCanvas");
canvas.width = 200;

const ctx = canvas.getContext("2d");

const car = new Car(100, 100, 30, 50);
const road = new Road(canvas.width/2, canvas.width * 0.9);
car.draw(ctx);

animate();

function animate() {
  car.update();
  canvas.height = window.innerHeight; //also clears the canvas lol
  road.draw(ctx);
  car.draw(ctx);
  requestAnimationFrame(animate);
}