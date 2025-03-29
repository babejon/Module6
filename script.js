let start = null;
let end = null;

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