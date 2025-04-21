// муравьиный алгоритм коммивояжера хз как работает но вроде ок
// сделал Вася, 1 курс, ФКТИТ

const svg = document.getElementById("graphArea");
let cities = [];
let bestPath = [];
let pheromones = [];
let bestLengthText = null;
const alpha = 1; // вес феромона
const beta = 5;  // вес расстояния
const rho = 0.5; // испарение феромона
const Q = 100;   // константа
const antCount = 20; // сколько муравьёв
const iterations = 100; // сколько раз бегать


svg.addEventListener("click", (e) => {
  const rect = svg.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 200;
  const y = ((e.clientY - rect.top) / rect.height) * 200;
  cities.push({ x, y });
  drawPoint(x, y);
});

function drawPoint(x, y) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", 2);
  circle.classList.add("point");
  svg.appendChild(circle);
}

function drawPath(path) {
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  const points = path.map(i => `${cities[i].x},${cities[i].y}`).join(" ") + ` ${cities[path[0]].x},${cities[path[0]].y}`;
  polyline.setAttribute("points", points);
  polyline.setAttribute("stroke", "red");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("id", "line");
  svg.appendChild(polyline);
}

function drawGrayPath(path) {
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  const points = path.map(i => `${cities[i].x},${cities[i].y}`).join(" ") + ` ${cities[path[0]].x},${cities[path[0]].y}`;
  polyline.setAttribute("points", points);
  polyline.setAttribute("stroke", "#ccc");
  polyline.setAttribute("stroke-width", "1");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("opacity", "0.5");
  svg.appendChild(polyline);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy); // обычная формула
}

function initPheromones(n) {
  pheromones = Array.from({ length: n }, () => Array(n).fill(1)); // стартуем с 1 феромоном везде
}

function selectNextCity(current, visited, distances, pheromones) {
  const probabilities = cities.map((_, j) => {
    if (visited.has(j)) return 0;
    const tau = pheromones[current][j] ** alpha;
    const eta = (1 / distances[current][j]) ** beta;
    return tau * eta;
  });

  const sum = probabilities.reduce((a, b) => a + b, 0);
  const rand = Math.random() * sum;
  let total = 0;

  for (let i = 0; i < probabilities.length; i++) {
    total += probabilities[i];
    if (rand <= total) return i;
  }
  return 0; 
}

async function startAlgo() {
  if (cities.length < 2) return alert("Добавь хотя бы два города, чёрт!");
  const n = cities.length;
  const distances = Array.from({ length: n }, (_, i) =>
    cities.map((_, j) => distance(cities[i], cities[j])));
  initPheromones(n);
  let bestLength = Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    const paths = [];
    const lengths = [];

    for (let ant = 0; ant < antCount; ant++) {
      const visited = new Set();
      const path = [];
      let current = Math.floor(Math.random() * n);
      path.push(current);
      visited.add(current);

      while (visited.size < n) {
        const next = selectNextCity(current, visited, distances, pheromones);
        path.push(next);
        visited.add(next);
        current = next;
      }

      path.push(path[0]);
      const length = path.reduce((acc, _, i) =>
        i < path.length - 1 ? acc + distances[path[i]][path[i + 1]] : acc, 0);

      if (length < bestLength) {
        bestLength = length;
        bestPath = path.slice();
      }

      paths.push(path);
      lengths.push(length);
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pheromones[i][j] *= (1 - rho); 
      }
    }

    for (let k = 0; k < paths.length; k++) {
      const path = paths[k];
      const contrib = Q / lengths[k];
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        pheromones[a][b] += contrib;
        pheromones[b][a] += contrib;
      }
    }

    if (iter % 10 === 0 || iter === iterations - 1) {
      [...svg.querySelectorAll("polyline")].forEach(el => el.remove());
      drawGrayPathsExceptBest(bestPath);
      drawPath(bestPath);
    }
  }

  // выводим длину пути
  if (!bestLengthText) {
    bestLengthText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    bestLengthText.setAttribute("x", "10");
    bestLengthText.setAttribute("y", "190");
    bestLengthText.setAttribute("fill", "black");
    bestLengthText.setAttribute("font-size", "10");
    svg.appendChild(bestLengthText);
  }
  
}

function drawGrayPathsExceptBest(best) {
  for (let i = 0; i < best.length - 1; i++) {
    for (let j = 0; j < best.length - 1; j++) {
      if (i !== j) {
        const path = [best[i], best[j]];
        drawGrayPath(path);
      }
    }
  }
}

function clearGraph() {
  cities = [];
  bestPath = [];
  pheromones = [];
  bestLengthText = null;
  [...svg.querySelectorAll("circle, polyline, text")].forEach(el => el.remove());
}