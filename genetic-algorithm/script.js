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
        pointIndex.setAttribute("font-size", "10");
        pointIndex.textContent = points.length - 1;
        svg.appendChild(pointIndex);
    });
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function fitnessCalculator(path, points) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += distance(points[path[i]], points[path[i + 1]]);
    }
    total += distance(points[path[path.length - 1]], points[path[0]]);
    return total;
}

function generatePopulation(size, numPoints) {
    const population = [];
    for (let i = 0; i < size; i++) {
        const path = [...Array(numPoints).keys()];
        shuffle(path);
        population.push(path);
    }
    return population;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function mutate(path) {
    let a = Math.floor(Math.random() * path.length);
    let b = Math.floor(Math.random() * path.length);
    let c = path[a];
    path[a] = path[b];
    path[b] = c;
    return path;
}

function crossover(p1, p2) {
    let cut = Math.floor(p1.length / 2);
    let half = p1.slice(0, cut);
    let rest = p2.filter(x => !half.includes(x));
    return half.concat(rest);
}

function getBestPath(pop, points) {
    let best = pop[0];
    let bestLen = fitnessCalculator(best, points);
    for (let i = 1; i < pop.length; i++) {
        let len = fitnessCalculator(pop[i], points);
        if (len < bestLen) {
            best = pop[i];
            bestLen = len;
        }
    }
    return best;
}

function drawPath(svg, points, path) {
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
    let pop = generatePopulation(50, num);

    for (let gen = 0; gen < 100; gen++) {
        let newPop = [];

        for (let i = 0; i < pop.length; i++) {
            let p1 = pop[Math.floor(Math.random() * pop.length)];
            let p2 = pop[Math.floor(Math.random() * pop.length)];
            let child = crossover(p1, p2);
            child = mutate(child);
            newPop.push(child);
        }

        pop = newPop;
        let best = getBestPath(pop, points);
        drawPath(svg, points, best);

        let length = fitnessCalculator(best, points);
        document.getElementById("bestLength").textContent = length.toFixed(2);
        await new Promise(r => setTimeout(r, 50));
    }
}

function clearGraph() {
    const svg = document.getElementById("graphArea");
    while (svg.lastChild) {
      svg.removeChild(svg.lastChild);
    }
    points = [];
    document.getElementById("bestLength").textContent = "0";
  }