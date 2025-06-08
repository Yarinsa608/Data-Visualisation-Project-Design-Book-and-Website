function drawBarChart(data) {
    const container = d3.select("#barchart");
    const containerWidth = container.node().getBoundingClientRect().width;

    // Reserve space for legend on narrow screens
    const legendWidth = 120;

    const margin = { 
        top: Math.min(90, containerWidth * 0.09),
        right: Math.min(190, containerWidth * 0.19),
        bottom: Math.min(70, containerWidth * 0.15),
        left: Math.min(80, containerWidth * 0.15)
    };

    // Adjust right margin to include legend width on small screens
    const adjustedRightMargin = containerWidth < 768 ? margin.right + legendWidth : margin.right;

    const width = containerWidth - margin.left - adjustedRightMargin;
    const height = Math.min(500, containerWidth * 0.6) - margin.top - margin.bottom;

    container.html("");

    const svg = container
        .append("div")
        .style("overflow", "auto")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "500")
        .attr("viewBox", `0 0 ${width + margin.left + adjustedRightMargin} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const methods = ["Fixed or mobile camera", "Police issued", "Mobile camera"];
    const months = [...new Set(data.map(d => d.month))];

    const baseFontSize = Math.max(12, containerWidth / 80);
    const axisFontSize = baseFontSize * 0.9;
    const labelFontSize = baseFontSize;

    // Add filter dropdown (position responsively)
    const filterContainer = container
        .insert("div", ":first-child")
        .attr("class", "chart-filter")
        .style("position", "absolute")
        .style("top", containerWidth < 768 ? "10px" : "20px")
        .style("right", containerWidth < 768 ? "10px" : "20px")
        .style("z-index", "10")
        .style("font-size", `${baseFontSize}px`);

    filterContainer.append("label")
        .text("Filter by Method:")
        .style("color", "white")
        .style("margin-right", "10px");

    const filterSelect = filterContainer.append("select")
        .attr("id", "method-filter")
        .style("font-size", `${baseFontSize}px`);

    filterSelect.selectAll("option")
        .data(["All Methods", ...methods])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => containerWidth < 768 ? d.split(" ")[0] : d);

    const color = d3.scaleOrdinal()
        .domain(methods)
        .range(["#47B6FF", "#12DFE1", "#9474FF"]);

    const tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute");

    const defs = svg.append("defs");
    const filter = defs.append("filter")
        .attr("id", "bar-drop-shadow")
        .attr("height", "130%")
        .attr("width", "130%");
    
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 2)
        .attr("result", "blur");
    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    function renderChart(filteredData) {
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".bar").remove();
        svg.selectAll(".legend").remove();

        const stackedData = d3.rollup(
            filteredData,
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
            .padding(containerWidth < 768 ? 0.1 : 0.2);

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .range([height, 0]);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", containerWidth < 768 ? "rotate(-45)" : "rotate(-25)")
            .style("text-anchor", "end")
            .style("font-size", `${axisFontSize}px`)
            .attr("dx", containerWidth < 768 ? "-0.5em" : "-0.8em")
            .attr("dy", containerWidth < 768 ? "0.5em" : "0.15em")
            .style("fill", "white");

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y)
                .tickFormat(d3.format(","))
                .ticks(containerWidth < 768 ? 5 : 6))
            .selectAll("text")
            .style("font-size", `${axisFontSize}px`)
            .style("fill", "white");

        svg.append("text")
            .attr("x", 0)
            .attr("y", containerWidth < 768 ? -15 : -30)
            .attr("class", "chart-title")
            .style("font-size", `${labelFontSize * 1.3}px`)
            .text("Fine Count by Detection Method");

        const bars = svg.selectAll(".bar")
            .data(stackedArray)
            .enter()
            .append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(${x(d.month)},0)`);

        bars.selectAll("rect")
            .data(d => d.values)
            .enter()
            .append("rect")
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.y1))
            .attr("height", d => y(d.y0) - y(d.y1))
            .attr("fill", d => color(d.method))
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("class", "bar-segment")
            .style("opacity", 0.9)
            .style("transition", "all 0.2s ease")
            .on("mouseover touchstart", function(event, d) {
                d3.select(this)
                    .style("opacity", 1)
                    .style("filter", "url(#bar-drop-shadow)")
                    .style("stroke", "white")
                    .style("stroke-width", "2px");

                const [xPos, yPos] = d3.pointer(event, container.node());
                const total = monthlyTotals.get(d.month);
                const percent = ((d.fines / total) * 100).toFixed(1);

                tooltip.transition().duration(200).style("opacity", 0.95);
                tooltip.html(`
                    <strong>Method:</strong> ${d.method}<br/>
                    <strong>Fines:</strong> ${d.fines.toLocaleString()}<br/>
                    <strong>Percent:</strong> ${percent}%
                `)
                .style("left", `${xPos + 10}px`)
                .style("top", `${yPos - 40}px`)
                .style("font-size", `${labelFontSize}px`);
            })
            .on("mouseout touchend", function() {
                d3.select(this)
                    .style("opacity", 0.9)
                    .style("filter", "none")
                    .style("stroke", "none");

                tooltip.transition().duration(300).style("opacity", 0);
            });

        // Legend fixed to right side inside svg viewport
        const legendX = width + 10;
        const legendY = 20;

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendX},${legendY})`);

        const legendItem = legend.selectAll(".legend-item")
            .data(methods)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0,${i * 25})`);

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color)
            .attr("rx", 2)
            .attr("ry", 2);

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", `${labelFontSize}px`)
            .style("fill", "white")
            .text(d => d)
            .call(wrap, 150, labelFontSize);

        // Helper to wrap legend text if needed
        function wrap(text, width, fontSize) {
            text.each(function() {
                const text = d3.select(this);
                const words = text.text().split(/\s+/).reverse();
                let word;
                let line = [];
                let lineNumber = 0;
                const lineHeight = 1.1; // ems
                const y = text.attr("y");
                const dy = parseFloat(text.attr("dy") || 0);
                let tspan = text.text(null).append("tspan")
                    .attr("x", 20)
                    .attr("y", y)
                    .attr("dy", dy + "px");

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", 20)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + "em")
                            .text(word);
                    }
                }
            });
        }
    }

    renderChart(data);

    filterSelect.on("change", function() {
        const selectedMethod = this.value;
        const filteredData = selectedMethod === "All Methods" 
            ? data 
            : data.filter(d => d.method === selectedMethod);
        renderChart(filteredData);
    });

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            drawBarChart(data);
        }, 200);
    });
}
