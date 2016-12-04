$(document).ready(function () {
    var $map = $('#map');
    var selected = 0;
    var containers = [$('#virginia'), $('#usa'), $('#world')];
    var maps = [setupVirginia(containers[0]), setupUSA(containers[1]), setupWorld(containers[2])];
    var contexts = { 'virginia': 0, 'usa': 1, 'world': 2 };
    var resized = [true, true, true];
    var lastSubmittedRequest = null;
    var changingMap = false;

    $map.on('mousewheel', function (e) {
        e.preventDefault();
        if (changingMap)
            return;
        changingMap = true;
        zoom(e.originalEvent.wheelDelta / 120 > 0, selected, containers).done(function (newSelected) {
            selected = newSelected;
            if (!resized[selected]) {
                maps[selected].resize();
                resized[selected] = true;
            }
            changingMap = false;
        });
    });

    $(window).on('resize', function () {
        maps[selected].resize();
        for (var i = 0; i < resized.length; i++)
            resized[i] = i == selected;
    });

    $('.breadcrumb li').on('click', function (e) {
        e.preventDefault();
        var index = 2 - $(this).index();
        if (changingMap || selected == index)
            return;
        changingMap = true;
        jump(selected, index, containers).done(function (newSelected) {
            selected = newSelected;
            if (!resized[selected]) {
                maps[selected].resize();
                resized[selected] = true;
            }
            changingMap = false;
        });
    });

    $('#submit').on('click', updateMaps);

    updateMaps();
    maps[selected].resize();
    containers[selected].hide().css("visibility", "visible").fadeIn();

    function zoom(scrollIn, selected, containers) {
        if ((scrollIn && selected == 0) || (!scrollIn && selected == containers.length - 1))
            return $.Deferred().resolve(selected);
        var next = scrollIn ? selected - 1 : selected + 1;
        return jump(selected, next, containers);
    }

    function jump(from, to, containers) {
        var dfd = $.Deferred();
        containers[from].fadeOut({
            complete: function() {
                containers[to].fadeIn({
                    complete: function () {
                        dfd.resolve(to);
                    }
                });
            }
        });
        return dfd.promise();
    }

    function setupVirginia($elem) {
        return new Datamap({
            width: 1390,
            height: 640,
            element: $elem[0],
            geographyConfig: {
                highlightFillColor: '96BCE2',
                highlightBorderColor: '#357EC7',
                popupTemplate: function(geography, data) {
                    return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong>' +
                        (data && data.count ? '<br />Count: ' + data.count : '') + '</div>';
                },
                highlightClickHandler: function (geography, data) {
                    console.log(geography.properties.name);
                    console.log(data);
                    console.log(lastSubmittedRequest);
                }
            },
            fills: {
                defaultFill: '#DCDCDC'
            },
            scope: 'virginia',
            responsive: true,
            setProjection: function (element, options) {
                var projection = d3.geo.equirectangular()
                    .center([0, 4])
                    .scale(8200)
                    .translate([12050, 5200]);
                var path = d3.geo.path()
                    .projection(projection);

                return { path: path, projection: projection };
            }
        });
    }

    function setupUSA($elem) {
        return new Datamap({
            width: $elem.width(),
            height: $elem.height() - 170,
            geographyConfig: {
                highlightFillColor: '96BCE2',
                highlightBorderColor: '#357EC7',
                popupTemplate: function(geography, data) {
                    return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong>' +
                        (data && data.count ? '<br />Count: ' + data.count : '') + '</div>';
                }
            },
            fills: {
                defaultFill: '#DCDCDC'
            },
            scope: 'usa',
            responsive: true,
            element: $elem[0]
        });
    }

    function setupWorld($elem) {
        return new Datamap({
            width: $elem.width(),
            height: $elem.height() - 170,
            geographyConfig: {
                highlightFillColor: '96BCE2',
                highlightBorderColor: '#357EC7',
                popupTemplate: function(geography, data) {
                    return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong>' +
                        (data && data.count ? '<br />Count: ' + data.count : '') + '</div>';
                }
            },
            fills: {
                defaultFill: '#DCDCDC'
            },
            responsive: true,
            element: $elem[0]
        });
    }

    function updateMaps() {
        lastSubmittedRequest = $.extend({}, request);
        for (var context in contexts) {
            request.context = context;
            submitRequest(function (data) {
                var properties, colorScale;
                var current = contexts[data.context];
                if (!('context' in data) || Object.keys(data).length == 0)
                    return;

                colorScale = d3.scale.log().domain([data.min, data.median, data.max]).range(["red", "yellow", "green"]);
                properties = {};
                Object.keys(data.values).map(function (key) {
                    properties[key] = {
                        'color': colorScale(data.values[key].count),
                        'count': data.values[key].count
                    };
                });
                maps[current].updateChoropleth(properties, { reset: true });
            });
        }
    }

    window.document.updateMaps = updateMaps;
});

var testData = [
    {
        "avg": 7,
        "min": 1,
        "max": 9,
        "values": {
            "VA1": 1,
            "VA2": 4,
            "VA3": 9,
            "VA4": 7,
            "VA5": 8,
            "VA6": 1,
            "VA7": 7,
            "VA8": 2,
            "VA9": 5,
            "VA10": 6,
            "VA11": 8,
            "VA12": 3,
            "VA13": 5,
            "VA14": 3,
            "VA15": 9,
            "VA16": 3,
            "VA17": 7,
            "VA18": 6,
            "VA19": 9,
            "VA20": 4,
            "VA21": 7,
            "VA22": 3,
            "VA23": 5,
            "VA24": 9,
            "VA25": 1,
            "VA26": 4,
            "VA27": 7,
            "VA28": 7,
            "VA29": 1,
            "VA30": 6,
            "VA31": 2,
            "VA32": 6,
            "VA33": 6,
            "VA34": 7,
            "VA35": 6,
            "VA36": 3,
            "VA37": 2,
            "VA38": 1,
            "VA39": 4,
            "VA40": 1,
            "VA41": 5,
            "VA42": 8,
            "VA43": 3,
            "VA44": 5,
            "VA45": 1,
            "VA46": 7,
            "VA47": 9,
            "VA48": 9,
            "VA49": 8,
            "VA50": 5
        }
    },
    {},
    {}
];