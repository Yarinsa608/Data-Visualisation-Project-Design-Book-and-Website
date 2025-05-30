let fullData = [];

d3.csv("data/piechart_data.csv", d => ({
  ageGroup: d.AGE_GROUP,
  fines: +d.FINES,
  year: +d.YEAR,
  month: +d.MONTH
})).then(data => {
  fullData = data.filter(d => d.year === 2023); // store filtered 2023 data

  drawPieChart(fullData); // draw initial chart

  // Add event listener for dropdown
  d3.select("#monthFilter").on("change", function () {
    const selected = this.value;
    const monthFiltered = selected === "all"
      ? fullData
      : fullData.filter(d => d.month === +selected);
    drawPieChart(monthFiltered);
  });
}).catch(error => {
  console.error("Error loading the CSV file:", error);
});


d3.csv("data/barchart.csv", d => ({
  year: +d.YEAR,
  month: d["Month (Name)"],
  method: d.DETECTION_METHOD,
  fines: +d["Sum(FINES)"].replace(/,/g, "")
}))
.then(data => {
  const filteredData = data.filter(d => d.year === 2023);
  drawBarChart(filteredData);
})
.catch(error => {
  console.error("Error loading the CSV file:", error);
});
