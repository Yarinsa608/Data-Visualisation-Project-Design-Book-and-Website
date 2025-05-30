const drawPieChart = (data) => {
  const container = d3.select("#piechart-content");
  container.selectAll("*").remove(); // remove any existing chart before drawing a new one

  // Group the data by age group and sum the fines for each group
  const finesByAge = d3.rollups(
    data,
    v => d3.sum(v, d => d.fines),
    d => d.ageGroup
  )
    .map(([ageGroup, totalFines]) => ({ ageGroup, totalFines })) // convert it into an array of objects
    .sort((a, b) => {
      // sort by the starting number in the age range (e.g., "18-25" becomes 18)
      const parseStart = age => parseInt(age.ageGroup.split("-")[0]);
      return parseStart(a) - parseStart(b);
    });

  // Set up dimensions and radius for the pie chart
  const width = 700;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 59;

  // Calculate total fines across all age groups for percentage calculations
  const totalFines = d3.sum(finesByAge, d => d.totalFines);

  // Create a color scale for each age group
  const color = d3.scaleOrdinal()
    .domain(finesByAge.map(d => d.ageGroup))
    .range(["cyan", "red", "blue", "orange", "yellow"]);

  // Create the SVG element and make it responsive
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");

  // Add a title to the top of the chart
  svg.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("text-anchor", "start")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", "'Poppins', 'Arial', sans-serif")
    .style("fill", "#333")
    .text("Mobile Phone Fines by Age Group");

  // Create a group element to hold the pie chart in the middle of the SVG
  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2 + 80}, ${height / 2 + 50})`);

  // Set up pie generator and arc path generator
  const pie = d3.pie().value(d => d.totalFines).sort(null);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  // Set up tooltip (initially hidden)
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Draw the pie chart paths
  chartGroup.selectAll("path")
    .data(pie(finesByAge))
    .join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.ageGroup)) // use the age group to determine color
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      // zoom effect on hover
      d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
      const percentage = ((d.data.totalFines / totalFines) * 100).toFixed(2);
      tooltip.style("opacity", 1)
        .html(`<strong>${d.data.ageGroup}</strong><br/>${percentage}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => {
      // move tooltip with the mouse
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // reset zoom and hide tooltip
      d3.select(this).transition().duration(200).attr("transform", "scale(1)");
      tooltip.style("opacity", 0);
    });

  // Create a legend to explain which color represents which age group
  const legend = svg.append("g")
    .attr("transform", `translate(40, ${(height / 2 - finesByAge.length * 15) + 40})`);

  // Draw colored boxes for each age group
  legend.selectAll("rect")
    .data(finesByAge)
    .join("rect")
    .attr("x", 0)
    .attr("y", (_, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => color(d.ageGroup));

  // Add text labels next to each color box
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

const setupPieChart = (fullData) => {
  const container = d3.select("#piechart");
  container.selectAll("*").remove(); // clear old chart setup (in case user switches filters)

  const chartWrapper = container.append("div")
    .attr("class", "piechart-box");

  // Add a month filter dropdown so users can choose a specific month
  chartWrapper.append("div")
    .attr("id", "month-filter-container")
    .html(`
      <label for="monthFilter">Select Month:</label>
      <select id="monthFilter">
        <option value="all">All Months</option>
        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
        <option value="4">April</option>
        <option value="5">May</option>
        <option value="6">June</option>
        <option value="7">July</option>
        <option value="8">August</option>
        <option value="9">September</option>
        <option value="10">October</option>
        <option value="11">November</option>
        <option value="12">December</option>
      </select>
    `);

  // This is the container where the actual pie chart will go
  chartWrapper.append("div")
    .attr("id", "piechart-content");

  // Draw the initial pie chart using all data
  drawPieChart(fullData);

  // Update chart whenever the dropdown value changes
  d3.select("#monthFilter").on("change", function () {
    const selected = this.value;
    const filtered = selected === "all"
      ? fullData
      : fullData.filter(d => d.month === +selected);
    drawPieChart(filtered); // re-draw with filtered data
  });
};
