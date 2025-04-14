document.addEventListener("DOMContentLoaded", () => {
    setupGraph();
});

let points = [];

function setupGraph() {
    const svg = document.getElementById("graphArea");

    svg.addEventListener("click", (event) => {
        const rect = svg.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const viewBox = svg.viewBox.baseVal;
        const svgX = (clickX / rect.width) * viewBox.width;
        const svgY = (clickY / rect.height) * viewBox.height;

        const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        point.setAttribute("cx", svgX);
        point.setAttribute("cy", svgY);
        point.setAttribute("r", 4);
        point.setAttribute("class", "point");
        points.push({ x: svgX, y: svgY });

        svg.appendChild(point);

        const pointIndex = document.createElementNS("http://www.w3.org/2000/svg", "text");
        pointIndex.setAttribute("x", svgX + 5);
        pointIndex.setAttribute("y", svgY - 5);
        pointIndex.setAttribute("font-size", "7");
        pointIndex.textContent = points.length - 1;
        svg.appendChild(pointIndex);
        pointIndex.setAttribute("class","label")


    });
}

function distance(a, b) {//Высчитывает длину между двумя точками
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function fitnessCalculator(path, points) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += distance(points[path[i]], points[path[i + 1]]);//Cкладывает расстояния между последовательно пройденными точками (замкнуто)
    }
    total += distance(points[path[path.length - 1]], points[path[0]]);
    return total;
}

function generatePopulation(size, numPoints) {//Создает массив маршрутов, в каждом из них случайная перестановка точек 
    const population = [];
    for (let i = 1; i < size; i++) {
        const path = [...Array(numPoints).keys()];
        shuffle(path);
        population.push(path);
    }
    return population;
}

function tournamentSelection(population, points, k = 3) {//Турнирный метод выбора "Родителя"
    let tournament = [];
    for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
    }

    return getBestPath(tournament, points);
}

function shuffle(array) {//Функция которя используется в создании популяции, для того чтобы случайно переставлять точки
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function crossover(p1, p2) {//Берет половину точек из одного "родителя", остальные добирает из остальных точек
    let cut = Math.floor(p1.length / 2);
    let half = p1.slice(0, cut);//половина от первого родителя 
    let rest = p2.filter(x => !half.includes(x));//остаток от второго
    return half.concat(rest);
}

function mutate(path) {
    const mutated = [...path];//копируем пути

    if(Math.random() < 0.8)//С 80% шансом меняем местами две соседние точки 
    {
        let i = Math.floor(Math.random() * (mutated.length - 1));
        [mutated[i], mutated[i + 1]] = [mutated[i + 1], mutated[i]];
    }
    if(Math.random()<0.2)//С шансом 20% делаем одну случайную перестановку
    {
    let a = Math.floor(Math.random() * mutated.length);
    let b = Math.floor(Math.random() * mutated.length);
    [mutated[a], mutated[b]] = [mutated[b], mutated[a]];
    }
    return mutated;
}

function getBestPath(population, points) {//выбирает самый короткий маршрут
    let best = population[0];
    let bestLen = fitnessCalculator(best, points);
    for (let i = 1; i < population.length; i++) {
        let len = fitnessCalculator(population[i], points);
        if (len < bestLen) {
            best = population[i];
            bestLen = len;
        }
    }
    return best;
}

function drawPath(svg, points, path) {// рисует линии
    let oldLine = document.getElementById("line");
    if (oldLine) svg.removeChild(oldLine);

    let line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    let str = "";
    for (let i = 0; i < path.length; i++) {
        let pt = points[path[i]];
        str += pt.x + "," + pt.y + " ";
    }

    let first = points[path[0]];
    str += first.x + "," + first.y;

    line.setAttribute("points", str);
    line.setAttribute("stroke", "red");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-width", 2);
    line.setAttribute("id", "line");
    svg.appendChild(line);
}

async function startAlgo() {
    let svg = document.getElementById("graphArea");
    let num = points.length;
    let pop = generatePopulation(30, num);//создаем 50 популяций 

    for (let gen = 0; gen < 60; gen++) {//всего у нас новых генов 100
        let newPop = [];

        const best = getBestPath(pop, points);
        newPop.push(best);

        for (let i = 0; i < pop.length; i++) {
            let p1 = tournamentSelection(pop, points, 5);
            let p2 = tournamentSelection(pop, points, 5);
            let child = crossover(p1, p2);
            child = mutate(child);
            newPop.push(child);
        }

        pop = newPop;
        let currentBest = getBestPath(pop, points);
        drawPath(svg, points, currentBest);

        let length = fitnessCalculator(currentBest, points);
        document.getElementById("bestLength").textContent = length.toFixed(2);
        await new Promise(r => setTimeout(r, 50));
    }
}

function clearGraph() {
    const svg = document.getElementById("graphArea");

    svg.querySelectorAll("circle.point").forEach(el => el.remove());

    svg.querySelectorAll("text.label").forEach(el => el.remove());

    const pathLine = document.getElementById("line");
    if (pathLine) pathLine.remove();

    points = [];
    document.getElementById("bestLength").textContent = "0";
}