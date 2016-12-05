$(document).ready(function () {
    var cellHeight = $('#colleges').width() * 0.430;
    var defaultMappings = {
        gender: {
            1: 'Female',
            2: 'Male',
            3: 'N/A'
        },
        ethnicity: {
            1: 'India/Alaska',
            2: 'Asian',
            3: 'Black',
            4: 'Hispanic',
            5: 'Hawai/Pacific',
            6: 'White',
            7: 'MultiRace',
            8: 'N/A',
            9: 'NR Alien'
        },
        college: {
            1: 'Agriculture',
            10: 'Nat Res & Env',
            9: 'Vet Medicine',
            8: 'Science',
            5: 'Engineering',
            7: 'Liberal Arts',
            2: 'Architecture',
            3: 'Business',
            6: 'InterCollege'
        }
    };

    var defaultConfiguration = {
        maxSelected: 4,
        gender: {
            'label': 'Gender',
            'container': '#gender',
            'bandOffsets': .3
        },
        ethnicity: {
            'label': 'Ethnicity',
            'container': '#ethnicity',
            'bandOffsets': .1
        },
        college: {
            'label': 'College',
            'container': '#colleges',
            'bandOffsets': .1
        }
    };

    /*
     { label: 'Colorado', 'gender': { 'Male': 122, 'Female': 241, 'N/A': 3 }, 'filters': { } }
     { id: 'someId', 'label': 'Colorado 2016', 'gender': { 'Male': 122, 'Female': 241, 'N/A': 3 } }
     [ 'someId', 'someOtherId' ]
     [ { type: 'Male', selections: [ { id: 'someId', label: 'Colorado 2016', value: 21321 } ] } ]
     */

    function removeSelection(data) {

    }

    function updateBarCharts(data) {
        var uuid = generateUUID(data.label, data.filters);
        for (var i = 0; i < barTypes.length; i++) {
            var type = barTypes[i];
            if (data.hasOwnProperty(type)) {
                var obj = {id: uuid, label: data.label};
                obj[type] = {};
                Object.keys(data[type]).forEach(function (key) {
                    obj[type][defaultMappings[type][key]] = data[type][key];
                });
                barCharts[type].addDatum(obj);
            }
        }
    }

    function generateUUID(label, filters) {
        var uuid = label + "[";
        for (var prop in filters) {
            if (filters.hasOwnProperty(prop)) {
                if ($.isArray(filters[prop]))
                    uuid += prop + "A[" + filters[prop].sort().toString() + "]";
                else if ($.isPlainObject(filters[prop]))
                    uuid += prop + "O[" + Object.keys(filters[prop]).sort().toString() + "]";
                else
                    uuid += prop + "[" + filters[prop] + "]";
            }
        }
        return uuid + "]";
    }

    var BarChart = (function () {
        function BarChart(type) {
            this.maxSelected = defaultConfiguration.maxSelected;
            this.type = type || 'gender';
            this.configuration = defaultConfiguration[this.type];
            this.selectedIds = [];
            var mappings = defaultMappings[this.type];
            this.orderedSelection = Object.keys(mappings).sort().map(function (key) {
                return {type: mappings[key], selections: []};
            });

            this._setup();
        }

        BarChart.prototype = {
            addDatum: function (data) {
                if (this.selectedIds.length >= this.maxSelected ||
                    this.selectedIds.indexOf(data.id) > -1)
                    return;
                this.selectedIds.push(data.id);
                for (var i = 0; i < this.orderedSelection.length; i++) {
                    var selection = this.orderedSelection[i];
                    selection.selections.push({
                        id: data.id,
                        label: data.label,
                        value: data[this.type][selection.type]
                    });
                }
                this._update();
            },

            removeDatum: function (data) {
                if (this.selectedIds.length <= 0)
                    return;
                var index = this.selectedIds.indexOf(data.id);
                if (index > -1) {
                    for (var i = 0; i < this.orderedSelection.length; i++)
                        this.orderedSelection[i].selections.splice(index, 1);
                    this.selectedIds.splice(index, 1);
                }
            },

            /*
             { id: 'someId', 'label': 'Colorado 2016', 'gender': { 'Male': 122, 'Female': 241, 'N/A': 3 } }
             [ 'someId', 'someOtherId' ]
             [ { type: 'Male', selections: [ { id: 'someId', label: 'Colorado 2016', value: 21321 } ] } ]
             */
            _update: function () {
                var self = this;
                self.x1.domain(this.selectedIds).rangeRoundBands([0, self.x0.rangeBand()]);
                self.y.domain([0, d3.max(this.orderedSelection, function (d) {
                    return d3.max(d.selections, function (s) {
                        return s.value;
                    });
                })]);

                self.svg.select('.x.axis').transition().duration(300).call(self.xAxis);

                self.svg.select(".y.axis").transition().duration(300).call(self.yAxis);

                var types = self.svg.selectAll(".chart-" + self.type)
                    .data(this.orderedSelection);

                types.exit()
                    .remove();

                types.enter()
                    .append("g")
                    .attr("class", "chart-" + self.type)
                    .attr("transform", function (d) {
                        return "translate(" + self.x0(d.type) + ",0)";
                    });

                var rects = types.selectAll("rect")
                    .data(function (d) {
                        return d.selections;
                    });

                rects.exit()
                    .transition()
                    .duration(300)
                    .attr("y", self.y(0))
                    .attr("height", self.height - self.y(0))
                    .style('fill-opacity', 1e-6)
                    .remove();

                rects.enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("y", self.y(0))
                    .attr("height", self.height - self.y(0));

                rects.transition().duration(300)
                    .attr("width", self.x1.rangeBand())
                    .attr("x", function (d) {
                        return self.x1(d.id);
                    })
                    .attr("y", function (d) {
                        return self.y(d.value);
                    })
                    .attr("height", function (d) {
                        return self.height - self.y(d.value);
                    })
                    .style("fill", function (d) {
                        return self.color(d.id);
                    });
            },

            _setup: function () {
                // magic
                var chartHeight = $('#colleges').width() * 0.430;
                var chartWidth = $(this.configuration.container).width();
                var margin = {top: 20, right: 20, bottom: 30, left: 40};

                this.width = chartWidth - margin.left - margin.right;
                this.height = chartHeight - margin.top - margin.bottom;

                this.x0 = d3.scale.ordinal().domain(this.orderedSelection.map(function (val) {
                    return val.type;
                })).rangeRoundBands([0, this.width], this.configuration.bandOffsets);
                this.x1 = d3.scale.ordinal();

                this.y = d3.scale.linear().range([this.height, 0]);

                this.color = d3.scale.ordinal()
                    .range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00",
                        "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707",
                        "#651067", "#329262", "#5574a6", "#3b3eac"]);

                this.xAxis = d3.svg.axis()
                    .scale(this.x0)
                    .orient("bottom");

                this.yAxis = d3.svg.axis()
                    .scale(this.y)
                    .orient("left")
                    .tickFormat(d3.format(".2s"));

                this.svg = d3.select(this.configuration.container).append("svg")
                    .attr("width", this.width + margin.left + margin.right)
                    .attr("height", this.height + margin.top + margin.bottom)
                    .append("g")
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("viewBox", "0 0 " + chartWidth + " " + chartHeight)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                this.svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + this.height + ")");

                this.svg.append("g")
                    .attr("class", "y axis")
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .style("font-weight", "bold")
                    .text(this.configuration.label);
            }
        };

        return BarChart;
    })();

    var barCharts = {};
    var barTypes = Object.keys(defaultMappings);
    for (var i = 0; i < barTypes.length; i++)
        barCharts[barTypes[i]] = new BarChart(barTypes[i]);

    updateBarCharts(testData);
    setTimeout(function () {
        updateBarCharts(testData2);
        setTimeout(function () {
            updateBarCharts(testData3);
            setTimeout(function () {
                updateBarCharts(testData4);
            }, 2000);
        }, 2000);
    }, 2000);
});

