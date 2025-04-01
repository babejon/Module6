document.addEventListener("DOMContentLoaded", () => {
    setupGraph();
    setupGrid();
});

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
        point.setAttribute("r", 2);
        point.setAttribute("class", "point");

        svg.appendChild(point);
        console.log(`Клик: (${svgX}, ${svgY})`);
    });
}

let start = null;
let end = null;

function setupGrid() {
    document.querySelector("button").addEventListener("click", generateGrid);
}

function generateGrid() {
    const size = document.getElementById('gridSize').value;
    const box = document.querySelector('.box'); 

    box.innerHTML = ""; 
    box.style.display = "grid"; 
    box.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    box.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");

        cell.addEventListener("click", () => toggleWall(cell));
        cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            setStartEnd(cell);
        });

        box.appendChild(cell);
    }
}

function toggleWall(cell) {
    if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
        cell.classList.toggle("wall");
    }
}

function setStartEnd(cell) {
    if (cell.classList.contains("wall")) return;

    if (!start) {
        start = cell;
        start.classList.add("start");
    } else if (!end) {
        end = cell;
        end.classList.add("end");
    } else {
        start.classList.remove("start");
        end.classList.remove("end");
        start = cell;
        start.classList.add("start");
        end = null;
    }
}
