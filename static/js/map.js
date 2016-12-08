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

    updateMaps(function (data) {
        if (contexts[data.context] != selected)
            return;
        var geographies = {};
        maps[selected].svg.selectAll('.datamaps-subunit').data().forEach(function (val) {
            geographies[val.id] = val;
        });
        for (var key in data.values) {
            if (data.values.hasOwnProperty(key)) {
                if (data.values[key].count == data.max) {
                    var selection = {
                        label: geographies[key].properties.name,
                        gender: data.values[key].gender,
                        ethnicity: data.values[key].race,
                        college: data.values[key].college
                    };
                    selection.filters = $.extend({}, lastSubmittedRequest);
                    updateCaptureAndCompare(selection);
                }
            }
        }
    });
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

    function updateSelection(geography, data) {
        var selection = { label: geography.properties.name };
        selection = $.extend(selection, data);
        selection.filters = $.extend({}, lastSubmittedRequest);
        updateCaptureAndCompare(selection);
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
                highlightClickHandler: updateSelection
            },
            fills: {
                min: '#FF0000',
                middle: '#FFFF00',
                max: '#008000',
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
            height: $elem.parent().height() * 0.9,
            geographyConfig: {
                highlightFillColor: '96BCE2',
                highlightBorderColor: '#357EC7',
                popupTemplate: function(geography, data) {
                    return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong>' +
                        (data && data.count ? '<br />Count: ' + data.count : '') + '</div>';
                },
                highlightClickHandler: updateSelection
            },
            fills: {
                min: '#FF0000',
                middle: '#FFFF00',
                max: '#008000',
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
            height: $elem.parent().height() * 0.9,
            geographyConfig: {
                highlightFillColor: '96BCE2',
                highlightBorderColor: '#357EC7',
                popupTemplate: function(geography, data) {
                    return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong>' +
                        (data && data.count ? '<br />Count: ' + data.count : '') + '</div>';
                },
                highlightClickHandler: updateSelection
            },
            fills: {
                min: '#FF0000',
                middle: '#FFFF00',
                max: '#008000',
                defaultFill: '#DCDCDC'
            },
            responsive: true,
            element: $elem[0]
        });
    }

    function updateMaps(callback) {
        lastSubmittedRequest = $.extend({}, request);
        for (var context in contexts) {
            request.context = context;
            containers[contexts[context]].css('pointerEvents', 'none');
            submitRequest(function (data) {
                var properties, colors, colorScale;
                var current = contexts[data.context];
                if (!('context' in data) || Object.keys(data).length == 0)
                    return;

                colors = maps[current].options.fills;
                colorScale = d3.scale.log()
                    .domain([data.min, data.median, data.max])
                    .range([colors.min, colors.middle, colors.max]);
                properties = {};
                Object.keys(data.values).map(function (key) {
                    properties[key] = {
                        'color': colorScale(data.values[key].count),
                        'count': data.values[key].count,
                        'gender': data.values[key].gender,
                        'ethnicity': data.values[key].race,
                        'college': data.values[key].college
                    };
                });
                maps[current].legend({
                    labels: {
                        max: 'Max',
                        middle: 'Median',
                        min: 'Min'
                    }
                });
                maps[current].updateChoropleth(properties, { reset: true });
                containers[current].css('pointerEvents', '');
                if (callback && $.isFunction(callback))
                    callback(data);
            });
        }
    }

    window.updateMaps = updateMaps;
});