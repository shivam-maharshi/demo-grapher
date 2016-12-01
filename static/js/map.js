$(document).ready(function () {
    var $map = $('#map');
    var selected = 0;
    var containers = [$('#virginia'), $('#usa'), $('#world')];
    var maps = [setupVirginia(containers[0]), setupUSA(containers[1]), setupWorld(containers[2])];
    var resized = [true, true, true];
    var zooming = false;

    maps[selected].resize();
    $map.on('mousewheel', function (e) {
        e.preventDefault();
        if (zooming)
            return;
        zooming = true;
        zoom(e.originalEvent.wheelDelta / 120 > 0, selected, containers).done(function (newSelected) {
            selected = newSelected;
            if (!resized[selected]) {
                maps[selected].resize();
                resized[selected] = true;
            }
            zooming = false;
        });
    });

    $(window).on('resize', function () {
        maps[selected].resize();
        for (var i = 0; i < resized.length; i++)
            resized[i] = i == selected;
    })
});

function zoom(scrollIn, selected, containers) {
    var dfd = $.Deferred();
    if ((scrollIn && selected == 0) || (!scrollIn && selected == containers.length - 1))
        return dfd.resolve(selected);
    containers[selected].fadeOut({
        complete: function() {
            containers[scrollIn ? --selected : ++selected].fadeIn({
                complete: function () {
                    dfd.resolve(selected);
                }
            });
        }
    });
    return dfd.promise();
}

function setupVirginia($elem) {
    return new Datamap({
        width: $elem.width(),
        height: $elem.height(),
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
                .translate([12050, 5250]);
            var path = d3.geo.path()
                .projection(projection);

            return { path: path, projection: projection };
        }
    });
}

function setupUSA($elem) {
    return new Datamap({
        width: $elem.width(),
        height: $elem.height(),
        scope: 'usa',
        responsive: true,
        element: $elem[0]
    });
}

function setupWorld($elem) {
    return new Datamap({
        width: $elem.width(),
        height: $elem.height(),
        responsive: true,
        element: $elem[0]
    });
}