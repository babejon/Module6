let start = null;
let end = null;

function generateGrid() {//Функция для генерации ячеек
    const size = parseInt(document.getElementById('gridSize').value);//проверка на размер карты 
    if (size<2||size>50)
    {
        alert("Введите корректное число")
        return;
    }
    const box = document.querySelector('.visualization');
    box.innerHTML = "";
    box.style.display = "grid";
    box.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    box.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    start = null;
    end = null;

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");

        cell.addEventListener("click", () => toggleWall(cell));//Штука которая считывает клики и вызывает функцию установки стены
        cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            setStartEnd(cell);
        });
        box.appendChild(cell);
    }
}

function toggleWall(cell) {//Функция для выставления стен
    const size = parseInt(document.getElementById('gridSize').value);
    if (size!=0){
    if (!cell.classList.contains("start") && !cell.classList.contains("end") ) 
    {
        cell.classList.remove("path","visited");
        cell.classList.toggle("wall");
    }    
}
}

function setStartEnd(cell) {   // добавляем старт и конец 

    const size = parseInt(document.getElementById('gridSize').value);
    if (size!=0){ 
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
}

function clearPath() {
    document.querySelectorAll('.cell.path, .cell.visited').forEach(cell => {
        cell.classList.remove('path', 'visited');
    });
}


function getGraph(size, cells) {//делаем из карты граф в котором нули и единицы для реализации алгоритма
    const graph = Array(size * size).fill(0).map(() => Array(size * size).fill(0));
    for (let i = 0; i < size; ++i) {//если встречаем стену, то это 0 и по ней мы в дальнейшем не сможем двигаться
        for (let j = 0; j < size; ++j) {
            const index = i * size + j;
            if (cells[index].classList.contains("wall")) continue;

            const neighbors = [
                [i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]//направления движения верх вниз лево право
            ];

            for (const [ni, nj] of neighbors) {
                if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                    const neighborIndex = ni * size + nj;
                    if (!cells[neighborIndex].classList.contains("wall")) {//если сосед не стена ставим 1
                        graph[index][neighborIndex] = 1;
                    }
                }
            }
        }
    }

    return graph;
}

