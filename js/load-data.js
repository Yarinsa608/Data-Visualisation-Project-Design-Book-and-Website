d3.csv("data/piechart_data.csv", d => ({
  ageGroup: d.AGE_GROUP,
  fines: +d.FINES,
  year: +d.YEAR,
  month: +d.MONTH
})).then(data => {
  const filteredData = data.filter(d => d.year === 2023);
  drawPieChart(filteredData);
}).catch(error => {
  console.error("Error loading the CSV file:", error);
});
