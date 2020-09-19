let vue = new Vue({
    el: "#vue-element",
    data: {
        data: null,
        chart_data: [],
        chart_global: [],
        heatmap_data: [['Country', 'Cases']],
        search_key: '',
        search_data: null,

        // Global Data
        global_confirmed: 0,
        global_deaths: 0,
        global_recovered: 0,

        // Local Data
        country_name: "",
        country_confirmed: 0,
        country_deaths: 0,
        country_recovered: 0,

        country_chart: null,
        global_chart: null,
        top_five: {}
    },
    methods: {
        switch_mobile: function (param) {
            switch (param) {
                case "1":
                    document.getElementsByClassName('local-statistics')[0].style.display = "block";
                    document.getElementsByClassName('heatmap')[0].style.display = "none";
                    document.getElementsByClassName('global-statistics')[0].style.display = "none";
                    break;
                case "2":
                    document.getElementsByClassName('local-statistics')[0].style.display = "none";
                    document.getElementsByClassName('heatmap')[0].style.display = "block";
                    document.getElementsByClassName('global-statistics')[0].style.display = "block";
                    break;
            }
        },
        get_data: async function () {
            await axios.get("https://pomber.github.io/covid19/timeseries.json")
                .then(response => {
                    this.data = response.data;
                    this.search_data = response.data;
                })
        },
        get_statistics: function (key) {
            this.country_name = key;
            this.country_confirmed = this.data[key][this.data[key].length - 1]['confirmed'].toLocaleString('en', { maximumFractionDigits: 0 });
            this.country_deaths = this.data[key][this.data[key].length - 1]['deaths'].toLocaleString('en', { maximumFractionDigits: 0 });
            this.country_recovered = this.data[key][this.data[key].length - 1]['recovered'].toLocaleString('en', { maximumFractionDigits: 0 });
        },
        get_chart_data: function (key) {
            this.chart_data = []
            for (var counter = 0; counter < this.data[key].length; counter++) {
                this.chart_data.push({ t: new Date(this.data[key][counter]['date']), y: this.data[key][counter]['confirmed'] });
            }
        },
        get_global_statistics: function () {
            for (var key in this.data) {
                this.global_confirmed += this.data[key][this.data[key].length - 1]['confirmed']
                this.global_deaths += this.data[key][this.data[key].length - 1]['deaths']
                this.global_recovered += this.data[key][this.data[key].length - 1]['recovered']
            }
            this.global_confirmed = this.global_confirmed.toLocaleString('en', { maximumFractionDigits: 0 });
            this.global_deaths = this.global_deaths.toLocaleString('en', { maximumFractionDigits: 0 });
            this.global_recovered = this.global_recovered.toLocaleString('en', { maximumFractionDigits: 0 });
        },
        get_global_chart: function () {
            for (var counter = 0; counter < this.data["Philippines"].length - 1; counter++) {
                var temp_number = 0;
                for (var key in this.data) {
                    temp_number += this.data[key][counter]['confirmed']
                }
                this.chart_global.push({ t: new Date(this.data["Philippines"][counter]['date']), y: temp_number });
            }
        },
        get_heatmap_data: function () {
            for (var key in this.data) {
                this.heatmap_data.push([key, this.data[key][this.data[key].length - 1]['confirmed']])
            }
            this.draw_heatmap()
        },
        change_country: function (key) {
            this.get_statistics(key);
            this.get_chart_data(key);
            this.country_chart.data.datasets[0].data = this.chart_data;
            this.country_chart.update();
            window.location.href = "#top-logo";
        },
        draw_heatmap: function () {
            var data = google.visualization.arrayToDataTable(this.heatmap_data);
            var options = {
                colorAxis: { colors: ['#ffe6eb', '#FF6384', '#ff0037'] },
                defaultColor: '#f5f5f5',
                backgroundColor: '#F5F5F6'
            };

            var chart = new google.visualization.GeoChart(document.getElementById('region-heatmap'));

            chart.draw(data, options);
        },
        get_top_five: function () {
            var top_cases = []
            for (var key in this.data) {
                top_cases.push(this.data[key][this.data[key].length - 1]['confirmed'])
            }
            top_cases.sort((a, b) => {
                return b - a;
            });
            for (var counter = 0; counter < 5; counter++) {
                for (var key in this.data) {
                    if (this.data[key][this.data[key].length - 1]['confirmed'] == top_cases[counter]) {
                        this.top_five[key] = top_cases[counter].toLocaleString('en', { maximumFractionDigits: 0 });
                    }
                }
            }
        },
        search_country: function () {
            if (this.search_key == '') {
                this.search_data = this.data;
            } else {
                this.search_data = {};
                for (var key in this.data) {
                    if (key.toLowerCase().search(this.search_key.toLowerCase()) != -1) {
                        this.search_data[key] = this.data[key];
                    }
                }
            }
        },
        get_location: async function () {
            await axios.get('http://ip-api.com/json')
                .then(response => {
                    this.country_name = response.data['country'];
                })
        }
    },
    mounted: async function () {
        await this.get_location();
        await this.get_data();
        await this.get_top_five();
        await this.get_statistics(this.country_name);
        await this.get_chart_data(this.country_name);
        await this.get_global_statistics();
        await this.get_global_chart();

        // Initialize Local Graph
        var localGraph = document.getElementById('localGraph').getContext('2d');
        this.country_chart = new Chart(localGraph, {
            type: 'line',
            data: {
                datasets: [{
                    borderColor: "#FF6384",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    data: this.chart_data,
                    pointRadius: 10,
                    pointBackgroundColor: "rgba(0,0,0,0)",
                    pointBorderColor: "rgba(0,0,0,0)"
                }]
            },
            options: {
                legend: {
                    display: false
                },
                hover: {
                    mode: 'nearest',
                    intersect: true,
                    axis: 'xy'
                },
                tooltips: {
                    mode: 'nearest'
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        distribution: 'series',
                        ticks: {
                            display: false
                        },
                        time: {
                            unit: 'day'
                        },
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            fontSize: 10
                        },
                    }]
                }
            }
        });

        // Initialize Global Graph
        var globalGraph = document.getElementById('globalGraph').getContext('2d');
        this.global_chart = new Chart(globalGraph, {
            type: 'line',
            data: {
                datasets: [{
                    borderColor: "#FF6384",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    data: this.chart_global,
                    pointRadius: 10,
                    pointBackgroundColor: "rgba(0,0,0,0)",
                    pointBorderColor: "rgba(0,0,0,0)"
                }]
            },
            options: {
                legend: {
                    display: false
                },
                hover: {
                    mode: 'nearest',
                    intersect: true,
                    axis: 'xy'
                },
                tooltips: {
                    mode: 'nearest'
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        distribution: 'series',
                        ticks: {
                            display: false
                        },
                        time: {
                            unit: 'day'
                        },
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            fontSize: 5
                        },
                    }]
                }
            }
        });

        document.getElementsByClassName('spinner-container')[0].style.display = "none";

        // Load Heatmap
        google.charts.load('current', {
            'packages': ['geochart'],
            'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
        });
        google.charts.setOnLoadCallback(this.draw_heatmap);
        this.get_heatmap_data();
    }
});