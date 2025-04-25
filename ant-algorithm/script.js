const svg = document.getElementById("graphArea");

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
  const points = path.map(i => `${cities[i].x},${cities[i].y}`).join(" ") + ` ${cities[path[0]].x},${cities[path[0]].y}`; // Замыкаем маршрут
  polyline.setAttribute("points", points);
  polyline.setAttribute("stroke", "red");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("fill", "none");
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

let cities = []; // Храним координаты городов
let optimalRoute = []; // Лучший найденный маршрут
let pheromoneMap = []; // Матрица феромонов
let routeLengthDisplay = null; 

const pheromoneInfluence = 1; // Влияние феромонов 
const distanceInfluence = 5;  // Влияние расстояния 
const evaporationRate = 0.5;  // Испарение феромонов 
const antPheromone = 100;     // Феромоны муравья
const numberOfAnts = 20;      // Количество муравьев в каждой итерации
const maxIterations = 100;    // Максимальное количество итераций алгоритма

function distance(a, b) {//Растояние между городами
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Матрица феромонов изначально она заполнена единицами
function initPheromoneMap(cityCount) {
  pheromoneMap = Array.from({ length: cityCount }, () => Array(cityCount).fill(1));
}

// Выбираем следующий город для муравья
function selectNextCity(current, visited, distances, pheromones) {
  const probabilities = cities.map((_, cityIndex) => {
    if (visited.has(cityIndex)) return 0; // Уже посещённые города исключаем
    const pheromoneLevel = pheromones[current][cityIndex] ** pheromoneInfluence; // Влияние феромонов
    const heuristic = (1 / distances[current][cityIndex]) ** distanceInfluence; // Влияние расстояния 
    return pheromoneLevel * heuristic; // Комбинируем феромоны и расстояние
  });

  const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0); //Суммируем общий вес
  const randomThreshold = Math.random() * totalProbability;//Генерим рандомный порог чтобы выбрать город
  let cumulativeProbability = 0;

  // Рулетка выбора следующего города
  for (let cityIndex = 0; cityIndex < probabilities.length; cityIndex++) {
    cumulativeProbability += probabilities[cityIndex];//Накапливаем Вероятность
    if (randomThreshold <= cumulativeProbability) return cityIndex;//Вероятность Достигла необходимого- отправили значение
  }
  return 0; 
}

// Основной запуск алгоритма муравьиной колонии
async function startAlgo() {
  if (cities.length < 2) return alert("Добавь хотя бы два города"); // Проверяем количество городов
  const cityCount = cities.length;
  const distanceMatrix = Array.from({ length: cityCount }, (_, fromCity) =>
    cities.map((_, toCity) => distance(cities[fromCity], cities[toCity]))
  ); // Заполняем матрицу расстояний

  initPheromoneMap(cityCount); // Инициализируем феромоны
  let bestRouteLength = Infinity; // Стартовое значение для лучшего маршрута

  for (let iteration = 0; iteration < maxIterations; iteration++) { // Основной цикл итераций
    const allPaths = []; // Все маршруты текущей итерации
    const allPathLengths = []; // Длины этих маршрутов

    // Запускаем каждого муравья
    for (let ant = 0; ant < numberOfAnts; ant++) {
      const visitedCities = new Set();
      const currentPath = [];
      let currentCity = Math.floor(Math.random() * cityCount); // Случайный стартовый город

      currentPath.push(currentCity);
      visitedCities.add(currentCity);

      // Пока не обошли все города
      while (visitedCities.size < cityCount) {
        const nextCity = selectNextCity(currentCity, visitedCities, distanceMatrix, pheromoneMap);
        currentPath.push(nextCity);
        visitedCities.add(nextCity);
        currentCity = nextCity;
      }

      currentPath.push(currentPath[0]); // Замыкаем маршрут

      // Считаем длину маршрута
      let pathLength = 0;
      for (let index = 0; index < currentPath.length - 1; index++) {
        const fromCity = currentPath[index];
        const toCity = currentPath[index + 1];
        pathLength += distanceMatrix[fromCity][toCity];
      }
      // Обновляем лучший маршрут
      if (pathLength < bestRouteLength) {//короче ли текущий путь чем то что был лучшим до этого
        bestRouteLength = pathLength;//обновляем
        optimalRoute = currentPath.slice();//копируем текущий марщрут
      }

      allPaths.push(currentPath); // Сохраняем маршрут муравья
      allPathLengths.push(pathLength); // Сохраняем его длину
    }

    // Испаряем феромоны
    for (let fromCity = 0; fromCity < cityCount; fromCity++) {
      for (let toCity = 0; toCity < cityCount; toCity++) {
        pheromoneMap[fromCity][toCity] *= (1 - evaporationRate);
      }
    }

    // Обновляем феромоны по маршрутам муравьёв
    for (let k = 0; k < allPaths.length; k++) {
      const path = allPaths[k];
      const pheromoneContribution = antPheromone / allPathLengths[k]; // Чем короче путь, тем больше феромонов
      for (let step = 0; step < path.length - 1; step++) {
        const fromCity = path[step], toCity = path[step + 1];
        pheromoneMap[fromCity][toCity] += pheromoneContribution;
        pheromoneMap[toCity][fromCity] += pheromoneContribution; // Для симметрии
      }
    }

    // Каждые 10 итераций или в конце рисуем лучший маршрут
    if (iteration % 10 === 0 || iteration === maxIterations - 1) {
      [...svg.querySelectorAll("polyline")].forEach(el => el.remove());
      drawGrayPathsExceptBest(optimalRoute);
      drawPath(optimalRoute);
    }
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
  optimalRoute = [];
  pheromoneMap = [];
  routeLengthDisplay = null;
  [...svg.querySelectorAll("circle, polyline, text")].forEach(el => el.remove());
}
