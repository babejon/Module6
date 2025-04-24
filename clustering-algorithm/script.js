const svg = document.getElementById("graphArea");

let points = []; 
let clusters = []; 
let assignments = []; // Присваивание точек к кластерам
let k;

const Colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe"];

// Обработка клика по SVG - добавление точки
svg.addEventListener("click", (event) => {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  const clickX = (event.clientX - rect.left) / rect.width * viewBox.width;
  const clickY = (event.clientY - rect.top) / rect.height * viewBox.height;

  points.push({ x: clickX, y: clickY }); // Добавляем точку

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", clickX);
  circle.setAttribute("cy", clickY);
  circle.setAttribute("r", 3);
  circle.setAttribute("class", "point");
  svg.appendChild(circle); // Отображаем точку на графике
});

function clearGraph() {
  points = []; 
  clusters = []; 
  assignments = []; 

  svg.querySelectorAll("circle").forEach(el => el.remove()); // Удаляем все круги
}

// Запуск алгоритма
function startAlgo() {
  const kInput = document.getElementById("kValue");
  k = parseInt(kInput.value); // Получаем значение k

  if (isNaN(k) || k < 1 || k > 10) {
    alert("Введите корректное значение k (от 1 до 10)");
    return;
  }

  if (points.length < k) {
    alert("Недостаточно точек для кластеризации."); 
    return;
  }

  assignments = new Array(points.length).fill(-1); // Инициализируем присваивания
  clusters = initializeKMeansPlusPlus(points, k).map((c, i) => ({ // Инициализация кластеров
    x: c.x,
    y: c.y,
    color: Colors[i]
  }));

  stepKMeans(); // Запускаем основной алгоритм
}

// Инициализация K-Means++
function initializeKMeansPlusPlus(points, k) {
  const centroids = []; // Массив центроидов

  const first = points[0]; 
  centroids.push({ x: first.x, y: first.y }); // Добавляем первую точку как центроид

  while (centroids.length < k) {
    const distances = points.map(p => { // Вычисляем расстояния до центроидов
      let minDist = Infinity;
      centroids.forEach(c => {
        const dist = Math.hypot(p.x - c.x, p.y - c.y);
        minDist = Math.min(minDist, dist);
      });
      return minDist ** 2; // Возвращаем квадрат минимального расстояния
    });

    const total = distances.reduce((sum, d) => sum + d, 0); // Суммируем расстояния
    let r = Math.random() * total; // Генерируем случайное число (от до суммы расстояний)
    let index = 0;

    while (r > distances[index]) { // Находим индекс нового центроида
      r -= distances[index];
      index++;
    }

    centroids.push({ x: points[index].x, y: points[index].y }); // Добавляем новый центроид
  }

  return centroids; // Возвращаем центроиды
}

// Основной цикл кластеризации
function stepKMeans() {
  const maxIterations = 20; // Максимальное количество итераций

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false; // Флаг изменения

    const newAssignments = points.map(p => {
      let minDist = Infinity;
      let clusterIndex = 0;

      clusters.forEach((c, i) => {
        const dist = Math.hypot(p.x - c.x, p.y - c.y); // Вычисляем расстояние до каждого кластера
        if (dist < minDist) { // Находим ближайший кластер
          minDist = dist;
          clusterIndex = i;
        }
      });

      return clusterIndex; // Возвращаем индекс ближайшего кластера
    });

    for (let i = 0; i < points.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true; // Если есть изменения, устанавливаем флаг
        break;
      }
    }

    assignments = newAssignments; // Обновляем присваивания

    // Пересчет центров кластеров
    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i); // Фильтруем точки по кластеру
      if (clusterPoints.length === 0) continue; // Пропускаем пустые кластеры

      const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length; // Среднее по X
      const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length; // Среднее по Y

      clusters[i].x = avgX; // Обновляем центр кластера
      clusters[i].y = avgY;
    }

    if (!changed) break; // Если изменений нет, выходим из цикла
  }

  drawClusters(); // Отрисовка кластеров
}

// Отрисовка кластеров и точек
function drawClusters() {
  svg.querySelectorAll("circle").forEach(c => c.remove()); // Удаляем старые круги

  // Точки
  points.forEach((p, i) => {
    const c = clusters[assignments[i]]; // Получаем текущий кластер
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("cx", p.x);
    point.setAttribute("cy", p.y);
    point.setAttribute("r", 3);
    point.setAttribute("fill", c?.color || "gray"); // Цвет точки
    point.setAttribute("stroke", "black");
    svg.appendChild(point); // Отображаем точку
  });

  // Центры кластеров
  clusters.forEach(c => {
    const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    center.setAttribute("cx", c.x);
    center.setAttribute("cy", c.y);
    center.setAttribute("r", 6);
    center.setAttribute("fill", c.color); // Цвет центра
    center.setAttribute("stroke", "black");
    center.setAttribute("stroke-width", "2");
    svg.appendChild(center); // Отображаем центр кластера
  });
}