function heuristic(a, b, size) {//Манхеттонское расстояние, определяет количество шагов до определенной точки, двигаясь только в 4-х направлениях
    const ax = a % size, ay = Math.floor(a / size);
    const bx = b % size, by = Math.floor(b / size);
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

async function aStar() {// Основаная работа алгоритма
    clearPath();
    setButtonsDisabled(true);// выключаем кнопки чтобы не сломать алгоритм

    if (!start || !end) {
        alert("Пожалуйста, выберите начальную и конечную точки (ПКМ)");
        setButtonsDisabled(false);
        return;
    }

    const size = parseInt(document.getElementById('gridSize').value);
    const cells = document.querySelectorAll('.cell');
    const graph = getGraph(size, cells);

    const startIndex = Array.from(cells).indexOf(start);
    const endIndex = Array.from(cells).indexOf(end);

    const openSet = [startIndex];//список того что нужно проверить, начинаем со старта
    const cameFrom = Array(size * size).fill(null);//откуда пришел
    const gScore = Array(size * size).fill(Infinity);//стоимость пути от старта до текущей ячейки 
    const fScore = Array(size * size).fill(Infinity);//Ожидаемая лучшая стоимость от начала до конца

    gScore[startIndex] = 0;//счетчик кратчайшего пути
    fScore[startIndex] = heuristic(startIndex, endIndex, size);//счетчик лучших путей до конца

    while (openSet.length > 0) {
        let current = openSet.reduce((minNode, node) =>
            fScore[node] < fScore[minNode] ? node : minNode, openSet[0]);//Выбирает среди всех кандидатов, клетку с наименьшим предпологаемым весом, чтобы доййти до конца
//если мы нашли кратчайший путь то у нас current = end, мы восстанавливам этот самый кратчайший путь
        if (current === endIndex) {
            const path = restorePath(cameFrom, startIndex, endIndex);
            for (let i = 0; i < path.length; i++) {
                if (cells[path[i]] !== start && cells[path[i]] !== end) {
                    cells[path[i]].classList.add("path");
                    await new Promise(r => setTimeout(r, 100));//задержка 100мс 
                }
            }
            setButtonsDisabled(false);
            return;
        }

        openSet.splice(openSet.indexOf(current), 1);//шутка которая красит проверяемые клетки
        if (cells[current] !== start && cells[current] !== end) {
            cells[current].classList.add("visited");
            await new Promise(r => setTimeout(r, 50));
        }


        for (let neighbor = 0; neighbor < size * size; ++neighbor) {// этот кусок кода, делает проверку на то есть ли среди соседей более короткий путь
            if (graph[current][neighbor] === 1) {//Если нашел, то добавляем в gScore. А если еще не рассматривали эту клетку то, добавляем на рассмотрение
                const tentativeG = gScore[current] + 1;
                if (tentativeG < gScore[neighbor]) {
                    cameFrom[neighbor] = current;//запоминаем от куда пришли, для восстановления пути
                    gScore[neighbor] = tentativeG;//стоимость для того чтобы добраться до соседа
                    fScore[neighbor] = tentativeG + heuristic(neighbor, endIndex, size);//ожидаемая полная стоимость до соседа 
                    if (!openSet.includes(neighbor)) {//добавляем соседа в очередь на рассмотрение в след шаге
                        openSet.push(neighbor);
                    }
                }
            }
        }
    }

    alert("Путь не найден");
    setButtonsDisabled(false);// не забываем врубить обратно
}

function restorePath(cameFrom, start, end) {//восстанавливаем путь от конца к началу, потом разворачиваем
    const path = [];
    let current = end;
    while (current !== null && current !== start) {
        path.push(current);
        current = cameFrom[current];
    }
    if (current === start) {
        path.push(start);
        return path.reverse();
    }
    return [];
}

function clearGrid()// кнопка очистки поля
{
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell=>{
    cell.classList.remove('wall','start','end','path','visited','cell');
});
    document.getElementById('gridSize').value = null;
    start=null;
    end =null;
}
function buttonClearPath()// кнопка очистки пути
{
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell=>{
        cell.classList.remove('visited','path');
    });
}

function clearGirdForMaze()// функция очистки для того чтобы можно было много раз генерировать случайный лабиринт
{
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell=>{
        cell.classList.remove('wall','start','end','path','visited');
    });
    }

function GenerateRandomMaze() {// генерация лабиринта

    const cells = document.querySelectorAll('.cell'); 
    const size = parseInt(document.getElementById('gridSize').value);

    let startIndex = start ? Array.from(cells).indexOf(start) : null;
    let endIndex = end ? Array.from(cells).indexOf(end) : null;

    clearGirdForMaze(false);
    do {
        startIndex = GetRandInt(0, size * size - 1);
        endIndex = GetRandInt(0, size * size - 1);
    } while (startIndex === endIndex);
        
    start = cells[startIndex];
    end = cells[endIndex];
    
    start.classList.add("start"); 
    end.classList.add("end"); 

    for (let i = 0; i < size * size * 0.4; i++) { //40% карты в стенах
        let randIndex;
        do {
            randIndex = GetRandInt(0, size * size - 1);
        } while (randIndex === startIndex || randIndex === endIndex); 

        cells[randIndex].classList.add("wall");
    }
}

function GetRandInt(min, max) {// думаю тут и так все понятно
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setButtonsDisabled(disabled) {//функция выключения кнопок при работающем алгоритме
    const buttons = document.querySelectorAll("button, .button");
    buttons.forEach(btn => btn.disabled = disabled);

     const visualization = document.querySelector(".visualization");
    if (disabled) {
        visualization.classList.add("disabled");
    } else {
        visualization.classList.remove("disabled");
    }
}