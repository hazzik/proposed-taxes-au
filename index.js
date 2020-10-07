function parseQueryString(queryString) {
    var params = {};
    var queries = queryString.split('&');
    for (var i = 0, l = queries.length; i < queries.length; i++) {
        var temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
    return params;
}

function tax(x, brakes) {
    var t = 0;
    var s = x;
    for (var i = 0; i < brakes.length; i++) {
        var br = brakes[i];
        if (s > br[0]) {
            t += (s - br[0]) * br[1];
            s = br[0];
        }
    }
    return t;
}

function formatCurrency(c) {
    return '$' + c.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var params = parseQueryString(window.location.search.substring(1));

window.onload = function () {
    //https://www.ato.gov.au/Rates/Individual-income-tax-rates/
    var au = [
        [180000, 0.450],
        [ 90000, 0.370],
        [ 37000, 0.325],
        [ 18200, 0.190]
    ];

    //https://budget.gov.au/2020-21/content/factsheets/download/tax_fact-sheet.pdf
    var au_2021 = [
        [180000, 0.450],
        [120000, 0.370],
        [ 45000, 0.325],
        [ 18200, 0.190]
    ];

    //https://budget.gov.au/2020-21/content/factsheets/download/tax_fact-sheet.pdf
    var au_2024 = [
        [200000, 0.45],
        [ 45000, 0.30],
        [ 18200, 0.19]
    ];

    var from = Math.max(parseInt(params['f']) || 0, 0);
    var to = parseInt(params['t']) || (from + 300000);
    var step = Math.max((to - from) / 50, 1);

    var labels = [];
    for (var l = from; l <= to; l += step) {
        labels.push(l);
    }

    var ctx = document.getElementById("myChart");
    var data = {
        labels: labels,
        datasets: [{
            label: "Current",
            function: function (x) {
                return tax(x, au);
            },
            data: [],
            fill: false
        },
        {
            label: "2020/21",
            function: function (x) {
                return tax(x, au_2021);
            },
            data: [],
            fill: false
        },
        {
            label: "2024/25",
            function: function (x) {
                return tax(x, au_2024);
            },
            data: [],
            fill: false
        },
    ]
    };

    Chart.pluginService.register({
        beforeInit: function (chart) {
            var data = chart.config.data;
            for (var i = 0; i < data.datasets.length; i++) {
                for (var j = 0; j < data.labels.length; j++) {
                    var fct = data.datasets[i].function,
                        x = data.labels[j],
                        y = fct(x);
                    data.datasets[i].data.push(y);
                }
            }
        }
    });

    Chart.pluginService.register({
        beforeInit: function (chart) {
            var datasets = chart.config.data.datasets;
            var colors = palette('mpn65', datasets.length);
            for (var i = 0; i < datasets.length; i++) {
                if (!datasets[i].borderColor)
                    datasets[i].borderColor = '#' + colors[i];
            }
        }
    });

    var myBarChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            legend: {
                display: true,
                position: 'bottom'
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label || '';
                        var xLabel = data.labels[tooltipItem.index];
                        if (label) {
                            label += ': ';
                        }
                        label += formatCurrency(tooltipItem.yLabel) + ' (' + (100 * tooltipItem.yLabel / xLabel).toFixed(2) + '%)';
                        return label;
                    }
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function (label, index, labels) {
                            return formatCurrency(label);
                        }
                    }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function (label, index, labels) {
                            return formatCurrency(label);
                        }
                    }
                }]
            }
        }
    });
};
