const drawPieChart = (data) => {
  const container = d3.select("#piechart");
  container.selectAll("*").remove(); // Clear previous chart

  // Calculate total fines by age group
  const finesByAge = d3.rollups(
    data,
    v => d3.sum(v, d => d.fines),
    d => d.ageGroup
  )
    .map(([ageGroup, totalFines]) => ({ ageGroup, totalFines }))
    .sort((a, b) => {
      const parseStart = age => parseInt(age.ageGroup.split("-")[0]);
      return parseStart(a) - parseStart(b);
    });

  // Smaller width for space on the left, height remains
  const width = 700;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 60;
  const totalFines = d3.sum(finesByAge, d => d.totalFines);

  // Age group color palette
  const color = d3.scaleOrdinal()
    .domain(finesByAge.map(d => d.ageGroup))
    .range(["cyan", "red", "blue", "orange", "yellow"]);

  // Create SVG
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet") // newww for responsive
    .attr("class", "piechart-box");

  // Chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", "'Poppins', 'Arial', sans-serif")
    .style("fill", "#333")
    .text("Mobile Phone Fines by Age Group in 2023");

  // Group for pie chart, pushed slightly right
  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2 + 70}, ${height / 2 + 20})`);

  // Pie and arc layout
  const pie = d3.pie().value(d => d.totalFines).sort(null);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Draw slices
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

  // Legend positioned on left inside box
  const legend = svg.append("g")
    .attr("transform", `translate(40, ${height / 2 - finesByAge.length * 15})`);

  legend.selectAll("rect")
    .data(finesByAge)
    .join("rect")
    .attr("x", 0)
    .attr("y", (_, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => color(d.ageGroup));

  legend.selectAll("text")
    .data(finesByAge)
    .join("text")
    .attr("x", 24)
    .attr("y", (_, i) => i * 25 + 13)
    .style("font-size", "16px")
    .style("font-family", "sans-serif")
    .style("fill", "#333")
    .text(d => {
      const percent = ((d.totalFines / totalFines) * 100).toFixed(2);
      return `${d.ageGroup} - ${percent}%`;
    });
};
