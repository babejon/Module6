const svg = document.getElementById("graphArea");

let points = [];
let clusters = [];
let assignments = [];
let k;

const Colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231","#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe"];

//Обработка клика по SVG - добавление точки
svg.addEventListener("click", (event) => {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  const clickX = (event.clientX - rect.left) / rect.width * viewBox.width;
  const clickY = (event.clientY - rect.top) / rect.height * viewBox.height;

  points.push({ x: clickX, y: clickY });

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", clickX);
  circle.setAttribute("cy", clickY);
  circle.setAttribute("r", 3);
  circle.setAttribute("class", "point");
  svg.appendChild(circle);
});

function clearGraph() {
  points = [];
  clusters = [];
  assignments = [];

  svg.querySelectorAll("circle").forEach(el => el.remove());
}

//Запуск алгоритма
function startAlgo() {
  const kInput = document.getElementById("kValue");
  k = parseInt(kInput.value);

  if (isNaN(k) || k < 1 || k > 10) {
    alert("Введите корректное значение k (от 1 до 10)");
    return;
  }

  if (points.length < k) {
    alert("Недостаточно точек для кластеризации.");
    return;
  }

  assignments = new Array(points.length).fill(-1);
  clusters = initializeKMeansPlusPlus(points, k).map((c, i) => ({
    x: c.x,
    y: c.y,
    color: Colors[i]
  }));

  stepKMeans();
}

//Инициализация K-Means++ 
function initializeKMeansPlusPlus(points, k) {
  const centroids = [];

  const first = points[0];
  centroids.push({ x: first.x, y: first.y });

  while (centroids.length < k) {
    const distances = points.map(p => {
      let minDist = Infinity;
      centroids.forEach(c => {
        const dist = Math.hypot(p.x - c.x, p.y - c.y);
        minDist = Math.min(minDist, dist);
      });
      return minDist ** 2;
    });

    const total = distances.reduce((sum, d) => sum + d, 0);
    let r = Math.random() * total;
    let index = 0;

    while (r > distances[index]) {
      r -= distances[index];
      index++;
    }

    centroids.push({ x: points[index].x, y: points[index].y });
  }

  return centroids;
}

//Основной цикл кластеризации 
function stepKMeans() {
  const maxIterations = 10;

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    const newAssignments = points.map(p => {
      let minDist = Infinity;
      let clusterIndex = 0;

      clusters.forEach((c, i) => {
        const dist = Math.hypot(p.x - c.x, p.y - c.y);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      });

      return clusterIndex;
    });

    for (let i = 0; i < points.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }

    assignments = newAssignments;

    // Пересчёт центров кластеров
    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i);
      if (clusterPoints.length === 0) continue;

      const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
      const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;

      clusters[i].x = avgX;
      clusters[i].y = avgY;
    }

    if (!changed) break;
  }

  drawClusters();
}

//Отрисовка кластеров и точек 
function drawClusters() {
  svg.querySelectorAll("circle").forEach(c => c.remove());

  // Точки
  points.forEach((p, i) => {
    const c = clusters[assignments[i]];
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("cx", p.x);
    point.setAttribute("cy", p.y);
    point.setAttribute("r", 3);
    point.setAttribute("fill", c?.color || "gray");
    point.setAttribute("stroke", "black");
    svg.appendChild(point);
  });

  // Центры кластеров
  clusters.forEach(c => {
    const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    center.setAttribute("cx", c.x);
    center.setAttribute("cy", c.y);
    center.setAttribute("r", 6);
    center.setAttribute("fill", c.color);
    center.setAttribute("stroke", "black");
    center.setAttribute("stroke-width", "2");
    svg.appendChild(center);
  });
}
