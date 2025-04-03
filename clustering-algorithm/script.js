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
        point.setAttribute("r", 1);
        point.setAttribute("class", "point");

        svg.appendChild(point);
        console.log(`Клик: (${svgX}, ${svgY})`);
    });

