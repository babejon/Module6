const svg = document.getElementById("graphArea");

let points = [];
let clusters = [];
let k;
let assignments = [];

svg.addEventListener("click", (event) => {
  const rect = svg.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const viewBox = svg.viewBox.baseVal;
  const svgX = (clickX / rect.width) * viewBox.width;
  const svgY = (clickY / rect.height) * viewBox.height;

  points.push({ x: svgX, y: svgY });

  const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  point.setAttribute("cx", svgX);
  point.setAttribute("cy", svgY);
  point.setAttribute("r", 3);
  point.setAttribute("class", "point");
  svg.appendChild(point);
});

function clearGraph() {
  points = [];
  clusters = [];
  assignments = [];

  const allPoints = svg.querySelectorAll("circle");
  allPoints.forEach(el => el.remove());
}

function getRandomColor() {
  return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

function startAlgo() {
    const kInput = document.getElementById("kValue");
    k = parseInt(kInput.value);
  
    if (isNaN(k) || k < 1) {
      alert("Введите корректное значение k (от 1 и выше)");
      return;
    }
  
    if (points.length < k) {
      alert("Недостаточно точек для кластеризации.");
      return;
    }

    clusters = [];
    const usedIndices = new Set();
    
    //случайно выбираем первую точку
    const firstIndex = Math.floor(Math.random() * points.length);
    clusters.push({ ...points[firstIndex], color: getRandomColor() });
    usedIndices.add(firstIndex);
    
    // выбираем оставшиеся точки по вероятностному распределению
    while (clusters.length < k) {
      const distances = points.map((p, i) => {
        if (usedIndices.has(i)) return 0;
        let minDist = Infinity;
        clusters.forEach(c => {
          const dist = Math.hypot(p.x - c.x, p.y - c.y);
          if (dist < minDist) minDist = dist;
        });
        return minDist ** 2; // квадраты расстояний
      });
    
      const sum = distances.reduce((acc, d) => acc + d, 0);
      const probs = distances.map(d => d / sum);
    
      // Случайно выбираем следующую точку 
      let r = Math.random();
      let cumulative = 0;
      let nextIndex = 0;
      for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (r <= cumulative) {
          nextIndex = i;
          break;
        }
      }
    
      if (!usedIndices.has(nextIndex)) {
        clusters.push({ ...points[nextIndex], color: getRandomColor() });
        usedIndices.add(nextIndex);
      }
    }
    

  assignments = new Array(points.length).fill(-1);
  stepKMeans(0);
}

// Шаги кластеризации
function stepKMeans(iteration) {
  if (iteration > 10) return;

  let changed = false;

  // Шаг 1: Назначаем точки ближайшему кластеру
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

  // Проверка, были ли изменения
  for (let i = 0; i < points.length; i++) {
    if (assignments[i] !== newAssignments[i]) {
      changed = true;
      break;
    }
  }

  assignments = newAssignments;

  // Шаг 2: Пересчитываем центры кластеров
  for (let i = 0; i < k; i++) {
    const clusterPoints = points.filter((_, idx) => assignments[idx] === i);
    if (clusterPoints.length === 0) continue;
    const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
    const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
    clusters[i].x = avgX;
    clusters[i].y = avgY;
  }

  drawClusters();

  // Анимация: запускаем следующий шаг
  if (changed) {
    setTimeout(() => stepKMeans(iteration + 1), 500);
  }
}

function drawClusters() {
  // Удаление всех кругов
  const allCircles = svg.querySelectorAll("circle");
  allCircles.forEach(c => c.remove());

  // точки
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

  // центры кластеров
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
