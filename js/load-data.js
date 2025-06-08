let fullData = [];
let barChartData = [];

// Load pie chart data
d3.csv("data/piechart_data.csv", d => ({
    ageGroup: d.AGE_GROUP,
    fines: +d.FINES,
    year: +d.YEAR,
    month: +d.MONTH
})).then(data => {
    fullData = data.filter(d => d.year === 2023);
    setupPieChart(fullData);
}).catch(error => {
    console.error("Error loading pie chart CSV:", error);
    document.getElementById("piechart").innerHTML = 
        `<div class="error">Error loading age data: ${error.message}</div>`;
});

// Load bar chart data with error handling
function loadBarChartData() {
    d3.csv("data/barchart.csv", d => ({
        year: +d.YEAR,
        month: d["Month (Name)"],
        method: d.DETECTION_METHOD,
        fines: +d["Sum(FINES)"].replace(/,/g, "")
    }))
    .then(data => {
        barChartData = data.filter(d => d.year === 2023);
        
        // Validate data before drawing
        if (barChartData.length === 0) {
            throw new Error("No 2023 data found in barchart.csv");
        }
        
        // Check if function exists before calling
        if (typeof drawBarChart === 'function') {
            drawBarChart(barChartData);
        } else {
            console.error("drawBarChart function not found");
            document.getElementById("barchart").innerHTML = 
                '<div class="error">Chart rendering function not loaded</div>';
        }
    })
    .catch(error => {
        console.error("Error loading bar chart CSV:", error);
        document.getElementById("barchart").innerHTML = 
            `<div class="error">Error loading detection method data: ${error.message}</div>`;
    });
}

// Load both datasets
document.addEventListener('DOMContentLoaded', function() {
    loadBarChartData();
});

// Make data available globally for debugging
window.getChartData = () => ({
    pieData: fullData,
    barData: barChartData
});