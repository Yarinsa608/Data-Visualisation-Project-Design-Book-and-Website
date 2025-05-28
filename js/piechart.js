const drawPieChart = (data) => {
  const container = d3.select("#piechart");
  container.selectAll("*").remove(); // Clear previous pie chart if any

  // Aggregate total fines per age group
  const finesByAge = d3.rollups(
    data,
    v => d3.sum(v, d => d.fines),
    d => d.ageGroup
  )
    .map(([ageGroup, totalFines]) => ({ ageGroup, totalFines }))
    .sort((a, b) => {
      // Sort age groups starting with the lowest 
      const parseStart = age => parseInt(age.ageGroup.split("-")[0]);
      return parseStart(a) - parseStart(b);
    });

  const width = 800;
  const height = 550;
  const radius = Math.min(width, height) / 2 - 60;
  const totalFines = d3.sum(finesByAge, d => d.totalFines);

  // Define colors for each age group
  const color = d3.scaleOrdinal()
    .domain(finesByAge.map(d => d.ageGroup))
    .range([ "cyan", "red", "blue", "orange", "yellow"]);

  // SVG container for the pie chart
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "piechart-box");

  // Group for the pie chart, positioned slightly right to allow space for the legend
  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2 + 100}, ${height / 2})`);

  // Create pie layout
  const pie = d3.pie()
    .value(d => d.totalFines)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Tooltip for showing fine percentages
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.15)")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Draw pie slices
  chartGroup.selectAll("path")
    .data(pie(finesByAge))
    .join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.ageGroup))
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");

      const percentage = ((d.data.totalFines / totalFines) * 100).toFixed(2);
      tooltip.style("opacity", 1)
        .html(`<strong>${d.data.ageGroup}</strong><br/>${percentage}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("transform", "scale(1)");
      tooltip.style("opacity", 0);
    });

  // Add legend on the left side
  const legend = svg.append("g")
    .attr("transform", `translate(40, ${height / 2 - finesByAge.length * 15})`);

  // Color boxes
  legend.selectAll("rect")
    .data(finesByAge)
    .join("rect")
    .attr("x", 0)
    .attr("y", (_, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => color(d.ageGroup));

  // Labels showing age group and fine percentage
  legend.selectAll("text")
    .data(finesByAge)
    .join("text")
    .attr("x", 24)
    .attr("y", (_, i) => i * 25 + 13)
    .style("font-size", "14px")
    .style("font-family", "sans-serif")
    .style("fill", "#333")
    .text(d => {
      const percent = ((d.totalFines / totalFines) * 100).toFixed(2);
      return `${d.ageGroup} - ${percent}%`;
    });
};