var testData = {
    "label": "Colorado",
    "college": {
        "1": 27,
        "2": 28,
        "3": 45,
        "5": 138,
        "6": 30,
        "7": 43,
        "8": 35,
        "9": 7,
        "10": 13
    },
    "ethnicity": {
        "1": 4,
        "2": 8,
        "3": 7,
        "4": 23,
        "5": 0,
        "6": 294,
        "7": 5,
        "8": 25,
        "9": 0
    },
    "count": 366,
    "gender": {
        "1": 122,
        "2": 241,
        "3": 3
    },
    "selection": {
        "1": 122,
        "2": 241,
        "3": 3
    },
    "filters": {}
};

var testData2 = {
    "label": "California",
    "college":{
        "1":6,
        "2":0,
        "3":6,
        "5":15,
        "6":10,
        "7":15,
        "8":8,
        "9":2,
        "10":1
    },
    "ethnicity":{
        "1":0,
        "2":13,
        "3":0,
        "4":5,
        "5":4,
        "6":33,
        "7":6,
        "8":2,
        "9":0
    },
    "count":63,
    "gender":{
        "1":250,
        "2":33,
        "3":0
    },
    "selection":{
        "1":30,
        "2":33,
        "3":0
    },
    "filters": {}
};

var testData3 = {
    "label": "Ohio",
    "college":{
        "1":6,
        "2":0,
        "3":6,
        "5":15,
        "6":10,
        "7":15,
        "8":8,
        "9":2,
        "10":1
    },
    "ethnicity":{
        "1":0,
        "2":13,
        "3":0,
        "4":5,
        "5":4,
        "6":33,
        "7":6,
        "8":2,
        "9":0
    },
    "count":63,
    "gender":{
        "1":30,
        "2":33,
        "3":0
    },
    "selection":{
        "1":30,
        "2":33,
        "3":0
    },
    "filters": {}
};

var testData4 = {
    "label": "Illinois",
    "college":{
        "1":6,
        "2":0,
        "3":6,
        "5":15,
        "6":10,
        "7":15,
        "8":8,
        "9":2,
        "10":1
    },
    "ethnicity":{
        "1":0,
        "2":13,
        "3":0,
        "4":5,
        "5":4,
        "6":33,
        "7":6,
        "8":2,
        "9":0
    },
    "count":63,
    "gender":{
        "1":30,
        "2":33,
        "3":0
    },
    "selection":{
        "1":30,
        "2":33,
        "3":0
    },
    "filters": {}
};


