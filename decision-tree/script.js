function parseCSV(csvText) {
    const rows = csvText.trim().split('\n').map(row => row.split(','));
    const headers = rows[0].slice(0, -1);
    const data = rows.slice(1).map(row => ({
        features: Object.fromEntries(headers.map((h, i) => [h, row[i]])),
        label: row[row.length - 1]
    }));
    return { data, headers };
}

function entropy(data) {
    const total = data.length;
    const counts = {};
    for (const item of data) {
        counts[item.label] = (counts[item.label] || 0) + 1;
    }
    return Object.values(counts)
        .map(count => {
            const p = count / total;
            return -p * Math.log2(p);
        })
        .reduce((a, b) => a + b, 0);
}

function bestFeature(data, features) {
    const baseEntropy = entropy(data);
    let bestGain = -Infinity;
    let bestFeature = null;

    for (const feature of features) {
        const subsets = {};
        for (const item of data) {
            const val = item.features[feature];
            if (!subsets[val]) subsets[val] = [];
            subsets[val].push(item);
        }

        const weightedEntropy = Object.values(subsets).reduce((acc, subset) => {
            return acc + (subset.length / data.length) * entropy(subset);
        }, 0);

        const gain = baseEntropy - weightedEntropy;
        if (gain > bestGain) {
            bestGain = gain;
            bestFeature = feature;
        }
    }

    return bestFeature;
}

function buildTree(data, features) {
    const labels = [...new Set(data.map(d => d.label))];

    if (labels.length === 1) return { type: 'leaf', label: labels[0] };
    if (features.length === 0) {
        const labelCounts = {};
        for (const item of data) {
            labelCounts[item.label] = (labelCounts[item.label] || 0) + 1;
        }
        const majorityLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0][0];
        return { type: 'leaf', label: majorityLabel };
    }

    const best = bestFeature(data, features);
    const tree = { type: 'node', feature: best, children: {} };

    const uniqueValues = [...new Set(data.map(d => d.features[best]))];
    for (const value of uniqueValues) {
        const subset = data.filter(d => d.features[best] === value);
        const remaining = features.filter(f => f !== best);
        tree.children[value] = buildTree(subset, remaining);
    }

    return tree;
}

function displayTree(tree, indent = '') {
    if (tree.type === 'leaf') return indent + `→ ${tree.label}\n`;

    let str = indent + `⮞ ${tree.feature}?\n`;
    for (const [value, subtree] of Object.entries(tree.children)) {
        str += indent + `  [${value}]\n`;
        str += displayTree(subtree, indent + '    ');
    }
    return str;
}

function predict(tree, input, path = []) {
    if (tree.type === 'leaf') {
        path.push(`Решение: ${tree.label}`);
        return { label: tree.label, path };
    }

    const val = input[tree.feature];
    path.push(`⮞ ${tree.feature} = ${val}`);
    if (!tree.children[val]) {
        path.push(`Неизвестное значение "${val}", невозможно принять решение.`);
        return { label: null, path };
    }
    return predict(tree.children[val], input, path);
}

function renderTreeVisual(tree, container, depth = 0) {
    if (!tree) return;

    const node = document.createElement('div');
    node.className = 'tree-node';
    node.style.marginLeft = `${depth * 40}px`;

    if (tree.type === 'leaf') {
        node.innerHTML = `<div class="leaf-node">→ ${tree.label}</div>`;
    } else {
        node.innerHTML = `<div class="internal-node">${tree.feature}?</div>`;
        for (const [value, subtree] of Object.entries(tree.children)) {
            const branch = document.createElement('div');
            branch.className = 'branch';
            branch.innerHTML = `<span class="condition">[${value}]</span>`;
            renderTreeVisual(subtree, branch, depth + 1);
            node.appendChild(branch);
        }
    }

    container.appendChild(node);
}

let currentTree = null;
let currentHeaders = [];

document.getElementById('parseButton').addEventListener('click', () => {
    const csvText = document.getElementById('csvInput').value;
    const { data, headers } = parseCSV(csvText);

    const tree = buildTree(data, headers);
    currentTree = tree;
    currentHeaders = headers;

    // Убираем вывод дерева в output
    document.getElementById('output').innerHTML = `  
        <h3>Введите пример для классификации:</h3>
        <textarea id="predictInput" class="num" placeholder="пример: sunny,hot,high,false"></textarea>
        <button class="button" id="predictButton">Прогнозировать</button>
        <div id="predictOutput"></div>
    `;

    // Очищаем box и строим только визуализацию дерева
    document.getElementById('box').innerHTML = '';
    renderTreeVisual(tree, document.getElementById('box'));

    // Прогнозирование
    document.getElementById('predictButton').addEventListener('click', () => {
        const inputText = document.getElementById('predictInput').value.trim();
        const values = inputText.split(',');

        if (values.length !== currentHeaders.length) {
            document.getElementById('predictOutput').innerHTML =
                '<span style="color:red">Неверное количество признаков</span>';
            return;
        }

        const inputObj = Object.fromEntries(currentHeaders.map((h, i) => [h, values[i]]));
        const result = predict(currentTree, inputObj);
        document.getElementById('predictOutput').innerHTML =
            `<pre>${result.path.join('\n')}</pre>`;
    });
});
