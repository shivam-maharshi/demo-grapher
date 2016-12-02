$(document).ready(function () {
    var $map = $('#map');
    var selected = 0;
    var containers = [$('#virginia'), $('#usa'), $('#world')];
    var maps = [setupVirginia(containers[0]), setupUSA(containers[1]), setupWorld(containers[2])];
    var resized = [true, true, true];
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

    // hack around eventual rendering
    setTimeout(function () {
        maps[selected].resize();
        maps[selected].labels();
        containers[selected].hide().css("visibility", "visible").fadeIn();
    }, 100);
});

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
    var map = new Datamap({
        width: 1390,
        height: 640,
        element: $elem[0],
        geographyConfig: {
            dataUrl: '/static/js/virginia.json'
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

    map.labels();
    return map;
}

function setupUSA($elem) {
    var map = new Datamap({
        width: $elem.width(),
        height: $elem.height() - 170,
        scope: 'usa',
        responsive: true,
        element: $elem[0]
    });

    map.labels();
    return map;
}

function setupWorld($elem) {
    var map = new Datamap({
        width: $elem.width(),
        height: $elem.height() - 170,
        responsive: true,
        element: $elem[0]
    });

    map.labels();
    return map;
}