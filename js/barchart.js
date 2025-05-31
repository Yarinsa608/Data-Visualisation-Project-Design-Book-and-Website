function drawBarChart(data) {
    const margin = { top: 90, right: 190, bottom: 70, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    

    const svg = d3.select("#barchart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const methods = ["Fixed or mobile camera", "Police issued", "Mobile camera"];
    const months = [...new Set(data.map(d => d.month))];

    const color = d3.scaleOrdinal()
        .domain(methods)
        .range(["#47B6FF", "#12DFE1", "#9474FF"]);

    const stackedData = d3.rollup(
        data,
        v => methods.map(method => {
            const match = v.find(d => d.method === method);
            return { method, fines: match ? match.fines : 0 };
        }),
        d => d.month
    );

    const stackedArray = Array.from(stackedData, ([month, values]) => {
        let y0 = 0;
        return {
            month,
            values: values.map(d => {
                const result = { ...d, y0, y1: y0 + d.fines, month };
                y0 += d.fines;
                return result;
            })
        };
    });

    const monthlyTotals = new Map();
    stackedArray.forEach(monthData => {
        const total = monthData.values.reduce((sum, d) => sum + d.fines, 0);
        monthlyTotals.set(monthData.month, total);
    });

    const maxY = d3.max(stackedArray, d => d3.max(d.values, v => v.y1));

    const x = d3.scaleBand()
        .domain(months)
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        .style("fill", "white");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(",")).ticks(6))
        .selectAll("text")
        .style("fill", "white");

    svg.append("text")
        .attr("x", 0)
        .attr("y", -30)
        .attr("class", "chart-title")
        .text("Fine Count by Detection Method");

    // Tooltip appended to <body>, not inside SVG
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Bars
    svg.selectAll("g.bar")
        .data(stackedArray)
        .join("g")
        .attr("transform", d => `translate(${x(d.month)},0)`)
        .selectAll("rect")
        .data(d => d.values)
        .join("rect")
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.y1))
        .attr("height", d => y(d.y0) - y(d.y1))
        .attr("fill", d => color(d.method))
        .on("mouseover", function (event, d) {
            const total = monthlyTotals.get(d.month);
            const percent = ((d.fines / total) * 100).toFixed(1);

            tooltip.transition().duration(200).style("opacity", 0.95);
            tooltip.html(`
                <strong>Method:</strong> ${d.method}<br/>
                <strong>Fines:</strong> ${d.fines.toLocaleString()}<br/>
                <strong>Percent:</strong> ${percent}%`
            )
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 40) + "px");
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);
        });

    // Legend
    const legend = svg.selectAll(".legend")
        .data(methods)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${width + 20}, ${i * 25})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));

    legend.append("text")
        .attr("x", 22)
        .attr("y", 12)
        .style("fill", "white")
        .text(d => d)
        .attr("font-size", "12px");
}
