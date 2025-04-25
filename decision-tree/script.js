// Функция для парсинга CSV текста
function parseCSV(csvText) {
    const rows = csvText.trim().split('\n').map(row => row.split(',')); // Разбиваем текст на строки и значения
    const headers = rows[0].slice(0, -1); // Получаем заголовки
    const data = rows.slice(1).map(row => ({ // Создаем массив объектов
        features: Object.fromEntries(headers.map((h, i) => [h, row[i].trim().toLowerCase()])),
        label: row[row.length - 1].trim().toLowerCase()
    }));
    return { data, headers }; // Возвращаем данные и заголовки
}

// Функция для подсчета меток
function countLabels(data) {
    return data.reduce((counts, item) => {
        counts[item.label] = (counts[item.label] || 0) + 1;
        return counts;
    }, {});
}

// Функция для вычисления энтропии по Шеннону
function entropy(data) {
    const total = data.length;
    const counts = countLabels(data);

    return Object.values(counts)
        .map(count => {
            const p = count / total; // Вероятность метки
            return -p * Math.log2(p); // Рассчитываем энтропию
        })
        .reduce((a, b) => a + b, 0); // Суммируем
}

// Функция для нахождения лучшего признака
function bestFeature(data, features) {
    const baseEntropy = entropy(data);
    let bestGain = -Infinity;
    let bestFeature = null;

    for (const feature of features) {
        const subsets = {};

        for (const item of data) { // Разделяем данные по значению признака
            const val = item.features[feature];
            if (!subsets[val]) subsets[val] = [];
            subsets[val].push(item); 
        }

        const weightedEntropy = Object.values(subsets).reduce((acc, subset) => {
            return acc + (subset.length / data.length) * entropy(subset); // Вычисляем взвешенную энтропию (доля всех данных * энтропия этого подмножества)
        }, 0);

        const gain = baseEntropy - weightedEntropy;  // Прирост информации
        if (gain > bestGain) { // Если прирост лучше, обновляем
            bestGain = gain;
            bestFeature = feature; 
        }
    }

    return bestFeature; // Возвращаем лучший признак
}

// Функция для построения дерева решений
function buildTree(data, features) {
    const labels = [...new Set(data.map(d => d.label))]; // Уникальные метки

    if (labels.length === 1) return { type: 'leaf', label: labels[0] };                     // Если все метки одинаковые — возвращаем лист
    if (features.length === 0) {                                                                // Если не осталось признаков
        const labelCounts = countLabels(data);                                                  // Подсчитываем количество каждой метки
        const majorityLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0][0];    // Находим метку большинства
        return { type: 'leaf', label: majorityLabel };                                          // Возвращаем лист с меткой большинства
    }

    const best = bestFeature(data, features);                                                    // Выбираем лучший признак для разделения
    const tree = { type: 'node', feature: best, children: {} };                                  // Создаем узел дерева

    const uniqueValues = [...new Set(data.map(d => d.features[best]))];                          // Уникальные значения лучшего признака
    for (const value of uniqueValues) {                                                          // Для каждого значения признака
        const subset = data.filter(d => d.features[best] === value);                             // Фильтруем подмножество данных
        const remaining = features.filter(f => f !== best);                                      // Исключаем использованный признак
        tree.children[value] = buildTree(subset, remaining);                                     // Рекурсивно строим поддерево
    }

    return tree; // Возвращаем дерево
}

// Функция для прогнозирования на основе дерева
function predict(tree, input, path = []) {
    if (tree.type === 'leaf') {               // Если это лист, добавляем решение
        path.push(`Решение: ${tree.label}`);
        return { label: tree.label, path }; // Возвращаем метку и путь
    }

    const val = input[tree.feature]; // Получаем значение для текущего признака
    path.push(`⮞ ${tree.feature} = ${val}`); // Добавляем шаг в путь
    if (!tree.children[val]) {
        path.push(`Неизвестное значение "${val}", невозможно принять решение.`);
        return { label: null, path };
    }
    return predict(tree.children[val], input, path); // Рекурсивное прогнозирование
}

// Функция для визуализации дерева в HTML
function renderTreeVisual(tree, container, depth = 0) {
    if (!tree) return;

    const node = document.createElement('div');
    node.className = 'tree-node';
    node.style.marginLeft = `${depth * 40}px`;   // Отступ относительно вложенности

    if (tree.type === 'leaf') {
        node.innerHTML = `<div class="leaf-node">→ ${tree.label}</div>`; // Лист
    } else {
        node.innerHTML = `<div class="internal-node">${tree.feature}?</div>`; // Узел
        for (const [value, subtree] of Object.entries(tree.children)) {
            const branch = document.createElement('div'); // Создаем элемент для ветки
            branch.className = 'branch';
            branch.innerHTML = `<span class="condition">[${value}]</span>`; // Добавляем условие
            renderTreeVisual(subtree, branch, depth + 1); // Рекурсивно визуализируем поддерево
            node.appendChild(branch);
        }
    }

    container.appendChild(node); // Добавляем узел в контейнер
}

// Инициализация переменных для текущего дерева и заголовков
let currentTree = null;
let currentHeaders = [];

// Обработчик события для кнопки парсинга CSV
document.getElementById('parseButton').addEventListener('click', () => {
    const csvText = document.getElementById('csvInput').value;
    const { data, headers } = parseCSV(csvText); // Парсим CSV

    const tree = buildTree(data, headers); // Строим дерево
    currentTree = tree;
    currentHeaders = headers;

    // Убираем вывод дерева в output
    document.getElementById('output').innerHTML = `
        <h3>Введите пример для классификации:</h3>
        <textarea id="predictInput" class="num"></textarea>
        <button class="button" id="predictButton">Прогнозировать</button>
        <div id="predictOutput"></div>
    `;
    
    document.getElementById('box').innerHTML = '';
    renderTreeVisual(tree, document.getElementById('box')); // Визуализируем дерево

    // Прогнозирование
    document.getElementById('predictButton').addEventListener('click', () => {
        const inputText = document.getElementById('predictInput').value.trim();
        const values = inputText.split(',').map(v => v.trim().toLowerCase());

        if (values.length !== currentHeaders.length) {  // Проверка на количество признаков
            document.getElementById('predictOutput').innerHTML =
                '<span style="color:red">Неверное количество признаков</span>';
            return;
        }

        const inputObj = Object.fromEntries(currentHeaders.map((h, i) => [h, values[i]]));  // Создаем объект для входных данных
        const result = predict(currentTree, inputObj);  // Получаем результат прогнозирования
        document.getElementById('predictOutput').innerHTML =
            `<pre>${result.path.join('\n')}</pre>`; // Отображаем путь
    });
});
