(function() {
  var svg;

  // Save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightClickHandler: function(geography, data) {
          // do nothing
        }
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function(geography, data) {
        // Case with latitude and longitude
        if ( ( data.origin && data.destination ) && data.origin.latitude && data.origin.longitude && data.destination.latitude && data.destination.longitude ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' + JSON.stringify(data.origin) + '<br>Destination: ' + JSON.stringify(data.destination) + '</div>';
        }
        // Case with only country name
        else if ( data.origin && data.destination ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>' + data.origin + ' -> ' + data.destination + '</div>';
        }
        // Missing information
        else {
          return '';
        }
      }
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; right: 4px; top: 45px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .datamaps-clickable { cursor: pointer; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .classed('datamaps-clickable', Object.keys(datum).length > 0)
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            // As per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test(navigator.userAgent) ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
            $this.classed('.datamaps-clickable', false);
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .on('click', function(d) {
          var $this = d3.select(this);
          if (!$this.classed('datamaps-clickable'))
              return;

          if (options.highlightClickHandler) {
            var data = JSON.parse($this.attr('data-info'));

            options.highlightClickHandler(d, data);
          }
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {

            var originXY, destXY;

            if (typeof datum.origin === "string") {
              switch (datum.origin) {
                   case "CAN":
                       originXY = self.latLngToXY(56.624472, -114.665293);
                       break;
                   case "CHL":
                       originXY = self.latLngToXY(-33.448890, -70.669265);
                       break;
                   case "IDN":
                       originXY = self.latLngToXY(-6.208763, 106.845599);
                       break;
                   case "JPN":
                       originXY = self.latLngToXY(35.689487, 139.691706);
                       break;
                   case "MYS":
                       originXY = self.latLngToXY(3.139003, 101.686855);
                       break;
                   case "NOR":
                       originXY = self.latLngToXY(59.913869, 10.752245);
                       break;
                   case "USA":
                       originXY = self.latLngToXY(41.140276, -100.760145);
                       break;
                   case "VNM":
                       originXY = self.latLngToXY(21.027764, 105.834160);
                       break;
                   default:
                       originXY = self.path.centroid(svg.select('path.' + datum.origin).data()[0]);
               }
            } else {
              originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
            }

            if (typeof datum.destination === 'string') {
              switch (datum.destination) {
                     case "CAN":
                        destXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "CHL":
                        destXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "IDN":
                        destXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "JPN":
                        destXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "MYS":
                        destXY = self.latLngToXY(3.139003, 101.686855);
                        break;
                    case "NOR":
                        destXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    case "USA":
                        destXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "VNM":
                        destXY = self.latLngToXY(21.027764, 105.834160);
                        break;
                    default:
                        destXY = self.path.centroid(svg.select('path.' + datum.destination).data()[0]);
              }
            } else {
              destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            }
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum))
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

          layer.append("text")
              .attr("x", x)
              .attr("y", y)
              .style("font-weight", "bold")
              .style("font-size", (options.fontSize || 10) + 'px')
              .style("font-family", options.fontFamily || "Verdana")
              .style("fill", options.labelColor || "#000")
              .text(function() {
                  if (options.customLabelText && options.customLabelText[d.id]) {
                      return options.customLabelText[d.id]
                  }
              });

        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
          // If animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
          return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      })
    .transition()
      .duration(0)
      .attr('data-info', function(d) {
        return JSON.stringify(d);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            }
            else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    // Add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // If fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          // Allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            // In the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        // Fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = {
    "type": "Topology",
    "objects": {
        "world": {
            "type": "GeometryCollection",
            "geometries": [{
                "type": "Polygon",
                "properties": {
                    "name": "Afghanistan"
                },
                "id": "AFG",
                "arcs": [
                    [0, 1, 2, 3, 4, 5]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Angola"
                },
                "id": "AGO",
                "arcs": [
                    [
                        [6, 7, 8, 9]
                    ],
                    [
                        [10, 11, 12]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Albania"
                },
                "id": "ALB",
                "arcs": [
                    [13, 14, 15, 16, 17]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "United Arab Emirates"
                },
                "id": "ARE",
                "arcs": [
                    [18, 19, 20, 21, 22]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Argentina"
                },
                "id": "ARG",
                "arcs": [
                    [
                        [23, 24]
                    ],
                    [
                        [25, 26, 27, 28, 29, 30]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Armenia"
                },
                "id": "ARM",
                "arcs": [
                    [31, 32, 33, 34, 35]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Antarctica"
                },
                "id": "ATA",
                "arcs": [
                    [
                        [36]
                    ],
                    [
                        [37]
                    ],
                    [
                        [38]
                    ],
                    [
                        [39]
                    ],
                    [
                        [40]
                    ],
                    [
                        [41]
                    ],
                    [
                        [42]
                    ],
                    [
                        [43]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "French Southern and Antarctic Lands"
                },
                "id": "ATF",
                "arcs": [
                    [44]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Australia"
                },
                "id": "AUS",
                "arcs": [
                    [
                        [45]
                    ],
                    [
                        [46]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Austria"
                },
                "id": "AUT",
                "arcs": [
                    [47, 48, 49, 50, 51, 52, 53]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Azerbaijan"
                },
                "id": "AZE",
                "arcs": [
                    [
                        [54, -35]
                    ],
                    [
                        [55, 56, -33, 57, 58]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Burundi"
                },
                "id": "BDI",
                "arcs": [
                    [59, 60, 61]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Belgium"
                },
                "id": "BEL",
                "arcs": [
                    [62, 63, 64, 65, 66]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Benin"
                },
                "id": "BEN",
                "arcs": [
                    [67, 68, 69, 70, 71]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Burkina Faso"
                },
                "id": "BFA",
                "arcs": [
                    [72, 73, 74, -70, 75, 76]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Bangladesh"
                },
                "id": "BGD",
                "arcs": [
                    [77, 78, 79]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Bulgaria"
                },
                "id": "BGR",
                "arcs": [
                    [80, 81, 82, 83, 84, 85]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "The Bahamas"
                },
                "id": "BHS",
                "arcs": [
                    [
                        [86]
                    ],
                    [
                        [87]
                    ],
                    [
                        [88]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Bosnia and Herzegovina"
                },
                "id": "BIH",
                "arcs": [
                    [89, 90, 91]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Belarus"
                },
                "id": "BLR",
                "arcs": [
                    [92, 93, 94, 95, 96]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Belize"
                },
                "id": "BLZ",
                "arcs": [
                    [97, 98, 99]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Bolivia"
                },
                "id": "BOL",
                "arcs": [
                    [100, 101, 102, 103, -31]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Brazil"
                },
                "id": "BRA",
                "arcs": [
                    [-27, 104, -103, 105, 106, 107, 108, 109, 110, 111, 112]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Brunei"
                },
                "id": "BRN",
                "arcs": [
                    [113, 114]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Bhutan"
                },
                "id": "BTN",
                "arcs": [
                    [115, 116]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Botswana"
                },
                "id": "BWA",
                "arcs": [
                    [117, 118, 119, 120]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Central African Republic"
                },
                "id": "CAF",
                "arcs": [
                    [121, 122, 123, 124, 125, 126, 127]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Canada"
                },
                "id": "CAN",
                "arcs": [
                    [
                        [128]
                    ],
                    [
                        [129]
                    ],
                    [
                        [130]
                    ],
                    [
                        [131]
                    ],
                    [
                        [132]
                    ],
                    [
                        [133]
                    ],
                    [
                        [134]
                    ],
                    [
                        [135]
                    ],
                    [
                        [136]
                    ],
                    [
                        [137]
                    ],
                    [
                        [138, 139, 140, 141]
                    ],
                    [
                        [142]
                    ],
                    [
                        [143]
                    ],
                    [
                        [144]
                    ],
                    [
                        [145]
                    ],
                    [
                        [146]
                    ],
                    [
                        [147]
                    ],
                    [
                        [148]
                    ],
                    [
                        [149]
                    ],
                    [
                        [150]
                    ],
                    [
                        [151]
                    ],
                    [
                        [152]
                    ],
                    [
                        [153]
                    ],
                    [
                        [154]
                    ],
                    [
                        [155]
                    ],
                    [
                        [156]
                    ],
                    [
                        [157]
                    ],
                    [
                        [158]
                    ],
                    [
                        [159]
                    ],
                    [
                        [160]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Switzerland"
                },
                "id": "CHE",
                "arcs": [
                    [-51, 161, 162, 163]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Chile"
                },
                "id": "CHL",
                "arcs": [
                    [
                        [-24, 164]
                    ],
                    [
                        [-30, 165, 166, -101]
                    ]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "China"
                },
                "id": "CHN",
                "arcs": [
                    [
                        [167]
                    ],
                    [
                        [168, 169, 170, 171, 172, 173, -117, 174, 175, 176, 177, -4, 178, 179, 180, 181, 182, 183]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ivory Coast"
                },
                "id": "CIV",
                "arcs": [
                    [184, 185, 186, 187, -73, 188]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Cameroon"
                },
                "id": "CMR",
                "arcs": [
                    [189, 190, 191, 192, 193, 194, -128, 195]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Democratic Republic of the Congo"
                },
                "id": "COD",
                "arcs": [
                    [196, 197, -60, 198, 199, -10, 200, -13, 201, -126, 202]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Republic of the Congo"
                },
                "id": "COG",
                "arcs": [
                    [-12, 203, 204, -196, -127, -202]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Colombia"
                },
                "id": "COL",
                "arcs": [
                    [205, 206, 207, 208, 209, -107, 210]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Costa Rica"
                },
                "id": "CRI",
                "arcs": [
                    [211, 212, 213, 214]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Cuba"
                },
                "id": "CUB",
                "arcs": [
                    [215]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Northern Cyprus"
                },
                "id": "-99",
                "arcs": [
                    [216, 217]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Cyprus"
                },
                "id": "CYP",
                "arcs": [
                    [218, -218]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Czech Republic"
                },
                "id": "CZE",
                "arcs": [
                    [-53, 219, 220, 221]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Germany"
                },
                "id": "DEU",
                "arcs": [
                    [222, 223, -220, -52, -164, 224, 225, -64, 226, 227, 228]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Djibouti"
                },
                "id": "DJI",
                "arcs": [
                    [229, 230, 231, 232]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Denmark"
                },
                "id": "DNK",
                "arcs": [
                    [
                        [233]
                    ],
                    [
                        [-229, 234]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Dominican Republic"
                },
                "id": "DOM",
                "arcs": [
                    [235, 236]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Algeria"
                },
                "id": "DZA",
                "arcs": [
                    [237, 238, 239, 240, 241, 242, 243, 244]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ecuador"
                },
                "id": "ECU",
                "arcs": [
                    [245, -206, 246]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Egypt"
                },
                "id": "EGY",
                "arcs": [
                    [247, 248, 249, 250, 251]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Eritrea"
                },
                "id": "ERI",
                "arcs": [
                    [252, 253, 254, -233]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Spain"
                },
                "id": "ESP",
                "arcs": [
                    [255, 256, 257, 258]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Estonia"
                },
                "id": "EST",
                "arcs": [
                    [259, 260, 261]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ethiopia"
                },
                "id": "ETH",
                "arcs": [
                    [-232, 262, 263, 264, 265, 266, 267, -253]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Finland"
                },
                "id": "FIN",
                "arcs": [
                    [268, 269, 270, 271]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Fiji"
                },
                "id": "FJI",
                "arcs": [
                    [
                        [272]
                    ],
                    [
                        [273, 274]
                    ],
                    [
                        [275, -275]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Falkland Islands"
                },
                "id": "FLK",
                "arcs": [
                    [276]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "France"
                },
                "id": "FRA",
                "arcs": [
                    [
                        [277]
                    ],
                    [
                        [278, -225, -163, 279, 280, -257, 281, -66]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "French Guiana"
                },
                "id": "GUF",
                "arcs": [
                    [282, 283, 284, 285, -111]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Gabon"
                },
                "id": "GAB",
                "arcs": [
                    [286, 287, -190, -205]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "United Kingdom"
                },
                "id": "GBR",
                "arcs": [
                    [
                        [288, 289]
                    ],
                    [
                        [290]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Georgia"
                },
                "id": "GEO",
                "arcs": [
                    [291, 292, -58, -32, 293]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ghana"
                },
                "id": "GHA",
                "arcs": [
                    [294, -189, -77, 295]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Guinea"
                },
                "id": "GIN",
                "arcs": [
                    [296, 297, 298, 299, 300, 301, -187]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Gambia"
                },
                "id": "GMB",
                "arcs": [
                    [302, 303]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Guinea Bissau"
                },
                "id": "GNB",
                "arcs": [
                    [304, 305, -300]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Equatorial Guinea"
                },
                "id": "GNQ",
                "arcs": [
                    [306, -191, -288]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Greece"
                },
                "id": "GRC",
                "arcs": [
                    [
                        [307]
                    ],
                    [
                        [308, -15, 309, -84, 310]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Greenland"
                },
                "id": "GRL",
                "arcs": [
                    [311]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Guatemala"
                },
                "id": "GTM",
                "arcs": [
                    [312, 313, -100, 314, 315, 316]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Guyana"
                },
                "id": "GUY",
                "arcs": [
                    [317, 318, -109, 319]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Honduras"
                },
                "id": "HND",
                "arcs": [
                    [320, 321, -316, 322, 323]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Croatia"
                },
                "id": "HRV",
                "arcs": [
                    [324, -92, 325, 326, 327, 328]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Haiti"
                },
                "id": "HTI",
                "arcs": [
                    [-237, 329]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Hungary"
                },
                "id": "HUN",
                "arcs": [
                    [-48, 330, 331, 332, 333, -329, 334]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Indonesia"
                },
                "id": "IDN",
                "arcs": [
                    [
                        [335]
                    ],
                    [
                        [336, 337]
                    ],
                    [
                        [338]
                    ],
                    [
                        [339]
                    ],
                    [
                        [340]
                    ],
                    [
                        [341]
                    ],
                    [
                        [342]
                    ],
                    [
                        [343]
                    ],
                    [
                        [344, 345]
                    ],
                    [
                        [346]
                    ],
                    [
                        [347]
                    ],
                    [
                        [348, 349]
                    ],
                    [
                        [350]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "India"
                },
                "id": "IND",
                "arcs": [
                    [-177, 351, -175, -116, -174, 352, -80, 353, 354]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ireland"
                },
                "id": "IRL",
                "arcs": [
                    [355, -289]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Iran"
                },
                "id": "IRN",
                "arcs": [
                    [356, -6, 357, 358, 359, 360, -55, -34, -57, 361]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Iraq"
                },
                "id": "IRQ",
                "arcs": [
                    [362, 363, 364, 365, 366, 367, -360]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Iceland"
                },
                "id": "ISL",
                "arcs": [
                    [368]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Israel"
                },
                "id": "ISR",
                "arcs": [
                    [369, 370, 371, -252, 372, 373, 374]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Italy"
                },
                "id": "ITA",
                "arcs": [
                    [
                        [375]
                    ],
                    [
                        [376]
                    ],
                    [
                        [377, 378, -280, -162, -50]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Jamaica"
                },
                "id": "JAM",
                "arcs": [
                    [379]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Jordan"
                },
                "id": "JOR",
                "arcs": [
                    [-370, 380, -366, 381, 382, -372, 383]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Japan"
                },
                "id": "JPN",
                "arcs": [
                    [
                        [384]
                    ],
                    [
                        [385]
                    ],
                    [
                        [386]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Kazakhstan"
                },
                "id": "KAZ",
                "arcs": [
                    [387, 388, 389, 390, -181, 391]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Kenya"
                },
                "id": "KEN",
                "arcs": [
                    [392, 393, 394, 395, -265, 396]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Kyrgyzstan"
                },
                "id": "KGZ",
                "arcs": [
                    [-392, -180, 397, 398]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Cambodia"
                },
                "id": "KHM",
                "arcs": [
                    [399, 400, 401, 402]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "South Korea"
                },
                "id": "KOR",
                "arcs": [
                    [403, 404]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Kosovo"
                },
                "id": "-99",
                "arcs": [
                    [-18, 405, 406, 407]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Kuwait"
                },
                "id": "KWT",
                "arcs": [
                    [408, 409, -364]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Laos"
                },
                "id": "LAO",
                "arcs": [
                    [410, 411, -172, 412, -401]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Lebanon"
                },
                "id": "LBN",
                "arcs": [
                    [-374, 413, 414]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Liberia"
                },
                "id": "LBR",
                "arcs": [
                    [415, 416, -297, -186]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Libya"
                },
                "id": "LBY",
                "arcs": [
                    [417, -245, 418, 419, -250, 420, 421]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Sri Lanka"
                },
                "id": "LKA",
                "arcs": [
                    [422]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Lesotho"
                },
                "id": "LSO",
                "arcs": [
                    [423]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Lithuania"
                },
                "id": "LTU",
                "arcs": [
                    [424, 425, 426, -93, 427]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Luxembourg"
                },
                "id": "LUX",
                "arcs": [
                    [-226, -279, -65]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Latvia"
                },
                "id": "LVA",
                "arcs": [
                    [428, -262, 429, -94, -427]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Morocco"
                },
                "id": "MAR",
                "arcs": [
                    [-242, 430, 431]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Moldova"
                },
                "id": "MDA",
                "arcs": [
                    [432, 433]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Madagascar"
                },
                "id": "MDG",
                "arcs": [
                    [434]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Mexico"
                },
                "id": "MEX",
                "arcs": [
                    [435, -98, -314, 436, 437]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Macedonia"
                },
                "id": "MKD",
                "arcs": [
                    [-408, 438, -85, -310, -14]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Mali"
                },
                "id": "MLI",
                "arcs": [
                    [439, -239, 440, -74, -188, -302, 441]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Myanmar"
                },
                "id": "MMR",
                "arcs": [
                    [442, -78, -353, -173, -412, 443]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Montenegro"
                },
                "id": "MNE",
                "arcs": [
                    [444, -326, -91, 445, -406, -17]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Mongolia"
                },
                "id": "MNG",
                "arcs": [
                    [446, -183]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Mozambique"
                },
                "id": "MOZ",
                "arcs": [
                    [447, 448, 449, 450, 451, 452, 453, 454]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Mauritania"
                },
                "id": "MRT",
                "arcs": [
                    [455, 456, 457, -240, -440]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Malawi"
                },
                "id": "MWI",
                "arcs": [
                    [-455, 458, 459]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Malaysia"
                },
                "id": "MYS",
                "arcs": [
                    [
                        [460, 461]
                    ],
                    [
                        [-349, 462, -115, 463]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Namibia"
                },
                "id": "NAM",
                "arcs": [
                    [464, -8, 465, -119, 466]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "New Caledonia"
                },
                "id": "NCL",
                "arcs": [
                    [467]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Niger"
                },
                "id": "NER",
                "arcs": [
                    [-75, -441, -238, -418, 468, -194, 469, -71]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Nigeria"
                },
                "id": "NGA",
                "arcs": [
                    [470, -72, -470, -193]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Nicaragua"
                },
                "id": "NIC",
                "arcs": [
                    [471, -324, 472, -213]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Netherlands"
                },
                "id": "NLD",
                "arcs": [
                    [-227, -63, 473]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Norway"
                },
                "id": "NOR",
                "arcs": [
                    [
                        [474, -272, 475, 476]
                    ],
                    [
                        [477]
                    ],
                    [
                        [478]
                    ],
                    [
                        [479]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Nepal"
                },
                "id": "NPL",
                "arcs": [
                    [-352, -176]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "New Zealand"
                },
                "id": "NZL",
                "arcs": [
                    [
                        [480]
                    ],
                    [
                        [481]
                    ]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Oman"
                },
                "id": "OMN",
                "arcs": [
                    [
                        [482, 483, -22, 484]
                    ],
                    [
                        [-20, 485]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Pakistan"
                },
                "id": "PAK",
                "arcs": [
                    [-178, -355, 486, -358, -5]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Panama"
                },
                "id": "PAN",
                "arcs": [
                    [487, -215, 488, -208]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Peru"
                },
                "id": "PER",
                "arcs": [
                    [-167, 489, -247, -211, -106, -102]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Philippines"
                },
                "id": "PHL",
                "arcs": [
                    [
                        [490]
                    ],
                    [
                        [491]
                    ],
                    [
                        [492]
                    ],
                    [
                        [493]
                    ],
                    [
                        [494]
                    ],
                    [
                        [495]
                    ],
                    [
                        [496]
                    ]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Papua New Guinea"
                },
                "id": "PNG",
                "arcs": [
                    [
                        [497]
                    ],
                    [
                        [498]
                    ],
                    [
                        [-345, 499]
                    ],
                    [
                        [500]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Poland"
                },
                "id": "POL",
                "arcs": [
                    [-224, 501, 502, -428, -97, 503, 504, -221]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Puerto Rico"
                },
                "id": "PRI",
                "arcs": [
                    [505]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "North Korea"
                },
                "id": "PRK",
                "arcs": [
                    [506, 507, -405, 508, -169]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Portugal"
                },
                "id": "PRT",
                "arcs": [
                    [-259, 509]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Paraguay"
                },
                "id": "PRY",
                "arcs": [
                    [-104, -105, -26]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Qatar"
                },
                "id": "QAT",
                "arcs": [
                    [510, 511]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Romania"
                },
                "id": "ROU",
                "arcs": [
                    [512, -434, 513, 514, -81, 515, -333]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Russia"
                },
                "id": "RUS",
                "arcs": [
                    [
                        [516]
                    ],
                    [
                        [-503, 517, -425]
                    ],
                    [
                        [518, 519]
                    ],
                    [
                        [520]
                    ],
                    [
                        [521]
                    ],
                    [
                        [522]
                    ],
                    [
                        [523]
                    ],
                    [
                        [524]
                    ],
                    [
                        [525]
                    ],
                    [
                        [526, -507, -184, -447, -182, -391, 527, -59, -293, 528, 529, -95, -430, -261, 530, -269, -475, 531, -520]
                    ],
                    [
                        [532]
                    ],
                    [
                        [533]
                    ],
                    [
                        [534]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Rwanda"
                },
                "id": "RWA",
                "arcs": [
                    [535, -61, -198, 536]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Western Sahara"
                },
                "id": "ESH",
                "arcs": [
                    [-241, -458, 537, -431]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Saudi Arabia"
                },
                "id": "SAU",
                "arcs": [
                    [538, -382, -365, -410, 539, -512, 540, -23, -484, 541]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Sudan"
                },
                "id": "SDN",
                "arcs": [
                    [542, 543, -123, 544, -421, -249, 545, -254, -268, 546]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "South Sudan"
                },
                "id": "SSD",
                "arcs": [
                    [547, -266, -396, 548, -203, -125, 549, -543]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Senegal"
                },
                "id": "SEN",
                "arcs": [
                    [550, -456, -442, -301, -306, 551, -304]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Solomon Islands"
                },
                "id": "SLB",
                "arcs": [
                    [
                        [552]
                    ],
                    [
                        [553]
                    ],
                    [
                        [554]
                    ],
                    [
                        [555]
                    ],
                    [
                        [556]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Sierra Leone"
                },
                "id": "SLE",
                "arcs": [
                    [557, -298, -417]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "El Salvador"
                },
                "id": "SLV",
                "arcs": [
                    [558, -317, -322]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Somaliland"
                },
                "id": "-99",
                "arcs": [
                    [-263, -231, 559, 560]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Somalia"
                },
                "id": "SOM",
                "arcs": [
                    [-397, -264, -561, 561]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Republic of Serbia"
                },
                "id": "SRB",
                "arcs": [
                    [-86, -439, -407, -446, -90, -325, -334, -516]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Suriname"
                },
                "id": "SUR",
                "arcs": [
                    [562, -285, 563, -283, -110, -319]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Slovakia"
                },
                "id": "SVK",
                "arcs": [
                    [-505, 564, -331, -54, -222]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Slovenia"
                },
                "id": "SVN",
                "arcs": [
                    [-49, -335, -328, 565, -378]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Sweden"
                },
                "id": "SWE",
                "arcs": [
                    [-476, -271, 566]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Swaziland"
                },
                "id": "SWZ",
                "arcs": [
                    [567, -451]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Syria"
                },
                "id": "SYR",
                "arcs": [
                    [-381, -375, -415, 568, 569, -367]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Chad"
                },
                "id": "TCD",
                "arcs": [
                    [-469, -422, -545, -122, -195]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Togo"
                },
                "id": "TGO",
                "arcs": [
                    [570, -296, -76, -69]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Thailand"
                },
                "id": "THA",
                "arcs": [
                    [571, -462, 572, -444, -411, -400]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Tajikistan"
                },
                "id": "TJK",
                "arcs": [
                    [-398, -179, -3, 573]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Turkmenistan"
                },
                "id": "TKM",
                "arcs": [
                    [-357, 574, -389, 575, -1]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "East Timor"
                },
                "id": "TLS",
                "arcs": [
                    [576, -337]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Trinidad and Tobago"
                },
                "id": "TTO",
                "arcs": [
                    [577]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Tunisia"
                },
                "id": "TUN",
                "arcs": [
                    [-244, 578, -419]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Turkey"
                },
                "id": "TUR",
                "arcs": [
                    [
                        [-294, -36, -361, -368, -570, 579]
                    ],
                    [
                        [-311, -83, 580]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Taiwan"
                },
                "id": "TWN",
                "arcs": [
                    [581]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "United Republic of Tanzania"
                },
                "id": "TZA",
                "arcs": [
                    [-394, 582, -448, -460, 583, -199, -62, -536, 584]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Uganda"
                },
                "id": "UGA",
                "arcs": [
                    [-537, -197, -549, -395, -585]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Ukraine"
                },
                "id": "UKR",
                "arcs": [
                    [-530, 585, -514, -433, -513, -332, -565, -504, -96]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Uruguay"
                },
                "id": "URY",
                "arcs": [
                    [-113, 586, -28]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "United States of America"
                },
                "id": "USA",
                "arcs": [
                    [
                        [587]
                    ],
                    [
                        [588]
                    ],
                    [
                        [589]
                    ],
                    [
                        [590]
                    ],
                    [
                        [591]
                    ],
                    [
                        [592, -438, 593, -139]
                    ],
                    [
                        [594]
                    ],
                    [
                        [595]
                    ],
                    [
                        [596]
                    ],
                    [
                        [-141, 597]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Uzbekistan"
                },
                "id": "UZB",
                "arcs": [
                    [-576, -388, -399, -574, -2]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Venezuela"
                },
                "id": "VEN",
                "arcs": [
                    [598, -320, -108, -210]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Vietnam"
                },
                "id": "VNM",
                "arcs": [
                    [599, -402, -413, -171]
                ]
            }, {
                "type": "MultiPolygon",
                "properties": {
                    "name": "Vanuatu"
                },
                "id": "VUT",
                "arcs": [
                    [
                        [600]
                    ],
                    [
                        [601]
                    ]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "West Bank"
                },
                "id": "PSE",
                "arcs": [
                    [-384, -371]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Yemen"
                },
                "id": "YEM",
                "arcs": [
                    [602, -542, -483]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "South Africa"
                },
                "id": "ZAF",
                "arcs": [
                    [-467, -118, 603, -452, -568, -450, 604],
                    [-424]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Zambia"
                },
                "id": "ZMB",
                "arcs": [
                    [-459, -454, 605, -120, -466, -7, -200, -584]
                ]
            }, {
                "type": "Polygon",
                "properties": {
                    "name": "Zimbabwe"
                },
                "id": "ZWE",
                "arcs": [
                    [-604, -121, -606, -453]
                ]
            }]
        }
    },
    "arcs": [
        [
            [6700, 7164],
            [28, -23],
            [21, 8],
            [6, 27],
            [22, 9],
            [15, 18],
            [6, 47],
            [23, 11],
            [5, 21],
            [13, -15],
            [8, -2]
        ],
        [
            [6847, 7265],
            [16, -1],
            [20, -12]
        ],
        [
            [6883, 7252],
            [9, -7],
            [20, 19],
            [9, -12],
            [9, 27],
            [17, -1],
            [4, 9],
            [3, 24],
            [12, 20],
            [15, -13],
            [-3, -18],
            [9, -3],
            [-3, -50],
            [11, -19],
            [10, 12],
            [12, 6],
            [17, 27],
            [19, -5],
            [29, 0]
        ],
        [
            [7082, 7268],
            [5, -17]
        ],
        [
            [7087, 7251],
            [-16, -6],
            [-14, -11],
            [-32, -7],
            [-30, -13],
            [-16, -25],
            [6, -25],
            [4, -30],
            [-14, -25],
            [1, -22],
            [-8, -22],
            [-26, 2],
            [11, -39],
            [-18, -15],
            [-12, -35],
            [2, -36],
            [-11, -16],
            [-10, 5],
            [-22, -8],
            [-3, -16],
            [-20, 0],
            [-16, -34],
            [-1, -50],
            [-36, -24],
            [-19, 5],
            [-6, -13],
            [-16, 7],
            [-28, -8],
            [-47, 30]
        ],
        [
            [6690, 6820],
            [25, 53],
            [-2, 38],
            [-21, 10],
            [-2, 38],
            [-9, 47],
            [12, 32],
            [-12, 9],
            [7, 43],
            [12, 74]
        ],
        [
            [5664, 4412],
            [3, -18],
            [-4, -29],
            [5, -28],
            [-4, -22],
            [3, -20],
            [-58, 1],
            [-2, -188],
            [19, -49],
            [18, -37]
        ],
        [
            [5644, 4022],
            [-51, -24],
            [-67, 9],
            [-19, 28],
            [-113, -3],
            [-4, -4],
            [-17, 27],
            [-18, 2],
            [-16, -10],
            [-14, -12]
        ],
        [
            [5325, 4035],
            [-2, 38],
            [4, 51],
            [9, 55],
            [2, 25],
            [9, 53],
            [6, 24],
            [16, 39],
            [9, 26],
            [3, 44],
            [-1, 34],
            [-9, 21],
            [-7, 36],
            [-7, 35],
            [2, 12],
            [8, 24],
            [-8, 57],
            [-6, 39],
            [-14, 38],
            [3, 11]
        ],
        [
            [5342, 4697],
            [11, 8],
            [8, -1],
            [10, 7],
            [82, -1],
            [7, -44],
            [8, -35],
            [6, -19],
            [11, -31],
            [18, 5],
            [9, 8],
            [16, -8],
            [4, 14],
            [7, 35],
            [17, 2],
            [2, 10],
            [14, 1],
            [-3, -22],
            [34, 1],
            [1, -37],
            [5, -23],
            [-4, -36],
            [2, -36],
            [9, -22],
            [-1, -70],
            [7, 5],
            [12, -1],
            [17, 8],
            [13, -3]
        ],
        [
            [5338, 4715],
            [-8, 45]
        ],
        [
            [5330, 4760],
            [12, 25],
            [8, 10],
            [10, -20]
        ],
        [
            [5360, 4775],
            [-10, -12],
            [-4, -16],
            [-1, -25],
            [-7, -7]
        ],
        [
            [5571, 7530],
            [-3, -20],
            [4, -25],
            [11, -15]
        ],
        [
            [5583, 7470],
            [0, -15],
            [-9, -9],
            [-2, -19],
            [-13, -29]
        ],
        [
            [5559, 7398],
            [-5, 5],
            [0, 13],
            [-15, 19],
            [-3, 29],
            [2, 40],
            [4, 18],
            [-4, 10]
        ],
        [
            [5538, 7532],
            [-2, 18],
            [12, 29],
            [1, -11],
            [8, 6]
        ],
        [
            [5557, 7574],
            [6, -16],
            [7, -6],
            [1, -22]
        ],
        [
            [6432, 6490],
            [5, 3],
            [1, -16],
            [22, 9],
            [23, -2],
            [17, -1],
            [19, 39],
            [20, 38],
            [18, 37]
        ],
        [
            [6557, 6597],
            [5, -20]
        ],
        [
            [6562, 6577],
            [4, -47]
        ],
        [
            [6566, 6530],
            [-14, 0],
            [-3, -39],
            [5, -8],
            [-12, -12],
            [0, -24],
            [-8, -24],
            [-1, -24]
        ],
        [
            [6533, 6399],
            [-6, -12],
            [-83, 29],
            [-11, 60],
            [-1, 14]
        ],
        [
            [3140, 1814],
            [-17, 2],
            [-30, 0],
            [0, 132]
        ],
        [
            [3093, 1948],
            [11, -27],
            [14, -45],
            [36, -35],
            [39, -15],
            [-13, -30],
            [-26, -2],
            [-14, 20]
        ],
        [
            [3258, 3743],
            [51, -96],
            [23, -9],
            [34, -44],
            [29, -23],
            [4, -26],
            [-28, -90],
            [28, -16],
            [32, -9],
            [22, 10],
            [25, 45],
            [4, 52]
        ],
        [
            [3482, 3537],
            [14, 11],
            [14, -34],
            [-1, -47],
            [-23, -33],
            [-19, -24],
            [-31, -57],
            [-37, -81]
        ],
        [
            [3399, 3272],
            [-7, -47],
            [-7, -61],
            [0, -58],
            [-6, -14],
            [-2, -38]
        ],
        [
            [3377, 3054],
            [-2, -31],
            [35, -50],
            [-4, -41],
            [18, -26],
            [-2, -29],
            [-26, -75],
            [-42, -32],
            [-55, -12],
            [-31, 6],
            [6, -36],
            [-6, -44],
            [5, -30],
            [-16, -20],
            [-29, -8],
            [-26, 21],
            [-11, -15],
            [4, -59],
            [18, -18],
            [16, 19],
            [8, -31],
            [-26, -18],
            [-22, -37],
            [-4, -59],
            [-7, -32],
            [-26, 0],
            [-22, -31],
            [-8, -44],
            [28, -43],
            [26, -12],
            [-9, -53],
            [-33, -33],
            [-18, -70],
            [-25, -23],
            [-12, -28],
            [9, -61],
            [19, -34],
            [-12, 3]
        ],
        [
            [3095, 1968],
            [-26, 9],
            [-67, 8],
            [-11, 34],
            [0, 45],
            [-18, -4],
            [-10, 21],
            [-3, 63],
            [22, 26],
            [9, 37],
            [-4, 30],
            [15, 51],
            [10, 78],
            [-3, 35],
            [12, 11],
            [-3, 22],
            [-13, 12],
            [10, 25],
            [-13, 22],
            [-6, 68],
            [11, 12],
            [-5, 72],
            [7, 61],
            [7, 52],
            [17, 22],
            [-9, 58],
            [0, 54],
            [21, 38],
            [-1, 50],
            [16, 57],
            [0, 55],
            [-7, 11],
            [-13, 102],
            [17, 60],
            [-2, 58],
            [10, 53],
            [18, 56],
            [20, 36],
            [-9, 24],
            [6, 19],
            [-1, 98],
            [30, 29],
            [10, 62],
            [-3, 14]
        ],
        [
            [3136, 3714],
            [23, 54],
            [36, -15],
            [16, -42],
            [11, 47],
            [32, -2],
            [4, -13]
        ],
        [
            [6210, 7485],
            [39, 9]
        ],
        [
            [6249, 7494],
            [5, -15],
            [11, -10],
            [-6, -15],
            [15, -21],
            [-8, -18],
            [12, -16],
            [13, -10],
            [0, -41]
        ],
        [
            [6291, 7348],
            [-10, -2]
        ],
        [
            [6281, 7346],
            [-11, 34],
            [0, 10],
            [-12, -1],
            [-9, 16],
            [-5, -1]
        ],
        [
            [6244, 7404],
            [-11, 17],
            [-21, 15],
            [3, 28],
            [-5, 21]
        ],
        [
            [3345, 329],
            [-8, -30],
            [-8, -27],
            [-59, 8],
            [-62, -3],
            [-34, 20],
            [0, 2],
            [-16, 17],
            [63, -2],
            [60, -6],
            [20, 24],
            [15, 21],
            [29, -24]
        ],
        [
            [577, 361],
            [-53, -8],
            [-36, 21],
            [-17, 21],
            [-1, 3],
            [-18, 16],
            [17, 22],
            [52, -9],
            [28, -18],
            [21, -21],
            [7, -27]
        ],
        [
            [3745, 447],
            [35, -26],
            [12, -36],
            [3, -25],
            [1, -30],
            [-43, -19],
            [-45, -15],
            [-52, -14],
            [-59, -11],
            [-65, 3],
            [-37, 20],
            [5, 24],
            [59, 16],
            [24, 20],
            [18, 26],
            [12, 22],
            [17, 20],
            [18, 25],
            [14, 0],
            [41, 12],
            [42, -12]
        ],
        [
            [1633, 715],
            [36, -9],
            [33, 10],
            [-16, -20],
            [-26, -15],
            [-39, 4],
            [-27, 21],
            [6, 20],
            [33, -11]
        ],
        [
            [1512, 716],
            [43, -23],
            [-17, 3],
            [-36, 5],
            [-38, 17],
            [20, 12],
            [28, -14]
        ],
        [
            [2250, 808],
            [31, -8],
            [30, 7],
            [17, -34],
            [-22, 5],
            [-34, -2],
            [-34, 2],
            [-38, -4],
            [-28, 12],
            [-15, 24],
            [18, 11],
            [35, -8],
            [40, -5]
        ],
        [
            [3098, 866],
            [4, -27],
            [-5, -23],
            [-8, -22],
            [-33, -8],
            [-31, -12],
            [-36, 1],
            [14, 24],
            [-33, -9],
            [-31, -8],
            [-21, 18],
            [-2, 24],
            [30, 23],
            [20, 7],
            [32, -2],
            [8, 30],
            [1, 22],
            [0, 47],
            [16, 28],
            [25, 9],
            [15, -22],
            [6, -22],
            [12, -26],
            [10, -26],
            [7, -26]
        ],
        [
            [3371, 1268],
            [-11, -13],
            [-21, 9],
            [-23, -6],
            [-19, -14],
            [-20, -15],
            [-14, -17],
            [-4, -23],
            [2, -22],
            [13, -20],
            [-19, -14],
            [-26, -4],
            [-15, -20],
            [-17, -19],
            [-17, -25],
            [-4, -22],
            [9, -24],
            [15, -19],
            [23, -14],
            [21, -18],
            [12, -23],
            [6, -22],
            [8, -24],
            [13, -19],
            [8, -22],
            [4, -55],
            [8, -22],
            [2, -23],
            [9, -23],
            [-4, -31],
            [-15, -24],
            [-17, -20],
            [-37, -8],
            [-12, -21],
            [-17, -20],
            [-42, -22],
            [-37, -9],
            [-35, -13],
            [-37, -13],
            [-22, -24],
            [-45, -2],
            [-49, 2],
            [-44, -4],
            [-47, 0],
            [9, -24],
            [42, -10],
            [31, -16],
            [18, -21],
            [-31, -19],
            [-48, 6],
            [-40, -15],
            [-2, -24],
            [-1, -23],
            [33, -20],
            [6, -22],
            [35, -22],
            [59, -9],
            [50, -16],
            [40, -19],
            [50, -18],
            [70, -10],
            [68, -16],
            [47, -17],
            [52, -20],
            [27, -28],
            [13, -22],
            [34, 21],
            [46, 17],
            [48, 19],
            [58, 15],
            [49, 16],
            [69, 1],
            [68, -8],
            [56, -14],
            [18, 26],
            [39, 17],
            [70, 1],
            [55, 13],
            [52, 13],
            [58, 8],
            [62, 10],
            [43, 15],
            [-20, 21],
            [-12, 21],
            [0, 22],
            [-54, -2],
            [-57, -10],
            [-54, 0],
            [-8, 22],
            [4, 44],
            [12, 13],
            [40, 14],
            [47, 14],
            [34, 17],
            [33, 18],
            [25, 23],
            [38, 10],
            [38, 8],
            [19, 5],
            [43, 2],
            [41, 8],
            [34, 12],
            [34, 14],
            [30, 14],
            [39, 18],
            [24, 20],
            [26, 17],
            [9, 24],
            [-30, 13],
            [10, 25],
            [18, 18],
            [29, 12],
            [31, 14],
            [28, 18],
            [22, 23],
            [13, 28],
            [21, 16],
            [33, -3],
            [13, -20],
            [34, -2],
            [1, 22],
            [14, 23],
            [30, -6],
            [7, -22],
            [33, -3],
            [36, 10],
            [35, 7],
            [31, -3],
            [12, -25],
            [31, 20],
            [28, 10],
            [31, 9],
            [31, 8],
            [29, 14],
            [31, 9],
            [24, 13],
            [17, 20],
            [20, -15],
            [29, 8],
            [20, -27],
            [16, -21],
            [32, 11],
            [12, 24],
            [28, 16],
            [37, -4],
            [11, -22],
            [22, 22],
            [30, 7],
            [33, 3],
            [29, -2],
            [31, -7],
            [30, -3],
            [13, -20],
            [18, -17],
            [31, 10],
            [32, 3],
            [32, 0],
            [31, 1],
            [28, 8],
            [29, 7],
            [25, 16],
            [26, 11],
            [28, 5],
            [21, 17],
            [15, 32],
            [16, 20],
            [29, -10],
            [11, -21],
            [24, -13],
            [29, 4],
            [19, -21],
            [21, -15],
            [28, 14],
            [10, 26],
            [25, 10],
            [29, 20],
            [27, 8],
            [33, 11],
            [22, 13],
            [22, 14],
            [22, 13],
            [26, -7],
            [25, 21],
            [18, 16],
            [26, -1],
            [23, 14],
            [6, 21],
            [23, 16],
            [23, 11],
            [28, 10],
            [25, 4],
            [25, -3],
            [26, -6],
            [22, -16],
            [3, -26],
            [24, -19],
            [17, -17],
            [33, -7],
            [19, -16],
            [23, -16],
            [26, -3],
            [23, 11],
            [24, 24],
            [26, -12],
            [27, -7],
            [26, -7],
            [27, -5],
            [28, 0],
            [23, -61],
            [-1, -15],
            [-4, -27],
            [-26, -15],
            [-22, -22],
            [4, -23],
            [31, 1],
            [-4, -23],
            [-14, -22],
            [-13, -24],
            [21, -19],
            [32, -6],
            [32, 11],
            [15, 23],
            [10, 22],
            [15, 18],
            [17, 18],
            [7, 21],
            [15, 29],
            [18, 5],
            [31, 3],
            [28, 7],
            [28, 9],
            [14, 23],
            [8, 22],
            [19, 22],
            [27, 15],
            [23, 12],
            [16, 19],
            [15, 11],
            [21, 9],
            [27, -6],
            [25, 6],
            [28, 7],
            [30, -4],
            [20, 17],
            [14, 39],
            [11, -16],
            [13, -28],
            [23, -12],
            [27, -4],
            [26, 7],
            [29, -5],
            [26, -1],
            [17, 6],
            [24, -4],
            [21, -12],
            [25, 8],
            [30, 0],
            [25, 8],
            [29, -8],
            [19, 19],
            [14, 20],
            [19, 16],
            [35, 44],
            [18, -8],
            [21, -16],
            [18, -21],
            [36, -36],
            [27, -1],
            [25, 0],
            [30, 7],
            [30, 8],
            [23, 16],
            [19, 18],
            [31, 2],
            [21, 13],
            [22, -12],
            [14, -18],
            [19, -19],
            [31, 2],
            [19, -15],
            [33, -15],
            [35, -5],
            [29, 4],
            [21, 19],
            [19, 18],
            [25, 5],
            [25, -8],
            [29, -6],
            [26, 9],
            [25, 0],
            [24, -6],
            [26, -5],
            [25, 10],
            [30, 9],
            [28, 3],
            [32, 0],
            [25, 5],
            [25, 5],
            [8, 29],
            [1, 24],
            [17, -16],
            [5, -27],
            [10, -24],
            [11, -20],
            [23, -10],
            [32, 4],
            [36, 1],
            [25, 3],
            [37, 0],
            [26, 1],
            [36, -2],
            [31, -5],
            [20, -18],
            [-5, -22],
            [18, -18],
            [30, -13],
            [31, -15],
            [35, -11],
            [38, -9],
            [28, -9],
            [32, -2],
            [18, 20],
            [24, -16],
            [21, -19],
            [25, -13],
            [34, -6],
            [32, -7],
            [13, -23],
            [32, -14],
            [21, -21],
            [31, -9],
            [32, 1],
            [30, -4],
            [33, 1],
            [34, -4],
            [31, -8],
            [28, -14],
            [29, -12],
            [20, -17],
            [-3, -23],
            [-15, -21],
            [-13, -27],
            [-9, -21],
            [-14, -24],
            [-36, -9],
            [-16, -21],
            [-36, -13],
            [-13, -23],
            [-19, -22],
            [-20, -18],
            [-11, -25],
            [-7, -22],
            [-3, -26],
            [0, -22],
            [16, -23],
            [6, -22],
            [13, -21],
            [52, -8],
            [11, -26],
            [-50, -9],
            [-43, -13],
            [-52, -2],
            [-24, -34],
            [-5, -27],
            [-12, -22],
            [-14, -22],
            [37, -20],
            [14, -24],
            [24, -22],
            [33, -20],
            [39, -19],
            [42, -18],
            [64, -19],
            [14, -29],
            [80, -12],
            [5, -5],
            [21, -17],
            [77, 15],
            [63, -19],
            [48, -14],
            [-9997, -1],
            [24, 35],
            [50, -19],
            [3, 2],
            [30, 19],
            [4, 0],
            [3, -1],
            [40, -25],
            [35, 25],
            [7, 3],
            [81, 11],
            [27, -14],
            [13, -7],
            [41, -20],
            [79, -15],
            [63, -18],
            [107, -14],
            [80, 16],
            [118, -11],
            [67, -19],
            [73, 17],
            [78, 17],
            [6, 27],
            [-110, 3],
            [-89, 14],
            [-24, 23],
            [-74, 12],
            [5, 27],
            [10, 24],
            [10, 22],
            [-5, 25],
            [-46, 16],
            [-22, 21],
            [-43, 18],
            [68, -3],
            [64, 9],
            [40, -20],
            [50, 18],
            [45, 22],
            [23, 19],
            [-10, 25],
            [-36, 16],
            [-41, 17],
            [-57, 4],
            [-50, 8],
            [-54, 6],
            [-18, 22],
            [-36, 18],
            [-21, 21],
            [-9, 67],
            [14, -6],
            [25, -18],
            [45, 6],
            [44, 8],
            [23, -26],
            [44, 6],
            [37, 13],
            [35, 16],
            [32, 20],
            [41, 5],
            [-1, 22],
            [-9, 22],
            [8, 21],
            [36, 11],
            [16, -20],
            [42, 12],
            [32, 15],
            [40, 1],
            [38, 6],
            [37, 13],
            [30, 13],
            [34, 13],
            [22, -4],
            [19, -4],
            [41, 8],
            [37, -10],
            [38, 1],
            [37, 8],
            [37, -6],
            [41, -6],
            [39, 3],
            [40, -2],
            [42, -1],
            [38, 3],
            [28, 17],
            [34, 9],
            [35, -13],
            [33, 11],
            [30, 21],
            [18, -19],
            [9, -21],
            [18, -19],
            [29, 17],
            [33, -22],
            [38, -7],
            [32, -16],
            [39, 3],
            [36, 11],
            [41, -3],
            [38, -8],
            [38, -10],
            [15, 25],
            [-18, 20],
            [-14, 21],
            [-36, 5],
            [-15, 22],
            [-6, 22],
            [-10, 43],
            [21, -8],
            [36, -3],
            [36, 3],
            [33, -9],
            [28, -17],
            [12, -21],
            [38, -4],
            [36, 9],
            [38, 11],
            [34, 7],
            [28, -14],
            [37, 5],
            [24, 45],
            [23, -27],
            [32, -10],
            [34, 6],
            [23, -23],
            [37, -3],
            [33, -7],
            [34, -12],
            [21, 22],
            [11, 20],
            [28, -23],
            [38, 6],
            [28, -13],
            [19, -19],
            [37, 5],
            [29, 13],
            [29, 15],
            [33, 8],
            [39, 7],
            [36, 8],
            [27, 13],
            [16, 19],
            [7, 25],
            [-3, 24],
            [-9, 24],
            [-10, 23],
            [-9, 23],
            [-7, 21],
            [-1, 23],
            [2, 23],
            [13, 22],
            [11, 24],
            [5, 23],
            [-6, 26],
            [-3, 23],
            [14, 27],
            [15, 17],
            [18, 22],
            [19, 19],
            [22, 17],
            [11, 25],
            [15, 17],
            [18, 15],
            [26, 3],
            [18, 19],
            [19, 11],
            [23, 7],
            [20, 15],
            [16, 19],
            [22, 7],
            [16, -15],
            [-10, -20],
            [-29, -17]
        ],
        [
            [6914, 2185],
            [18, -19],
            [26, -7],
            [1, -11],
            [-7, -27],
            [-43, -4],
            [-1, 31],
            [4, 25],
            [2, 12]
        ],
        [
            [9038, 2648],
            [27, -21],
            [15, 8],
            [22, 12],
            [16, -4],
            [2, -70],
            [-9, -21],
            [-3, -47],
            [-10, 16],
            [-19, -41],
            [-6, 3],
            [-17, 2],
            [-17, 50],
            [-4, 39],
            [-16, 52],
            [1, 27],
            [18, -5]
        ],
        [
            [8987, 4244],
            [10, -46],
            [18, 22],
            [9, -25],
            [13, -23],
            [-3, -26],
            [6, -51],
            [5, -29],
            [7, -7],
            [7, -51],
            [-3, -30],
            [9, -40],
            [31, -31],
            [19, -28],
            [19, -26],
            [-4, -14],
            [16, -37],
            [11, -64],
            [11, 13],
            [11, -26],
            [7, 9],
            [5, -63],
            [19, -36],
            [13, -22],
            [22, -48],
            [8, -48],
            [1, -33],
            [-2, -37],
            [13, -50],
            [-2, -52],
            [-5, -28],
            [-7, -52],
            [1, -34],
            [-6, -43],
            [-12, -53],
            [-21, -29],
            [-10, -46],
            [-9, -29],
            [-8, -51],
            [-11, -30],
            [-7, -44],
            [-4, -41],
            [2, -18],
            [-16, -21],
            [-31, -2],
            [-26, -24],
            [-13, -23],
            [-17, -26],
            [-23, 27],
            [-17, 10],
            [5, 31],
            [-15, -11],
            [-25, -43],
            [-24, 16],
            [-15, 9],
            [-16, 4],
            [-27, 17],
            [-18, 37],
            [-5, 45],
            [-7, 30],
            [-13, 24],
            [-27, 7],
            [9, 28],
            [-7, 44],
            [-13, -41],
            [-25, -11],
            [14, 33],
            [5, 34],
            [10, 29],
            [-2, 44],
            [-22, -50],
            [-18, -21],
            [-10, -47],
            [-22, 25],
            [1, 31],
            [-18, 43],
            [-14, 22],
            [5, 14],
            [-36, 35],
            [-19, 2],
            [-27, 29],
            [-50, -6],
            [-36, -21],
            [-31, -20],
            [-27, 4],
            [-29, -30],
            [-24, -14],
            [-6, -31],
            [-10, -24],
            [-23, -1],
            [-18, -5],
            [-24, 10],
            [-20, -6],
            [-19, -3],
            [-17, -31],
            [-8, 2],
            [-14, -16],
            [-13, -19],
            [-21, 2],
            [-18, 0],
            [-30, 38],
            [-15, 11],
            [1, 34],
            [14, 8],
            [4, 14],
            [-1, 21],
            [4, 41],
            [-3, 35],
            [-15, 60],
            [-4, 33],
            [1, 34],
            [-11, 38],
            [-1, 18],
            [-12, 23],
            [-4, 47],
            [-16, 46],
            [-4, 26],
            [13, -26],
            [-10, 55],
            [14, -17],
            [8, -23],
            [0, 30],
            [-14, 47],
            [-3, 18],
            [-6, 18],
            [3, 34],
            [6, 15],
            [4, 29],
            [-3, 35],
            [11, 42],
            [2, -45],
            [12, 41],
            [22, 20],
            [14, 25],
            [21, 22],
            [13, 4],
            [7, -7],
            [22, 22],
            [17, 6],
            [4, 13],
            [8, 6],
            [15, -2],
            [29, 18],
            [15, 26],
            [7, 31],
            [17, 30],
            [1, 24],
            [1, 32],
            [19, 50],
            [12, -51],
            [12, 12],
            [-10, 28],
            [9, 29],
            [12, -13],
            [3, 45],
            [15, 29],
            [7, 23],
            [14, 10],
            [0, 17],
            [13, -7],
            [0, 15],
            [12, 8],
            [14, 8],
            [20, -27],
            [16, -35],
            [17, 0],
            [18, -6],
            [-6, 33],
            [13, 47],
            [13, 15],
            [-5, 15],
            [12, 34],
            [17, 21],
            [14, -7],
            [24, 11],
            [-1, 30],
            [-20, 19],
            [15, 9],
            [18, -15],
            [15, -24],
            [23, -15],
            [8, 6],
            [17, -18],
            [17, 17],
            [10, -5],
            [7, 11],
            [12, -29],
            [-7, -32],
            [-11, -24],
            [-9, -2],
            [3, -23],
            [-8, -30],
            [-10, -29],
            [2, -17],
            [22, -32],
            [21, -19],
            [15, -20],
            [20, -35],
            [8, 0],
            [14, -15],
            [4, -19],
            [27, -20],
            [18, 20],
            [6, 32],
            [5, 26],
            [4, 33],
            [8, 47],
            [-4, 28],
            [2, 17],
            [-3, 34],
            [4, 45],
            [5, 12],
            [-4, 20],
            [7, 31],
            [5, 32],
            [1, 17],
            [10, 22],
            [8, -29],
            [2, -37],
            [7, -7],
            [1, -25],
            [10, -30],
            [2, -33],
            [-1, -22]
        ],
        [
            [5471, 7900],
            [-2, -24],
            [-16, 0],
            [6, -13],
            [-9, -38]
        ],
        [
            [5450, 7825],
            [-6, -10],
            [-24, -1],
            [-14, -13],
            [-23, 4]
        ],
        [
            [5383, 7805],
            [-40, 15],
            [-6, 21],
            [-27, -10],
            [-4, -12],
            [-16, 9]
        ],
        [
            [5290, 7828],
            [-15, 1],
            [-12, 11],
            [4, 15],
            [-1, 10]
        ],
        [
            [5266, 7865],
            [8, 3],
            [14, -16],
            [4, 16],
            [25, -3],
            [20, 11],
            [13, -2],
            [9, -12],
            [2, 10],
            [-4, 38],
            [10, 8],
            [10, 27]
        ],
        [
            [5377, 7945],
            [21, -19],
            [15, 24],
            [10, 5],
            [22, -18],
            [13, 3],
            [13, -12]
        ],
        [
            [5471, 7928],
            [-3, -7],
            [3, -21]
        ],
        [
            [6281, 7346],
            [-19, 8],
            [-14, 27],
            [-4, 23]
        ],
        [
            [6349, 7527],
            [15, -31],
            [14, -42],
            [13, -2],
            [8, -16],
            [-23, -5],
            [-5, -46],
            [-4, -21],
            [-11, -13],
            [1, -30]
        ],
        [
            [6357, 7321],
            [-7, -3],
            [-17, 31],
            [10, 30],
            [-9, 17],
            [-10, -4],
            [-33, -44]
        ],
        [
            [6249, 7494],
            [6, 10],
            [21, -17],
            [15, -4],
            [4, 7],
            [-14, 32],
            [7, 9]
        ],
        [
            [6288, 7531],
            [8, -2],
            [19, -36],
            [13, -4],
            [4, 15],
            [17, 23]
        ],
        [
            [5814, 4792],
            [-1, 71],
            [-7, 27]
        ],
        [
            [5806, 4890],
            [17, -5],
            [8, 34],
            [15, -4]
        ],
        [
            [5846, 4915],
            [1, -23],
            [6, -14],
            [1, -19],
            [-7, -12],
            [-11, -31],
            [-10, -22],
            [-12, -2]
        ],
        [
            [5092, 8091],
            [20, -5],
            [26, 12],
            [17, -25],
            [16, -14]
        ],
        [
            [5171, 8059],
            [-4, -40]
        ],
        [
            [5167, 8019],
            [-7, -2],
            [-3, -33]
        ],
        [
            [5157, 7984],
            [-24, 26],
            [-14, -4],
            [-20, 28],
            [-13, 23],
            [-13, 1],
            [-4, 21]
        ],
        [
            [5069, 8079],
            [23, 12]
        ],
        [
            [5074, 5427],
            [-23, -7]
        ],
        [
            [5051, 5420],
            [-7, 41],
            [2, 136],
            [-6, 12],
            [-1, 29],
            [-10, 21],
            [-8, 17],
            [3, 31]
        ],
        [
            [5024, 5707],
            [10, 7],
            [6, 26],
            [13, 5],
            [6, 18]
        ],
        [
            [5059, 5763],
            [10, 17],
            [10, 0],
            [21, -34]
        ],
        [
            [5100, 5746],
            [-1, -19],
            [6, -35],
            [-6, -24],
            [3, -16],
            [-13, -37],
            [-9, -18],
            [-5, -37],
            [1, -38],
            [-2, -95]
        ],
        [
            [4921, 5627],
            [-19, 15],
            [-13, -2],
            [-10, -15],
            [-12, 13],
            [-5, 19],
            [-13, 13]
        ],
        [
            [4849, 5670],
            [-1, 34],
            [7, 26],
            [-1, 20],
            [23, 48],
            [4, 41],
            [7, 14],
            [14, -8],
            [11, 12],
            [4, 16],
            [22, 26],
            [5, 19],
            [26, 24],
            [15, 9],
            [7, -12],
            [18, 0]
        ],
        [
            [5010, 5939],
            [-2, -28],
            [3, -27],
            [16, -39],
            [1, -28],
            [32, -14],
            [-1, -40]
        ],
        [
            [5024, 5707],
            [-24, 1]
        ],
        [
            [5000, 5708],
            [-13, 5],
            [-9, -9],
            [-12, 4],
            [-48, -3],
            [-1, -33],
            [4, -45]
        ],
        [
            [7573, 6360],
            [0, -43],
            [-10, 9],
            [2, -47]
        ],
        [
            [7565, 6279],
            [-8, 30],
            [-1, 31],
            [-6, 28],
            [-11, 34],
            [-26, 3],
            [3, -25],
            [-9, -32],
            [-12, 12],
            [-4, -11],
            [-8, 6],
            [-11, 5]
        ],
        [
            [7472, 6360],
            [-4, 49],
            [-10, 45],
            [5, 35],
            [-17, 16],
            [6, 22],
            [18, 22],
            [-20, 31],
            [9, 40],
            [22, -26],
            [14, -3],
            [2, -41],
            [26, -8],
            [26, 1],
            [16, -10],
            [-13, -50],
            [-12, -3],
            [-9, -34],
            [16, -31],
            [4, 38],
            [8, 0],
            [14, -93]
        ],
        [
            [5629, 7671],
            [8, -25],
            [11, 5],
            [21, -9],
            [41, -4],
            [13, 16],
            [33, 13],
            [20, -21],
            [17, -6]
        ],
        [
            [5793, 7640],
            [-15, -25],
            [-10, -42],
            [9, -34]
        ],
        [
            [5777, 7539],
            [-24, 8],
            [-28, -18]
        ],
        [
            [5725, 7529],
            [0, -30],
            [-26, -5],
            [-19, 20],
            [-22, -16],
            [-21, 2]
        ],
        [
            [5637, 7500],
            [-2, 39],
            [-14, 19]
        ],
        [
            [5621, 7558],
            [5, 8],
            [-3, 7],
            [4, 19],
            [11, 18],
            [-14, 26],
            [-2, 21],
            [7, 14]
        ],
        [
            [2846, 6461],
            [-7, -3],
            [-7, 34],
            [-10, 17],
            [6, 38],
            [8, -3],
            [10, -49],
            [0, -34]
        ],
        [
            [2838, 6628],
            [-30, -10],
            [-2, 22],
            [13, 5],
            [18, -2],
            [1, -15]
        ],
        [
            [2861, 6628],
            [-5, -42],
            [-5, 8],
            [0, 31],
            [-12, 23],
            [0, 7],
            [22, -27]
        ],
        [
            [5527, 7708],
            [10, 0],
            [-7, -26],
            [14, -23],
            [-4, -28],
            [-7, -2]
        ],
        [
            [5533, 7629],
            [-5, -6],
            [-9, -13],
            [-4, -33]
        ],
        [
            [5515, 7577],
            [-25, 23],
            [-10, 24],
            [-11, 13],
            [-12, 22],
            [-6, 19],
            [-14, 27],
            [6, 25],
            [10, -14],
            [6, 12],
            [13, 2],
            [24, -10],
            [19, 1],
            [12, -13]
        ],
        [
            [5652, 8242],
            [27, 0],
            [30, 22],
            [6, 34],
            [23, 19],
            [-3, 26]
        ],
        [
            [5735, 8343],
            [17, 10],
            [30, 23]
        ],
        [
            [5782, 8376],
            [29, -15],
            [4, -15],
            [15, 7],
            [27, -14],
            [3, -27],
            [-6, -16],
            [17, -39],
            [12, -11],
            [-2, -11],
            [19, -10],
            [8, -16],
            [-11, -13],
            [-23, 2],
            [-5, -5],
            [7, -20],
            [6, -37]
        ],
        [
            [5882, 8136],
            [-23, -4],
            [-9, -13],
            [-2, -30],
            [-11, 6],
            [-25, -3],
            [-7, 14],
            [-11, -10],
            [-10, 8],
            [-22, 1],
            [-31, 15],
            [-28, 4],
            [-22, -1],
            [-15, -16],
            [-13, -2]
        ],
        [
            [5653, 8105],
            [-1, 26],
            [-8, 27],
            [17, 12],
            [0, 24],
            [-8, 22],
            [-1, 26]
        ],
        [
            [2524, 6110],
            [-1, 8],
            [4, 3],
            [5, -7],
            [10, 36],
            [5, 0]
        ],
        [
            [2547, 6150],
            [0, -8],
            [5, -1],
            [0, -16],
            [-5, -25],
            [3, -9],
            [-3, -21],
            [2, -6],
            [-4, -30],
            [-5, -16],
            [-5, -1],
            [-6, -21]
        ],
        [
            [2529, 5996],
            [-8, 0],
            [2, 67],
            [1, 47]
        ],
        [
            [3136, 3714],
            [-20, -8],
            [-11, 82],
            [-15, 66],
            [9, 57],
            [-15, 25],
            [-4, 43],
            [-13, 40]
        ],
        [
            [3067, 4019],
            [17, 64],
            [-12, 49],
            [7, 20],
            [-5, 22],
            [10, 30],
            [1, 50],
            [1, 41],
            [6, 20],
            [-24, 96]
        ],
        [
            [3068, 4411],
            [21, -5],
            [14, 1],
            [6, 18],
            [25, 24],
            [14, 22],
            [37, 10],
            [-3, -44],
            [3, -23],
            [-2, -40],
            [30, -53],
            [31, -9],
            [11, -23],
            [19, -11],
            [11, -17],
            [18, 0],
            [16, -17],
            [1, -34],
            [6, -18],
            [0, -25],
            [-8, -1],
            [11, -69],
            [53, -2],
            [-4, -35],
            [3, -23],
            [15, -16],
            [6, -37],
            [-4, -47],
            [-8, -26],
            [3, -33],
            [-9, -12]
        ],
        [
            [3384, 3866],
            [-1, 18],
            [-25, 30],
            [-26, 1],
            [-49, -17],
            [-13, -52],
            [-1, -32],
            [-11, -71]
        ],
        [
            [3482, 3537],
            [6, 34],
            [3, 35],
            [1, 32],
            [-10, 11],
            [-11, -9],
            [-10, 2],
            [-4, 23],
            [-2, 54],
            [-5, 18],
            [-19, 16],
            [-11, -12],
            [-30, 11],
            [2, 81],
            [-8, 33]
        ],
        [
            [3068, 4411],
            [-15, -11],
            [-13, 7],
            [2, 90],
            [-23, -35],
            [-24, 2],
            [-11, 31],
            [-18, 4],
            [5, 25],
            [-15, 36],
            [-11, 53],
            [7, 11],
            [0, 25],
            [17, 17],
            [-3, 32],
            [7, 20],
            [2, 28],
            [32, 40],
            [22, 11],
            [4, 9],
            [25, -2]
        ],
        [
            [3058, 4804],
            [13, 162],
            [0, 25],
            [-4, 34],
            [-12, 22],
            [0, 42],
            [15, 10],
            [6, -6],
            [1, 23],
            [-16, 6],
            [-1, 37],
            [54, -2],
            [10, 21],
            [7, -19],
            [6, -35],
            [5, 8]
        ],
        [
            [3142, 5132],
            [15, -32],
            [22, 4],
            [5, 18],
            [21, 14],
            [11, 10],
            [4, 25],
            [19, 17],
            [-1, 12],
            [-24, 5],
            [-3, 37],
            [1, 40],
            [-13, 15],
            [5, 6],
            [21, -8],
            [22, -15],
            [8, 14],
            [20, 9],
            [31, 23],
            [10, 22],
            [-3, 17]
        ],
        [
            [3313, 5365],
            [14, 2],
            [7, -13],
            [-4, -26],
            [9, -9],
            [7, -28],
            [-8, -20],
            [-4, -51],
            [7, -30],
            [2, -27],
            [17, -28],
            [14, -3],
            [3, 12],
            [8, 3],
            [13, 10],
            [9, 16],
            [15, -5],
            [7, 2]
        ],
        [
            [3429, 5170],
            [15, -5],
            [3, 12],
            [-5, 12],
            [3, 17],
            [11, -5],
            [13, 6],
            [16, -13]
        ],
        [
            [3485, 5194],
            [12, -12],
            [9, 16],
            [6, -3],
            [4, -16],
            [13, 4],
            [11, 22],
            [8, 44],
            [17, 54]
        ],
        [
            [3565, 5303],
            [9, 3],
            [7, -33],
            [16, -103],
            [14, -10],
            [1, -41],
            [-21, -48],
            [9, -18],
            [49, -9],
            [1, -60],
            [21, 39],
            [35, -21],
            [46, -36],
            [14, -35],
            [-5, -32],
            [33, 18],
            [54, -32],
            [41, 3],
            [41, -49],
            [36, -66],
            [21, -17],
            [24, -3],
            [10, -18],
            [9, -76],
            [5, -35],
            [-11, -98],
            [-14, -39],
            [-39, -82],
            [-18, -67],
            [-21, -51],
            [-7, -1],
            [-7, -43],
            [2, -111],
            [-8, -91],
            [-3, -39],
            [-9, -23],
            [-5, -79],
            [-28, -77],
            [-5, -61],
            [-22, -26],
            [-7, -35],
            [-30, 0],
            [-44, -23],
            [-19, -26],
            [-31, -18],
            [-33, -47],
            [-23, -58],
            [-5, -44],
            [5, -33],
            [-5, -60],
            [-6, -28],
            [-20, -33],
            [-31, -104],
            [-24, -47],
            [-19, -27],
            [-13, -57],
            [-18, -33]
        ],
        [
            [3517, 3063],
            [-8, 33],
            [13, 28],
            [-16, 40],
            [-22, 33],
            [-29, 38],
            [-10, -2],
            [-28, 46],
            [-18, -7]
        ],
        [
            [8172, 5325],
            [11, 22],
            [23, 32]
        ],
        [
            [8206, 5379],
            [-1, -29],
            [-2, -37],
            [-13, 1],
            [-6, -20],
            [-12, 31]
        ],
        [
            [7546, 6698],
            [12, -19],
            [-2, -36],
            [-23, -2],
            [-23, 4],
            [-18, -9],
            [-25, 22],
            [-1, 12]
        ],
        [
            [7466, 6670],
            [19, 44],
            [15, 15],
            [20, -14],
            [14, -1],
            [12, -16]
        ],
        [
            [5817, 3752],
            [-39, -43],
            [-25, -44],
            [-10, -40],
            [-8, -22],
            [-15, -4],
            [-5, -29],
            [-3, -18],
            [-17, -14],
            [-23, 3],
            [-13, 17],
            [-12, 7],
            [-14, -14],
            [-6, -28],
            [-14, -18],
            [-13, -26],
            [-20, -6],
            [-6, 20],
            [2, 36],
            [-16, 56],
            [-8, 9]
        ],
        [
            [5552, 3594],
            [0, 173],
            [27, 2],
            [1, 210],
            [21, 2],
            [43, 21],
            [10, -24],
            [18, 23],
            [9, 0],
            [15, 13]
        ],
        [
            [5696, 4014],
            [5, -4]
        ],
        [
            [5701, 4010],
            [11, -48],
            [5, -10],
            [9, -34],
            [32, -65],
            [12, -7],
            [0, -20],
            [8, -38],
            [21, -9],
            [18, -27]
        ],
        [
            [5424, 5496],
            [23, 4],
            [5, 16],
            [5, -2],
            [7, -13],
            [34, 23],
            [12, 23],
            [15, 20],
            [-3, 21],
            [8, 6],
            [27, -4],
            [26, 27],
            [20, 65],
            [14, 24],
            [18, 10]
        ],
        [
            [5635, 5716],
            [3, -26],
            [16, -36],
            [0, -25],
            [-5, -24],
            [2, -18],
            [10, -18]
        ],
        [
            [5661, 5569],
            [21, -25]
        ],
        [
            [5682, 5544],
            [15, -24],
            [0, -19],
            [19, -31],
            [12, -26],
            [7, -35],
            [20, -24],
            [5, -18]
        ],
        [
            [5760, 5367],
            [-9, -7],
            [-18, 2],
            [-21, 6],
            [-10, -5],
            [-5, -14],
            [-9, -2],
            [-10, 12],
            [-31, -29],
            [-13, 6],
            [-4, -5],
            [-8, -35],
            [-21, 11],
            [-20, 6],
            [-18, 22],
            [-23, 20],
            [-15, -19],
            [-10, -30],
            [-3, -41]
        ],
        [
            [5512, 5265],
            [-18, 3],
            [-19, 10],
            [-16, -32],
            [-15, -55]
        ],
        [
            [5444, 5191],
            [-3, 18],
            [-1, 27],
            [-13, 19],
            [-10, 30],
            [-2, 21],
            [-13, 31],
            [2, 18],
            [-3, 25],
            [2, 45],
            [7, 11],
            [14, 60]
        ],
        [
            [3231, 7808],
            [20, -8],
            [26, 1],
            [-14, -24],
            [-10, -4],
            [-35, 25],
            [-7, 20],
            [10, 18],
            [10, -28]
        ],
        [
            [3283, 7958],
            [-14, -1],
            [-36, 19],
            [-26, 28],
            [10, 5],
            [37, -15],
            [28, -25],
            [1, -11]
        ],
        [
            [1569, 7923],
            [-14, -8],
            [-46, 27],
            [-8, 21],
            [-25, 21],
            [-5, 16],
            [-28, 11],
            [-11, 32],
            [2, 14],
            [30, -13],
            [17, -9],
            [26, -6],
            [9, -21],
            [14, -28],
            [28, -24],
            [11, -33]
        ],
        [
            [3440, 8052],
            [-18, -52],
            [18, 20],
            [19, -12],
            [-10, -21],
            [25, -16],
            [12, 14],
            [28, -18],
            [-8, -43],
            [19, 10],
            [4, -32],
            [8, -36],
            [-11, -52],
            [-13, -2],
            [-18, 11],
            [6, 48],
            [-8, 8],
            [-32, -52],
            [-17, 2],
            [20, 28],
            [-27, 14],
            [-30, -3],
            [-54, 2],
            [-4, 17],
            [17, 21],
            [-12, 16],
            [24, 36],
            [28, 94],
            [18, 33],
            [24, 21],
            [13, -3],
            [-6, -16],
            [-15, -37]
        ],
        [
            [1313, 8250],
            [27, 5],
            [-8, -67],
            [24, -48],
            [-11, 0],
            [-17, 27],
            [-10, 27],
            [-14, 19],
            [-5, 26],
            [1, 19],
            [13, -8]
        ],
        [
            [2798, 8730],
            [-11, -31],
            [-12, 5],
            [-8, 17],
            [2, 4],
            [10, 18],
            [12, -1],
            [7, -12]
        ],
        [
            [2725, 8762],
            [-33, -32],
            [-19, 1],
            [-6, 16],
            [20, 27],
            [38, 0],
            [0, -12]
        ],
        [
            [2634, 8936],
            [5, -26],
            [15, 9],
            [16, -15],
            [30, -20],
            [32, -19],
            [2, -28],
            [21, 5],
            [20, -20],
            [-25, -18],
            [-43, 14],
            [-16, 26],
            [-27, -31],
            [-40, -31],
            [-9, 35],
            [-38, -6],
            [24, 30],
            [4, 46],
            [9, 54],
            [20, -5]
        ],
        [
            [2892, 9024],
            [-31, -3],
            [-7, 29],
            [12, 34],
            [26, 8],
            [21, -17],
            [1, -25],
            [-4, -8],
            [-18, -18]
        ],
        [
            [2343, 9140],
            [-17, -21],
            [-38, 18],
            [-22, -6],
            [-38, 26],
            [24, 19],
            [19, 25],
            [30, -16],
            [17, -11],
            [8, -11],
            [17, -23]
        ],
        [
            [3135, 7724],
            [-18, 33],
            [0, 81],
            [-13, 17],
            [-18, -10],
            [-10, 16],
            [-21, -45],
            [-8, -46],
            [-10, -27],
            [-12, -9],
            [-9, -3],
            [-3, -15],
            [-51, 0],
            [-42, 0],
            [-12, -11],
            [-30, -42],
            [-3, -5],
            [-9, -23],
            [-26, 0],
            [-27, 0],
            [-12, -10],
            [4, -11],
            [2, -18],
            [0, -6],
            [-36, -30],
            [-29, -9],
            [-32, -31],
            [-7, 0],
            [-10, 9],
            [-3, 8],
            [1, 6],
            [6, 21],
            [13, 33],
            [8, 35],
            [-5, 51],
            [-6, 53],
            [-29, 28],
            [3, 11],
            [-4, 7],
            [-8, 0],
            [-5, 9],
            [-2, 14],
            [-5, -6],
            [-7, 2],
            [1, 6],
            [-6, 6],
            [-3, 15],
            [-21, 19],
            [-23, 20],
            [-27, 23],
            [-26, 21],
            [-25, -17],
            [-9, 0],
            [-34, 15],
            [-23, -8],
            [-27, 19],
            [-28, 9],
            [-19, 4],
            [-9, 10],
            [-5, 32],
            [-9, 0],
            [-1, -23],
            [-57, 0],
            [-95, 0],
            [-94, 0],
            [-84, 0],
            [-83, 0],
            [-82, 0],
            [-85, 0],
            [-27, 0],
            [-82, 0],
            [-79, 0]
        ],
        [
            [1588, 7952],
            [-4, 0],
            [-54, 58],
            [-20, 26],
            [-50, 24],
            [-15, 53],
            [3, 36],
            [-35, 25],
            [-5, 48],
            [-34, 43],
            [0, 30]
        ],
        [
            [1374, 8295],
            [15, 29],
            [0, 37],
            [-48, 37],
            [-28, 68],
            [-17, 42],
            [-26, 27],
            [-19, 24],
            [-14, 31],
            [-28, -20],
            [-27, -33],
            [-25, 39],
            [-19, 26],
            [-27, 16],
            [-28, 2],
            [0, 337],
            [1, 219]
        ],
        [
            [1084, 9176],
            [51, -14],
            [44, -29],
            [29, -5],
            [24, 24],
            [34, 19],
            [41, -7],
            [42, 26],
            [45, 14],
            [20, -24],
            [20, 14],
            [6, 27],
            [20, -6],
            [47, -53],
            [37, 40],
            [3, -45],
            [34, 10],
            [11, 17],
            [34, -3],
            [42, -25],
            [65, -22],
            [38, -10],
            [28, 4],
            [37, -30],
            [-39, -29],
            [50, -13],
            [75, 7],
            [24, 11],
            [29, -36],
            [31, 30],
            [-29, 25],
            [18, 20],
            [34, 3],
            [22, 6],
            [23, -14],
            [28, -32],
            [31, 5],
            [49, -27],
            [43, 9],
            [40, -1],
            [-3, 37],
            [25, 10],
            [43, -20],
            [0, -56],
            [17, 47],
            [23, -1],
            [12, 59],
            [-30, 36],
            [-32, 24],
            [2, 65],
            [33, 43],
            [37, -9],
            [28, -26],
            [38, -67],
            [-25, -29],
            [52, -12],
            [-1, -60],
            [38, 46],
            [33, -38],
            [-9, -44],
            [27, -40],
            [29, 43],
            [21, 51],
            [1, 65],
            [40, -5],
            [41, -8],
            [37, -30],
            [2, -29],
            [-21, -31],
            [20, -32],
            [-4, -29],
            [-54, -41],
            [-39, -9],
            [-29, 18],
            [-8, -30],
            [-27, -50],
            [-8, -26],
            [-32, -40],
            [-40, -4],
            [-22, -25],
            [-2, -38],
            [-32, -7],
            [-34, -48],
            [-30, -67],
            [-11, -46],
            [-1, -69],
            [40, -10],
            [13, -55],
            [13, -45],
            [39, 12],
            [51, -26],
            [28, -22],
            [20, -28],
            [35, -17],
            [29, -24],
            [46, -4],
            [30, -6],
            [-4, -51],
            [8, -59],
            [21, -66],
            [41, -56],
            [21, 19],
            [15, 61],
            [-14, 93],
            [-20, 31],
            [45, 28],
            [31, 41],
            [16, 41],
            [-3, 40],
            [-19, 50],
            [-33, 44],
            [32, 62],
            [-12, 54],
            [-9, 92],
            [19, 14],
            [48, -16],
            [29, -6],
            [23, 15],
            [25, -20],
            [35, -34],
            [8, -23],
            [50, -4],
            [-1, -50],
            [9, -74],
            [25, -10],
            [21, -35],
            [40, 33],
            [26, 65],
            [19, 28],
            [21, -53],
            [36, -75],
            [31, -71],
            [-11, -37],
            [37, -33],
            [25, -34],
            [44, -15],
            [18, -19],
            [11, -50],
            [22, -8],
            [11, -22],
            [2, -67],
            [-20, -22],
            [-20, -21],
            [-46, -21],
            [-35, -48],
            [-47, -10],
            [-59, 13],
            [-42, 0],
            [-29, -4],
            [-23, -43],
            [-35, -26],
            [-40, -78],
            [-32, -54],
            [23, 9],
            [45, 78],
            [58, 49],
            [42, 6],
            [24, -29],
            [-26, -40],
            [9, -63],
            [9, -45],
            [36, -29],
            [46, 8],
            [28, 67],
            [2, -43],
            [17, -22],
            [-34, -38],
            [-61, -36],
            [-28, -23],
            [-31, -43],
            [-21, 4],
            [-1, 50],
            [48, 49],
            [-44, -2],
            [-31, -7]
        ],
        [
            [1829, 9377],
            [-14, -27],
            [61, 17],
            [39, -29],
            [31, 30],
            [26, -20],
            [23, -58],
            [14, 25],
            [-20, 60],
            [24, 9],
            [28, -9],
            [31, -24],
            [17, -58],
            [9, -41],
            [47, -30],
            [50, -28],
            [-3, -26],
            [-46, -4],
            [18, -23],
            [-9, -22],
            [-51, 9],
            [-48, 16],
            [-32, -3],
            [-52, -20],
            [-70, -9],
            [-50, -6],
            [-15, 28],
            [-38, 16],
            [-24, -6],
            [-35, 47],
            [19, 6],
            [43, 10],
            [39, -3],
            [36, 11],
            [-54, 13],
            [-59, -4],
            [-39, 1],
            [-15, 22],
            [64, 23],
            [-42, -1],
            [-49, 16],
            [23, 44],
            [20, 24],
            [74, 36],
            [29, -12]
        ],
        [
            [2097, 9395],
            [-24, -39],
            [-44, 41],
            [10, 9],
            [37, 2],
            [21, -13]
        ],
        [
            [2879, 9376],
            [3, -16],
            [-30, 2],
            [-30, 1],
            [-30, -8],
            [-8, 3],
            [-31, 32],
            [1, 21],
            [14, 4],
            [63, -6],
            [48, -33]
        ],
        [
            [2595, 9379],
            [22, -36],
            [26, 47],
            [70, 24],
            [48, -61],
            [-4, -38],
            [55, 17],
            [26, 23],
            [62, -30],
            [38, -28],
            [3, -25],
            [52, 13],
            [29, -38],
            [67, -23],
            [24, -24],
            [26, -55],
            [-51, -28],
            [66, -38],
            [44, -13],
            [40, -55],
            [44, -3],
            [-9, -42],
            [-49, -69],
            [-34, 26],
            [-44, 57],
            [-36, -8],
            [-3, -34],
            [29, -34],
            [38, -27],
            [11, -16],
            [18, -58],
            [-9, -43],
            [-35, 16],
            [-70, 47],
            [39, -51],
            [29, -35],
            [5, -21],
            [-76, 24],
            [-59, 34],
            [-34, 29],
            [10, 17],
            [-42, 30],
            [-40, 29],
            [0, -18],
            [-80, -9],
            [-23, 20],
            [18, 44],
            [52, 1],
            [57, 7],
            [-9, 21],
            [10, 30],
            [36, 57],
            [-8, 27],
            [-11, 20],
            [-42, 29],
            [-57, 20],
            [18, 15],
            [-29, 36],
            [-25, 4],
            [-22, 20],
            [-14, -18],
            [-51, -7],
            [-101, 13],
            [-59, 17],
            [-45, 9],
            [-23, 21],
            [29, 27],
            [-39, 0],
            [-9, 60],
            [21, 53],
            [29, 24],
            [72, 16],
            [-21, -39]
        ],
        [
            [2212, 9420],
            [33, -12],
            [50, 7],
            [7, -17],
            [-26, -28],
            [42, -26],
            [-5, -53],
            [-45, -23],
            [-27, 5],
            [-19, 23],
            [-69, 45],
            [0, 19],
            [57, -7],
            [-31, 38],
            [33, 29]
        ],
        [
            [2411, 9357],
            [-30, -45],
            [-32, 3],
            [-17, 52],
            [1, 29],
            [14, 25],
            [28, 16],
            [58, -2],
            [53, -14],
            [-42, -53],
            [-33, -11]
        ],
        [
            [1654, 9275],
            [-73, -29],
            [-15, 26],
            [-64, 31],
            [12, 25],
            [19, 43],
            [24, 39],
            [-27, 36],
            [94, 10],
            [39, -13],
            [71, -3],
            [27, -17],
            [30, -25],
            [-35, -15],
            [-68, -41],
            [-34, -42],
            [0, -25]
        ],
        [
            [2399, 9487],
            [-15, -23],
            [-40, 5],
            [-34, 15],
            [15, 27],
            [40, 16],
            [24, -21],
            [10, -19]
        ],
        [
            [2264, 9590],
            [21, -27],
            [1, -31],
            [-13, -44],
            [-46, -6],
            [-30, 10],
            [1, 34],
            [-45, -4],
            [-2, 45],
            [30, -2],
            [41, 21],
            [40, -4],
            [2, 8]
        ],
        [
            [1994, 9559],
            [11, -21],
            [25, 10],
            [29, -2],
            [5, -29],
            [-17, -28],
            [-94, -10],
            [-70, -25],
            [-43, -2],
            [-3, 20],
            [57, 26],
            [-125, -7],
            [-39, 10],
            [38, 58],
            [26, 17],
            [78, -20],
            [50, -35],
            [48, -5],
            [-40, 57],
            [26, 21],
            [29, -7],
            [9, -28]
        ],
        [
            [2370, 9612],
            [30, -19],
            [55, 0],
            [24, -19],
            [-6, -22],
            [32, -14],
            [17, -14],
            [38, -2],
            [40, -5],
            [44, 13],
            [57, 5],
            [45, -5],
            [30, -22],
            [6, -24],
            [-17, -16],
            [-42, -13],
            [-35, 8],
            [-80, -10],
            [-57, -1],
            [-45, 8],
            [-74, 19],
            [-9, 32],
            [-4, 29],
            [-27, 26],
            [-58, 7],
            [-32, 19],
            [10, 24],
            [58, -4]
        ],
        [
            [1772, 9645],
            [-4, -46],
            [-21, -20],
            [-26, -3],
            [-52, -26],
            [-44, -9],
            [-38, 13],
            [47, 44],
            [57, 39],
            [43, -1],
            [38, 9]
        ],
        [
            [2393, 9637],
            [-13, -2],
            [-52, 4],
            [-7, 17],
            [56, -1],
            [19, -11],
            [-3, -7]
        ],
        [
            [1939, 9648],
            [-52, -17],
            [-41, 19],
            [23, 19],
            [40, 6],
            [39, -10],
            [-9, -17]
        ],
        [
            [1954, 9701],
            [-34, -11],
            [-46, 0],
            [0, 8],
            [29, 18],
            [14, -3],
            [37, -12]
        ],
        [
            [2338, 9669],
            [-41, -12],
            [-23, 13],
            [-12, 23],
            [-2, 24],
            [36, -2],
            [16, -4],
            [33, -21],
            [-7, -21]
        ],
        [
            [2220, 9685],
            [11, -25],
            [-45, 7],
            [-46, 19],
            [-62, 2],
            [27, 18],
            [-34, 14],
            [-2, 22],
            [55, -8],
            [75, -21],
            [21, -28]
        ],
        [
            [2583, 9764],
            [33, -20],
            [-38, -17],
            [-51, -45],
            [-50, -4],
            [-57, 8],
            [-30, 24],
            [0, 21],
            [22, 16],
            [-50, 0],
            [-31, 19],
            [-18, 27],
            [20, 26],
            [19, 18],
            [28, 4],
            [-12, 14],
            [65, 3],
            [35, -32],
            [47, -12],
            [46, -11],
            [22, -39]
        ],
        [
            [3097, 9967],
            [74, -4],
            [60, -8],
            [51, -16],
            [-2, -16],
            [-67, -25],
            [-68, -12],
            [-25, -14],
            [61, 1],
            [-66, -36],
            [-45, -17],
            [-48, -48],
            [-57, -10],
            [-18, -12],
            [-84, -6],
            [39, -8],
            [-20, -10],
            [23, -29],
            [-26, -21],
            [-43, -16],
            [-13, -24],
            [-39, -17],
            [4, -14],
            [48, 3],
            [0, -15],
            [-74, -35],
            [-73, 16],
            [-81, -9],
            [-42, 7],
            [-52, 3],
            [-4, 29],
            [52, 13],
            [-14, 43],
            [17, 4],
            [74, -26],
            [-38, 38],
            [-45, 11],
            [23, 23],
            [49, 14],
            [8, 21],
            [-39, 23],
            [-12, 31],
            [76, -3],
            [22, -6],
            [43, 21],
            [-62, 7],
            [-98, -4],
            [-49, 20],
            [-23, 24],
            [-32, 17],
            [-6, 21],
            [41, 11],
            [32, 2],
            [55, 9],
            [41, 22],
            [34, -3],
            [30, -16],
            [21, 32],
            [37, 9],
            [50, 7],
            [85, 2],
            [14, -6],
            [81, 10],
            [60, -4],
            [60, -4]
        ],
        [
            [5290, 7828],
            [-3, -24],
            [-12, -10],
            [-20, 7],
            [-6, -24],
            [-14, -2],
            [-5, 10],
            [-15, -20],
            [-13, -3],
            [-12, 13]
        ],
        [
            [5190, 7775],
            [-10, 25],
            [-13, -9],
            [0, 27],
            [21, 33],
            [-1, 15],
            [12, -5],
            [8, 10]
        ],
        [
            [5207, 7871],
            [24, -1],
            [5, 13],
            [30, -18]
        ],
        [
            [3140, 1814],
            [-10, -24],
            [-23, -18],
            [-14, 2],
            [-16, 5],
            [-21, 18],
            [-29, 8],
            [-35, 33],
            [-28, 32],
            [-38, 66],
            [23, -12],
            [39, -40],
            [36, -21],
            [15, 27],
            [9, 41],
            [25, 24],
            [20, -7]
        ],
        [
            [3095, 1968],
            [-25, 0],
            [-13, -14],
            [-25, -22],
            [-5, -55],
            [-11, -1],
            [-32, 19],
            [-32, 41],
            [-34, 34],
            [-9, 37],
            [8, 35],
            [-14, 39],
            [-4, 101],
            [12, 57],
            [30, 45],
            [-43, 18],
            [27, 52],
            [9, 98],
            [31, -21],
            [15, 123],
            [-19, 15],
            [-9, -73],
            [-17, 8],
            [9, 84],
            [9, 110],
            [13, 40],
            [-8, 58],
            [-2, 66],
            [11, 2],
            [17, 96],
            [20, 94],
            [11, 88],
            [-6, 89],
            [8, 49],
            [-3, 72],
            [16, 73],
            [5, 114],
            [9, 123],
            [9, 132],
            [-2, 96],
            [-6, 84]
        ],
        [
            [3045, 3974],
            [14, 15],
            [8, 30]
        ],
        [
            [8064, 6161],
            [-24, -28],
            [-23, 18],
            [0, 51],
            [13, 26],
            [31, 17],
            [16, -1],
            [6, -23],
            [-12, -26],
            [-7, -34]
        ],
        [
            [8628, 7562],
            [-18, 35],
            [-11, -33],
            [-43, -26],
            [4, -31],
            [-24, 2],
            [-13, 19],
            [-19, -42],
            [-30, -32],
            [-23, -38]
        ],
        [
            [8451, 7416],
            [-39, -17],
            [-20, -27],
            [-30, -17],
            [15, 28],
            [-6, 23],
            [22, 40],
            [-15, 30],
            [-24, -20],
            [-32, -41],
            [-17, -39],
            [-27, -2],
            [-14, -28],
            [15, -40],
            [22, -10],
            [1, -26],
            [22, -17],
            [31, 42],
            [25, -23],
            [18, -2],
            [4, -31],
            [-39, -16],
            [-13, -32],
            [-27, -30],
            [-14, -41],
            [30, -33],
            [11, -58],
            [17, -54],
            [18, -45],
            [0, -44],
            [-17, -16],
            [6, -32],
            [17, -18],
            [-5, -48],
            [-7, -47],
            [-15, -5],
            [-21, -64],
            [-22, -78],
            [-26, -70],
            [-38, -55],
            [-39, -50],
            [-31, -6],
            [-17, -27],
            [-10, 20],
            [-15, -30],
            [-39, -29],
            [-29, -9],
            [-10, -63],
            [-15, -3],
            [-8, 43],
            [7, 22],
            [-37, 19],
            [-13, -9]
        ],
        [
            [8001, 6331],
            [-28, 15],
            [-14, 24],
            [5, 34],
            [-26, 11],
            [-13, 22],
            [-24, -31],
            [-27, -7],
            [-22, 0],
            [-15, -14]
        ],
        [
            [7837, 6385],
            [-14, -9],
            [4, -68],
            [-15, 2],
            [-2, 14]
        ],
        [
            [7810, 6324],
            [-1, 24],
            [-20, -17],
            [-12, 11],
            [-21, 22],
            [8, 49],
            [-18, 12],
            [-6, 54],
            [-30, -10],
            [4, 70],
            [26, 50],
            [1, 48],
            [-1, 46],
            [-12, 14],
            [-9, 35],
            [-16, -5]
        ],
        [
            [7703, 6727],
            [-30, 9],
            [9, 25],
            [-13, 36],
            [-20, -24],
            [-23, 14],
            [-32, -37],
            [-25, -44],
            [-23, -8]
        ],
        [
            [7466, 6670],
            [-2, 47],
            [-17, -13]
        ],
        [
            [7447, 6704],
            [-32, 6],
            [-32, 14],
            [-22, 26],
            [-22, 11],
            [-9, 29],
            [-16, 8],
            [-28, 39],
            [-22, 18],
            [-12, -14]
        ],
        [
            [7252, 6841],
            [-38, 41],
            [-28, 37],
            [-7, 65],
            [20, -7],
            [1, 30],
            [-12, 30],
            [3, 48],
            [-30, 69]
        ],
        [
            [7161, 7154],
            [-45, 24],
            [-8, 46],
            [-21, 27]
        ],
        [
            [7082, 7268],
            [-4, 34],
            [1, 23],
            [-17, 13],
            [-9, -6],
            [-7, 55]
        ],
        [
            [7046, 7387],
            [8, 13],
            [-4, 14],
            [26, 28],
            [20, 12],
            [29, -8],
            [11, 38],
            [35, 7],
            [10, 23],
            [44, 32],
            [4, 13]
        ],
        [
            [7229, 7559],
            [-2, 34],
            [19, 15],
            [-25, 103],
            [55, 24],
            [14, 13],
            [20, 106],
            [55, -20],
            [15, 27],
            [2, 59],
            [23, 6],
            [21, 39]
        ],
        [
            [7426, 7965],
            [11, 5]
        ],
        [
            [7437, 7970],
            [7, -41],
            [23, -32],
            [40, -22],
            [19, -47],
            [-10, -70],
            [10, -25],
            [33, -10],
            [37, -8],
            [33, -37],
            [18, -7],
            [12, -54],
            [17, -35],
            [30, 1],
            [58, -13],
            [36, 8],
            [28, -9],
            [41, -36],
            [34, 0],
            [12, -18],
            [32, 32],
            [45, 20],
            [42, 2],
            [32, 21],
            [20, 32],
            [20, 20],
            [-5, 19],
            [-9, 23],
            [15, 38],
            [15, -5],
            [29, -12],
            [28, 31],
            [42, 23],
            [20, 39],
            [20, 17],
            [40, 8],
            [22, -7],
            [3, 21],
            [-25, 41],
            [-22, 19],
            [-22, -22],
            [-27, 10],
            [-16, -8],
            [-7, 24],
            [20, 59],
            [13, 45]
        ],
        [
            [8240, 8005],
            [34, -23],
            [39, 38],
            [-1, 26],
            [26, 62],
            [15, 19],
            [0, 33],
            [-16, 14],
            [23, 29],
            [35, 11],
            [37, 2],
            [41, -18],
            [25, -22],
            [17, -59],
            [10, -26],
            [10, -36],
            [10, -58],
            [49, -19],
            [32, -42],
            [12, -55],
            [42, 0],
            [24, 23],
            [46, 17],
            [-15, -53],
            [-11, -21],
            [-9, -65],
            [-19, -58],
            [-33, 11],
            [-24, -21],
            [7, -51],
            [-4, -69],
            [-14, -2],
            [0, -30]
        ],
        [
            [4920, 5353],
            [-12, -1],
            [-20, 12],
            [-18, -1],
            [-33, -10],
            [-19, -18],
            [-27, -21],
            [-6, 1]
        ],
        [
            [4785, 5315],
            [2, 49],
            [3, 7],
            [-1, 24],
            [-12, 24],
            [-8, 4],
            [-8, 17],
            [6, 26],
            [-3, 28],
            [1, 18]
        ],
        [
            [4765, 5512],
            [5, 0],
            [1, 25],
            [-2, 12],
            [3, 8],
            [10, 7],
            [-7, 47],
            [-6, 25],
            [2, 20],
            [5, 4]
        ],
        [
            [4776, 5660],
            [4, 6],
            [8, -9],
            [21, -1],
            [5, 18],
            [5, -1],
            [8, 6],
            [4, -25],
            [7, 7],
            [11, 9]
        ],
        [
            [4921, 5627],
            [7, -84],
            [-11, -50],
            [-8, -66],
            [12, -51],
            [-1, -23]
        ],
        [
            [5363, 5191],
            [-4, 4],
            [-16, -8],
            [-17, 8],
            [-13, -4]
        ],
        [
            [5313, 5191],
            [-45, 1]
        ],
        [
            [5268, 5192],
            [4, 47],
            [-11, 39],
            [-13, 10],
            [-6, 27],
            [-7, 8],
            [1, 16]
        ],
        [
            [5236, 5339],
            [7, 42],
            [13, 57],
            [8, 1],
            [17, 34],
            [10, 1],
            [16, -24],
            [19, 20],
            [2, 25],
            [7, 23],
            [4, 30],
            [15, 25],
            [5, 41],
            [6, 13],
            [4, 31],
            [7, 37],
            [24, 46],
            [1, 20],
            [3, 10],
            [-11, 24]
        ],
        [
            [5393, 5795],
            [1, 19],
            [8, 3]
        ],
        [
            [5402, 5817],
            [11, -38],
            [2, -39],
            [-1, -39],
            [15, -54],
            [-15, 1],
            [-8, -4],
            [-13, 6],
            [-6, -28],
            [16, -35],
            [13, -10],
            [3, -24],
            [9, -41],
            [-4, -16]
        ],
        [
            [5444, 5191],
            [-2, -31],
            [-22, 14],
            [-22, 15],
            [-35, 2]
        ],
        [
            [5856, 5265],
            [-2, -69],
            [11, -8],
            [-9, -21],
            [-10, -16],
            [-11, -31],
            [-6, -27],
            [-1, -48],
            [-7, -22],
            [0, -45]
        ],
        [
            [5821, 4978],
            [-8, -16],
            [-1, -35],
            [-4, -5],
            [-2, -32]
        ],
        [
            [5814, 4792],
            [5, -55],
            [-2, -30],
            [5, -35],
            [16, -33],
            [15, -74]
        ],
        [
            [5853, 4565],
            [-11, 6],
            [-37, -10],
            [-7, -7],
            [-8, -38],
            [6, -26],
            [-5, -70],
            [-3, -59],
            [7, -11],
            [19, -23],
            [8, 11],
            [2, -64],
            [-21, 1],
            [-11, 32],
            [-10, 25],
            [-22, 9],
            [-6, 31],
            [-17, -19],
            [-22, 8],
            [-10, 27],
            [-17, 6],
            [-13, -2],
            [-2, 19],
            [-9, 1]
        ],
        [
            [5342, 4697],
            [-4, 18]
        ],
        [
            [5360, 4775],
            [8, -6],
            [9, 23],
            [15, -1],
            [2, -17],
            [11, -10],
            [16, 37],
            [16, 29],
            [7, 19],
            [-1, 48],
            [12, 58],
            [13, 30],
            [18, 29],
            [3, 18],
            [1, 22],
            [5, 21],
            [-2, 33],
            [4, 52],
            [5, 37],
            [8, 32],
            [2, 36]
        ],
        [
            [5760, 5367],
            [17, -49],
            [12, -7],
            [8, 10],
            [12, -4],
            [16, 12],
            [6, -25],
            [25, -39]
        ],
        [
            [5330, 4760],
            [-22, 62]
        ],
        [
            [5308, 4822],
            [21, 33],
            [-11, 39],
            [10, 15],
            [19, 7],
            [2, 26],
            [15, -28],
            [24, -2],
            [9, 27],
            [3, 40],
            [-3, 46],
            [-13, 35],
            [12, 68],
            [-7, 12],
            [-21, -5],
            [-7, 31],
            [2, 25]
        ],
        [
            [2906, 5049],
            [-12, 14],
            [-14, 19],
            [-7, -9],
            [-24, 8],
            [-7, 25],
            [-5, -1],
            [-28, 34]
        ],
        [
            [2809, 5139],
            [-3, 18],
            [10, 5],
            [-1, 29],
            [6, 22],
            [14, 4],
            [12, 37],
            [10, 31],
            [-10, 14],
            [5, 34],
            [-6, 54],
            [6, 16],
            [-4, 50],
            [-12, 31]
        ],
        [
            [2836, 5484],
            [4, 29],
            [9, -4],
            [5, 17],
            [-6, 35],
            [3, 9]
        ],
        [
            [2851, 5570],
            [14, -2],
            [21, 41],
            [12, 6],
            [0, 20],
            [5, 50],
            [16, 27],
            [17, 1],
            [3, 13],
            [21, -5],
            [22, 30],
            [11, 13],
            [14, 28],
            [9, -3],
            [8, -16],
            [-6, -20]
        ],
        [
            [3018, 5753],
            [-18, -10],
            [-7, -29],
            [-10, -17],
            [-8, -22],
            [-4, -42],
            [-8, -35],
            [15, -4],
            [3, -27],
            [6, -13],
            [3, -24],
            [-4, -22],
            [1, -12],
            [7, -5],
            [7, -20],
            [36, 5],
            [16, -7],
            [19, -51],
            [11, 6],
            [20, -3],
            [16, 7],
            [10, -10],
            [-5, -32],
            [-6, -20],
            [-2, -42],
            [5, -40],
            [8, -17],
            [1, -13],
            [-14, -30],
            [10, -13],
            [8, -21],
            [8, -58]
        ],
        [
            [3058, 4804],
            [-14, 31],
            [-8, 1],
            [18, 61],
            [-21, 27],
            [-17, -5],
            [-10, 10],
            [-15, -15],
            [-21, 7],
            [-16, 62],
            [-13, 15],
            [-9, 28],
            [-19, 28],
            [-7, -5]
        ],
        [
            [2695, 5543],
            [-15, 14],
            [-6, 12],
            [4, 10],
            [-1, 13],
            [-8, 14],
            [-11, 12],
            [-10, 8],
            [-1, 17],
            [-8, 10],
            [2, -17],
            [-5, -14],
            [-7, 17],
            [-9, 5],
            [-4, 12],
            [1, 18],
            [3, 19],
            [-8, 8],
            [7, 12]
        ],
        [
            [2619, 5713],
            [4, 7],
            [18, -15],
            [7, 7],
            [9, -5],
            [4, -12],
            [8, -4],
            [7, 13]
        ],
        [
            [2676, 5704],
            [7, -32],
            [11, -24],
            [13, -25]
        ],
        [
            [2707, 5623],
            [-11, -6],
            [0, -23],
            [6, -9],
            [-4, -7],
            [1, -11],
            [-2, -12],
            [-2, -12]
        ],
        [
            [2715, 6427],
            [23, -4],
            [22, 0],
            [26, -21],
            [11, -21],
            [26, 6],
            [10, -13],
            [24, -37],
            [17, -27],
            [9, 1],
            [17, -12],
            [-2, -17],
            [20, -2],
            [21, -24],
            [-3, -14],
            [-19, -7],
            [-18, -3],
            [-19, 4],
            [-40, -5],
            [18, 32],
            [-11, 16],
            [-18, 4],
            [-9, 17],
            [-7, 33],
            [-16, -2],
            [-26, 16],
            [-8, 12],
            [-36, 10],
            [-10, 11],
            [11, 15],
            [-28, 3],
            [-20, -31],
            [-11, -1],
            [-4, -14],
            [-14, -7],
            [-12, 6],
            [15, 18],
            [6, 22],
            [13, 13],
            [14, 11],
            [21, 6],
            [7, 6]
        ],
        [
            [5909, 7133],
            [2, 1],
            [4, 14],
            [20, -1],
            [25, 18],
            [-19, -25],
            [2, -11]
        ],
        [
            [5943, 7129],
            [-3, 2],
            [-5, -5],
            [-4, 1],
            [-2, -2],
            [0, 6],
            [-2, 4],
            [-6, 0],
            [-7, -5],
            [-5, 3]
        ],
        [
            [5943, 7129],
            [1, -5],
            [-28, -24],
            [-14, 8],
            [-7, 23],
            [14, 2]
        ],
        [
            [5377, 7945],
            [-16, 25],
            [-14, 15],
            [-3, 25],
            [-5, 17],
            [21, 13],
            [10, 15],
            [20, 11],
            [7, 11],
            [7, -6],
            [13, 6]
        ],
        [
            [5417, 8077],
            [13, -19],
            [21, -5],
            [-2, -17],
            [15, -12],
            [4, 15],
            [19, -6],
            [3, -19],
            [20, -3],
            [13, -29]
        ],
        [
            [5523, 7982],
            [-8, 0],
            [-4, -11],
            [-7, -3],
            [-2, -13],
            [-5, -3],
            [-1, -5],
            [-9, -7],
            [-12, 1],
            [-4, -13]
        ],
        [
            [5275, 8306],
            [1, -23],
            [28, -14],
            [-1, -21],
            [29, 11],
            [15, 16],
            [32, -23],
            [13, -19]
        ],
        [
            [5392, 8233],
            [6, -30],
            [-8, -16],
            [11, -21],
            [6, -31],
            [-2, -21],
            [12, -37]
        ],
        [
            [5207, 7871],
            [3, 42],
            [14, 40],
            [-40, 11],
            [-13, 16]
        ],
        [
            [5171, 7980],
            [2, 26],
            [-6, 13]
        ],
        [
            [5171, 8059],
            [-5, 62],
            [17, 0],
            [7, 22],
            [6, 54],
            [-5, 20]
        ],
        [
            [5191, 8217],
            [6, 13],
            [23, 3],
            [5, -13],
            [19, 29],
            [-6, 22],
            [-2, 34]
        ],
        [
            [5236, 8305],
            [21, -8],
            [18, 9]
        ],
        [
            [6196, 5808],
            [7, -19],
            [-1, -24],
            [-16, -14],
            [12, -16]
        ],
        [
            [6198, 5735],
            [-10, -32]
        ],
        [
            [6188, 5703],
            [-7, 11],
            [-6, -5],
            [-16, 1],
            [0, 18],
            [-2, 17],
            [9, 27],
            [10, 26]
        ],
        [
            [6176, 5798],
            [12, -5],
            [8, 15]
        ],
        [
            [5352, 8343],
            [-17, -48],
            [-29, 33],
            [-4, 25],
            [41, 19],
            [9, -29]
        ],
        [
            [5236, 8305],
            [-11, 32],
            [-1, 61],
            [5, 16],
            [8, 17],
            [24, 4],
            [10, 16],
            [22, 17],
            [-1, -30],
            [-8, -20],
            [4, -16],
            [15, -9],
            [-7, -22],
            [-8, 6],
            [-20, -42],
            [7, -29]
        ],
        [
            [3008, 6222],
            [3, 10],
            [22, 0],
            [16, -15],
            [8, 1],
            [5, -21],
            [15, 1],
            [-1, -17],
            [12, -2],
            [14, -22],
            [-10, -24],
            [-14, 13],
            [-12, -3],
            [-9, 3],
            [-5, -11],
            [-11, -3],
            [-4, 14],
            [-10, -8],
            [-11, -41],
            [-7, 10],
            [-1, 17]
        ],
        [
            [3008, 6124],
            [0, 16],
            [-7, 17],
            [7, 10],
            [2, 23],
            [-2, 32]
        ],
        [
            [5333, 6444],
            [-95, -112],
            [-81, -117],
            [-39, -26]
        ],
        [
            [5118, 6189],
            [-31, -6],
            [0, 38],
            [-13, 10],
            [-17, 16],
            [-7, 28],
            [-94, 129],
            [-93, 129]
        ],
        [
            [4863, 6533],
            [-105, 143]
        ],
        [
            [4758, 6676],
            [1, 11],
            [0, 4]
        ],
        [
            [4759, 6691],
            [0, 70],
            [44, 44],
            [28, 9],
            [23, 16],
            [11, 29],
            [32, 24],
            [1, 44],
            [16, 5],
            [13, 22],
            [36, 9],
            [5, 23],
            [-7, 13],
            [-10, 62],
            [-1, 36],
            [-11, 38]
        ],
        [
            [4939, 7135],
            [27, 32],
            [30, 11],
            [17, 24],
            [27, 18],
            [47, 11],
            [46, 4],
            [14, -8],
            [26, 23],
            [30, 0],
            [11, -13],
            [19, 3]
        ],
        [
            [5233, 7240],
            [-5, -30],
            [4, -56],
            [-6, -49],
            [-18, -33],
            [3, -45],
            [23, -35],
            [0, -14],
            [17, -24],
            [12, -106]
        ],
        [
            [5263, 6848],
            [9, -52],
            [1, -28],
            [-5, -48],
            [2, -27],
            [-3, -32],
            [2, -37],
            [-11, -25],
            [17, -43],
            [1, -25],
            [10, -33],
            [13, 11],
            [22, -28],
            [12, -37]
        ],
        [
            [2769, 4856],
            [15, 45],
            [-6, 25],
            [-11, -27],
            [-16, 26],
            [5, 16],
            [-4, 54],
            [9, 9],
            [5, 37],
            [11, 38],
            [-2, 24],
            [15, 13],
            [19, 23]
        ],
        [
            [2906, 5049],
            [4, -45],
            [-9, -39],
            [-30, -62],
            [-33, -23],
            [-17, -51],
            [-6, -40],
            [-15, -24],
            [-12, 29],
            [-11, 7],
            [-12, -5],
            [-1, 22],
            [8, 14],
            [-3, 24]
        ],
        [
            [5969, 6800],
            [-7, -23],
            [-6, -45],
            [-8, -31],
            [-6, -10],
            [-10, 19],
            [-12, 26],
            [-20, 85],
            [-3, -5],
            [12, -63],
            [17, -59],
            [21, -92],
            [10, -32],
            [9, -34],
            [25, -65],
            [-6, -10],
            [1, -39],
            [33, -53],
            [4, -12]
        ],
        [
            [6023, 6357],
            [-110, 0],
            [-107, 0],
            [-112, 0]
        ],
        [
            [5694, 6357],
            [0, 218],
            [0, 210],
            [-8, 47],
            [7, 37],
            [-5, 25],
            [10, 29]
        ],
        [
            [5698, 6923],
            [37, 0],
            [27, -15],
            [28, -18],
            [13, -9],
            [21, 19],
            [11, 17],
            [25, 5],
            [20, -8],
            [7, -29],
            [7, 19],
            [22, -14],
            [22, -3],
            [13, 15]
        ],
        [
            [5951, 6902],
            [18, -102]
        ],
        [
            [6176, 5798],
            [-10, 20],
            [-11, 34],
            [-12, 19],
            [-8, 21],
            [-24, 23],
            [-19, 1],
            [-7, 12],
            [-16, -14],
            [-17, 27],
            [-8, -44],
            [-33, 13]
        ],
        [
            [6011, 5910],
            [-3, 23],
            [12, 87],
            [3, 39],
            [9, 18],
            [20, 10],
            [14, 34]
        ],
        [
            [6066, 6121],
            [16, -69],
            [8, -54],
            [15, -29],
            [38, -55],
            [16, -34],
            [15, -34],
            [8, -20],
            [14, -18]
        ],
        [
            [4749, 7532],
            [1, 42],
            [-11, 25],
            [39, 43],
            [34, -11],
            [37, 1],
            [30, -10],
            [23, 3],
            [45, -2]
        ],
        [
            [4947, 7623],
            [11, -23],
            [51, -27],
            [10, 13],
            [31, -27],
            [32, 8]
        ],
        [
            [5082, 7567],
            [2, -35],
            [-26, -39],
            [-36, -12],
            [-2, -20],
            [-18, -33],
            [-10, -48],
            [11, -34],
            [-16, -26],
            [-6, -39],
            [-21, -11],
            [-20, -46],
            [-35, -1],
            [-27, 1],
            [-17, -21],
            [-11, -22],
            [-13, 5],
            [-11, 20],
            [-8, 34],
            [-26, 9]
        ],
        [
            [4792, 7249],
            [-2, 20],
            [10, 22],
            [4, 16],
            [-9, 17],
            [7, 39],
            [-11, 36],
            [12, 5],
            [1, 27],
            [5, 9],
            [0, 46],
            [13, 16],
            [-8, 30],
            [-16, 2],
            [-5, -8],
            [-16, 0],
            [-7, 29],
            [-11, -8],
            [-10, -15]
        ],
        [
            [5675, 8472],
            [3, 35],
            [-10, -8],
            [-18, 21],
            [-2, 34],
            [35, 17],
            [35, 8],
            [30, -10],
            [29, 2]
        ],
        [
            [5777, 8571],
            [4, -10],
            [-20, -34],
            [8, -55],
            [-12, -19]
        ],
        [
            [5757, 8453],
            [-22, 0],
            [-24, 22],
            [-13, 7],
            [-23, -10]
        ],
        [
            [6188, 5703],
            [-6, -21],
            [10, -32],
            [10, -29],
            [11, -21],
            [90, -70],
            [24, 0]
        ],
        [
            [6327, 5530],
            [-79, -177],
            [-36, -3],
            [-25, -41],
            [-17, -1],
            [-8, -19]
        ],
        [
            [6162, 5289],
            [-19, 0],
            [-11, 20],
            [-26, -25],
            [-8, -24],
            [-18, 4],
            [-6, 7],
            [-7, -1],
            [-9, 0],
            [-35, 50],
            [-19, 0],
            [-10, 20],
            [0, 33],
            [-14, 10]
        ],
        [
            [5980, 5383],
            [-17, 64],
            [-12, 14],
            [-5, 23],
            [-14, 29],
            [-17, 4],
            [9, 34],
            [15, 2],
            [4, 18]
        ],
        [
            [5943, 5571],
            [0, 53]
        ],
        [
            [5943, 5624],
            [8, 62],
            [13, 16],
            [3, 24],
            [12, 45],
            [17, 30],
            [11, 58],
            [4, 51]
        ],
        [
            [5794, 9138],
            [-4, -42],
            [42, -39],
            [-26, -45],
            [33, -67],
            [-19, -51],
            [25, -43],
            [-11, -39],
            [41, -40],
            [-11, -31],
            [-25, -34],
            [-60, -75]
        ],
        [
            [5779, 8632],
            [-50, -5],
            [-49, -21],
            [-45, -13],
            [-16, 32],
            [-27, 20],
            [6, 58],
            [-14, 53],
            [14, 35],
            [25, 37],
            [63, 64],
            [19, 12],
            [-3, 25],
            [-39, 28]
        ],
        [
            [5663, 8957],
            [-9, 23],
            [-1, 91],
            [-43, 40],
            [-37, 29]
        ],
        [
            [5573, 9140],
            [17, 16],
            [30, -32],
            [37, 3],
            [30, -14],
            [26, 26],
            [14, 44],
            [43, 20],
            [35, -24],
            [-11, -41]
        ],
        [
            [9954, 4033],
            [9, -17],
            [-4, -31],
            [-17, -8],
            [-16, 7],
            [-2, 26],
            [10, 21],
            [13, -8],
            [7, 10]
        ],
        [
            [0, 4079],
            [9981, -14],
            [-17, -13],
            [-4, 23],
            [14, 12],
            [9, 3],
            [-9983, 18]
        ],
        [
            [0, 4108],
            [0, -29]
        ],
        [
            [0, 4108],
            [6, 3],
            [-4, -28],
            [-2, -4]
        ],
        [
            [3300, 1994],
            [33, 36],
            [24, -15],
            [16, 24],
            [22, -27],
            [-8, -21],
            [-37, -17],
            [-13, 20],
            [-23, -26],
            [-14, 26]
        ],
        [
            [5265, 7548],
            [-9, -46],
            [-13, 12],
            [-6, 40],
            [5, 22],
            [18, 22],
            [5, -50]
        ],
        [
            [5157, 7984],
            [6, -6],
            [8, 2]
        ],
        [
            [5190, 7775],
            [-2, -17],
            [9, -22],
            [-10, -18],
            [7, -46],
            [15, -8],
            [-3, -25]
        ],
        [
            [5206, 7639],
            [-25, -34],
            [-55, 16],
            [-40, -19],
            [-4, -35]
        ],
        [
            [4947, 7623],
            [14, 35],
            [5, 118],
            [-28, 62],
            [-21, 30],
            [-42, 23],
            [-3, 43],
            [36, 12],
            [47, -15],
            [-9, 67],
            [26, -25],
            [65, 46],
            [8, 48],
            [24, 12]
        ],
        [
            [3485, 5194],
            [7, 25],
            [3, 27]
        ],
        [
            [3495, 5246],
            [4, 26],
            [-10, 34]
        ],
        [
            [3489, 5306],
            [-3, 41],
            [15, 51]
        ],
        [
            [3501, 5398],
            [9, -7],
            [21, -14],
            [29, -50],
            [5, -24]
        ],
        [
            [5308, 4822],
            [-29, 60],
            [-18, 49],
            [-17, 61],
            [1, 19],
            [6, 19],
            [7, 43],
            [5, 44]
        ],
        [
            [5263, 5117],
            [10, 4],
            [40, -1],
            [0, 71]
        ],
        [
            [4827, 8240],
            [-21, 12],
            [-17, -1],
            [6, 32],
            [-6, 32]
        ],
        [
            [4789, 8315],
            [23, 2],
            [30, -37],
            [-15, -40]
        ],
        [
            [4916, 8521],
            [-30, -63],
            [29, 8],
            [30, -1],
            [-7, -48],
            [-25, -53],
            [29, -4],
            [2, -6],
            [25, -69],
            [19, -10],
            [17, -67],
            [8, -24],
            [33, -11],
            [-3, -38],
            [-14, -17],
            [11, -30],
            [-25, -31],
            [-37, 0],
            [-48, -16],
            [-13, 12],
            [-18, -28],
            [-26, 7],
            [-19, -23],
            [-15, 12],
            [41, 62],
            [25, 13],
            [-1, 0],
            [-43, 9],
            [-8, 24],
            [29, 18],
            [-15, 32],
            [5, 39],
            [42, -6],
            [4, 35],
            [-19, 36],
            [0, 1],
            [-34, 10],
            [-7, 16],
            [10, 27],
            [-9, 16],
            [-15, -28],
            [-1, 57],
            [-14, 30],
            [10, 61],
            [21, 48],
            [23, -4],
            [33, 4]
        ],
        [
            [6154, 7511],
            [4, 26],
            [-7, 40],
            [-16, 22],
            [-16, 6],
            [-10, 19]
        ],
        [
            [6109, 7624],
            [4, 6],
            [23, -10],
            [41, -9],
            [38, -28],
            [5, -11],
            [17, 9],
            [25, -13],
            [9, -24],
            [17, -13]
        ],
        [
            [6210, 7485],
            [-27, 29],
            [-29, -3]
        ],
        [
            [5029, 5408],
            [-44, -35],
            [-15, -20],
            [-25, -17],
            [-25, 17]
        ],
        [
            [5000, 5708],
            [-2, -18],
            [12, -30],
            [0, -43],
            [2, -47],
            [7, -21],
            [-6, -54],
            [2, -29],
            [8, -37],
            [6, -21]
        ],
        [
            [4765, 5512],
            [-8, 1],
            [-5, -24],
            [-8, 1],
            [-6, 12],
            [2, 24],
            [-11, 36],
            [-8, -7],
            [-6, -1]
        ],
        [
            [4715, 5554],
            [-7, -3],
            [0, 21],
            [-4, 16],
            [0, 17],
            [-6, 25],
            [-7, 21],
            [-23, 0],
            [-6, -11],
            [-8, -1],
            [-4, -13],
            [-4, -17],
            [-14, -26]
        ],
        [
            [4632, 5583],
            [-13, 35],
            [-10, 24],
            [-8, 7],
            [-6, 12],
            [-4, 26],
            [-4, 13],
            [-8, 10]
        ],
        [
            [4579, 5710],
            [13, 29],
            [8, -2],
            [7, 10],
            [6, 0],
            [5, 8],
            [-3, 20],
            [3, 6],
            [1, 20]
        ],
        [
            [4619, 5801],
            [13, -1],
            [20, -14],
            [6, 1],
            [3, 7],
            [15, -5],
            [4, 4]
        ],
        [
            [4680, 5793],
            [1, -22],
            [5, 0],
            [7, 8],
            [5, -2],
            [7, -15],
            [12, -5],
            [8, 13],
            [9, 8],
            [6, 8],
            [6, -1],
            [6, -13],
            [3, -17],
            [12, -24],
            [-6, -16],
            [-1, -19],
            [6, 6],
            [3, -7],
            [-1, -17],
            [8, -18]
        ],
        [
            [4532, 5834],
            [3, 27]
        ],
        [
            [4535, 5861],
            [31, 1],
            [6, 14],
            [9, 1],
            [11, -14],
            [8, -1],
            [9, 10],
            [6, -17],
            [-12, -13],
            [-12, 1],
            [-12, 13],
            [-10, -14],
            [-5, -1],
            [-7, -8],
            [-25, 1]
        ],
        [
            [4579, 5710],
            [-15, 24],
            [-11, 4],
            [-7, 17],
            [1, 9],
            [-9, 13],
            [-2, 12]
        ],
        [
            [4536, 5789],
            [15, 10],
            [9, -2],
            [8, 7],
            [51, -3]
        ],
        [
            [5263, 5117],
            [-5, 9],
            [10, 66]
        ],
        [
            [5658, 7167],
            [15, -20],
            [22, 3],
            [20, -4],
            [0, -10],
            [15, 7],
            [-4, -18],
            [-40, -5],
            [1, 10],
            [-34, 12],
            [5, 25]
        ],
        [
            [5723, 7469],
            [-17, 2],
            [-14, 6],
            [-34, -16],
            [19, -33],
            [-14, -10],
            [-15, 0],
            [-15, 31],
            [-5, -13],
            [6, -36],
            [14, -27],
            [-10, -13],
            [15, -27],
            [14, -18],
            [0, -33],
            [-25, 16],
            [8, -30],
            [-18, -7],
            [11, -52],
            [-19, -1],
            [-23, 26],
            [-10, 47],
            [-5, 40],
            [-11, 27],
            [-14, 34],
            [-2, 16]
        ],
        [
            [5583, 7470],
            [18, 6],
            [11, 13],
            [15, -2],
            [5, 11],
            [5, 2]
        ],
        [
            [5725, 7529],
            [13, -16],
            [-8, -37],
            [-7, -7]
        ],
        [
            [3701, 9939],
            [93, 35],
            [97, -2],
            [36, 21],
            [98, 6],
            [222, -7],
            [174, -47],
            [-52, -23],
            [-106, -3],
            [-150, -5],
            [14, -11],
            [99, 7],
            [83, -21],
            [54, 18],
            [23, -21],
            [-30, -34],
            [71, 22],
            [135, 23],
            [83, -12],
            [15, -25],
            [-113, -42],
            [-16, -14],
            [-88, -10],
            [64, -3],
            [-32, -43],
            [-23, -38],
            [1, -66],
            [33, -38],
            [-43, -3],
            [-46, -19],
            [52, -31],
            [6, -50],
            [-30, -6],
            [36, -50],
            [-61, -5],
            [32, -24],
            [-9, -20],
            [-39, -10],
            [-39, 0],
            [35, -40],
            [0, -26],
            [-55, 24],
            [-14, -15],
            [37, -15],
            [37, -36],
            [10, -48],
            [-49, -11],
            [-22, 22],
            [-34, 34],
            [10, -40],
            [-33, -31],
            [73, -2],
            [39, -3],
            [-75, -52],
            [-75, -46],
            [-81, -21],
            [-31, 0],
            [-29, -23],
            [-38, -62],
            [-60, -42],
            [-19, -2],
            [-37, -15],
            [-40, -13],
            [-24, -37],
            [0, -41],
            [-15, -39],
            [-45, -47],
            [11, -47],
            [-12, -48],
            [-14, -58],
            [-39, -4],
            [-41, 49],
            [-56, 0],
            [-27, 32],
            [-18, 58],
            [-49, 73],
            [-14, 39],
            [-3, 53],
            [-39, 54],
            [10, 44],
            [-18, 21],
            [27, 69],
            [42, 22],
            [11, 25],
            [6, 46],
            [-32, -21],
            [-15, -9],
            [-25, -8],
            [-34, 19],
            [-2, 40],
            [11, 31],
            [25, 1],
            [57, -15],
            [-48, 37],
            [-24, 20],
            [-28, -8],
            [-23, 15],
            [31, 55],
            [-17, 22],
            [-22, 41],
            [-34, 62],
            [-35, 23],
            [0, 25],
            [-74, 34],
            [-59, 5],
            [-74, -3],
            [-68, -4],
            [-32, 19],
            [-49, 37],
            [73, 19],
            [56, 3],
            [-119, 15],
            [-62, 24],
            [3, 23],
            [106, 28],
            [101, 29],
            [11, 21],
            [-75, 22],
            [24, 23],
            [97, 41],
            [40, 7],
            [-12, 26],
            [66, 16],
            [86, 9],
            [85, 1],
            [30, -19],
            [74, 33],
            [66, -22],
            [39, -5],
            [58, -19],
            [-66, 32],
            [4, 25]
        ],
        [
            [2497, 5869],
            [-14, 10],
            [-17, 1],
            [-13, 12],
            [-15, 24]
        ],
        [
            [2438, 5916],
            [1, 18],
            [3, 13],
            [-4, 12],
            [13, 48],
            [36, 0],
            [1, 20],
            [-5, 4],
            [-3, 12],
            [-10, 14],
            [-11, 20],
            [13, 0],
            [0, 33],
            [26, 0],
            [26, 0]
        ],
        [
            [2529, 5996],
            [10, -11],
            [2, 9],
            [8, -7]
        ],
        [
            [2549, 5987],
            [-13, -23],
            [-13, -16],
            [-2, -12],
            [2, -11],
            [-5, -15]
        ],
        [
            [2518, 5910],
            [-7, -4],
            [2, -7],
            [-6, -6],
            [-9, -15],
            [-1, -9]
        ],
        [
            [3340, 5552],
            [18, -22],
            [17, -38],
            [1, -31],
            [10, -1],
            [15, -29],
            [11, -21]
        ],
        [
            [3412, 5410],
            [-4, -53],
            [-17, -15],
            [1, -14],
            [-5, -31],
            [13, -42],
            [9, -1],
            [3, -33],
            [17, -51]
        ],
        [
            [3313, 5365],
            [-19, 45],
            [7, 16],
            [0, 27],
            [17, 10],
            [7, 11],
            [-10, 22],
            [3, 21],
            [22, 35]
        ],
        [
            [2574, 5825],
            [-5, 18],
            [-8, 5]
        ],
        [
            [2561, 5848],
            [2, 24],
            [-4, 6],
            [-6, 4],
            [-12, -7],
            [-1, 8],
            [-8, 10],
            [-6, 12],
            [-8, 5]
        ],
        [
            [2549, 5987],
            [3, -3],
            [6, 11],
            [8, 1],
            [3, -5],
            [4, 3],
            [13, -6],
            [13, 2],
            [9, 6],
            [3, 7],
            [9, -3],
            [6, -4],
            [8, 1],
            [5, 5],
            [13, -8],
            [4, -1],
            [9, -11],
            [8, -13],
            [10, -9],
            [7, -17]
        ],
        [
            [2690, 5943],
            [-9, 2],
            [-4, -8],
            [-10, -8],
            [-7, 0],
            [-6, -8],
            [-6, 3],
            [-4, 9],
            [-3, -2],
            [-4, -14],
            [-3, 1],
            [0, -12],
            [-10, -17],
            [-5, -7],
            [-3, -7],
            [-8, 12],
            [-6, -16],
            [-6, 1],
            [-6, -2],
            [0, -29],
            [-4, 0],
            [-3, -14],
            [-9, -2]
        ],
        [
            [5522, 7770],
            [7, -23],
            [9, -17],
            [-11, -22]
        ],
        [
            [5515, 7577],
            [-3, -10]
        ],
        [
            [5512, 7567],
            [-26, 22],
            [-16, 21],
            [-26, 18],
            [-23, 43],
            [6, 5],
            [-13, 25],
            [-1, 19],
            [-17, 10],
            [-9, -26],
            [-8, 20],
            [0, 21],
            [1, 1]
        ],
        [
            [5380, 7746],
            [20, -2],
            [5, 9],
            [9, -9],
            [11, -1],
            [0, 16],
            [10, 6],
            [2, 24],
            [23, 16]
        ],
        [
            [5460, 7805],
            [8, -7],
            [21, -26],
            [23, -11],
            [10, 9]
        ],
        [
            [3008, 6124],
            [-19, 10],
            [-13, -5],
            [-17, 5],
            [-13, -11],
            [-15, 18],
            [3, 19],
            [25, -8],
            [21, -5],
            [10, 13],
            [-12, 26],
            [0, 23],
            [-18, 9],
            [7, 16],
            [17, -3],
            [24, -9]
        ],
        [
            [5471, 7900],
            [14, -15],
            [10, -6],
            [24, 7],
            [2, 12],
            [11, 2],
            [14, 9],
            [3, -4],
            [13, 8],
            [6, 13],
            [9, 4],
            [30, -18],
            [6, 6]
        ],
        [
            [5613, 7918],
            [15, -16],
            [2, -16]
        ],
        [
            [5630, 7886],
            [-17, -12],
            [-13, -40],
            [-17, -40],
            [-22, -11]
        ],
        [
            [5561, 7783],
            [-17, 2],
            [-22, -15]
        ],
        [
            [5460, 7805],
            [-6, 20],
            [-4, 0]
        ],
        [
            [8352, 4453],
            [-11, -2],
            [-37, 42],
            [26, 11],
            [14, -18],
            [10, -17],
            [-2, -16]
        ],
        [
            [8471, 4532],
            [2, -11],
            [1, -18]
        ],
        [
            [8474, 4503],
            [-18, -45],
            [-24, -13],
            [-3, 8],
            [2, 20],
            [12, 36],
            [28, 23]
        ],
        [
            [8274, 4579],
            [10, -16],
            [17, 5],
            [7, -25],
            [-32, -12],
            [-19, -8],
            [-15, 1],
            [10, 34],
            [15, 0],
            [7, 21]
        ],
        [
            [8413, 4579],
            [-4, -32],
            [-42, -17],
            [-37, 7],
            [0, 22],
            [22, 12],
            [18, -18],
            [18, 5],
            [25, 21]
        ],
        [
            [8017, 4657],
            [53, -6],
            [6, 25],
            [51, -29],
            [10, -38],
            [42, -11],
            [34, -35],
            [-31, -23],
            [-31, 24],
            [-25, -1],
            [-29, 4],
            [-26, 11],
            [-32, 22],
            [-21, 6],
            [-11, -7],
            [-51, 24],
            [-5, 25],
            [-25, 5],
            [19, 56],
            [34, -3],
            [22, -23],
            [12, -5],
            [4, -21]
        ],
        [
            [8741, 4690],
            [-14, -40],
            [-3, 45],
            [5, 21],
            [6, 20],
            [7, -17],
            [-1, -29]
        ],
        [
            [8534, 4853],
            [-11, -19],
            [-19, 10],
            [-5, 26],
            [28, 3],
            [7, -20]
        ],
        [
            [8623, 4875],
            [10, -45],
            [-23, 24],
            [-23, 5],
            [-16, -4],
            [-19, 2],
            [6, 33],
            [35, 2],
            [30, -17]
        ],
        [
            [8916, 4904],
            [0, -193],
            [1, -192]
        ],
        [
            [8917, 4519],
            [-25, 48],
            [-28, 12],
            [-7, -17],
            [-35, -1],
            [12, 48],
            [17, 16],
            [-7, 64],
            [-14, 50],
            [-53, 50],
            [-23, 5],
            [-42, 54],
            [-8, -28],
            [-11, -5],
            [-6, 21],
            [0, 26],
            [-21, 29],
            [29, 21],
            [20, -1],
            [-2, 16],
            [-41, 0],
            [-11, 35],
            [-25, 11],
            [-11, 29],
            [37, 14],
            [14, 20],
            [45, -25],
            [4, -22],
            [8, -95],
            [29, -35],
            [23, 62],
            [32, 36],
            [25, 0],
            [23, -21],
            [21, -21],
            [30, -11]
        ],
        [
            [8478, 5141],
            [-22, -58],
            [-21, -12],
            [-27, 12],
            [-46, -3],
            [-24, -8],
            [-4, -45],
            [24, -53],
            [15, 27],
            [52, 20],
            [-2, -27],
            [-12, 9],
            [-12, -35],
            [-25, -23],
            [27, -76],
            [-5, -20],
            [25, -68],
            [-1, -39],
            [-14, -17],
            [-11, 20],
            [13, 49],
            [-27, -23],
            [-7, 16],
            [3, 23],
            [-20, 35],
            [3, 57],
            [-19, -18],
            [2, -69],
            [1, -84],
            [-17, -9],
            [-12, 18],
            [8, 54],
            [-4, 57],
            [-12, 1],
            [-9, 40],
            [12, 39],
            [4, 47],
            [14, 89],
            [5, 24],
            [24, 44],
            [22, -18],
            [35, -8],
            [32, 3],
            [27, 43],
            [5, -14]
        ],
        [
            [8574, 5124],
            [-2, -51],
            [-14, 6],
            [-4, -36],
            [11, -32],
            [-8, -7],
            [-11, 38],
            [-8, 75],
            [6, 47],
            [9, 22],
            [2, -32],
            [16, -5],
            [3, -25]
        ],
        [
            [8045, 5176],
            [5, -39],
            [19, -34],
            [18, 12],
            [18, -4],
            [16, 30],
            [13, 5],
            [26, -17],
            [23, 13],
            [14, 82],
            [11, 21],
            [10, 67],
            [32, 0],
            [24, -10]
        ],
        [
            [8274, 5302],
            [-16, -53],
            [20, -56],
            [-5, -28],
            [32, -54],
            [-33, -7],
            [-10, -40],
            [2, -54],
            [-27, -40],
            [-1, -59],
            [-10, -91],
            [-5, 21],
            [-31, -26],
            [-11, 36],
            [-20, 3],
            [-14, 19],
            [-33, -21],
            [-10, 29],
            [-18, -4],
            [-23, 7],
            [-4, 79],
            [-14, 17],
            [-13, 50],
            [-4, 52],
            [3, 55],
            [16, 39]
        ],
        [
            [7939, 4712],
            [-31, -1],
            [-24, 49],
            [-35, 48],
            [-12, 36],
            [-21, 48],
            [-14, 44],
            [-21, 83],
            [-24, 49],
            [-9, 51],
            [-10, 46],
            [-25, 37],
            [-14, 51],
            [-21, 33],
            [-29, 65],
            [-3, 30],
            [18, -2],
            [43, -12],
            [25, -57],
            [21, -40],
            [16, -25],
            [26, -63],
            [28, -1],
            [23, -41],
            [16, -49],
            [22, -27],
            [-12, -49],
            [16, -20],
            [10, -2],
            [5, -41],
            [10, -33],
            [20, -5],
            [14, -37],
            [-7, -74],
            [-1, -91]
        ],
        [
            [7252, 6841],
            [-17, -27],
            [-11, -55],
            [27, -23],
            [26, -29],
            [36, -33],
            [38, -8],
            [16, -30],
            [22, -5],
            [33, -14],
            [23, 1],
            [4, 23],
            [-4, 38],
            [2, 25]
        ],
        [
            [7703, 6727],
            [2, -22],
            [-10, -11],
            [2, -36],
            [-19, 10],
            [-36, -41],
            [0, -33],
            [-15, -50],
            [-1, -29],
            [-13, -48],
            [-21, 13],
            [-1, -61],
            [-7, -20],
            [3, -25],
            [-14, -14]
        ],
        [
            [7472, 6360],
            [-4, -21],
            [-19, 1],
            [-34, -13],
            [2, -44],
            [-15, -35],
            [-40, -40],
            [-31, -69],
            [-21, -38],
            [-28, -38],
            [0, -27],
            [-13, -15],
            [-26, -21],
            [-12, -3],
            [-9, -45],
            [6, -77],
            [1, -49],
            [-11, -56],
            [0, -101],
            [-15, -2],
            [-12, -46],
            [8, -19],
            [-25, -17],
            [-10, -40],
            [-11, -17],
            [-26, 55],
            [-13, 83],
            [-11, 60],
            [-9, 28],
            [-15, 56],
            [-7, 74],
            [-5, 37],
            [-25, 81],
            [-12, 115],
            [-8, 75],
            [0, 72],
            [-5, 55],
            [-41, -35],
            [-19, 7],
            [-36, 71],
            [13, 22],
            [-8, 23],
            [-33, 50]
        ],
        [
            [6893, 6457],
            [19, 40],
            [61, -1],
            [-6, 51],
            [-15, 30],
            [-4, 46],
            [-18, 26],
            [31, 62],
            [32, -4],
            [29, 61],
            [18, 60],
            [27, 60],
            [-1, 42],
            [24, 34],
            [-23, 29],
            [-9, 40],
            [-10, 52],
            [14, 25],
            [42, -14],
            [31, 9],
            [26, 49]
        ],
        [
            [4827, 8240],
            [5, -42],
            [-21, -53],
            [-49, -35],
            [-40, 9],
            [23, 62],
            [-15, 60],
            [38, 46],
            [21, 28]
        ],
        [
            [6497, 7255],
            [25, 12],
            [19, 33],
            [19, -1],
            [12, 11],
            [20, -6],
            [31, -30],
            [22, -6],
            [31, -53],
            [21, -2],
            [3, -49]
        ],
        [
            [6690, 6820],
            [14, -31],
            [11, -36],
            [27, -26],
            [1, -52],
            [13, -10],
            [2, -27],
            [-40, -30],
            [-10, -69]
        ],
        [
            [6708, 6539],
            [-53, 18],
            [-30, 13],
            [-31, 8],
            [-12, 73],
            [-13, 10],
            [-22, -11],
            [-28, -28],
            [-34, 20],
            [-28, 45],
            [-27, 17],
            [-18, 56],
            [-21, 79],
            [-15, -10],
            [-17, 20],
            [-11, -24]
        ],
        [
            [6348, 6825],
            [-15, 32],
            [0, 31],
            [-9, 0],
            [5, 43],
            [-15, 45],
            [-34, 32],
            [-19, 56],
            [6, 46],
            [14, 21],
            [-2, 34],
            [-18, 18],
            [-18, 70]
        ],
        [
            [6243, 7253],
            [-15, 48],
            [5, 18],
            [-8, 68],
            [19, 17]
        ],
        [
            [6357, 7321],
            [9, -43],
            [26, -13],
            [20, -29],
            [39, -10],
            [44, 15],
            [2, 14]
        ],
        [
            [6348, 6825],
            [-16, 3]
        ],
        [
            [6332, 6828],
            [-19, 5],
            [-20, -56]
        ],
        [
            [6293, 6777],
            [-52, 4],
            [-78, 119],
            [-41, 41],
            [-34, 16]
        ],
        [
            [6088, 6957],
            [-11, 72]
        ],
        [
            [6077, 7029],
            [61, 62],
            [11, 71],
            [-3, 43],
            [16, 15],
            [14, 37]
        ],
        [
            [6176, 7257],
            [12, 9],
            [32, -8],
            [10, -15],
            [13, 10]
        ],
        [
            [4597, 8984],
            [-7, -39],
            [31, -40],
            [-36, -45],
            [-80, -41],
            [-24, -10],
            [-36, 8],
            [-78, 19],
            [28, 26],
            [-61, 29],
            [49, 12],
            [-1, 17],
            [-58, 14],
            [19, 38],
            [42, 9],
            [43, -40],
            [42, 32],
            [35, -17],
            [45, 32],
            [47, -4]
        ],
        [
            [5992, 6990],
            [-5, -19]
        ],
        [
            [5987, 6971],
            [-10, 8],
            [-6, -39],
            [7, -7],
            [-7, -8],
            [-1, -15],
            [13, 8]
        ],
        [
            [5983, 6918],
            [0, -23],
            [-14, -95]
        ],
        [
            [5951, 6902],
            [8, 19],
            [-2, 4],
            [8, 27],
            [5, 45],
            [4, 15],
            [1, 0]
        ],
        [
            [5975, 7012],
            [9, 0],
            [3, 11],
            [7, 0]
        ],
        [
            [5994, 7023],
            [1, -24],
            [-4, -9],
            [1, 0]
        ],
        [
            [5431, 7316],
            [-10, -46],
            [4, -19],
            [-6, -30],
            [-21, 22],
            [-14, 7],
            [-39, 30],
            [4, 30],
            [32, -6],
            [28, 7],
            [22, 5]
        ],
        [
            [5255, 7492],
            [17, -42],
            [-4, -78],
            [-13, 4],
            [-11, -20],
            [-10, 16],
            [-2, 71],
            [-6, 34],
            [15, -3],
            [14, 18]
        ],
        [
            [5383, 7805],
            [-3, -29],
            [7, -25]
        ],
        [
            [5387, 7751],
            [-22, 8],
            [-23, -20],
            [1, -30],
            [-3, -17],
            [9, -30],
            [26, -29],
            [14, -49],
            [31, -48],
            [22, 0],
            [7, -13],
            [-8, -11],
            [25, -22],
            [20, -18],
            [24, -30],
            [3, -11],
            [-5, -22],
            [-16, 28],
            [-24, 10],
            [-12, -39],
            [20, -21],
            [-3, -31],
            [-11, -4],
            [-15, -50],
            [-12, -5],
            [0, 18],
            [6, 32],
            [6, 12],
            [-11, 35],
            [-8, 29],
            [-12, 8],
            [-8, 25],
            [-18, 11],
            [-12, 24],
            [-21, 4],
            [-21, 26],
            [-26, 39],
            [-19, 34],
            [-8, 58],
            [-14, 7],
            [-23, 20],
            [-12, -8],
            [-16, -28],
            [-12, -4]
        ],
        [
            [2845, 6150],
            [19, -5],
            [14, -15],
            [5, -16],
            [-19, -1],
            [-9, -10],
            [-15, 10],
            [-16, 21],
            [3, 14],
            [12, 4],
            [6, -2]
        ],
        [
            [5992, 6990],
            [31, -24],
            [54, 63]
        ],
        [
            [6088, 6957],
            [-5, -8],
            [-56, -30],
            [28, -59],
            [-9, -10],
            [-5, -20],
            [-21, -8],
            [-7, -21],
            [-12, -19],
            [-31, 10]
        ],
        [
            [5970, 6792],
            [-1, 8]
        ],
        [
            [5983, 6918],
            [4, 17],
            [0, 36]
        ],
        [
            [8739, 7075],
            [4, -20],
            [-16, -36],
            [-11, 19],
            [-15, -14],
            [-7, -34],
            [-18, 16],
            [0, 28],
            [15, 36],
            [16, -7],
            [12, 25],
            [20, -13]
        ],
        [
            [8915, 7252],
            [-10, -47],
            [4, -30],
            [-14, -42],
            [-35, -27],
            [-49, -4],
            [-40, -67],
            [-19, 22],
            [-1, 44],
            [-48, -13],
            [-33, -27],
            [-32, -2],
            [28, -43],
            [-19, -101],
            [-18, -24],
            [-13, 23],
            [7, 53],
            [-18, 17],
            [-11, 41],
            [26, 18],
            [15, 37],
            [28, 30],
            [20, 41],
            [55, 17],
            [30, -12],
            [29, 105],
            [19, -28],
            [40, 59],
            [16, 23],
            [18, 72],
            [-5, 67],
            [11, 37],
            [30, 11],
            [15, -82],
            [-1, -48],
            [-25, -59],
            [0, -61]
        ],
        [
            [8997, 7667],
            [19, -12],
            [20, 25],
            [6, -67],
            [-41, -16],
            [-25, -59],
            [-43, 41],
            [-15, -65],
            [-31, -1],
            [-4, 59],
            [14, 46],
            [29, 3],
            [8, 82],
            [9, 46],
            [32, -62],
            [22, -20]
        ],
        [
            [6970, 7554],
            [-15, -10],
            [-37, -42],
            [-12, -42],
            [-11, 0],
            [-7, 28],
            [-36, 2],
            [-5, 48],
            [-14, 0],
            [2, 60],
            [-33, 43],
            [-48, -5],
            [-32, -8],
            [-27, 53],
            [-22, 22],
            [-43, 43],
            [-6, 5],
            [-71, -35],
            [1, -218]
        ],
        [
            [6554, 7498],
            [-14, -3],
            [-20, 46],
            [-18, 17],
            [-32, -12],
            [-12, -20]
        ],
        [
            [6458, 7526],
            [-2, 14],
            [7, 25],
            [-5, 21],
            [-32, 20],
            [-13, 53],
            [-15, 15],
            [-1, 19],
            [27, -6],
            [1, 44],
            [23, 9],
            [25, -9],
            [5, 58],
            [-5, 36],
            [-28, -2],
            [-24, 14],
            [-32, -26],
            [-26, -12]
        ],
        [
            [6363, 7799],
            [-14, 9],
            [3, 31],
            [-18, 39],
            [-20, -2],
            [-24, 40],
            [16, 45],
            [-8, 12],
            [22, 65],
            [29, -34],
            [3, 43],
            [58, 64],
            [43, 2],
            [61, -41],
            [33, -24],
            [30, 25],
            [44, 1],
            [35, -30],
            [8, 17],
            [39, -2],
            [7, 28],
            [-45, 40],
            [27, 29],
            [-5, 16],
            [26, 15],
            [-20, 41],
            [13, 20],
            [104, 21],
            [13, 14],
            [70, 22],
            [25, 24],
            [50, -12],
            [9, -61],
            [29, 14],
            [35, -20],
            [-2, -32],
            [27, 3],
            [69, 56],
            [-10, -19],
            [35, -46],
            [62, -150],
            [15, 31],
            [39, -34],
            [39, 16],
            [16, -11],
            [13, -34],
            [20, -12],
            [11, -25],
            [36, 8],
            [15, -36]
        ],
        [
            [7229, 7559],
            [-17, 9],
            [-14, 21],
            [-42, 6],
            [-46, 2],
            [-10, -6],
            [-39, 24],
            [-16, -12],
            [-4, -35],
            [-46, 21],
            [-18, -9],
            [-7, -26]
        ],
        [
            [6155, 4958],
            [-20, -24],
            [-7, -24],
            [-10, -4],
            [-4, -42],
            [-9, -24],
            [-5, -39],
            [-12, -20]
        ],
        [
            [6088, 4781],
            [-40, 59],
            [-1, 35],
            [-101, 120],
            [-5, 6]
        ],
        [
            [5941, 5001],
            [0, 63],
            [8, 24],
            [14, 39],
            [10, 43],
            [-13, 68],
            [-3, 30],
            [-13, 41]
        ],
        [
            [5944, 5309],
            [17, 35],
            [19, 39]
        ],
        [
            [6162, 5289],
            [-24, -67],
            [0, -215],
            [17, -49]
        ],
        [
            [7046, 7387],
            [-53, -9],
            [-34, 19],
            [-30, -4],
            [3, 34],
            [30, -10],
            [10, 18]
        ],
        [
            [6972, 7435],
            [21, -6],
            [36, 43],
            [-33, 31],
            [-20, -15],
            [-21, 22],
            [24, 39],
            [-9, 5]
        ],
        [
            [7849, 5777],
            [-7, 72],
            [18, 49],
            [36, 11],
            [26, -8]
        ],
        [
            [7922, 5901],
            [23, -23],
            [12, 40],
            [25, -21]
        ],
        [
            [7982, 5897],
            [6, -40],
            [-3, -71],
            [-47, -45],
            [13, -36],
            [-30, -4],
            [-24, -24]
        ],
        [
            [7897, 5677],
            [-23, 9],
            [-11, 30],
            [-14, 61]
        ],
        [
            [8564, 7339],
            [24, -70],
            [7, -38],
            [0, -68],
            [-10, -33],
            [-25, -11],
            [-22, -25],
            [-25, -5],
            [-3, 32],
            [5, 45],
            [-13, 61],
            [21, 10],
            [-19, 51]
        ],
        [
            [8504, 7288],
            [2, 5],
            [12, -2],
            [11, 27],
            [20, 2],
            [11, 4],
            [4, 15]
        ],
        [
            [5557, 7574],
            [5, 13]
        ],
        [
            [5562, 7587],
            [7, 4],
            [4, 20],
            [5, 3],
            [4, -8],
            [5, -4],
            [3, -10],
            [5, -2],
            [5, -11],
            [4, 0],
            [-3, -14],
            [-3, -7],
            [1, -5]
        ],
        [
            [5599, 7553],
            [-6, -2],
            [-17, -9],
            [-1, -12],
            [-4, 0]
        ],
        [
            [6332, 6828],
            [6, -26],
            [-3, -13],
            [9, -45]
        ],
        [
            [6344, 6744],
            [-19, -1],
            [-7, 28],
            [-25, 6]
        ],
        [
            [7922, 5901],
            [9, 26],
            [1, 50],
            [-22, 52],
            [-2, 58],
            [-21, 48],
            [-21, 4],
            [-6, -20],
            [-16, -2],
            [-8, 10],
            [-30, -35],
            [0, 53],
            [7, 62],
            [-19, 3],
            [-2, 36],
            [-12, 18]
        ],
        [
            [7780, 6264],
            [6, 21],
            [24, 39]
        ],
        [
            [7837, 6385],
            [17, -47],
            [12, -54],
            [34, 0],
            [11, -52],
            [-18, -15],
            [-8, -21],
            [34, -36],
            [23, -70],
            [17, -52],
            [21, -41],
            [7, -41],
            [-5, -59]
        ],
        [
            [5975, 7012],
            [10, 49],
            [14, 41],
            [0, 2]
        ],
        [
            [5999, 7104],
            [13, -3],
            [4, -23],
            [-15, -22],
            [-7, -33]
        ],
        [
            [4785, 5315],
            [-7, 0],
            [-29, 28],
            [-25, 45],
            [-24, 32],
            [-18, 38]
        ],
        [
            [4682, 5458],
            [6, 19],
            [2, 17],
            [12, 33],
            [13, 27]
        ],
        [
            [5412, 6408],
            [-20, -22],
            [-15, 33],
            [-44, 25]
        ],
        [
            [5263, 6848],
            [13, 14],
            [3, 25],
            [-3, 24],
            [19, 23],
            [8, 19],
            [14, 17],
            [2, 45]
        ],
        [
            [5319, 7015],
            [32, -20],
            [12, 5],
            [23, -10],
            [37, -26],
            [13, -53],
            [25, -11],
            [39, -25],
            [30, -29],
            [13, 15],
            [13, 27],
            [-6, 45],
            [9, 29],
            [20, 28],
            [19, 8],
            [37, -12],
            [10, -27],
            [10, 0],
            [9, -10],
            [28, -7],
            [6, -19]
        ],
        [
            [5694, 6357],
            [0, -118],
            [-32, 0],
            [0, -25]
        ],
        [
            [5662, 6214],
            [-111, 113],
            [-111, 113],
            [-28, -32]
        ],
        [
            [7271, 5502],
            [-4, -62],
            [-12, -16],
            [-24, -14],
            [-13, 47],
            [-5, 85],
            [13, 96],
            [19, -33],
            [13, -42],
            [13, -61]
        ],
        [
            [5804, 3347],
            [10, -18],
            [-9, -29],
            [-4, -19],
            [-16, -9],
            [-5, -19],
            [-10, -6],
            [-21, 46],
            [15, 37],
            [15, 23],
            [13, 12],
            [12, -18]
        ],
        [
            [5631, 8267],
            [-2, 15],
            [3, 16],
            [-13, 10],
            [-29, 10]
        ],
        [
            [5590, 8318],
            [-6, 50]
        ],
        [
            [5584, 8368],
            [32, 18],
            [47, -4],
            [27, 6],
            [4, -12],
            [15, -4],
            [26, -29]
        ],
        [
            [5652, 8242],
            [-7, 19],
            [-14, 6]
        ],
        [
            [5584, 8368],
            [1, 44],
            [14, 37],
            [26, 20],
            [22, -44],
            [22, 1],
            [6, 46]
        ],
        [
            [5757, 8453],
            [14, -14],
            [2, -28],
            [9, -35]
        ],
        [
            [4759, 6691],
            [-4, 0],
            [0, -31],
            [-17, -2],
            [-9, -14],
            [-13, 0],
            [-10, 8],
            [-23, -6],
            [-9, -46],
            [-9, -5],
            [-13, -74],
            [-38, -64],
            [-9, -81],
            [-12, -27],
            [-3, -21],
            [-63, -5]
        ],
        [
            [4527, 6323],
            [1, 27],
            [11, 17],
            [9, 30],
            [-2, 20],
            [10, 42],
            [15, 38],
            [9, 9],
            [8, 35],
            [0, 31],
            [10, 37],
            [19, 21],
            [18, 60],
            [0, 1],
            [14, 23],
            [26, 6],
            [22, 41],
            [14, 16],
            [23, 49],
            [-7, 73],
            [10, 51],
            [4, 31],
            [18, 40],
            [28, 27],
            [21, 25],
            [18, 61],
            [9, 36],
            [20, 0],
            [17, -25],
            [26, 4],
            [29, -13],
            [12, -1]
        ],
        [
            [5739, 7906],
            [6, 9],
            [19, 6],
            [20, -19],
            [12, -2],
            [12, -16],
            [-2, -20],
            [11, -9],
            [4, -25],
            [9, -15],
            [-2, -9],
            [5, -6],
            [-7, -4],
            [-16, 1],
            [-3, 9],
            [-6, -5],
            [2, -11],
            [-7, -19],
            [-5, -20],
            [-7, -6]
        ],
        [
            [5784, 7745],
            [-5, 27],
            [3, 25],
            [-1, 26],
            [-16, 35],
            [-9, 25],
            [-9, 17],
            [-8, 6]
        ],
        [
            [6376, 4321],
            [7, -25],
            [7, -39],
            [4, -71],
            [7, -28],
            [-2, -28],
            [-5, -18],
            [-10, 35],
            [-5, -18],
            [5, -43],
            [-2, -25],
            [-8, -14],
            [-1, -50],
            [-11, -69],
            [-14, -81],
            [-17, -112],
            [-11, -82],
            [-12, -69],
            [-23, -14],
            [-24, -25],
            [-16, 15],
            [-22, 21],
            [-8, 31],
            [-2, 53],
            [-10, 47],
            [-2, 42],
            [5, 43],
            [13, 10],
            [0, 20],
            [13, 45],
            [2, 37],
            [-6, 28],
            [-5, 38],
            [-2, 54],
            [9, 33],
            [4, 38],
            [14, 2],
            [15, 12],
            [11, 10],
            [12, 1],
            [16, 34],
            [23, 36],
            [8, 30],
            [-4, 25],
            [12, -7],
            [15, 41],
            [1, 36],
            [9, 26],
            [10, -25]
        ],
        [
            [2301, 6586],
            [-10, -52],
            [-5, -43],
            [-2, -79],
            [-3, -29],
            [5, -32],
            [9, -29],
            [5, -45],
            [19, -44],
            [6, -34],
            [11, -29],
            [29, -16],
            [12, -25],
            [24, 17],
            [21, 6],
            [21, 11],
            [18, 10],
            [17, 24],
            [7, 34],
            [2, 50],
            [5, 17],
            [19, 16],
            [29, 13],
            [25, -2],
            [17, 5],
            [6, -12],
            [-1, -29],
            [-15, -35],
            [-6, -36],
            [5, -10],
            [-4, -26],
            [-7, -46],
            [-7, 15],
            [-6, -1]
        ],
        [
            [2438, 5916],
            [-32, 64],
            [-14, 19],
            [-23, 16],
            [-15, -5],
            [-22, -22],
            [-14, -6],
            [-20, 16],
            [-21, 11],
            [-26, 27],
            [-21, 8],
            [-31, 28],
            [-23, 28],
            [-7, 16],
            [-16, 3],
            [-28, 19],
            [-12, 27],
            [-30, 34],
            [-14, 37],
            [-6, 29],
            [9, 5],
            [-3, 17],
            [7, 16],
            [0, 20],
            [-10, 27],
            [-2, 23],
            [-9, 30],
            [-25, 59],
            [-28, 46],
            [-13, 37],
            [-24, 24],
            [-5, 14],
            [4, 37],
            [-14, 13],
            [-17, 29],
            [-7, 41],
            [-14, 5],
            [-17, 31],
            [-13, 29],
            [-1, 19],
            [-15, 44],
            [-10, 45],
            [1, 23],
            [-20, 23],
            [-10, -2],
            [-15, 16],
            [-5, -24],
            [5, -28],
            [2, -45],
            [10, -24],
            [21, -41],
            [4, -14],
            [4, -4],
            [4, -20],
            [5, 1],
            [6, -38],
            [8, -15],
            [6, -21],
            [17, -30],
            [10, -55],
            [8, -26],
            [8, -28],
            [1, -31],
            [13, -2],
            [12, -27],
            [10, -26],
            [-1, -11],
            [-12, -21],
            [-5, 0],
            [-7, 36],
            [-18, 33],
            [-20, 29],
            [-14, 15],
            [1, 43],
            [-5, 32],
            [-13, 19],
            [-19, 26],
            [-4, -8],
            [-7, 16],
            [-17, 14],
            [-16, 34],
            [2, 5],
            [11, -4],
            [11, 22],
            [1, 27],
            [-22, 42],
            [-16, 17],
            [-10, 36],
            [-11, 39],
            [-12, 47],
            [-12, 54]
        ],
        [
            [1746, 6980],
            [32, 4],
            [35, 7],
            [-2, -12],
            [41, -29],
            [64, -41],
            [55, 0],
            [22, 0],
            [0, 24],
            [48, 0],
            [10, -20],
            [15, -19],
            [16, -26],
            [9, -31],
            [7, -32],
            [15, -18],
            [23, -18],
            [17, 47],
            [23, 1],
            [19, -24],
            [14, -40],
            [10, -35],
            [16, -34],
            [6, -41],
            [8, -28],
            [22, -18],
            [20, -13],
            [10, 2]
        ],
        [
            [5599, 7553],
            [9, 4],
            [13, 1]
        ],
        [
            [4661, 5921],
            [10, 11],
            [4, 35],
            [9, 1],
            [20, -16],
            [15, 11],
            [11, -4],
            [4, 13],
            [112, 1],
            [6, 42],
            [-5, 7],
            [-13, 255],
            [-14, 255],
            [43, 1]
        ],
        [
            [5118, 6189],
            [0, -136],
            [-15, -39],
            [-2, -37],
            [-25, -9],
            [-38, -5],
            [-10, -21],
            [-18, -3]
        ],
        [
            [4680, 5793],
            [1, 18],
            [-2, 23],
            [-11, 16],
            [-5, 34],
            [-2, 37]
        ],
        [
            [7737, 5644],
            [-3, 44],
            [9, 45],
            [-10, 35],
            [3, 65],
            [-12, 30],
            [-9, 71],
            [-5, 75],
            [-12, 49],
            [-18, -30],
            [-32, -42],
            [-15, 5],
            [-17, 14],
            [9, 73],
            [-6, 56],
            [-21, 68],
            [3, 21],
            [-16, 7],
            [-20, 49]
        ],
        [
            [7780, 6264],
            [-16, -14],
            [-16, -26],
            [-20, -2],
            [-12, -64],
            [-12, -11],
            [14, -52],
            [17, -43],
            [12, -39],
            [-11, -51],
            [-9, -11],
            [6, -30],
            [19, -47],
            [3, -33],
            [0, -27],
            [11, -54],
            [-16, -55],
            [-13, -61]
        ],
        [
            [5538, 7532],
            [-6, 4],
            [-8, 19],
            [-12, 12]
        ],
        [
            [5533, 7629],
            [8, -10],
            [4, -9],
            [9, -6],
            [10, -12],
            [-2, -5]
        ],
        [
            [7437, 7970],
            [29, 10],
            [53, 51],
            [42, 28],
            [24, -18],
            [29, -1],
            [19, -28],
            [28, -2],
            [40, -15],
            [27, 41],
            [-11, 35],
            [28, 61],
            [31, -24],
            [26, -7],
            [32, -15],
            [6, -44],
            [39, -25],
            [26, 11],
            [36, 7],
            [27, -7],
            [28, -29],
            [16, -30],
            [26, 1],
            [35, -10],
            [26, 15],
            [36, 9],
            [41, 42],
            [17, -6],
            [14, -20],
            [33, 5]
        ],
        [
            [5959, 4377],
            [21, 5],
            [34, -17],
            [7, 8],
            [19, 1],
            [10, 18],
            [17, -1],
            [30, 23],
            [22, 34]
        ],
        [
            [6119, 4448],
            [5, -26],
            [-1, -59],
            [3, -52],
            [1, -92],
            [5, -29],
            [-8, -43],
            [-11, -41],
            [-18, -36],
            [-25, -23],
            [-31, -28],
            [-32, -64],
            [-10, -11],
            [-20, -42],
            [-11, -13],
            [-3, -42],
            [14, -45],
            [5, -35],
            [0, -17],
            [5, 3],
            [-1, -58],
            [-4, -28],
            [6, -10],
            [-4, -25],
            [-11, -21],
            [-23, -20],
            [-34, -32],
            [-12, -21],
            [3, -25],
            [7, -4],
            [-3, -31]
        ],
        [
            [5911, 3478],
            [-21, 0]
        ],
        [
            [5890, 3478],
            [-2, 26],
            [-4, 27]
        ],
        [
            [5884, 3531],
            [-3, 21],
            [5, 66],
            [-7, 42],
            [-13, 83]
        ],
        [
            [5866, 3743],
            [29, 67],
            [7, 43],
            [5, 5],
            [3, 35],
            [-5, 17],
            [1, 44],
            [6, 41],
            [0, 75],
            [-15, 19],
            [-13, 4],
            [-6, 15],
            [-13, 12],
            [-23, -1],
            [-2, 22]
        ],
        [
            [5840, 4141],
            [-2, 42],
            [84, 49]
        ],
        [
            [5922, 4232],
            [16, -28],
            [8, 5],
            [11, -15],
            [1, -23],
            [-6, -28],
            [2, -42],
            [19, -36],
            [8, 41],
            [12, 12],
            [-2, 76],
            [-12, 43],
            [-10, 19],
            [-10, -1],
            [-7, 77],
            [7, 45]
        ],
        [
            [4661, 5921],
            [-18, 41],
            [-17, 43],
            [-18, 16],
            [-13, 17],
            [-16, -1],
            [-13, -12],
            [-14, 5],
            [-10, -19]
        ],
        [
            [4542, 6011],
            [-2, 32],
            [8, 29],
            [3, 55],
            [-3, 59],
            [-3, 29],
            [2, 30],
            [-7, 28],
            [-14, 25]
        ],
        [
            [4526, 6298],
            [6, 20],
            [108, -1],
            [-5, 86],
            [7, 30],
            [26, 5],
            [-1, 152],
            [91, -4],
            [0, 90]
        ],
        [
            [5922, 4232],
            [-15, 15],
            [9, 55],
            [9, 21],
            [-6, 49],
            [6, 48],
            [5, 16],
            [-7, 50],
            [-14, 26]
        ],
        [
            [5909, 4512],
            [28, -11],
            [5, -16],
            [10, -28],
            [7, -80]
        ],
        [
            [7836, 5425],
            [7, -5],
            [16, -36],
            [12, -40],
            [2, -39],
            [-3, -27],
            [2, -21],
            [2, -35],
            [10, -16],
            [11, -52],
            [-1, -20],
            [-19, -4],
            [-27, 44],
            [-32, 47],
            [-4, 30],
            [-16, 39],
            [-4, 49],
            [-10, 32],
            [4, 43],
            [-7, 25]
        ],
        [
            [7779, 5439],
            [5, 11],
            [23, -26],
            [2, -30],
            [18, 7],
            [9, 24]
        ],
        [
            [8045, 5176],
            [21, -20],
            [21, 11],
            [6, 50],
            [12, 11],
            [33, 13],
            [20, 47],
            [14, 37]
        ],
        [
            [8206, 5379],
            [22, 41],
            [14, 47],
            [11, 0],
            [14, -30],
            [1, -26],
            [19, -16],
            [23, -18],
            [-2, -23],
            [-19, -3],
            [5, -29],
            [-20, -20]
        ],
        [
            [5453, 3369],
            [-20, 45],
            [-11, 43],
            [-6, 58],
            [-7, 42],
            [-9, 91],
            [-1, 71],
            [-3, 32],
            [-11, 25],
            [-15, 48],
            [-14, 71],
            [-6, 37],
            [-23, 58],
            [-2, 45]
        ],
        [
            [5644, 4022],
            [23, 14],
            [18, -4],
            [11, -13],
            [0, -5]
        ],
        [
            [5552, 3594],
            [0, -218],
            [-25, -30],
            [-15, -4],
            [-17, 11],
            [-13, 4],
            [-4, 25],
            [-11, 17],
            [-14, -30]
        ],
        [
            [9604, 3812],
            [23, -36],
            [14, -28],
            [-10, -14],
            [-16, 16],
            [-19, 27],
            [-18, 31],
            [-19, 42],
            [-4, 20],
            [12, -1],
            [16, -20],
            [12, -20],
            [9, -17]
        ],
        [
            [5412, 6408],
            [7, -92],
            [10, -15],
            [1, -19],
            [11, -20],
            [-6, -25],
            [-11, -120],
            [-1, -77],
            [-35, -56],
            [-12, -78],
            [11, -22],
            [0, -38],
            [18, -1],
            [-3, -28]
        ],
        [
            [5393, 5795],
            [-5, -1],
            [-19, 64],
            [-6, 3],
            [-22, -33],
            [-21, 17],
            [-15, 3],
            [-8, -8],
            [-17, 2],
            [-16, -25],
            [-14, -2],
            [-34, 31],
            [-13, -15],
            [-14, 1],
            [-10, 23],
            [-28, 22],
            [-30, -7],
            [-7, -13],
            [-4, -34],
            [-8, -24],
            [-2, -53]
        ],
        [
            [5236, 5339],
            [-29, -21],
            [-11, 3],
            [-10, -13],
            [-23, 1],
            [-15, 37],
            [-9, 43],
            [-19, 39],
            [-21, -1],
            [-25, 0]
        ],
        [
            [2619, 5713],
            [-10, 18],
            [-13, 24],
            [-6, 20],
            [-12, 19],
            [-13, 26],
            [3, 9],
            [4, -9],
            [2, 5]
        ],
        [
            [2690, 5943],
            [-2, -5],
            [-2, -13],
            [3, -22],
            [-6, -20],
            [-3, -24],
            [-1, -26],
            [1, -15],
            [1, -27],
            [-4, -6],
            [-3, -25],
            [2, -15],
            [-6, -16],
            [2, -16],
            [4, -9]
        ],
        [
            [5092, 8091],
            [14, 16],
            [24, 87],
            [38, 25],
            [23, -2]
        ],
        [
            [5863, 9167],
            [-47, -24],
            [-22, -5]
        ],
        [
            [5573, 9140],
            [-17, -2],
            [-4, -39],
            [-53, 9],
            [-7, -33],
            [-27, 1],
            [-18, -42],
            [-28, -66],
            [-43, -83],
            [10, -20],
            [-10, -24],
            [-27, 1],
            [-18, -55],
            [2, -79],
            [17, -29],
            [-9, -70],
            [-23, -40],
            [-12, -34]
        ],
        [
            [5306, 8535],
            [-19, 36],
            [-55, -69],
            [-37, -13],
            [-38, 30],
            [-10, 63],
            [-9, 137],
            [26, 38],
            [73, 49],
            [55, 61],
            [51, 82],
            [66, 115],
            [47, 44],
            [76, 74],
            [61, 26],
            [46, -3],
            [42, 49],
            [51, -3],
            [50, 12],
            [87, -43],
            [-36, -16],
            [30, -37]
        ],
        [
            [5686, 9657],
            [-62, -24],
            [-49, 13],
            [19, 16],
            [-16, 19],
            [57, 11],
            [11, -22],
            [40, -13]
        ],
        [
            [5506, 9766],
            [92, -44],
            [-70, -23],
            [-15, -44],
            [-25, -11],
            [-13, -49],
            [-34, -2],
            [-59, 36],
            [25, 21],
            [-42, 17],
            [-54, 50],
            [-21, 46],
            [75, 21],
            [16, -20],
            [39, 0],
            [11, 21],
            [40, 2],
            [35, -21]
        ],
        [
            [5706, 9808],
            [55, -21],
            [-41, -32],
            [-81, -7],
            [-82, 10],
            [-5, 16],
            [-40, 1],
            [-30, 27],
            [86, 17],
            [40, -14],
            [28, 17],
            [70, -14]
        ],
        [
            [9805, 2640],
            [6, -24],
            [20, 24],
            [8, -25],
            [0, -25],
            [-10, -27],
            [-18, -44],
            [-14, -24],
            [10, -28],
            [-22, -1],
            [-23, -22],
            [-8, -39],
            [-16, -60],
            [-21, -26],
            [-14, -17],
            [-26, 1],
            [-18, 20],
            [-30, 4],
            [-5, 22],
            [15, 43],
            [35, 59],
            [18, 11],
            [20, 22],
            [24, 31],
            [16, 31],
            [13, 44],
            [10, 15],
            [5, 33],
            [19, 27],
            [6, -25]
        ],
        [
            [9849, 2922],
            [20, -63],
            [1, 41],
            [13, -16],
            [4, -45],
            [22, -19],
            [19, -5],
            [16, 22],
            [14, -6],
            [-7, -53],
            [-8, -34],
            [-22, 1],
            [-7, -18],
            [3, -25],
            [-4, -11],
            [-11, -32],
            [-14, -41],
            [-21, -23],
            [-5, 15],
            [-12, 9],
            [16, 48],
            [-9, 33],
            [-30, 23],
            [1, 22],
            [20, 20],
            [5, 46],
            [-1, 38],
            [-12, 40],
            [1, 10],
            [-13, 25],
            [-22, 52],
            [-12, 42],
            [11, 4],
            [15, -33],
            [21, -15],
            [8, -52]
        ],
        [
            [6475, 6041],
            [-9, 41],
            [-22, 98]
        ],
        [
            [6444, 6180],
            [83, 59],
            [19, 118],
            [-13, 42]
        ],
        [
            [6566, 6530],
            [12, -40],
            [16, -22],
            [20, -8],
            [17, -10],
            [12, -34],
            [8, -20],
            [10, -7],
            [0, -13],
            [-10, -36],
            [-5, -16],
            [-12, -19],
            [-10, -41],
            [-13, 3],
            [-5, -14],
            [-5, -30],
            [4, -39],
            [-3, -7],
            [-13, 0],
            [-17, -22],
            [-3, -29],
            [-6, -12],
            [-18, 0],
            [-10, -15],
            [0, -24],
            [-14, -16],
            [-15, 5],
            [-19, -19],
            [-12, -4]
        ],
        [
            [6557, 6597],
            [8, 20],
            [3, -5],
            [-2, -25],
            [-4, -10]
        ],
        [
            [6893, 6457],
            [-20, 15],
            [-9, 43],
            [-21, 45],
            [-51, -12],
            [-45, -1],
            [-39, -8]
        ],
        [
            [2836, 5484],
            [-9, 17],
            [-6, 32],
            [7, 16],
            [-7, 4],
            [-5, 20],
            [-14, 16],
            [-12, -4],
            [-6, -20],
            [-11, -15],
            [-6, -2],
            [-3, -13],
            [13, -32],
            [-7, -7],
            [-4, -9],
            [-13, -3],
            [-5, 35],
            [-4, -10],
            [-9, 4],
            [-5, 24],
            [-12, 3],
            [-7, 7],
            [-12, 0],
            [-1, -13],
            [-3, 9]
        ],
        [
            [2707, 5623],
            [10, -22],
            [-1, -12],
            [11, -3],
            [3, 5],
            [8, -14],
            [13, 4],
            [12, 15],
            [17, 12],
            [9, 17],
            [16, -3],
            [-1, -6],
            [15, -2],
            [12, -10],
            [10, -18],
            [10, -16]
        ],
        [
            [3045, 3974],
            [-28, 33],
            [-2, 25],
            [-55, 59],
            [-50, 65],
            [-22, 36],
            [-11, 49],
            [4, 17],
            [-23, 77],
            [-28, 109],
            [-26, 118],
            [-11, 27],
            [-9, 43],
            [-21, 39],
            [-20, 24],
            [9, 26],
            [-14, 57],
            [9, 41],
            [22, 37]
        ],
        [
            [8510, 5555],
            [2, -40],
            [2, -33],
            [-9, -54],
            [-11, 60],
            [-13, -30],
            [9, -43],
            [-8, -28],
            [-32, 35],
            [-8, 42],
            [8, 28],
            [-17, 28],
            [-9, -24],
            [-13, 2],
            [-21, -33],
            [-4, 17],
            [11, 50],
            [17, 17],
            [15, 22],
            [10, -27],
            [21, 17],
            [5, 26],
            [19, 1],
            [-1, 46],
            [22, -28],
            [3, -30],
            [2, -21]
        ],
        [
            [8443, 5665],
            [-10, -20],
            [-9, -37],
            [-8, -17],
            [-17, 40],
            [5, 16],
            [7, 17],
            [3, 36],
            [16, 4],
            [-5, -40],
            [21, 57],
            [-3, -56]
        ],
        [
            [8291, 5608],
            [-37, -56],
            [14, 41],
            [20, 37],
            [16, 41],
            [15, 58],
            [5, -48],
            [-18, -33],
            [-15, -40]
        ],
        [
            [8385, 5760],
            [16, -18],
            [18, 0],
            [0, -25],
            [-13, -25],
            [-18, -18],
            [-1, 28],
            [2, 30],
            [-4, 28]
        ],
        [
            [8485, 5776],
            [8, -66],
            [-21, 16],
            [0, -20],
            [7, -37],
            [-13, -13],
            [-1, 42],
            [-9, 3],
            [-4, 36],
            [16, -5],
            [0, 22],
            [-17, 45],
            [27, -1],
            [7, -22]
        ],
        [
            [8375, 5830],
            [-7, -51],
            [-12, 29],
            [-15, 45],
            [24, -2],
            [10, -21]
        ],
        [
            [8369, 6151],
            [17, -17],
            [9, 15],
            [2, -15],
            [-4, -24],
            [9, -43],
            [-7, -49],
            [-16, -19],
            [-5, -48],
            [7, -47],
            [14, -7],
            [13, 7],
            [34, -32],
            [-2, -32],
            [9, -15],
            [-3, -27],
            [-22, 29],
            [-10, 31],
            [-7, -22],
            [-18, 36],
            [-25, -9],
            [-14, 13],
            [1, 25],
            [9, 15],
            [-8, 13],
            [-4, -21],
            [-14, 34],
            [-4, 26],
            [-1, 56],
            [11, -19],
            [3, 92],
            [9, 54],
            [17, 0]
        ],
        [
            [9329, 4655],
            [-8, -6],
            [-12, 22],
            [-12, 38],
            [-6, 45],
            [4, 6],
            [3, -18],
            [8, -13],
            [14, -38],
            [13, -20],
            [-4, -16]
        ],
        [
            [9221, 4734],
            [-15, -5],
            [-4, -17],
            [-15, -14],
            [-15, -14],
            [-14, 0],
            [-23, 18],
            [-16, 16],
            [2, 18],
            [25, -8],
            [15, 4],
            [5, 29],
            [4, 1],
            [2, -31],
            [16, 4],
            [8, 20],
            [16, 21],
            [-4, 35],
            [17, 1],
            [6, -9],
            [-1, -33],
            [-9, -36]
        ],
        [
            [8916, 4904],
            [48, -41],
            [51, -34],
            [19, -30],
            [16, -30],
            [4, -34],
            [46, -37],
            [7, -31],
            [-25, -7],
            [6, -39],
            [25, -39],
            [18, -62],
            [15, 2],
            [-1, -27],
            [22, -10],
            [-9, -11],
            [30, -25],
            [-3, -17],
            [-18, -4],
            [-7, 16],
            [-24, 6],
            [-28, 9],
            [-22, 38],
            [-16, 32],
            [-14, 52],
            [-36, 26],
            [-24, -17],
            [-17, -20],
            [4, -43],
            [-22, -20],
            [-16, 9],
            [-28, 3]
        ],
        [
            [9253, 4792],
            [-9, -16],
            [-5, 35],
            [-6, 23],
            [-13, 19],
            [-16, 25],
            [-20, 18],
            [8, 14],
            [15, -17],
            [9, -13],
            [12, -14],
            [11, -25],
            [11, -19],
            [3, -30]
        ],
        [
            [5392, 8233],
            [19, 18],
            [43, 27],
            [35, 20],
            [28, -10],
            [2, -14],
            [27, -1]
        ],
        [
            [5546, 8273],
            [34, -7],
            [51, 1]
        ],
        [
            [5653, 8105],
            [14, -52],
            [-3, -17],
            [-14, -6],
            [-25, -50],
            [7, -26],
            [-6, 3]
        ],
        [
            [5626, 7957],
            [-26, 23],
            [-20, -8],
            [-13, 6],
            [-17, -13],
            [-14, 21],
            [-11, -8],
            [-2, 4]
        ],
        [
            [3159, 6151],
            [14, -5],
            [5, -12],
            [-7, -15],
            [-21, 1],
            [-17, -2],
            [-1, 25],
            [4, 9],
            [23, -1]
        ],
        [
            [8628, 7562],
            [4, -10]
        ],
        [
            [8632, 7552],
            [-11, 3],
            [-12, -20],
            [-8, -20],
            [1, -42],
            [-14, -13],
            [-5, -11],
            [-11, -17],
            [-18, -10],
            [-12, -16],
            [-1, -25],
            [-3, -7],
            [11, -9],
            [15, -26]
        ],
        [
            [8504, 7288],
            [-13, 11],
            [-4, -11],
            [-8, -5],
            [-1, 11],
            [-7, 5],
            [-8, 10],
            [8, 26],
            [7, 7],
            [-3, 11],
            [7, 31],
            [-2, 10],
            [-16, 7],
            [-13, 15]
        ],
        [
            [4792, 7249],
            [-11, -15],
            [-14, 8],
            [-15, -6],
            [5, 46],
            [-3, 36],
            [-12, 6],
            [-7, 22],
            [2, 39],
            [11, 21],
            [2, 24],
            [6, 36],
            [-1, 25],
            [-5, 21],
            [-1, 20]
        ],
        [
            [6411, 6520],
            [-2, 43],
            [7, 31],
            [8, 6],
            [8, -18],
            [1, -35],
            [-6, -35]
        ],
        [
            [6427, 6512],
            [-8, -4],
            [-8, 12]
        ],
        [
            [5630, 7886],
            [12, 13],
            [17, -7],
            [18, 0],
            [13, -14],
            [10, 9],
            [20, 5],
            [7, 14],
            [12, 0]
        ],
        [
            [5784, 7745],
            [12, -11],
            [13, 9],
            [13, -10]
        ],
        [
            [5822, 7733],
            [0, -15],
            [-13, -13],
            [-9, 6],
            [-7, -71]
        ],
        [
            [5629, 7671],
            [-5, 10],
            [6, 10],
            [-7, 7],
            [-8, -13],
            [-17, 17],
            [-2, 25],
            [-17, 14],
            [-3, 18],
            [-15, 24]
        ],
        [
            [8989, 8056],
            [28, -105],
            [-41, 19],
            [-17, -85],
            [27, -61],
            [-1, -41],
            [-21, 36],
            [-18, -46],
            [-5, 50],
            [3, 57],
            [-3, 64],
            [6, 45],
            [2, 79],
            [-17, 58],
            [3, 80],
            [25, 28],
            [-11, 27],
            [13, 8],
            [7, -39],
            [10, -57],
            [-1, -58],
            [11, -59]
        ],
        [
            [5546, 8273],
            [6, 26],
            [38, 19]
        ],
        [
            [0, 9132],
            [68, -45],
            [73, -59],
            [-3, -37],
            [19, -15],
            [-6, 43],
            [75, -8],
            [55, -56],
            [-28, -26],
            [-46, -6],
            [0, -57],
            [-11, -13],
            [-26, 2],
            [-22, 21],
            [-36, 17],
            [-7, 26],
            [-28, 9],
            [-31, -7],
            [-16, 20],
            [6, 22],
            [-33, -14],
            [13, -28],
            [-16, -25]
        ],
        [
            [0, 8896],
            [0, 236]
        ],
        [
            [0, 9282],
            [9999, -40],
            [-30, -3],
            [-5, 19],
            [-9964, 24]
        ],
        [
            [0, 9282],
            [4, 3],
            [23, 0],
            [40, -17],
            [-2, -8],
            [-29, -14],
            [-36, -4],
            [0, 40]
        ],
        [
            [8988, 9383],
            [-42, -1],
            [-57, 7],
            [-5, 3],
            [27, 23],
            [34, 6],
            [40, -23],
            [3, -15]
        ],
        [
            [9186, 9493],
            [-32, -23],
            [-44, 5],
            [-52, 23],
            [7, 20],
            [51, -9],
            [70, -16]
        ],
        [
            [9029, 9522],
            [-22, -44],
            [-102, 1],
            [-46, -14],
            [-55, 39],
            [15, 40],
            [37, 11],
            [73, -2],
            [100, -31]
        ],
        [
            [6598, 9235],
            [-17, -5],
            [-91, 8],
            [-7, 26],
            [-50, 16],
            [-4, 32],
            [28, 13],
            [-1, 32],
            [55, 50],
            [-25, 7],
            [66, 52],
            [-7, 27],
            [62, 31],
            [91, 38],
            [93, 11],
            [48, 22],
            [54, 8],
            [19, -23],
            [-19, -19],
            [-98, -29],
            [-85, -28],
            [-86, -57],
            [-42, -57],
            [-43, -57],
            [5, -49],
            [54, -49]
        ],
        [
            [0, 8896],
            [9963, -26],
            [-36, 4],
            [25, -31],
            [17, -49],
            [13, -16],
            [3, -24],
            [-7, -16],
            [-52, 13],
            [-78, -44],
            [-25, -7],
            [-42, -42],
            [-40, -36],
            [-11, -27],
            [-39, 41],
            [-73, -46],
            [-12, 22],
            [-27, -26],
            [-37, 8],
            [-9, -38],
            [-33, -58],
            [1, -24],
            [31, -13],
            [-4, -86],
            [-25, -2],
            [-12, -49],
            [11, -26],
            [-48, -30],
            [-10, -67],
            [-41, -15],
            [-9, -60],
            [-40, -55],
            [-10, 41],
            [-12, 86],
            [-15, 131],
            [13, 82],
            [23, 35],
            [2, 28],
            [43, 13],
            [50, 75],
            [47, 60],
            [50, 48],
            [23, 83],
            [-34, -5],
            [-17, -49],
            [-70, -65],
            [-23, 73],
            [-72, -20],
            [-69, -99],
            [23, -36],
            [-62, -16],
            [-43, -6],
            [2, 43],
            [-43, 9],
            [-35, -29],
            [-85, 10],
            [-91, -18],
            [-90, -115],
            [-106, -139],
            [43, -8],
            [14, -37],
            [27, -13],
            [18, 30],
            [30, -4],
            [40, -65],
            [1, -50],
            [-21, -59],
            [-3, -71],
            [-12, -94],
            [-42, -86],
            [-9, -41],
            [-38, -69],
            [-38, -68],
            [-18, -35],
            [-37, -34],
            [-17, -1],
            [-17, 29],
            [-38, -44],
            [-4, -19]
        ],
        [
            [6363, 7799],
            [-12, -35],
            [-27, -10],
            [-28, -61],
            [25, -56],
            [-2, -40],
            [30, -70]
        ],
        [
            [6109, 7624],
            [-35, 49],
            [-32, 23],
            [-24, 34],
            [20, 10],
            [23, 49],
            [-15, 24],
            [41, 24],
            [-1, 13],
            [-25, -10]
        ],
        [
            [6061, 7840],
            [1, 26],
            [14, 17],
            [27, 4],
            [5, 20],
            [-7, 33],
            [12, 30],
            [-1, 18],
            [-41, 19],
            [-16, -1],
            [-17, 28],
            [-21, -9],
            [-35, 20],
            [0, 12],
            [-10, 26],
            [-22, 3],
            [-2, 18],
            [7, 12],
            [-18, 33],
            [-29, -5],
            [-8, 3],
            [-7, -14],
            [-11, 3]
        ],
        [
            [5777, 8571],
            [31, 33],
            [-29, 28]
        ],
        [
            [5863, 9167],
            [29, 20],
            [46, -35],
            [76, -14],
            [105, -67],
            [21, -28],
            [2, -40],
            [-31, -31],
            [-45, -15],
            [-124, 44],
            [-21, -7],
            [45, -43],
            [2, -28],
            [2, -60],
            [36, -18],
            [22, -15],
            [3, 28],
            [-17, 26],
            [18, 22],
            [67, -37],
            [24, 15],
            [-19, 43],
            [65, 58],
            [25, -4],
            [26, -20],
            [16, 40],
            [-23, 35],
            [14, 36],
            [-21, 36],
            [78, -18],
            [16, -34],
            [-35, -7],
            [0, -33],
            [22, -20],
            [43, 13],
            [7, 38],
            [58, 28],
            [97, 50],
            [20, -3],
            [-27, -35],
            [35, -7],
            [19, 21],
            [52, 1],
            [42, 25],
            [31, -36],
            [32, 39],
            [-29, 35],
            [14, 19],
            [82, -18],
            [39, -18],
            [100, -68],
            [19, 31],
            [-28, 31],
            [-1, 13],
            [-34, 6],
            [10, 28],
            [-15, 46],
            [-1, 19],
            [51, 53],
            [18, 54],
            [21, 11],
            [74, -15],
            [5, -33],
            [-26, -48],
            [17, -19],
            [9, -41],
            [-6, -81],
            [31, -36],
            [-12, -40],
            [-55, -84],
            [32, -8],
            [11, 21],
            [31, 15],
            [7, 29],
            [24, 29],
            [-16, 33],
            [13, 39],
            [-31, 5],
            [-6, 33],
            [22, 59],
            [-36, 48],
            [50, 40],
            [-7, 42],
            [14, 2],
            [15, -33],
            [-11, -57],
            [29, -11],
            [-12, 43],
            [46, 23],
            [58, 3],
            [51, -34],
            [-25, 49],
            [-2, 63],
            [48, 12],
            [67, -2],
            [60, 7],
            [-23, 31],
            [33, 39],
            [31, 2],
            [54, 29],
            [74, 8],
            [9, 16],
            [73, 6],
            [23, -14],
            [62, 32],
            [51, -1],
            [8, 25],
            [26, 25],
            [66, 25],
            [48, -19],
            [-38, -15],
            [63, -9],
            [7, -29],
            [25, 14],
            [82, -1],
            [62, -29],
            [23, -22],
            [-7, -30],
            [-31, -18],
            [-73, -33],
            [-21, -17],
            [35, -8],
            [41, -15],
            [25, 11],
            [14, -38],
            [12, 15],
            [44, 10],
            [90, -10],
            [6, -28],
            [116, -9],
            [2, 46],
            [59, -11],
            [44, 1],
            [45, -32],
            [13, -37],
            [-17, -25],
            [35, -47],
            [44, -24],
            [27, 62],
            [44, -26],
            [48, 16],
            [53, -18],
            [21, 16],
            [45, -8],
            [-20, 55],
            [37, 25],
            [251, -38],
            [24, -35],
            [72, -45],
            [112, 11],
            [56, -10],
            [23, -24],
            [-4, -44],
            [35, -16],
            [37, 12],
            [49, 1],
            [52, -11],
            [53, 6],
            [49, -52],
            [34, 19],
            [-23, 37],
            [13, 27],
            [88, -17],
            [58, 4],
            [80, -29],
            [-9960, -25]
        ],
        [
            [7918, 9684],
            [-157, -23],
            [51, 77],
            [23, 7],
            [21, -4],
            [70, -33],
            [-8, -24]
        ],
        [
            [6420, 9816],
            [-37, -8],
            [-25, -4],
            [-4, -10],
            [-33, -10],
            [-30, 14],
            [16, 19],
            [-62, 2],
            [54, 10],
            [43, 1],
            [5, -16],
            [16, 14],
            [26, 10],
            [42, -13],
            [-11, -9]
        ],
        [
            [7775, 9718],
            [-60, -8],
            [-78, 17],
            [-46, 23],
            [-21, 42],
            [-38, 12],
            [72, 40],
            [60, 14],
            [54, -30],
            [64, -57],
            [-7, -53]
        ],
        [
            [5844, 4990],
            [11, -33],
            [-1, -35],
            [-8, -7]
        ],
        [
            [5821, 4978],
            [7, -6],
            [16, 18]
        ],
        [
            [4526, 6298],
            [1, 25]
        ],
        [
            [6188, 6023],
            [-4, 26],
            [-8, 17],
            [-2, 24],
            [-15, 21],
            [-15, 50],
            [-7, 48],
            [-20, 40],
            [-12, 10],
            [-18, 56],
            [-4, 41],
            [2, 35],
            [-16, 66],
            [-13, 23],
            [-15, 12],
            [-10, 34],
            [2, 13],
            [-8, 31],
            [-8, 13],
            [-11, 44],
            [-17, 48],
            [-14, 40],
            [-14, 0],
            [5, 33],
            [1, 20],
            [3, 24]
        ],
        [
            [6344, 6744],
            [11, -51],
            [14, -13],
            [5, -21],
            [18, -25],
            [2, -24],
            [-3, -20],
            [4, -20],
            [8, -16],
            [4, -20],
            [4, -14]
        ],
        [
            [6427, 6512],
            [5, -22]
        ],
        [
            [6444, 6180],
            [-80, -23],
            [-26, -26],
            [-20, -62],
            [-13, -10],
            [-7, 20],
            [-11, -3],
            [-27, 6],
            [-5, 5],
            [-32, -1],
            [-7, -5],
            [-12, 15],
            [-7, -29],
            [3, -25],
            [-12, -19]
        ],
        [
            [5943, 5617],
            [-4, 1],
            [0, 29],
            [-3, 20],
            [-14, 24],
            [-4, 42],
            [4, 44],
            [-13, 4],
            [-2, -13],
            [-17, -3],
            [7, -17],
            [2, -36],
            [-15, -32],
            [-14, -43],
            [-14, -6],
            [-23, 34],
            [-11, -12],
            [-3, -17],
            [-14, -11],
            [-1, -12],
            [-28, 0],
            [-3, 12],
            [-20, 2],
            [-10, -10],
            [-8, 5],
            [-14, 34],
            [-5, 17],
            [-20, -9],
            [-8, -27],
            [-7, -53],
            [-10, -11],
            [-8, -6]
        ],
        [
            [5663, 5567],
            [-2, 2]
        ],
        [
            [5635, 5716],
            [0, 14],
            [-10, 17],
            [-1, 35],
            [-5, 23],
            [-10, -4],
            [3, 22],
            [7, 25],
            [-3, 24],
            [9, 18],
            [-6, 14],
            [7, 36],
            [13, 44],
            [24, -4],
            [-1, 234]
        ],
        [
            [6023, 6357],
            [9, -58],
            [-6, -10],
            [4, -61],
            [11, -71],
            [10, -14],
            [15, -22]
        ],
        [
            [5943, 5624],
            [0, -7]
        ],
        [
            [5943, 5617],
            [0, -46]
        ],
        [
            [5944, 5309],
            [-17, -28],
            [-20, 1],
            [-22, -14],
            [-18, 13],
            [-11, -16]
        ],
        [
            [5682, 5544],
            [-19, 23]
        ],
        [
            [4535, 5861],
            [-11, 46],
            [-14, 21],
            [12, 11],
            [14, 41],
            [6, 31]
        ],
        [
            [4536, 5789],
            [-4, 45]
        ],
        [
            [9502, 4438],
            [8, -20],
            [-19, 0],
            [-11, 37],
            [17, -15],
            [5, -2]
        ],
        [
            [9467, 4474],
            [-11, -1],
            [-17, 6],
            [-5, 9],
            [1, 23],
            [19, -9],
            [9, -12],
            [4, -16]
        ],
        [
            [9490, 4490],
            [-4, -11],
            [-21, 52],
            [-5, 35],
            [9, 0],
            [10, -47],
            [11, -29]
        ],
        [
            [9440, 4565],
            [1, -12],
            [-22, 25],
            [-15, 21],
            [-10, 20],
            [4, 6],
            [13, -14],
            [23, -27],
            [6, -19]
        ],
        [
            [9375, 4623],
            [-5, -3],
            [-13, 14],
            [-11, 24],
            [1, 10],
            [17, -25],
            [11, -20]
        ],
        [
            [4682, 5458],
            [-8, 5],
            [-20, 24],
            [-14, 31],
            [-5, 22],
            [-3, 43]
        ],
        [
            [2561, 5848],
            [-3, -14],
            [-16, 1],
            [-10, 6],
            [-12, 12],
            [-15, 3],
            [-8, 13]
        ],
        [
            [6198, 5735],
            [9, -11],
            [5, -25],
            [13, -24],
            [14, -1],
            [26, 16],
            [30, 7],
            [25, 18],
            [13, 4],
            [10, 11],
            [16, 2]
        ],
        [
            [6359, 5732],
            [0, -1],
            [0, -25],
            [0, -59],
            [0, -31],
            [-13, -36],
            [-19, -50]
        ],
        [
            [6359, 5732],
            [9, 1],
            [13, 9],
            [14, 6],
            [14, 20],
            [10, 0],
            [1, -16],
            [-3, -35],
            [0, -31],
            [-6, -21],
            [-7, -64],
            [-14, -66],
            [-17, -75],
            [-24, -87],
            [-23, -66],
            [-33, -81],
            [-28, -48],
            [-42, -58],
            [-25, -45],
            [-31, -72],
            [-6, -31],
            [-6, -14]
        ],
        [
            [3412, 5410],
            [34, -11],
            [2, 10],
            [23, 4],
            [30, -15]
        ],
        [
            [3489, 5306],
            [10, -35],
            [-4, -25]
        ],
        [
            [5626, 7957],
            [-8, -15],
            [-5, -24]
        ],
        [
            [5380, 7746],
            [7, 5]
        ],
        [
            [5663, 8957],
            [-47, -17],
            [-27, -41],
            [4, -36],
            [-44, -48],
            [-54, -50],
            [-20, -84],
            [20, -41],
            [26, -33],
            [-25, -67],
            [-29, -14],
            [-11, -99],
            [-15, -55],
            [-34, 6],
            [-16, -47],
            [-32, -3],
            [-9, 56],
            [-23, 67],
            [-21, 84]
        ],
        [
            [5890, 3478],
            [-5, -26],
            [-17, -6],
            [-16, 32],
            [0, 20],
            [7, 22],
            [3, 17],
            [8, 5],
            [14, -11]
        ],
        [
            [5999, 7104],
            [-2, 45],
            [7, 25]
        ],
        [
            [6004, 7174],
            [7, 13],
            [7, 13],
            [2, 33],
            [9, -12],
            [31, 17],
            [14, -12],
            [23, 1],
            [32, 22],
            [15, -1],
            [32, 9]
        ],
        [
            [5051, 5420],
            [-22, -12]
        ],
        [
            [7849, 5777],
            [-25, 28],
            [-24, -2],
            [4, 47],
            [-24, 0],
            [-2, -65],
            [-15, -87],
            [-10, -52],
            [2, -43],
            [18, -2],
            [12, -53],
            [5, -52],
            [15, -33],
            [17, -7],
            [14, -31]
        ],
        [
            [7779, 5439],
            [-11, 23],
            [-4, 29],
            [-15, 34],
            [-14, 28],
            [-4, -35],
            [-5, 33],
            [3, 37],
            [8, 56]
        ],
        [
            [6883, 7252],
            [16, 60],
            [-6, 44],
            [-20, 14],
            [7, 26],
            [23, -3],
            [13, 33],
            [9, 38],
            [37, 13],
            [-6, -27],
            [4, -17],
            [12, 2]
        ],
        [
            [6497, 7255],
            [-5, 42],
            [4, 62],
            [-22, 20],
            [8, 40],
            [-19, 4],
            [6, 49],
            [26, -14],
            [25, 19],
            [-20, 35],
            [-8, 34],
            [-23, -15],
            [-3, -43],
            [-8, 38]
        ],
        [
            [6554, 7498],
            [31, 1],
            [-4, 29],
            [24, 21],
            [23, 34],
            [37, -31],
            [3, -47],
            [11, -12],
            [30, 2],
            [9, -10],
            [14, -61],
            [32, -41],
            [18, -28],
            [29, -29],
            [37, -25],
            [-1, -36]
        ],
        [
            [8471, 4532],
            [3, 14],
            [24, 13],
            [19, 2],
            [9, 8],
            [10, -8],
            [-10, -16],
            [-29, -25],
            [-23, -17]
        ],
        [
            [3286, 5693],
            [16, 8],
            [6, -2],
            [-1, -44],
            [-23, -7],
            [-5, 6],
            [8, 16],
            [-1, 23]
        ],
        [
            [5233, 7240],
            [31, 24],
            [19, -7],
            [-1, -30],
            [24, 22],
            [2, -12],
            [-14, -29],
            [0, -27],
            [9, -15],
            [-3, -51],
            [-19, -29],
            [6, -33],
            [14, -1],
            [7, -28],
            [11, -9]
        ],
        [
            [6004, 7174],
            [-11, 27],
            [11, 22],
            [-17, -5],
            [-23, 13],
            [-19, -34],
            [-43, -6],
            [-22, 31],
            [-30, 2],
            [-6, -24],
            [-20, -7],
            [-26, 31],
            [-31, -1],
            [-16, 59],
            [-21, 33],
            [14, 46],
            [-18, 28],
            [31, 56],
            [43, 3],
            [12, 45],
            [53, -8],
            [33, 38],
            [32, 17],
            [46, 1],
            [49, -42],
            [40, -22],
            [32, 9],
            [24, -6],
            [33, 31]
        ],
        [
            [5777, 7539],
            [3, -23],
            [25, -19],
            [-5, -14],
            [-33, -3],
            [-12, -19],
            [-23, -31],
            [-9, 27],
            [0, 12]
        ],
        [
            [8382, 6499],
            [-17, -95],
            [-12, -49],
            [-14, 50],
            [-4, 44],
            [17, 58],
            [22, 45],
            [13, -18],
            [-5, -35]
        ],
        [
            [6088, 4781],
            [-12, -73],
            [1, -33],
            [18, -22],
            [1, -15],
            [-8, -36],
            [2, -18],
            [-2, -28],
            [10, -37],
            [11, -58],
            [10, -13]
        ],
        [
            [5909, 4512],
            [-15, 18],
            [-18, 10],
            [-11, 10],
            [-12, 15]
        ],
        [
            [5844, 4990],
            [10, 8],
            [31, -1],
            [56, 4]
        ],
        [
            [6061, 7840],
            [-22, -5],
            [-18, -19],
            [-26, -3],
            [-24, -22],
            [1, -37],
            [14, -14],
            [28, 4],
            [-5, -21],
            [-31, -11],
            [-37, -34],
            [-16, 12],
            [6, 28],
            [-30, 17],
            [5, 12],
            [26, 19],
            [-8, 14],
            [-43, 15],
            [-2, 22],
            [-25, -8],
            [-11, -32],
            [-21, -44]
        ],
        [
            [3517, 3063],
            [-12, -38],
            [-31, -32],
            [-21, 11],
            [-15, -6],
            [-26, 25],
            [-18, -1],
            [-17, 32]
        ],
        [
            [679, 6185],
            [-4, -10],
            [-7, 8],
            [1, 17],
            [-4, 21],
            [1, 7],
            [5, 10],
            [-2, 11],
            [1, 6],
            [3, -1],
            [10, -10],
            [5, -5],
            [5, -8],
            [7, -21],
            [-1, -3],
            [-11, -13],
            [-9, -9]
        ],
        [
            [664, 6277],
            [-9, -4],
            [-5, 12],
            [-3, 5],
            [0, 4],
            [3, 5],
            [9, -6],
            [8, -9],
            [-3, -7]
        ],
        [
            [646, 6309],
            [-1, -7],
            [-15, 2],
            [2, 7],
            [14, -2]
        ],
        [
            [621, 6317],
            [-2, -3],
            [-2, 1],
            [-9, 2],
            [-4, 13],
            [-1, 2],
            [7, 8],
            [3, -3],
            [8, -20]
        ],
        [
            [574, 6356],
            [-4, -6],
            [-9, 11],
            [1, 4],
            [5, 6],
            [6, -1],
            [1, -14]
        ],
        [
            [3135, 7724],
            [5, -19],
            [-30, -29],
            [-29, -20],
            [-29, -18],
            [-15, -35],
            [-4, -13],
            [-1, -31],
            [10, -32],
            [11, -1],
            [-3, 21],
            [8, -13],
            [-2, -17],
            [-19, -9],
            [-13, 1],
            [-20, -10],
            [-12, -3],
            [-17, -3],
            [-23, -17],
            [41, 11],
            [8, -11],
            [-39, -18],
            [-17, 0],
            [0, 7],
            [-8, -16],
            [8, -3],
            [-6, -43],
            [-20, -45],
            [-2, 15],
            [-6, 3],
            [-9, 15],
            [5, -32],
            [7, -10],
            [1, -23],
            [-9, -23],
            [-16, -47],
            [-2, 3],
            [8, 40],
            [-14, 22],
            [-3, 49],
            [-5, -25],
            [5, -38],
            [-18, 10],
            [19, -19],
            [1, -57],
            [8, -4],
            [3, -20],
            [4, -59],
            [-17, -44],
            [-29, -18],
            [-18, -34],
            [-14, -4],
            [-14, -22],
            [-4, -20],
            [-31, -38],
            [-16, -28],
            [-13, -35],
            [-4, -42],
            [5, -41],
            [9, -51],
            [13, -41],
            [0, -26],
            [13, -69],
            [-1, -39],
            [-1, -23],
            [-7, -36],
            [-8, -8],
            [-14, 7],
            [-4, 26],
            [-11, 14],
            [-15, 51],
            [-13, 45],
            [-4, 23],
            [6, 39],
            [-8, 33],
            [-22, 49],
            [-10, 9],
            [-28, -27],
            [-5, 3],
            [-14, 28],
            [-17, 14],
            [-32, -7],
            [-24, 7],
            [-21, -5],
            [-12, -9],
            [5, -15],
            [0, -24],
            [5, -12],
            [-5, -8],
            [-10, 9],
            [-11, -11],
            [-20, 2],
            [-20, 31],
            [-25, -8],
            [-20, 14],
            [-17, -4],
            [-24, -14],
            [-25, -44],
            [-27, -25],
            [-16, -28],
            [-6, -27],
            [0, -41],
            [1, -28],
            [5, -20]
        ],
        [
            [1746, 6980],
            [-4, 30],
            [-18, 34],
            [-13, 7],
            [-3, 17],
            [-16, 3],
            [-10, 16],
            [-26, 6],
            [-7, 9],
            [-3, 32],
            [-27, 60],
            [-23, 82],
            [1, 14],
            [-13, 19],
            [-21, 50],
            [-4, 48],
            [-15, 32],
            [6, 49],
            [-1, 51],
            [-8, 45],
            [10, 56],
            [4, 53],
            [3, 54],
            [-5, 79],
            [-9, 51],
            [-8, 27],
            [4, 12],
            [40, -20],
            [15, -56],
            [7, 15],
            [-5, 49],
            [-9, 48]
        ],
        [
            [750, 8432],
            [-28, -23],
            [-14, 15],
            [-4, 28],
            [25, 21],
            [15, 9],
            [18, -4],
            [12, -18],
            [-24, -28]
        ],
        [
            [401, 8597],
            [-18, -9],
            [-18, 11],
            [-17, 16],
            [28, 10],
            [22, -6],
            [3, -22]
        ],
        [
            [230, 8826],
            [17, -12],
            [17, 6],
            [23, -15],
            [27, -8],
            [-2, -7],
            [-21, -12],
            [-21, 13],
            [-11, 11],
            [-24, -4],
            [-7, 5],
            [2, 23]
        ],
        [
            [1374, 8295],
            [-15, 22],
            [-25, 19],
            [-8, 52],
            [-36, 47],
            [-15, 56],
            [-26, 4],
            [-44, 2],
            [-33, 17],
            [-57, 61],
            [-27, 11],
            [-49, 21],
            [-38, -5],
            [-55, 27],
            [-33, 25],
            [-30, -12],
            [5, -41],
            [-15, -4],
            [-32, -12],
            [-25, -20],
            [-30, -13],
            [-4, 35],
            [12, 58],
            [30, 18],
            [-8, 15],
            [-35, -33],
            [-19, -39],
            [-40, -42],
            [20, -29],
            [-26, -42],
            [-30, -25],
            [-28, -18],
            [-7, -26],
            [-43, -31],
            [-9, -28],
            [-32, -25],
            [-20, 5],
            [-25, -17],
            [-29, -20],
            [-23, -20],
            [-47, -16],
            [-5, 9],
            [31, 28],
            [27, 18],
            [29, 33],
            [35, 6],
            [14, 25],
            [38, 35],
            [6, 12],
            [21, 21],
            [5, 44],
            [14, 35],
            [-32, -18],
            [-9, 11],
            [-15, -22],
            [-18, 30],
            [-8, -21],
            [-10, 29],
            [-28, -23],
            [-17, 0],
            [-3, 35],
            [5, 21],
            [-17, 22],
            [-37, -12],
            [-23, 28],
            [-19, 14],
            [0, 34],
            [-22, 25],
            [11, 34],
            [23, 33],
            [10, 30],
            [22, 4],
            [19, -9],
            [23, 28],
            [20, -5],
            [21, 19],
            [-5, 27],
            [-16, 10],
            [21, 23],
            [-17, -1],
            [-30, -13],
            [-8, -13],
            [-22, 13],
            [-39, -6],
            [-41, 14],
            [-12, 24],
            [-35, 34],
            [39, 25],
            [62, 29],
            [23, 0],
            [-4, -30],
            [59, 2],
            [-23, 37],
            [-34, 23],
            [-20, 29],
            [-26, 25],
            [-38, 19],
            [15, 31],
            [49, 2],
            [35, 27],
            [7, 29],
            [28, 28],
            [28, 6],
            [52, 27],
            [26, -4],
            [42, 31],
            [42, -12],
            [21, -27],
            [12, 11],
            [47, -3],
            [-2, -14],
            [43, -10],
            [28, 6],
            [59, -18],
            [53, -6],
            [21, -8],
            [37, 10],
            [42, -18],
            [31, -8]
        ],
        [
            [3018, 5753],
            [-1, -14],
            [-16, -7],
            [9, -26],
            [0, -31],
            [-12, -35],
            [10, -47],
            [12, 4],
            [6, 43],
            [-8, 21],
            [-2, 45],
            [35, 24],
            [-4, 27],
            [10, 19],
            [10, -41],
            [19, -1],
            [18, -33],
            [1, -20],
            [25, 0],
            [30, 6],
            [16, -27],
            [21, -7],
            [16, 18],
            [0, 15],
            [34, 4],
            [34, 1],
            [-24, -18],
            [10, -28],
            [22, -4],
            [21, -29],
            [4, -48],
            [15, 2],
            [11, -14]
        ],
        [
            [8001, 6331],
            [-37, -51],
            [-24, -56],
            [-6, -41],
            [22, -62],
            [25, -77],
            [26, -37],
            [17, -47],
            [12, -109],
            [-3, -104],
            [-24, -39],
            [-31, -38],
            [-23, -49],
            [-35, -55],
            [-10, 37],
            [8, 40],
            [-21, 34]
        ],
        [
            [9661, 4085],
            [-9, -8],
            [-9, 26],
            [1, 16],
            [17, -34]
        ],
        [
            [9641, 4175],
            [4, -47],
            [-7, 7],
            [-6, -3],
            [-4, 16],
            [0, 45],
            [13, -18]
        ],
        [
            [6475, 6041],
            [-21, -16],
            [-5, -26],
            [-1, -20],
            [-27, -25],
            [-45, -28],
            [-24, -41],
            [-13, -3],
            [-8, 3],
            [-16, -25],
            [-18, -11],
            [-23, -3],
            [-7, -3],
            [-6, -16],
            [-8, -4],
            [-4, -15],
            [-14, 1],
            [-9, -8],
            [-19, 3],
            [-7, 35],
            [1, 32],
            [-5, 17],
            [-5, 44],
            [-8, 24],
            [5, 3],
            [-2, 27],
            [3, 12],
            [-1, 25]
        ],
        [
            [5817, 3752],
            [11, 0],
            [14, -10],
            [9, 7],
            [15, -6]
        ],
        [
            [5911, 3478],
            [-7, -43],
            [-3, -49],
            [-7, -27],
            [-19, -30],
            [-5, -8],
            [-12, -30],
            [-8, -31],
            [-16, -42],
            [-31, -61],
            [-20, -36],
            [-21, -26],
            [-29, -23],
            [-14, -3],
            [-3, -17],
            [-17, 9],
            [-14, -11],
            [-30, 11],
            [-17, -7],
            [-12, 3],
            [-28, -23],
            [-24, -10],
            [-17, -22],
            [-13, -1],
            [-11, 21],
            [-10, 1],
            [-12, 26],
            [-1, -8],
            [-4, 16],
            [0, 34],
            [-9, 40],
            [9, 11],
            [0, 45],
            [-19, 55],
            [-14, 50],
            [0, 1],
            [-20, 76]
        ],
        [
            [5840, 4141],
            [-21, -8],
            [-15, -23],
            [-4, -21],
            [-10, -4],
            [-24, -49],
            [-15, -38],
            [-10, -2],
            [-9, 7],
            [-31, 7]
        ]
    ],
    "transform": {
        "scale": [0.036003600360036005, 0.016927109510951093],
        "translate": [-180, -85.609038]
    }
}
;
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = {"type":"Topology","transform":{"scale":[0.03514630243024302,0.005240860686068607],"translate":[-178.123152,18.948267]},"objects":{"usa":{"type":"GeometryCollection","geometries":[{"type":"Polygon","id":"AL","arcs":[[0,1,2,3,4]],"properties":{"name":"Alabama"}},{"type":"MultiPolygon","id":"AK","arcs":[[[5]],[[6]],[[7]],[[8]],[[9]],[[10]],[[11]],[[12]],[[13]],[[14]],[[15]],[[16]],[[17]],[[18]],[[19]],[[20]],[[21]],[[22]],[[23]],[[24]],[[25]],[[26]],[[27]],[[28]],[[29]],[[30]],[[31]],[[32]],[[33]],[[34]],[[35]],[[36]],[[37]],[[38]],[[39]],[[40]],[[41]],[[42]],[[43]]],"properties":{"name":"Alaska"}},{"type":"Polygon","id":"AZ","arcs":[[44,45,46,47,48]],"properties":{"name":"Arizona"}},{"type":"Polygon","id":"AR","arcs":[[49,50,51,52,53,54]],"properties":{"name":"Arkansas"}},{"type":"Polygon","id":"CA","arcs":[[55,-47,56,57]],"properties":{"name":"California"}},{"type":"Polygon","id":"CO","arcs":[[58,59,60,61,62,63]],"properties":{"name":"Colorado"}},{"type":"Polygon","id":"CT","arcs":[[64,65,66,67]],"properties":{"name":"Connecticut"}},{"type":"Polygon","id":"DE","arcs":[[68,69,70,71]],"properties":{"name":"Delaware"}},{"type":"Polygon","id":"DC","arcs":[[72,73]],"properties":{"name":"District of Columbia"}},{"type":"Polygon","id":"FL","arcs":[[74,75,-2]],"properties":{"name":"Florida"}},{"type":"Polygon","id":"GA","arcs":[[76,77,-75,-1,78,79]],"properties":{"name":"Georgia"}},{"type":"MultiPolygon","id":"HI","arcs":[[[80]],[[81]],[[82]],[[83]],[[84]]],"properties":{"name":"Hawaii"}},{"type":"Polygon","id":"ID","arcs":[[85,86,87,88,89,90,91]],"properties":{"name":"Idaho"}},{"type":"Polygon","id":"IL","arcs":[[92,93,94,95,96,97]],"properties":{"name":"Illinois"}},{"type":"Polygon","id":"IN","arcs":[[98,99,-95,100,101]],"properties":{"name":"Indiana"}},{"type":"Polygon","id":"IA","arcs":[[102,-98,103,104,105,106]],"properties":{"name":"Iowa"}},{"type":"Polygon","id":"KS","arcs":[[107,108,-60,109]],"properties":{"name":"Kansas"}},{"type":"Polygon","id":"KY","arcs":[[110,111,112,113,-96,-100,114]],"properties":{"name":"Kentucky"}},{"type":"Polygon","id":"LA","arcs":[[115,116,117,-52]],"properties":{"name":"Louisiana"}},{"type":"Polygon","id":"ME","arcs":[[118,119]],"properties":{"name":"Maine"}},{"type":"MultiPolygon","id":"MD","arcs":[[[120]],[[-71,121,122,123,124,-74,125,126,127]]],"properties":{"name":"Maryland"}},{"type":"Polygon","id":"MA","arcs":[[128,129,130,131,-68,132,133,134]],"properties":{"name":"Massachusetts"}},{"type":"MultiPolygon","id":"MI","arcs":[[[-102,135,136]],[[137]],[[138,139]],[[140]]],"properties":{"name":"Michigan"}},{"type":"Polygon","id":"MN","arcs":[[-107,141,142,143,144]],"properties":{"name":"Minnesota"}},{"type":"Polygon","id":"MS","arcs":[[-4,145,-116,-51,146]],"properties":{"name":"Mississippi"}},{"type":"Polygon","id":"MO","arcs":[[-97,-114,147,-55,148,-108,149,-104]],"properties":{"name":"Missouri"}},{"type":"Polygon","id":"MT","arcs":[[150,151,-92,152,153]],"properties":{"name":"Montana"}},{"type":"Polygon","id":"NE","arcs":[[-105,-150,-110,-59,154,155]],"properties":{"name":"Nebraska"}},{"type":"Polygon","id":"NV","arcs":[[156,-48,-56,157,-88]],"properties":{"name":"Nevada"}},{"type":"Polygon","id":"NH","arcs":[[-135,158,159,-120,160]],"properties":{"name":"New Hampshire"}},{"type":"Polygon","id":"NJ","arcs":[[161,-69,162,163]],"properties":{"name":"New Jersey"}},{"type":"Polygon","id":"NM","arcs":[[164,165,166,-45,-62]],"properties":{"name":"New Mexico"}},{"type":"Polygon","id":"NY","arcs":[[-133,-67,167,-164,168,169,170]],"properties":{"name":"New York"}},{"type":"Polygon","id":"NC","arcs":[[171,172,-80,173,174]],"properties":{"name":"North Carolina"}},{"type":"Polygon","id":"ND","arcs":[[175,-154,176,-143]],"properties":{"name":"North Dakota"}},{"type":"Polygon","id":"OH","arcs":[[177,-115,-99,-137,178,179]],"properties":{"name":"Ohio"}},{"type":"Polygon","id":"OK","arcs":[[-149,-54,180,-165,-61,-109]],"properties":{"name":"Oklahoma"}},{"type":"Polygon","id":"OR","arcs":[[-89,-158,-58,181,182]],"properties":{"name":"Oregon"}},{"type":"Polygon","id":"PA","arcs":[[-163,-72,-128,183,-180,184,-169]],"properties":{"name":"Pennsylvania"}},{"type":"MultiPolygon","id":"RI","arcs":[[[185,-130]],[[186,-65,-132]]],"properties":{"name":"Rhode Island"}},{"type":"Polygon","id":"SC","arcs":[[187,-77,-173]],"properties":{"name":"South Carolina"}},{"type":"Polygon","id":"SD","arcs":[[-142,-106,-156,188,-151,-176]],"properties":{"name":"South Dakota"}},{"type":"Polygon","id":"TN","arcs":[[189,-174,-79,-5,-147,-50,-148,-113]],"properties":{"name":"Tennessee"}},{"type":"Polygon","id":"TX","arcs":[[-53,-118,190,-166,-181]],"properties":{"name":"Texas"}},{"type":"Polygon","id":"UT","arcs":[[191,-63,-49,-157,-87]],"properties":{"name":"Utah"}},{"type":"Polygon","id":"VT","arcs":[[-134,-171,192,-159]],"properties":{"name":"Vermont"}},{"type":"MultiPolygon","id":"VA","arcs":[[[193,-123]],[[120]],[[-126,-73,-125,194,-175,-190,-112,195]]],"properties":{"name":"Virginia"}},{"type":"MultiPolygon","id":"WA","arcs":[[[-183,196,-90]],[[197]],[[198]]],"properties":{"name":"Washington"}},{"type":"Polygon","id":"WV","arcs":[[-184,-127,-196,-111,-178]],"properties":{"name":"West Virginia"}},{"type":"Polygon","id":"WI","arcs":[[199,-93,-103,-145,200,-140]],"properties":{"name":"Wisconsin"}},{"type":"Polygon","id":"WY","arcs":[[-189,-155,-64,-192,-86,-152]],"properties":{"name":"Wyoming"}}]}},"arcs":[[[2632,3060],[5,-164],[7,-242],[4,-53],[3,-30],[-2,-19],[4,-11],[-5,-25],[0,-24],[-2,-32],[2,-57],[-2,-51],[3,-52]],[[2649,2300],[-14,-1],[-59,0],[-1,-25],[6,-37],[-1,-31],[2,-16],[-4,-28]],[[2578,2162],[-4,-6],[-7,31],[-1,47],[-2,6],[-3,-36],[-1,-34],[-7,9]],[[2553,2179],[-2,291],[6,363],[4,209],[-3,20]],[[2558,3062],[24,1],[50,-3]],[[1324,6901],[1,32],[6,-19],[-1,-32],[-8,4],[2,15]],[[1317,6960],[5,-23],[-3,-33],[-2,11],[0,45]],[[1285,7153],[6,5],[3,-8],[-1,-28],[-6,-6],[-5,17],[3,20]],[[1267,7137],[12,-7],[3,-36],[13,-41],[4,-25],[0,-21],[3,-4],[1,-27],[5,-27],[0,-25],[3,8],[2,-19],[1,-74],[-3,-17],[-7,3],[-3,38],[-2,-3],[-6,28],[-2,-10],[-5,10],[1,-28],[5,7],[3,-10],[-2,-39],[-5,4],[-9,49],[-2,25],[1,26],[-7,-2],[0,20],[5,2],[5,18],[-2,31],[-6,7],[-1,50],[-2,25],[-4,-18],[-2,28],[4,14],[-3,32],[2,8]],[[1263,6985],[5,-12],[4,15],[4,-7],[-4,-28],[-6,8],[-3,24]],[[1258,7247],[-4,19],[5,13],[15,-18],[7,1],[5,-36],[9,-29],[-1,-22],[-5,-11],[-6,5],[-5,-14],[-6,9],[-7,-9],[-1,45],[0,30],[-5,1],[-1,16]],[[1252,7162],[-4,14],[-4,32],[0,24],[3,11],[4,-11],[0,20],[12,-35],[1,-33],[-4,-5],[-3,-37],[3,-11],[-3,-43],[-5,9],[0,-27],[-3,13],[-2,54],[5,25]],[[1207,7331],[8,38],[3,-16],[7,-13],[6,-2],[0,-30],[6,-99],[0,-85],[-1,-22],[-4,13],[-10,84],[-7,25],[3,20],[-3,48],[-8,39]],[[1235,7494],[10,-15],[5,2],[0,-14],[8,-52],[-5,8],[-2,-18],[6,-27],[2,-48],[-6,-13],[-2,-16],[-10,-35],[-3,1],[-1,37],[2,22],[-1,32],[-3,40],[0,21],[-2,51],[-4,22],[-1,38],[7,-36]],[[1203,7324],[4,0],[4,-35],[-2,-24],[-6,-5],[0,38],[0,26]],[[1207,7331],[-5,7],[-3,26],[-6,18],[-5,37],[-6,17],[1,30],[4,10],[1,26],[3,-11],[8,-1],[6,17],[8,-23],[-5,-26],[2,-9],[4,28],[10,-9],[5,-21],[-3,-38],[3,-3],[3,-50],[-7,-7],[-14,41],[0,-42],[-4,-17]],[[883,7871],[-12,-48],[-1,-19],[-9,-12],[2,29],[10,30],[7,34],[3,-14]],[[870,7943],[-2,-39],[-4,-41],[-6,14],[5,47],[7,19]],[[863,9788],[3,-8],[15,-9],[8,5],[10,0],[12,-7],[7,4],[7,-15],[12,-18],[16,-4],[5,10],[11,6],[4,14],[12,2],[0,-9],[7,5],[15,-15],[9,-24],[10,-11],[2,-11],[8,-2],[8,-18],[1,-11],[5,9],[6,-7],[0,-1783],[13,-16],[2,17],[14,-24],[8,30],[18,4],[-3,-52],[4,-17],[10,-17],[2,-27],[29,-101],[4,-63],[6,17],[12,31],[7,1],[3,23],[0,34],[5,0],[1,31],[9,7],[13,26],[13,-45],[-1,-27],[3,-27],[7,-7],[10,-40],[-1,-12],[4,-22],[12,-25],[19,-110],[3,-29],[6,-29],[8,-65],[9,-55],[-3,-23],[9,-9],[-2,-33],[7,-14],[1,-38],[7,2],[14,-40],[9,-7],[5,-19],[4,-5],[1,-19],[9,-5],[3,-23],[-4,-43],[1,-36],[4,-58],[-4,-15],[-6,-53],[-10,-39],[-3,20],[-4,-6],[-3,39],[1,17],[-3,20],[7,21],[-2,7],[-7,-26],[-3,17],[-4,-10],[-12,42],[4,46],[-8,-15],[0,-23],[-6,17],[-1,22],[4,24],[-1,24],[-6,-19],[-6,42],[-3,-8],[-2,36],[5,23],[6,0],[-2,28],[3,36],[-5,-1],[-9,32],[-6,37],[-15,27],[0,77],[-4,9],[1,31],[-5,9],[-8,42],[-2,22],[-12,7],[-14,56],[-6,132],[-3,-30],[1,-27],[6,-53],[-1,-8],[3,-43],[0,-28],[-6,6],[-4,31],[-6,6],[-8,-9],[0,45],[-5,38],[-5,-12],[-17,40],[-2,-11],[10,-13],[7,-31],[3,-1],[1,-25],[4,-30],[-10,-16],[-5,10],[0,-26],[-8,20],[-2,14],[-5,0],[-13,38],[-10,33],[-1,20],[-5,30],[-14,21],[-9,21],[-14,26],[-9,24],[1,26],[2,-9],[3,17],[-3,38],[4,21],[-2,9],[-7,-40],[-14,-26],[-18,10],[-14,24],[-1,18],[-7,-4],[-7,14],[-17,12],[-9,1],[-21,-10],[-8,-7],[-10,27],[-12,12],[-3,17],[-2,28],[-8,-2],[-3,-25],[-15,34],[-2,14],[-15,-27],[-7,-32],[-3,30],[3,17],[4,-5],[14,22],[-2,17],[-6,-8],[-3,22],[-6,3],[-6,55],[-3,-13],[-8,-8],[-3,8],[-3,-18],[-11,6],[-1,-20],[-7,-5],[-3,7],[2,36],[-3,-1],[-5,-38],[7,-12],[1,-27],[4,-30],[-3,-31],[-5,10],[-2,-15],[6,-7],[3,-41],[-8,-9],[-4,9],[-7,-12],[-3,10],[-9,-2],[0,16],[-4,-10],[-3,-20],[-3,18],[-5,-25],[2,-12],[-6,-15],[-6,-2],[-3,-20],[-6,-17],[-4,6],[-5,-21],[-4,1],[-8,-43],[-9,-3],[-3,14],[-5,-23],[-11,17],[2,33],[8,11],[4,-2],[2,13],[8,25],[0,21],[-11,-28],[-9,16],[-1,12],[5,48],[8,34],[1,29],[2,5],[1,30],[-4,34],[10,12],[19,48],[4,-19],[6,-5],[9,20],[-10,26],[-4,20],[-7,-2],[-5,9],[-2,-8],[-9,-14],[-4,-26],[-9,-6],[-9,-30],[-1,-20],[-7,-11],[-2,-22],[-5,-13],[-2,-39],[-10,-25],[5,-20],[-4,-29],[-9,-5],[-1,-38],[-8,-13],[-3,15],[-4,-29],[-5,-1],[1,-21],[-11,-13],[-2,-57],[12,-3],[10,-16],[3,-19],[-4,-30],[-7,-19],[-6,-1],[0,-17],[-4,-6],[1,-21],[-4,-31],[-9,-29],[-5,0],[-5,-11],[-5,2],[-4,-11],[2,-16],[-7,-8],[-2,-23],[-5,14],[-5,-45],[-9,4],[1,-24],[-6,6],[-3,-11],[0,-32],[-6,-50],[-10,-6],[-7,-23],[-2,-13],[-5,18],[-8,-48],[-2,13],[-5,-4],[-1,-27],[-5,-10],[-6,4],[-4,-27],[8,-9],[-9,-60],[-25,-20],[-6,-54],[-2,12],[1,33],[-5,6],[-6,-13],[-1,-14],[-10,-22],[-4,-25],[-1,18],[-2,-21],[-6,14],[-10,-33],[-8,2],[1,25],[-4,24],[-3,-20],[1,-21],[-11,-64],[-3,16],[-1,-24],[-8,4],[-1,38],[-4,8],[-2,-14],[4,-16],[-2,-27],[-5,-13],[-5,29],[-5,2],[-1,-11],[5,-17],[-9,-27],[6,-7],[0,-13],[-5,9],[-7,-25],[-15,1],[-7,-16],[0,-13],[-8,-15],[-6,6],[-2,35],[6,12],[4,43],[6,1],[13,28],[10,1],[4,-27],[3,20],[-1,23],[6,10],[7,0],[8,50],[10,45],[12,40],[15,18],[6,-9],[6,12],[1,-17],[-3,-19],[4,-14],[1,23],[7,2],[2,-15],[5,-5],[0,18],[-8,15],[0,11],[5,49],[6,28],[9,27],[15,24],[10,35],[5,-13],[4,5],[-1,22],[1,21],[8,44],[11,28],[8,38],[0,21],[7,148],[11,40],[-1,31],[-27,-45],[-8,6],[-2,18],[-5,9],[-1,21],[-4,-10],[-3,-32],[5,-41],[-6,-18],[-5,7],[-9,64],[-6,33],[-4,0],[-2,-24],[-3,-4],[-4,19],[-5,4],[-2,32],[-16,-37],[-13,-26],[-1,-14],[-11,-22],[-6,20],[5,23],[-1,54],[-4,57],[7,24],[-6,49],[-5,27],[-4,39],[-6,17],[-2,-34],[-7,-8],[-12,-22],[-14,-9],[-7,2],[-7,12],[-1,30],[-5,9],[-9,42],[-8,8],[-8,46],[6,21],[1,39],[-5,-8],[0,24],[2,19],[-6,18],[0,-19],[-7,8],[-1,32],[-6,4],[-3,22],[0,27],[-5,-12],[-1,26],[7,6],[-6,30],[10,2],[0,35],[2,24],[18,77],[4,23],[3,-5],[-2,33],[7,55],[6,22],[11,9],[8,-9],[12,-33],[8,4],[11,32],[11,49],[6,6],[1,-13],[13,0],[12,10],[11,52],[0,12],[-5,48],[-1,28],[-8,31],[-3,26],[8,-7],[8,22],[0,20],[-10,39],[-8,-30],[-7,5],[-6,-17],[-8,-4],[-2,-11],[-9,-17],[-2,-28],[-5,-12],[-2,34],[-5,7],[-4,-26],[-2,12],[-10,19],[-20,-1],[-14,-21],[-6,-3],[-11,13],[-22,14],[-6,12],[-3,19],[2,26],[-8,22],[2,24],[5,12],[-2,31],[-8,0],[-6,8],[-13,6],[-7,16],[-10,16],[-1,19],[16,27],[20,43],[15,27],[8,-15],[8,-3],[2,21],[-5,3],[-1,18],[20,29],[22,22],[12,2],[7,-7],[-4,-32],[2,-22],[-3,-15],[4,-26],[8,5],[10,-5],[11,6],[4,-10],[7,-2],[7,10],[8,-11],[9,42],[5,2],[5,-8],[2,24],[-12,11],[-11,-9],[1,31],[-8,34],[-10,10],[-2,30],[7,8],[9,-31],[-1,-24],[4,-18],[10,-22],[2,23],[-11,30],[5,54],[-4,10],[-11,-12],[-11,3],[-2,10],[-6,-10],[-24,23],[0,24],[-7,54],[-6,19],[-9,17],[-19,46],[-9,18],[-8,4],[-13,31],[-12,18],[-1,6],[9,10],[4,29],[1,59],[25,-4],[31,13],[8,11],[12,29],[12,45],[3,45],[5,38],[10,33],[5,24],[13,38],[2,-10],[11,-3],[16,20],[10,21],[24,64],[9,4],[1,-10],[9,7],[9,-2],[18,9],[17,28],[17,58],[7,13],[2,-10],[26,-24],[2,-17],[-9,-22],[-4,-1],[0,-29],[14,9],[0,16],[6,14],[2,-8],[5,33],[13,-30],[-2,-23],[8,-6],[5,-14],[7,22],[13,1],[7,7],[18,-7],[10,-8],[-5,-45],[17,-12],[2,-11],[16,-20],[1,9],[12,13],[11,-1],[0,-11],[7,-1],[7,15],[11,2],[9,-6],[11,-16],[5,3],[7,-22],[4,9],[7,-7],[5,-13]],[[717,7456],[-1,-8],[-9,13],[7,49],[6,4],[4,45],[5,-40],[4,14],[8,-22],[0,-31],[-11,-4],[-5,-13],[-8,-7]],[[688,7363],[8,25],[-8,6],[0,22],[6,14],[5,-10],[0,-22],[3,15],[0,32],[5,-15],[1,21],[5,-12],[5,0],[5,11],[7,-20],[0,-55],[9,4],[-6,-37],[-11,15],[4,-24],[-3,-20],[-6,10],[0,-38],[-8,-10],[-3,-16],[-5,15],[-6,-40],[-4,-4],[-5,-18],[-2,43],[-6,-23],[-1,13],[-6,14],[0,39],[-6,15],[4,45],[11,28],[7,-2],[1,-21]],[[671,7185],[-6,-39],[-2,6],[8,33]],[[640,7055],[4,-2],[-1,-40],[-8,6],[-1,13],[6,23]],[[519,6933],[-2,-41],[-9,-33],[5,51],[2,-5],[4,28]],[[501,6947],[5,0],[0,-20],[-5,-23],[-5,15],[-3,-14],[-2,35],[2,12],[8,-5]],[[451,6875],[1,-16],[-3,-11],[-3,18],[5,9]],[[447,8527],[-4,-19],[-2,16],[6,3]],[[436,6781],[6,-7],[-1,-16],[-5,1],[0,22]],[[358,6745],[2,-22],[-5,-10],[-1,23],[4,9]],[[352,6718],[-8,-21],[-2,14],[3,19],[7,-12]],[[335,7902],[6,7],[2,-14],[5,3],[6,-12],[1,-54],[-3,-18],[-7,-11],[-2,-18],[-11,20],[-5,-1],[-10,28],[-4,0],[-6,15],[-3,25],[4,7],[10,-7],[5,20],[5,2],[3,14],[4,-6]],[[334,6690],[5,-14],[-10,-36],[1,-6],[12,26],[0,-15],[-5,-17],[-8,-12],[-1,-18],[-8,-18],[-7,-1],[-5,-18],[-9,-16],[-5,17],[9,20],[3,-3],[8,16],[-2,19],[4,20],[6,-9],[1,12],[-7,4],[-4,14],[4,23],[11,13],[2,-26],[5,25]],[[266,6527],[10,37],[1,16],[4,17],[7,9],[3,-10],[1,-25],[-12,-27],[-6,-40],[-6,-13],[-2,36]],[[238,6477],[2,-19],[-8,-1],[-1,13],[7,7]],[[227,7303],[-4,-18],[-1,18],[5,0]],[[212,6440],[2,-18],[-5,-13],[-1,19],[4,12]],[[182,8542],[22,-28],[13,24],[6,-2],[5,-14],[2,-23],[11,-12],[4,-12],[15,-5],[8,-8],[-4,-28],[-7,6],[-8,-5],[-4,-13],[-4,-28],[-5,26],[-6,18],[-6,2],[-3,20],[-15,25],[-6,1],[-11,-22],[-7,11],[-4,23],[4,44]],[[162,6381],[0,-22],[-5,-4],[1,19],[4,7]],[[128,6335],[4,-8],[10,1],[1,-7],[-13,-9],[-2,23]],[[108,6360],[0,19],[4,7],[6,-19],[-2,-17],[-4,1],[1,-20],[-5,-2],[-12,-21],[-6,6],[2,15],[7,-2],[9,33]],[[47,6279],[5,3],[0,-24],[-6,3],[-8,-28],[-4,37],[4,1],[0,29],[5,1],[0,-21],[4,-1]],[[28,6296],[3,-9],[-2,-32],[-5,-10],[0,20],[4,31]],[[0,6291],[5,-1],[4,-23],[-4,-27],[-5,51]],[[9993,6496],[6,-13],[0,-19],[-11,-12],[-8,31],[0,15],[13,-2]],[[1966,3444],[-1,-1081]],[[1965,2363],[-57,0],[-34,71],[-73,150],[3,43]],[[1804,2627],[6,8],[1,16],[-1,36],[-4,1],[-2,71],[6,27],[0,28],[-1,45],[4,34],[4,12],[4,25],[-6,27],[-4,51],[-5,31],[0,24]],[[1806,3063],[2,26],[0,36],[-3,36],[-2,112],[11,7],[3,-23],[3,1],[3,33],[0,153]],[[1823,3444],[101,2],[42,-2]],[[2515,3253],[-1,-35],[-4,-11],[-1,-29],[-5,-31],[0,-46],[-3,-34],[-3,-5]],[[2498,3062],[2,-17],[-4,-14],[-2,-33],[-3,-8],[0,-38],[-5,-10],[0,-13],[-6,-31],[2,-21],[-5,-30],[-5,-59],[5,-25],[-2,-16],[1,-39],[-2,-26]],[[2474,2682],[-69,3],[-13,0]],[[2392,2685],[0,101],[-4,8],[-5,-9],[-3,18]],[[2380,2803],[1,335],[-5,211]],[[2376,3349],[4,0],[123,-1],[2,-36],[-4,-23],[-4,-36],[18,0]],[[1654,4398],[0,-331],[0,-241],[36,-171],[35,-169],[27,-137],[20,-101],[34,-185]],[[1804,2627],[-38,-18],[-30,-16],[-4,25],[0,40],[-2,47],[-4,33],[-9,46],[-12,43],[-2,-12],[-4,8],[1,18],[-5,39],[-7,-8],[-12,28],[-2,23],[-8,28],[-9,-1],[-7,13],[-10,-6],[-5,26],[1,53],[-1,8],[1,38],[-8,28],[0,39],[-3,2],[-4,33],[-4,8],[-1,20],[-11,79],[-5,23],[-1,61],[2,-5],[2,37],[-4,33],[-5,-4],[-7,30],[-2,24],[0,23],[-3,31],[0,50],[5,0],[-2,70],[-2,-7],[-1,-35],[-5,-7],[-7,26],[-1,45],[-4,35],[-6,22],[-3,25],[-9,50],[2,14],[-4,64],[2,35],[-3,54],[-7,52],[-7,29],[-2,35],[7,83],[2,29],[-2,22],[3,57],[-2,52],[-3,13],[1,42]],[[1534,4399],[28,1],[24,1],[38,-3],[30,0]],[[2107,4208],[57,0],[0,-191]],[[2164,4017],[1,-574]],[[2165,3443],[-28,1]],[[2137,3444],[-38,-1],[-72,0],[-15,1],[-46,0]],[[1966,3444],[0,223],[-1,21],[0,162],[0,357]],[[1965,4207],[32,1],[63,-1],[47,1]],[[3025,4400],[0,-113],[-2,-18]],[[3023,4269],[-2,3],[-12,-14],[-15,4],[-7,-26],[-7,-9],[-8,-22]],[[2972,4205],[-2,22],[7,21],[-2,16],[2,144]],[[2977,4408],[12,-2],[36,-3],[0,-3]],[[2922,3980],[-2,-23]],[[2920,3957],[-3,-13],[0,-30],[5,-29],[1,-47],[6,-49],[3,-2],[1,-66]],[[2933,3721],[-19,2],[-2,241]],[[2912,3964],[5,21],[5,-5]],[[2876,3786],[-2,27]],[[2874,3813],[2,12],[4,-19],[-4,-20]],[[2649,2300],[4,-55],[39,-13],[37,-14],[1,-41],[4,1],[1,39],[-1,35],[2,15],[7,-16],[8,-7]],[[2751,2244],[1,-83],[4,-93],[8,-122],[13,-131],[-2,-9],[1,-61],[5,-68],[8,-137],[2,-42],[0,-44],[-3,-158],[-3,-3],[-3,-49],[1,-16],[-5,-36],[-2,9],[-6,-15],[-9,-8],[-2,20],[1,29],[-7,85],[-5,15],[-4,-11],[-3,47],[-1,38],[-6,43],[-2,28],[1,41],[-3,8],[1,-24],[-3,-7],[-9,104],[-4,26],[9,76],[-6,-4],[-4,-24],[-3,38],[5,104],[1,87],[-4,21],[-1,28],[-5,6],[-7,46],[-5,19],[0,28],[-4,11],[-3,31],[-11,42],[-9,-10],[0,-29],[-3,5],[-12,-35],[-12,-9],[0,21],[-3,25],[-15,57],[-10,24],[-10,6],[-8,-4],[-17,-18]],[[2703,3063],[-6,-41],[0,-20],[9,-40],[3,3],[5,-42],[1,-22],[4,-40],[7,-24],[3,-35],[8,-33],[0,-22],[5,-35],[7,-29],[2,-32],[1,-40],[3,-14],[5,-51],[0,-33],[7,-16]],[[2767,2497],[-7,-65],[-2,-34],[-3,-29],[0,-30],[-3,-14],[-1,-81]],[[2632,3060],[37,1]],[[2669,3061],[20,-1],[14,3]],[[640,0],[-7,17],[-1,16],[1,43],[-5,73],[4,24],[2,34],[-2,22],[1,23],[8,-27],[9,-20],[5,-29],[0,-26],[8,-40],[-5,-34],[-8,-15],[-7,-25],[-3,-36]],[[613,397],[3,-26],[4,11],[9,-30],[-1,-27],[-9,-14],[-2,6],[-1,33],[-5,7],[-1,19],[3,21]],[[602,432],[-3,-20],[-7,0],[2,22],[8,-2]],[[574,525],[3,-45],[-2,-26],[-6,-5],[-4,54],[4,1],[5,21]],[[531,626],[3,-2],[2,-20],[-1,-28],[-4,-18],[-9,22],[1,31],[8,15]],[[1908,4871],[0,-472]],[[1908,4399],[-31,-1],[-54,0]],[[1823,4398],[-85,1]],[[1738,4399],[0,349],[4,62],[-2,16],[-6,3],[-2,26],[6,68],[3,6],[3,29],[-1,17],[4,23],[1,34],[6,56],[-2,26],[-7,14],[-4,32]],[[1741,5160],[0,34],[-3,33],[0,16],[0,255],[0,236]],[[1738,5734],[28,0]],[[1766,5734],[0,-195],[9,-54],[1,-52],[5,-23],[6,-8],[0,-14],[11,-51],[1,-21],[8,-20],[0,-12],[8,1],[-4,-71],[-1,-45],[3,-29],[-5,-21],[2,-20],[-1,-21],[6,-20],[7,26],[3,21],[5,-19],[-1,-15],[3,-37],[5,-39],[3,-13],[0,-37],[3,-16],[6,-2],[4,-61],[3,-11],[3,18],[9,-1],[7,17],[3,-10],[7,9],[2,-11],[5,8],[7,39],[4,-33],[5,-20]],[[2489,4496],[53,-3],[28,0]],[[2570,4493],[-1,-37],[4,-43],[5,-70]],[[2578,4343],[0,-450],[-3,-35],[3,-40],[1,-34],[-4,-27],[-1,-25],[-5,-41],[-3,-3],[0,-24],[-2,-9],[-1,-45],[0,-13]],[[2563,3597],[-3,-27],[2,-34],[-11,-17],[-1,-20],[2,-25],[-3,-16],[-11,29],[-3,-2],[-4,-33],[1,-11]],[[2532,3441],[-5,2],[-6,55],[2,12],[-2,37],[0,29],[-9,41],[-3,-4],[-3,25],[-9,38],[0,31],[5,49],[-1,18],[3,23],[-4,13],[-6,9],[-3,-18],[-3,11],[-1,63],[-10,41],[-9,49],[-3,58],[-1,39],[3,27]],[[2467,4089],[0,35],[8,21],[1,29],[4,19],[0,33],[-4,27],[2,34],[11,9],[9,24],[0,29],[4,13],[1,37],[0,24],[-7,18],[-1,20],[-6,35]],[[2655,4340],[0,-228],[0,-266]],[[2655,3846],[-2,-9],[2,-52],[-5,-1],[-5,-18],[-8,9],[1,-38],[-5,-16],[-2,-24],[-5,-9],[-3,-48],[-3,-13],[-6,18],[-1,22],[-7,-24],[1,-21],[-7,-7],[-1,19],[-8,-19],[-2,-20],[-7,28],[-4,-6],[-2,13],[-3,-13],[-7,-2],[-3,-18]],[[2578,4343],[3,-12],[8,0],[9,22]],[[2598,4353],[23,0],[34,0],[0,-13]],[[2473,4685],[0,-28],[4,-19],[-3,-23],[1,-43],[2,-30],[10,-22],[2,-24]],[[2467,4089],[-3,7],[-6,38],[-3,-1],[-40,-5],[-39,-2],[-33,3]],[[2343,4129],[-3,25],[2,49],[-3,43],[0,48],[-5,17],[-1,26],[2,23],[-2,33],[-4,13],[-5,86]],[[2324,4492],[-5,41],[2,29],[1,37],[2,14],[-3,19],[1,33],[-2,16],[4,4]],[[2324,4685],[144,0],[5,0]],[[2356,4017],[3,-18],[9,-14],[-6,-56],[4,-18],[4,-45],[6,-10],[0,-412]],[[2376,3444],[-156,0],[-55,-1]],[[2164,4017],[5,0],[187,0]],[[2718,3716],[-1,-57],[4,-37],[4,-28],[2,-22],[5,-22],[4,-3]],[[2736,3547],[-11,-51],[-11,-29],[0,-14],[-4,-13],[0,-16],[-6,-8],[-1,-21],[-16,-27]],[[2687,3368],[0,-3],[-24,2],[-22,6],[-5,-2],[-32,8],[-36,-5],[-6,9],[1,-35],[-36,2],[-3,-2]],[[2524,3348],[1,24],[5,-8],[2,77]],[[2655,3846],[11,0],[5,-40],[1,-17],[9,-7],[6,-26],[5,13],[10,-14],[4,19],[4,6],[1,-32],[3,-6],[4,-26]],[[2474,2682],[3,-22],[-2,-9],[-1,-38],[5,-24],[0,-57],[-3,-44],[-7,-27],[-2,-43],[-2,4],[-1,-70],[-3,-2],[2,-37],[-2,-14],[54,0],[-3,-63],[4,-41],[1,-32],[4,-20]],[[2521,2143],[-9,-26],[0,-19],[7,-12],[3,30],[6,-30],[-1,-24],[-3,-11],[-7,10],[1,-18],[-2,-27],[5,-24],[9,-7],[3,-29],[3,-4],[-5,-32],[-5,6],[-4,33],[-10,18],[0,33],[-6,-11],[1,-27],[-3,-25],[-3,-4],[-3,28],[-7,1],[-2,-29],[-4,-9],[-5,18],[-4,2],[-3,47],[-7,21],[-2,-3],[-3,40],[-7,-5],[0,24],[-8,-23],[1,-18],[-5,-17],[-9,8],[-10,27],[-7,11],[-16,-9],[-2,-8]],[[2398,2049],[-2,19],[6,68],[-2,37],[2,20],[-1,26],[3,19],[3,50],[0,40],[-8,78],[0,41],[-7,42],[0,196]],[[3046,5029],[12,26],[-2,13],[5,30],[4,13],[-1,12],[5,18],[-1,33],[2,50],[5,17],[1,53],[22,147],[6,-7],[0,-35],[4,-13],[9,21],[6,0],[4,14],[8,-31],[4,-25],[1,-214],[-1,-51],[10,-14],[-2,-22],[3,-21],[-2,-18],[4,-30],[5,7],[5,-68],[-6,-31],[-3,12],[-3,-21],[-4,5],[0,-18],[-6,2],[-8,-40],[-2,28],[-3,2],[1,-30],[-6,-15],[-2,24],[-3,-12],[-7,0],[0,28],[-5,-6],[1,-20],[-4,-42],[1,-12],[-6,-23],[-5,9],[-3,-24],[-4,-3],[-4,-20],[-4,4],[-1,21],[-7,-34],[2,-21],[-5,-7],[0,-18],[-5,-22],[-5,-50]],[[3056,4600],[-3,14],[0,19],[-4,22],[-2,250],[-1,124]],[[2904,3626],[2,0],[-1,0],[-1,0]],[[2933,3721],[-6,-80]],[[2927,3641],[-4,-3],[-8,-12]],[[2915,3626],[-6,-8],[0,31],[-2,13],[3,13],[-4,32],[-2,-14],[-6,3],[-2,35],[2,0],[0,45],[2,18],[-2,60],[3,36],[5,6],[0,37],[-3,-5],[0,-18],[-8,-25],[-2,-21],[0,-56],[-3,-26],[1,-44],[4,-30],[-1,-23],[3,-23],[-2,-16],[-6,30],[-10,15],[-2,29],[-6,-16],[-2,23],[5,29]],[[2874,3756],[2,30]],[[2874,3813],[-4,18],[-6,10],[0,28],[-3,15],[-4,4]],[[2857,3888],[-4,53],[-4,0],[-5,18],[-3,-15],[-5,1],[-1,-21],[-8,14],[-6,-28],[-3,6],[-6,-33],[-6,-17],[1,98]],[[2807,3964],[105,0]],[[3053,4565],[1,-34],[-1,-27],[-5,-25],[0,-29],[6,-4],[4,-31],[0,-24],[3,-6],[0,-22],[8,-19],[9,18],[-2,-26],[-13,-23],[-5,-1],[-3,18],[-5,-6],[0,-13],[-5,-9]],[[3045,4302],[-3,35]],[[3042,4337],[0,6]],[[3042,4343],[-3,14],[-2,45],[-4,0],[-8,-2]],[[2977,4408],[0,7],[6,126]],[[2983,4541],[23,-3]],[[3006,4538],[34,-7],[3,18],[7,19],[3,-3]],[[2598,4353],[5,25],[4,43],[4,26],[3,36],[1,52],[0,57],[-9,111],[3,42],[-2,50],[6,51],[2,43],[-1,23],[5,9],[0,31],[8,9],[5,34],[0,-69],[3,-3],[3,35],[1,58],[2,15],[8,9],[-3,41],[5,35],[7,2],[7,-22],[7,-3],[3,-28],[6,-2],[9,-25],[3,1],[4,-41],[-3,-21],[3,-29],[2,-32],[-2,-71],[-6,-18],[-1,-37],[-7,-12],[-4,-44],[2,-17],[6,-15],[6,24],[6,49],[10,19],[5,-15],[3,-27],[3,-80],[0,-39],[3,-48],[-3,-69],[-4,-11],[-1,25],[-3,-7],[-3,-58],[-6,-21],[-2,-44],[-7,-37],[0,-16]],[[2694,4347],[-39,-7]],[[2635,5110],[1,-23],[-4,-4],[1,33],[2,-6]],[[2496,5270],[11,20],[5,23],[12,9],[8,29],[4,1],[3,20],[9,28],[4,24],[7,15],[6,-13],[-11,-59],[-2,-19],[0,-36],[5,27],[10,-4],[8,-19],[7,-52],[3,-10],[7,9],[2,-12],[7,-6],[16,44],[8,4],[10,-2],[7,15],[6,1],[1,-54],[5,-7],[6,8],[2,-12],[4,16],[8,5],[1,-67],[3,-28],[6,-8],[1,19],[5,0],[3,-20],[-3,-14],[-15,12],[-8,-8],[-8,23],[-2,-21],[1,-18],[-4,4],[-5,27],[-9,15],[-5,1],[-4,-25],[-8,-6],[-8,5],[-3,-10],[-1,-21],[-9,-18],[1,25],[-4,5],[-2,-26],[-6,-1],[-3,-11],[-5,-45],[-8,-58],[1,-5]],[[2576,4989],[-4,20],[2,27],[-7,4],[3,26],[0,34],[-5,23],[-4,24],[-12,19],[-4,-7],[-12,29],[-29,38],[-3,33],[-5,11]],[[2541,5539],[-7,-24],[-4,-3],[1,19],[18,45],[-4,-31],[-4,-6]],[[2324,4685],[0,343],[-7,22],[-5,36],[8,41],[1,22]],[[2321,5149],[-1,76],[-4,20],[-2,42],[0,51],[-1,8],[-1,123],[-5,65],[-3,36],[0,77],[1,27],[-3,60]],[[2302,5734],[59,0],[0,73],[5,-2],[4,-14],[4,-100],[3,-11],[9,-3],[1,-10],[11,-4],[1,-21],[10,5],[0,9],[7,10],[6,-4],[8,-16],[2,-19],[4,2],[4,-43],[2,18],[7,8],[1,-18],[9,-12],[0,-17],[4,-14],[8,8],[5,18],[8,12],[2,-28],[5,6],[6,-6],[6,4],[8,-24],[7,4],[0,-10],[-10,-24],[-13,-19],[-9,-20],[-12,-49],[-5,-31],[-8,-34],[-13,-46],[2,-16]],[[2450,5296],[-2,9],[-6,-16],[0,-113],[-2,-11],[-8,-16],[-6,-41],[-1,-27],[3,-2],[4,-24],[-3,-29],[0,-33],[-2,-70],[8,-34],[6,-3],[3,-21],[8,-21],[2,-25],[8,-33],[5,-7],[5,-42],[-1,-30],[2,-22]],[[2553,2179],[-3,-8],[-7,4],[-3,12],[-7,-8],[-9,-22],[-3,-14]],[[2498,3062],[53,0],[7,0]],[[2524,3348],[-2,0],[-2,0],[1,-47],[-6,-48]],[[2376,3349],[0,95]],[[2356,4017],[-7,50],[-6,62]],[[2108,5151],[0,-181],[-1,0]],[[2107,4970],[-53,1],[-90,0],[-56,0],[0,-100]],[[1766,5734],[130,-1],[58,1],[154,0]],[[2108,5734],[0,-217],[0,-366]],[[2107,4208],[0,382]],[[2107,4590],[21,0],[49,-1],[88,0],[1,-10],[15,-34],[4,19],[4,-4],[13,0],[15,-36],[2,-27],[5,-5]],[[1823,4398],[0,-954]],[[1654,4398],[37,-1],[47,2]],[[3006,4538],[-2,14],[0,28],[3,11],[-1,27],[3,81],[5,37],[2,43],[3,16],[-1,47],[10,17],[5,33],[-3,31],[4,32],[0,18]],[[3034,4973],[4,49],[6,-5],[2,12]],[[3056,4600],[-3,-35]],[[2962,4152],[-5,-13],[-2,-29],[8,-14],[0,-22],[-3,-103],[-9,-76],[-6,-22],[-5,-48],[-3,31],[-8,16],[-10,42],[-1,28],[0,4],[2,11]],[[2922,3980],[8,15],[0,15],[9,31],[2,17],[-9,39],[0,24],[-3,6],[-1,22],[5,33],[-3,20],[7,40],[2,21],[4,13]],[[2943,4276],[13,-41],[9,-28],[-3,-55]],[[2137,3444],[0,-95]],[[2137,3349],[-1,0],[0,-474],[0,-193],[0,-192],[-101,0],[-1,-18],[3,-22]],[[2037,2450],[-48,0],[0,-87],[-24,0]],[[2972,4205],[13,-15],[2,11],[10,0],[6,6],[8,31],[1,-22],[5,-10],[-11,-28],[-22,-42],[-9,-8],[-6,2],[-5,-9],[-2,31]],[[2943,4276],[-2,14],[-4,1],[-5,32],[1,29],[-4,22],[-2,-2],[-3,27],[-125,0],[0,48],[0,3]],[[2799,4450],[17,54],[3,26],[5,18],[-2,32],[-2,7],[-2,52],[17,22],[15,-1],[6,-5],[6,-21],[4,8],[12,-1],[8,14],[8,34],[5,1],[0,52],[3,31],[-7,21],[2,24],[11,32],[4,28],[14,64],[13,32],[19,-5],[23,4]],[[2981,4973],[1,-39],[-2,-36],[3,-34],[-1,-37],[-3,-39],[2,-52],[-1,-16],[4,-31],[-1,-132],[0,-16]],[[2909,3359],[4,-77],[-8,8],[-1,-10],[-10,-11],[-1,-11],[-7,-3],[0,-13],[8,9],[1,-8],[9,9],[3,-18],[5,8],[2,-46],[-2,-22],[-3,-2],[-8,-47],[-9,-2],[-2,-33],[4,-32],[4,-6],[-6,-54],[-6,7],[-9,-6],[-6,-11],[-10,-37],[-7,-48],[-4,-60],[-6,13],[-11,-12]],[[2833,2844],[-32,181],[-32,4],[1,21],[-5,33],[-3,-12],[0,20],[-35,10],[-8,-8],[-6,-17],[-10,-13]],[[2669,3061],[1,45],[5,4],[3,31],[7,29],[7,1],[7,29],[8,10],[6,43],[4,13],[1,-19],[11,37],[5,-8],[4,36],[5,9],[1,45]],[[2744,3366],[20,-5],[19,-3],[23,-1],[103,2]],[[2321,5149],[-213,2]],[[2108,5734],[194,0]],[[2777,4138],[-4,-10],[2,-21],[0,-29],[-4,-46],[-3,-70],[-11,-62],[-3,-8],[-4,12],[-3,-27],[-3,1],[-4,-36],[1,-22],[-3,-18],[-4,29],[-5,-46],[1,-29],[-3,-11],[-1,-25],[-8,-4]],[[2694,4347],[11,-26],[3,-15],[3,14],[6,-30],[4,-9],[14,25],[7,-6],[9,36],[12,34],[14,24]],[[2777,4394],[0,-256]],[[2380,2803],[-11,21],[-3,22],[-7,18],[-2,-16],[-8,1],[-1,10],[-7,-19],[-3,11],[-6,-10],[-5,-29],[-2,17],[-6,14],[-7,0],[-2,21],[-7,-42],[-2,24],[-3,-8],[-3,16],[-7,15],[-5,-25],[-2,26],[-4,3],[-2,21],[-6,8],[-3,-18],[-3,16],[-5,-2],[-6,17],[-6,-2],[-2,36],[-9,2],[-4,-6],[-6,37],[-2,-3],[0,370],[-52,0],[-34,0]],[[1534,4399],[-4,22],[-2,61],[0,43],[-4,33],[3,32],[2,51],[4,54],[2,48],[3,162],[0,22],[3,71],[1,99],[-2,54],[1,32],[12,29]],[[1553,5212],[5,-22],[4,5],[3,2],[6,-20],[3,-23],[1,-57],[15,-21],[12,30],[8,3],[9,-10],[1,-13],[16,27],[3,-9],[9,5],[7,19],[12,17],[12,4],[4,12],[58,-1]],[[2807,3964],[-30,0],[0,174]],[[2777,4394],[5,11],[17,45]],[[3045,4302],[-6,-4],[3,39]],[[3042,4343],[-4,3],[-3,-28],[-1,-40],[-11,-9]],[[2833,2844],[-5,-10],[-6,-31],[-6,-49],[-1,-40],[-5,-31],[-6,0],[-2,-23],[-6,-25],[-4,-28],[-6,-11],[-6,-29],[-1,-14],[-6,-16],[-6,-40]],[[2107,4590],[0,380]],[[2687,3368],[57,-2]],[[2398,2049],[-5,-1],[-14,-26],[-6,15],[-1,31],[-3,-22],[-3,5],[-1,-27],[3,-11],[0,-36],[-5,-37],[-9,-47],[-17,-51],[-2,9],[-5,-13],[0,12],[-7,-9],[-3,24],[-2,-5],[7,-49],[-5,-16],[-5,10],[-1,-35],[-7,-35],[-6,-66],[-4,-69],[-3,5],[-1,-25],[3,6],[-2,-50],[-2,-2],[0,-28],[3,-16],[1,-57],[3,-20],[0,-37],[3,-32],[-9,-20],[-3,25],[-7,10],[-9,-3],[-8,32],[-5,3],[-5,25],[-6,8],[-4,24],[-2,58],[-5,34],[0,30],[-2,31],[1,27],[-4,30],[-3,4],[-5,27],[-1,34],[-5,32],[-6,26],[-3,57],[-2,16],[-4,46],[-1,38],[-4,27],[-6,24],[-1,16],[-6,15],[-4,42],[-13,9],[-7,-2],[-7,15],[-1,-20],[-7,-6],[-5,-40],[-3,-64],[-2,-1],[-4,-37],[-5,-1],[-7,29],[-17,47],[-4,25],[-6,24],[-5,54],[-1,49],[-4,40],[-2,35],[-3,22],[-11,32],[-6,44],[-4,15],[-6,38],[-7,20],[-5,50],[-4,11]],[[1908,4399],[0,-192],[57,0]],[[2981,4973],[30,-2],[23,2]],[[2927,3641],[-4,-32],[-3,-12],[-3,-44],[-6,-71],[-5,-15],[-1,27],[2,58],[8,74]],[[2874,3756],[-4,-8],[-2,-28],[1,-19],[8,6],[1,-31],[10,-12],[3,-24],[8,-26],[-4,-54],[4,-41],[-4,-20],[-1,-24],[4,-15],[-4,-23],[-6,30],[-1,-10],[5,-22],[14,-5],[3,-71]],[[2736,3547],[-1,-16],[4,-32],[5,-16],[4,1],[5,25],[4,-20],[7,11],[13,36],[1,-11],[5,17],[0,34],[4,30],[5,29],[2,34],[6,36],[2,44],[5,-27],[4,-8],[3,16],[6,68],[4,-17],[13,77],[2,57],[15,-64],[3,37]],[[1553,5212],[-5,7],[-4,-12],[-6,17],[1,26],[4,14],[-6,40],[-4,103],[-2,14],[-3,73],[-6,28],[-2,56],[3,38],[6,-18],[11,-24],[8,1],[8,-9],[8,9],[3,-16],[7,1],[5,-42],[3,3],[1,-56],[2,-52],[3,6],[-3,43],[1,43],[4,44],[-3,18],[-1,31],[-3,35],[2,25],[-2,29],[-5,4],[-4,22],[1,21],[163,0]],[[1576,5602],[4,9],[0,-39],[-5,15],[1,15]],[[1568,5655],[3,25],[4,-30],[-1,-27],[-7,8],[1,24]],[[2576,4989],[-1,-23],[-6,-4],[-4,-44],[-2,-30],[3,-6],[5,20],[4,38],[6,15],[5,48],[6,10],[-1,-25],[-4,-23],[-8,-79],[-2,-44],[0,-32],[-3,-10],[-2,-43],[1,-37],[-3,-24],[-3,-59],[0,-47],[4,-42],[-1,-55]],[[2450,5296],[6,-2],[20,33],[8,17],[2,-13],[-4,-25],[9,-33],[5,-3]]]};
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';
  Datamap.prototype.virginiaTopo = {"type":"Topology","arcs":[[[49101,7439],[275,-96],[234,-97]],[[49610,7246],[-27,-31]],[[49583,7215],[4,-31],[-7,-19]],[[49580,7165],[-47,-24],[7,-12],[-16,-69],[-83,-81],[-72,-15],[-25,23]],[[49344,6987],[-31,3],[-7,9]],[[49306,6999],[-48,-17],[-34,11],[-26,-24],[-8,-28],[-84,-12],[-16,-40],[-57,-47],[-19,-37],[-79,-55]],[[48935,6750],[-29,-4],[-70,-32]],[[48836,6714],[-47,17]],[[48789,6731],[-60,-26],[33,-794]],[[48762,5911],[43,-804],[13,-126]],[[48818,4981],[-67,-4],[-31,9]],[[48720,4986],[-25,-31]],[[48695,4955],[-43,-13],[-66,15]],[[48586,4957],[-2,-33],[-15,3],[-14,-15]],[[48555,4912],[-12,12],[-2,15]],[[48541,4939],[-17,-11],[-69,2],[-29,43],[-27,7],[-50,-23],[-25,24],[-44,5],[-6,22],[-65,-10]],[[48209,4998],[-15,-6],[-19,-26]],[[48175,4966],[-18,-2],[-17,35],[-38,32]],[[48102,5031],[-19,42],[-28,34]],[[48055,5107],[-8,37],[-75,71],[-13,39],[-43,14],[-5,14],[11,37]],[[47922,5319],[-1,35],[-39,24]],[[47882,5378],[-43,-35],[-55,4]],[[47784,5347],[-42,-14],[-29,-33],[-10,1],[0,11],[-22,2],[-37,-11],[-20,-34]],[[47624,5269],[-24,-8],[-88,32],[-24,-15]],[[47488,5278],[-26,8],[-5,12]],[[47457,5298],[-37,-2],[-11,-14],[20,-27],[-43,-19],[-25,-4],[9,23],[-12,4],[-5,-12]],[[47353,5247],[-32,-8],[-11,-12]],[[47310,5227],[-14,19],[-25,6],[-35,-11],[-17,-19],[-28,6],[-2,62],[-63,46],[-58,16],[-30,35],[-49,-38],[-24,10],[-8,41],[12,31],[-24,19],[-47,-9],[-17,56],[-45,12],[-141,84],[-21,-5],[-36,11],[-21,31],[-10,-2],[-10,-24],[-64,24],[-8,13],[11,10],[-2,30],[-33,-6],[-16,17],[-39,13],[-11,22],[18,14],[-3,24],[8,2],[0,88],[-21,7],[-10,34],[21,24],[-8,11],[7,21],[-41,1],[2,-27],[-10,-7],[-57,14],[-46,-11],[-37,20],[8,30],[-7,35],[-18,6],[-9,-37],[-28,-5],[-28,17],[14,43],[-21,1],[-16,25],[-16,1],[-21,-31]],[[46116,6027],[-21,26],[-37,14],[-8,20],[-22,13]],[[46028,6100],[-35,5],[-12,61]],[[45981,6166],[-33,16],[-6,22],[9,7],[0,35],[39,9],[-6,42],[-22,26],[-9,35],[-20,-20],[-9,15],[-16,-9],[-2,25],[10,6],[-15,26],[3,15],[-36,24]],[[45868,6440],[10,831],[59,1127]],[[45937,8398],[897,-278],[957,-280],[1310,-401]],[[43500,16513],[-2,25],[4,3],[-3,13]],[[43499,16554],[15,1],[1,-14],[29,0],[25,18],[19,22]],[[43588,16581],[7,1],[6,-4],[51,2],[36,13]],[[43688,16593],[-20,12],[-12,19],[-16,8]],[[43640,16632],[18,40],[-25,28]],[[43633,16700],[-5,-3],[-4,-5],[-4,-10],[5,-3],[-6,-10],[-2,-7],[-6,-2],[-10,-39]],[[43601,16621],[-44,15],[-19,-5]],[[43538,16631],[-12,35],[5,5],[-9,10]],[[43522,16681],[14,32],[15,1],[-5,8]],[[43546,16722],[27,-12]],[[43573,16710],[39,13],[7,6]],[[43619,16729],[9,20],[-46,44],[23,57],[53,14]],[[43658,16864],[4,9],[-13,23]],[[43649,16896],[62,53]],[[43711,16949],[20,-19],[9,-19]],[[43740,16911],[54,79]],[[43794,16990],[34,-25],[2,-12]],[[43830,16953],[5,2],[12,-2],[15,-10]],[[43862,16943],[10,21],[11,11],[-5,10]],[[43878,16985],[19,18],[8,3]],[[43905,17006],[5,2],[6,-10]],[[43916,16998],[-14,-24]],[[43902,16974],[33,6],[0,-5],[13,2]],[[43948,16977],[12,-23],[10,-12]],[[43970,16942],[-30,-62],[-15,-36],[-22,-36]],[[43903,16808],[7,-24],[-6,-8],[-2,-8]],[[43902,16768],[13,-1],[8,-21],[32,-14]],[[43955,16732],[6,15],[1,11],[6,5],[4,11]],[[43972,16774],[57,0],[3,-8]],[[44032,16766],[-2,16],[-13,7]],[[44017,16789],[18,52]],[[44035,16841],[7,-4],[12,-16],[7,-4]],[[44061,16817],[1,2],[-7,4],[1,2],[-5,6]],[[44051,16831],[48,45],[11,-17]],[[44110,16859],[2,-9],[-1,-24],[4,-35],[7,-19]],[[44122,16772],[-8,-36]],[[44114,16736],[-5,-5],[-10,-5],[-23,6],[-15,1],[-9,-6]],[[44052,16727],[-2,-15],[6,-18],[1,-12],[-4,-29]],[[44053,16653],[-4,-12],[-10,-14],[-32,-35]],[[44007,16592],[-3,-11],[-1,-19],[-6,-16]],[[43997,16546],[3,-14],[9,-5]],[[44009,16527],[9,3],[10,15],[11,9],[9,2],[8,-4]],[[44056,16552],[8,-7],[7,-12]],[[44071,16533],[-5,-26]],[[44066,16507],[-15,-38],[-16,-11]],[[44035,16458],[-23,14],[-23,1]],[[43989,16473],[-12,-21],[-29,-25]],[[43948,16427],[-19,-40],[6,-8],[-11,-29]],[[43924,16350],[-41,18]],[[43883,16368],[-4,5],[3,8],[-7,6]],[[43875,16387],[-21,-7],[-11,-8],[-7,-1],[-8,-12],[-7,-5],[-10,2]],[[43811,16356],[-1,28],[-7,11]],[[43803,16395],[-8,5],[-13,2],[-7,6],[-16,1],[-10,6]],[[43749,16415],[-7,-4],[-18,-21],[-12,-7],[-6,0],[-27,-17],[-10,-1],[-15,-19],[-13,-10]],[[43641,16336],[-11,0],[-34,13]],[[43596,16349],[-5,-3],[-8,-13],[-12,-3],[-49,7],[-16,8],[4,10],[1,15],[-6,43]],[[43505,16413],[-9,7],[1,7],[-5,6],[-9,-5],[-12,12]],[[43471,16440],[-1,36],[2,9],[2,31]],[[43474,16516],[1,0],[25,-3]],[[6724,3919],[61,-45],[81,-147],[89,-66],[-12,-60],[18,-28],[34,-11],[18,-36],[-42,-32],[6,-29],[-8,-13],[13,-34],[26,-15],[49,22]],[[7057,3425],[30,-8],[542,-537],[-22,-2],[-24,-72]],[[7583,2806],[-79,-55]],[[7504,2751],[-18,-65]],[[7486,2686],[-27,-27],[14,-21],[-5,-17],[-77,17]],[[7391,2638],[-77,-58]],[[7314,2580],[-176,-282],[45,-42],[9,-65]],[[7192,2191],[-1,-51]],[[7191,2140],[-41,-45],[-208,-133],[-296,-115]],[[6646,1847],[-504,-346]],[[6142,1501],[-318,-913]],[[5824,588],[-2328,2],[-129,48],[-72,-1],[-2295,-8],[-550,6],[-450,32],[18,43],[82,25],[54,68],[22,1],[27,41],[17,-1],[8,63],[27,21],[38,5],[50,-21],[91,30],[48,34],[37,69],[67,34],[47,0],[110,49],[8,18],[26,-30],[48,2],[25,33],[73,31],[30,46],[132,32],[82,53],[40,34],[0,30],[19,15],[54,2],[54,25],[14,-8],[27,21],[56,-8],[56,17],[54,-3],[14,-18],[71,-26],[136,-17],[158,7],[36,21],[61,-11],[98,13],[238,106],[11,9],[-5,19],[76,80],[47,8],[50,38],[36,-1],[51,38],[53,-6],[94,74],[278,90],[42,26],[55,6],[55,27],[70,1],[362,136],[183,48],[244,102],[169,-3],[57,17],[8,-15],[33,0],[90,38],[68,-12],[79,11],[18,38],[-12,36],[54,15],[-6,100],[26,22],[-59,31],[26,64],[-30,17],[34,45],[-35,98],[85,24],[41,41],[64,112],[54,39],[14,81],[35,25],[0,114],[-29,49],[24,40],[69,31],[29,40],[104,28],[9,57],[-15,54],[27,43],[71,-33],[29,26],[110,-25],[54,37],[48,-10],[76,16],[17,-43],[22,-19],[53,-12],[25,-22],[52,8],[31,60],[45,43],[73,25],[44,-7],[44,15],[65,-25],[79,54],[66,20],[17,21],[118,13],[28,32],[51,2],[49,39],[124,10],[3,50],[104,33],[90,69],[45,9],[5,45]],[[28857,8949],[43,68]],[[28900,9017],[217,144]],[[29117,9161],[85,24],[99,78],[22,51],[444,42],[92,87]],[[29859,9443],[271,169]],[[30130,9612],[30,41],[75,37]],[[30235,9690],[153,110],[96,-155]],[[30484,9645],[939,-478],[728,-411]],[[32151,8756],[214,-304]],[[32365,8452],[-11,-33],[-78,-34],[9,-83],[-16,-36]],[[32269,8266],[4,-23],[34,-37]],[[32307,8206],[-97,-131],[50,-75]],[[32260,8000],[-6,-26],[54,-118],[-3,-69]],[[32305,7787],[32,-70],[8,-54]],[[32345,7663],[-42,-51]],[[32303,7612],[-42,-21]],[[32261,7591],[8,-22],[-16,-33],[19,-24],[-12,-18],[-53,-20],[-23,47],[-84,-12],[-33,-39],[-70,-37],[-13,-46],[9,-20],[-24,-32],[-59,-15],[1,-90],[15,-39]],[[31926,7191],[-19,-19],[-11,-42]],[[31896,7130],[-56,-33],[-77,-12],[-4,-92],[-17,-19],[-1,-32],[-62,-49],[-55,-13],[-49,-56],[-32,-11],[-11,-28],[-58,-4],[-75,-127],[-72,-25],[-24,4],[-12,20],[-56,3],[-15,42],[-63,6],[-18,-19],[-43,20],[-21,58],[18,27],[-8,15],[-18,8],[-58,-24],[-22,51],[-26,9],[40,93],[-3,19],[-44,21],[-13,42],[-120,-26],[-67,51],[-117,-95],[-148,-15],[-85,-36],[-27,-53],[-20,7],[-15,44],[-55,5],[-22,-17]],[[30265,6889],[5,-11],[-20,-32]],[[30250,6846],[4,-46],[-56,-10],[-15,-18]],[[30183,6772],[-30,11],[-21,-9]],[[30132,6774],[-19,-24],[-13,-51]],[[30100,6699],[11,-30],[-8,-37],[-81,-60]],[[30022,6572],[-7,-21],[-36,18],[4,-39]],[[29983,6530],[-14,-26],[-32,-14],[-6,-18]],[[29931,6472],[-18,6]],[[29913,6478],[-23,-42],[-25,15]],[[29865,6451],[-29,-22],[-26,5],[4,-21],[-71,-27],[-9,-32],[-90,-37],[-40,18],[-7,-18]],[[29597,6317],[-38,-9]],[[29559,6308],[-20,43]],[[29539,6351],[-32,8],[17,226]],[[29524,6585],[-44,305],[-80,783],[-1,21]],[[29399,7694],[14,6]],[[29413,7700],[-110,89]],[[29303,7789],[-8,59],[-464,685]],[[28831,8533],[-28,370],[54,46]],[[31961,8536],[-79,77],[-10,-14],[-62,84]],[[31810,8683],[-59,-24]],[[31751,8659],[-57,13],[-3,40],[13,44],[-22,-2],[0,-20],[-14,8],[-70,-59]],[[31598,8683],[12,-24]],[[31610,8659],[-99,19]],[[31511,8678],[-8,14]],[[31503,8692],[-37,-18],[-30,58],[-78,-68],[-34,43],[21,10],[-24,89]],[[31321,8806],[-36,53],[-218,-145]],[[31067,8714],[-95,-100]],[[30972,8614],[-78,5]],[[30894,8619],[-69,-86]],[[30825,8533],[-48,32]],[[30777,8565],[-3,48]],[[30774,8613],[-45,98]],[[30729,8711],[-41,-47]],[[30688,8664],[-84,-29]],[[30604,8635],[-129,-81]],[[30475,8554],[-23,19]],[[30452,8573],[3,-34]],[[30455,8539],[-23,-20]],[[30432,8519],[-9,52]],[[30423,8571],[-15,0]],[[30408,8571],[-2,-39]],[[30406,8532],[-27,-2]],[[30379,8530],[20,-40]],[[30399,8490],[-88,-72]],[[30311,8418],[-133,-57]],[[30178,8361],[-31,39],[-47,-28]],[[30100,8372],[17,-25]],[[30117,8347],[-121,-50]],[[29996,8297],[40,-23]],[[30036,8274],[7,-29],[15,-1]],[[30058,8244],[2,-27]],[[30060,8217],[17,-11]],[[30077,8206],[41,21],[7,-30]],[[30125,8197],[97,49]],[[30222,8246],[47,-2]],[[30269,8244],[12,-50]],[[30281,8194],[20,4]],[[30301,8198],[-11,-24]],[[30290,8174],[8,-28],[16,6]],[[30314,8152],[5,-19]],[[30319,8133],[33,-21]],[[30352,8112],[-26,-57]],[[30326,8055],[47,-28]],[[30373,8027],[4,-17]],[[30377,8010],[-17,-3]],[[30360,8007],[25,-34]],[[30385,7973],[81,28]],[[30466,8001],[30,-37]],[[30496,7964],[-3,-13]],[[30493,7951],[62,-25]],[[30555,7926],[24,10],[5,-22]],[[30584,7914],[38,15]],[[30622,7929],[10,47]],[[30632,7976],[35,39],[63,13]],[[30730,8028],[-7,-56]],[[30723,7972],[-27,-67],[12,-30],[61,-61]],[[30769,7814],[85,50]],[[30854,7864],[97,10]],[[30951,7874],[7,-33],[16,2]],[[30974,7843],[7,33]],[[30981,7876],[47,33]],[[31028,7909],[8,-37]],[[31036,7872],[33,-35]],[[31069,7837],[-45,-3]],[[31024,7834],[14,-31]],[[31038,7803],[16,5]],[[31054,7808],[8,-25]],[[31062,7783],[34,9],[-14,-26],[30,-23],[18,30],[29,5],[-22,-46]],[[31137,7732],[32,-34]],[[31169,7698],[0,-41]],[[31169,7657],[39,73]],[[31208,7730],[11,-38],[34,-35]],[[31253,7657],[47,-114]],[[31300,7543],[66,-72]],[[31366,7471],[65,-17],[35,21]],[[31466,7475],[8,95]],[[31474,7570],[23,28]],[[31497,7598],[53,32]],[[31550,7630],[32,-19]],[[31582,7611],[1,-14]],[[31583,7597],[24,-1],[3,-20],[23,8],[-3,10],[19,9],[9,60],[19,0]],[[31677,7663],[5,29]],[[31682,7692],[-15,9]],[[31667,7701],[14,20]],[[31681,7721],[-10,3]],[[31671,7724],[13,53]],[[31684,7777],[129,48]],[[31813,7825],[-22,36]],[[31791,7861],[19,4]],[[31810,7865],[3,40]],[[31813,7905],[20,13]],[[31833,7918],[23,48]],[[31856,7966],[-33,0]],[[31823,7966],[-44,38]],[[31779,8004],[20,24]],[[31799,8028],[35,-9]],[[31834,8019],[13,31]],[[31847,8050],[-33,9]],[[31814,8059],[7,58]],[[31821,8117],[-44,78]],[[31777,8195],[-49,19]],[[31728,8214],[-19,-7]],[[31709,8207],[-3,17],[99,45]],[[31805,8269],[20,-32]],[[31825,8237],[20,33]],[[31845,8270],[43,-12]],[[31888,8258],[108,115],[21,-22],[-40,-40],[11,-11],[-9,-13],[-18,17]],[[31961,8304],[-20,-38]],[[31941,8266],[48,-7]],[[31989,8259],[48,91]],[[32037,8350],[-18,117]],[[32019,8467],[12,18]],[[32031,8485],[-70,51]],[[44201,21995],[6,28]],[[44207,22023],[-55,69],[39,33]],[[44191,22125],[41,-47],[25,3],[18,35],[70,48],[55,149],[36,16],[13,27]],[[44449,22356],[103,44]],[[44552,22400],[53,-8],[68,71],[-2,72],[-17,14],[-8,23],[13,48],[-5,30],[-13,7],[-8,44],[20,63],[77,68],[26,55],[27,31],[30,85],[34,31],[-1,11],[27,-3],[18,-16],[22,39]],[[44913,23065],[54,28]],[[44967,23093],[14,24]],[[44981,23117],[1,33],[51,47]],[[45033,23197],[605,-707],[26,-20]],[[45664,22470],[904,-1083],[25,-29]],[[46593,21358],[36,-21]],[[46629,21337],[49,-67],[34,-11]],[[46712,21259],[5,-14],[-10,-19],[6,-14],[32,-22],[7,-19]],[[46752,21171],[25,-6],[12,-38]],[[46789,21127],[53,-3],[12,-11],[32,-61]],[[46886,21052],[-13,-21],[-27,-12]],[[46846,21019],[-5,-32]],[[46841,20987],[-23,-28],[34,-3]],[[46852,20956],[21,-34],[47,-4],[-27,-21],[17,-15],[-14,-18],[-9,11],[5,-26],[18,5],[31,-38],[25,13],[11,-26]],[[46977,20803],[7,4],[-1,19]],[[46983,20826],[17,-8],[12,-17],[-29,-31]],[[46983,20770],[93,-50],[9,-27],[-4,-21],[11,-12]],[[47092,20660],[-13,-65]],[[47079,20595],[36,-33],[-36,-46]],[[47079,20516],[-26,14],[-16,-26],[-25,-4],[-15,-21]],[[46997,20479],[-27,-5],[-29,17],[-22,-6]],[[46919,20485],[30,-18],[-3,-48],[-18,-9]],[[46928,20410],[-3,-28],[-36,-73],[8,-11],[-2,-38]],[[46895,20260],[16,-12],[-4,-36],[16,-24],[5,-27]],[[46928,20161],[30,-47],[34,-23]],[[46992,20091],[-11,-21],[0,-30]],[[46981,20040],[62,2],[74,-52],[5,-29],[27,-20],[5,-30],[36,-45]],[[47190,19866],[-13,-9],[-53,7]],[[47124,19864],[-31,-21]],[[47093,19843],[-32,-61],[-23,-18],[-13,-39],[-24,-23],[2,-13],[15,-3],[34,-5]],[[47052,19681],[26,14],[12,-7],[-12,-9],[9,-75]],[[47087,19604],[-9,-24],[-35,-41],[-38,-8]],[[47005,19531],[-17,-40],[-44,-57]],[[46944,19434],[-72,-13]],[[46872,19421],[-22,-46],[5,-38]],[[46855,19337],[-17,-20],[-12,4]],[[46826,19321],[-2,32],[-9,8]],[[46815,19361],[-46,-8],[-39,8]],[[46730,19361],[-19,-14],[-24,-43]],[[46687,19304],[-26,-11],[-16,19],[-1,28]],[[46644,19340],[22,34],[-34,6]],[[46632,19380],[-41,-24],[-41,-95],[17,-34],[34,-22],[5,-15],[-5,-12],[-60,1]],[[46541,19179],[-38,35],[-28,3]],[[46475,19217],[-10,-11],[-9,-50]],[[46456,19156],[-32,56],[-8,-12]],[[46416,19200],[-12,8],[-58,-9]],[[46346,19199],[-10,-20],[22,-24]],[[46358,19155],[-11,-13],[2,-8]],[[46349,19134],[14,-10],[15,25],[22,-3],[-16,-78],[5,-17],[-38,-5]],[[46351,19046],[-13,-8],[-4,-16]],[[46334,19022],[-20,-1],[-50,-70],[-55,-15],[-19,15],[-19,-9],[-22,-37],[-38,22],[-57,-9],[-15,-33],[1,-46],[-19,-59],[-94,7],[-23,26],[-19,-1],[-6,18],[-56,9]],[[45823,18839],[-31,-14],[-26,3]],[[45766,18828],[-8,11],[12,29],[-14,22],[-70,23]],[[45686,18913],[-13,12],[3,19],[-15,31],[-18,23]],[[45643,18998],[-41,8],[-11,17],[23,11],[-7,36],[19,12],[9,23],[-5,16]],[[45630,19121],[-9,-10],[-8,7]],[[45613,19118],[2,20],[15,9],[-3,9]],[[45627,19156],[-111,51],[-86,59]],[[45430,19266],[-35,40],[-14,-2],[-8,-30]],[[45373,19274],[-59,-1]],[[45314,19273],[6,-36],[10,-11],[-6,-7],[-45,6]],[[45279,19225],[-47,31]],[[45232,19256],[-17,-14],[8,-16],[-7,-14]],[[45216,19212],[-21,-2],[-38,22]],[[45157,19232],[-7,22],[-36,-21],[-30,11]],[[45084,19244],[-12,32]],[[45072,19276],[-19,15],[-2,23],[-41,24],[-23,-1],[-26,-35],[-27,12],[0,28],[11,16],[-7,29],[12,41],[-31,11],[-36,-11],[-18,12],[-8,25],[-53,13],[-10,41],[12,48]],[[44806,19567],[60,-11]],[[44866,19556],[6,10],[-12,32],[-22,2],[-7,11]],[[44831,19611],[6,41]],[[44837,19652],[-35,31]],[[44802,19683],[13,54]],[[44815,19737],[-14,16],[-95,-6],[-46,13],[-7,31],[-23,36],[-66,47],[0,17],[-11,14]],[[44553,19905],[-79,57],[-31,47]],[[44443,20009],[-19,80]],[[44424,20089],[-16,12],[2,22],[-30,27],[-7,18],[5,15]],[[44378,20183],[-50,30]],[[44328,20213],[-21,45],[-28,9]],[[44279,20267],[-20,38],[17,28],[-5,27],[13,58],[28,63],[-14,14],[-6,49],[-13,10],[-9,27]],[[44270,20581],[-68,35]],[[44202,20616],[-4,53],[-10,19],[4,24],[-14,14],[4,27],[-13,25],[24,39],[-5,33],[37,40],[-5,38],[12,55],[-10,20]],[[44222,21003],[4,66]],[[44226,21069],[-24,40],[5,35],[-10,45],[20,37],[-1,20],[-19,45],[-28,31]],[[44169,21322],[-32,16]],[[44137,21338],[-32,103]],[[44105,21441],[-39,69]],[[44066,21510],[31,74]],[[44097,21584],[18,14]],[[44115,21598],[22,66],[25,11]],[[44162,21675],[-6,44],[-17,9],[-22,46],[8,6],[4,32],[25,33],[-6,63],[22,23],[-5,30]],[[44165,21961],[18,8],[18,26]],[[59442,14028],[7,29],[30,18],[56,-19],[54,33],[40,-24],[20,14],[10,25],[50,3],[2,24],[12,20],[15,-12],[-4,-23],[10,1],[17,24],[-3,16],[16,14],[10,-13],[15,0],[0,-21],[23,-6],[7,19],[17,1],[-7,8],[6,15],[-11,9],[22,21],[1,19],[-12,9],[6,22],[-22,-10],[-5,24],[26,10],[3,26],[19,8],[13,35],[50,3],[63,64],[27,-4],[18,-17],[59,11],[111,-13],[68,20],[102,-28],[16,2],[46,43]],[[60445,14428],[27,4],[7,-1],[-3,-62]],[[60476,14369],[55,23],[29,43]],[[60560,14435],[30,23],[66,-34]],[[60656,14424],[77,-9]],[[60733,14415],[79,-163],[64,-26],[169,22],[62,33]],[[61107,14281],[31,41]],[[61138,14322],[92,-68]],[[61230,14254],[-12,-103]],[[61218,14151],[5,-79],[54,-81]],[[61277,13991],[5,-27],[-6,-29],[8,-27],[36,-49],[44,-22],[16,-57],[91,-20]],[[61471,13760],[52,15],[70,-25],[65,-46]],[[61658,13704],[11,-52]],[[61669,13652],[20,-24],[1,-15],[-31,-44]],[[61659,13569],[-10,-35],[9,-26]],[[61658,13508],[41,-48],[-8,-51],[18,-63]],[[61709,13346],[3,-62],[-25,-47]],[[61687,13237],[-1,-60],[-27,-42],[-23,-13],[-50,-89],[7,-12],[-4,-6],[13,-9],[16,19],[11,0],[119,-66],[9,-20],[55,-39],[-2,-23],[9,-22],[-5,-19],[47,-55],[23,-6],[19,-21],[40,-12],[37,-33],[76,-31],[106,-126],[495,0],[624,20]],[[63281,12572],[111,-517],[9,0]],[[63401,12055],[82,-435]],[[63483,11620],[-1102,-8],[-112,40],[-124,24],[-155,12],[-204,-11],[-98,22],[-52,26],[-120,111]],[[61516,11836],[-159,91],[-107,73]],[[61250,12000],[-122,55],[-119,40]],[[61009,12095],[-131,27],[-114,5],[-83,-15],[-101,-38],[-84,-6],[-108,14],[-65,26],[-35,25],[-52,79],[-91,178],[-42,111],[-48,196],[-45,134],[-201,469]],[[59809,13300],[-70,103],[-70,85],[-78,59],[-353,134],[-50,23]],[[59188,13704],[-62,55]],[[59126,13759],[206,147],[116,85],[4,13],[-10,24]],[[40892,11716],[127,54],[25,25],[10,30],[-4,41]],[[41050,11866],[-99,123],[-12,29]],[[40939,12018],[-2,63],[21,49],[69,31],[82,72],[71,17],[58,-7],[57,-42],[92,2],[47,-21],[125,-18],[37,-27],[53,-10],[75,25],[62,1],[62,30],[26,56]],[[41874,12239],[-7,53],[-22,36],[-24,132]],[[41821,12460],[72,121],[65,24],[89,6],[29,25],[-3,71],[-32,32],[-23,54],[6,47]],[[42024,12840],[19,24],[65,10],[66,-28]],[[42174,12846],[60,-66],[48,-113]],[[42282,12667],[30,-25],[75,1]],[[42387,12643],[86,60],[8,30],[-29,84],[-84,76]],[[42368,12893],[-15,38],[15,43]],[[42368,12974],[2,92],[61,69]],[[42431,13135],[25,96],[-2,25]],[[42454,13256],[39,69]],[[42493,13325],[58,36],[39,52],[134,100],[227,-10]],[[42951,13503],[175,48],[65,32],[92,17]],[[43283,13600],[179,-63],[114,-9],[60,24],[47,31],[20,40]],[[43703,13623],[6,68]],[[43709,13691],[-29,190],[20,54],[46,30],[32,-9],[20,-28],[93,-249]],[[43891,13679],[59,-100],[55,-48]],[[44005,13531],[71,-33],[33,-36]],[[44109,13462],[82,-30]],[[44191,13432],[25,-29],[92,-56]],[[44308,13347],[133,-35]],[[44441,13312],[40,-38]],[[44481,13274],[219,-8]],[[44700,13266],[104,-24]],[[44804,13242],[123,-115],[123,-59],[130,-25]],[[45180,13043],[105,-44],[67,7],[63,-17],[76,-41]],[[45491,12948],[157,-129]],[[45648,12819],[70,-25]],[[45718,12794],[147,-8],[-78,-615]],[[45787,12171],[-892,-1582]],[[44895,10589],[-931,-1707],[-35,20]],[[43929,8902],[-24,-13]],[[43905,8889],[-15,-68],[-45,0],[-59,71]],[[43786,8892],[-9,-29],[5,-46],[-27,-48],[-72,45],[-65,-11],[-46,-32],[-74,92],[-44,31],[15,25],[32,-21],[17,17]],[[43518,8915],[-6,16],[-62,6]],[[43450,8937],[-43,22]],[[43407,8959],[-39,40],[-107,-42]],[[43261,8957],[0,37],[-9,4],[10,10],[-4,20],[-58,-1],[-9,16],[21,12],[2,28],[-20,29],[-44,13]],[[43150,9125],[41,50],[-15,11],[-32,-33]],[[43144,9153],[-7,30],[-20,23]],[[43117,9206],[6,13],[-14,11],[-17,-4]],[[43092,9226],[-16,19]],[[43076,9245],[-16,-22],[51,-51]],[[43111,9172],[-7,-24],[-53,27]],[[43051,9175],[-50,-21],[3,40],[31,20],[-23,71],[-25,22],[-54,-2],[-38,30],[42,82],[50,41]],[[42987,9458],[-72,34],[-50,52]],[[42865,9544],[-51,-43],[-53,-22],[-38,17],[-30,-10]],[[42693,9486],[-5,-61]],[[42688,9425],[-21,-11],[-23,13]],[[42644,9427],[-77,-49],[-8,17]],[[42559,9395],[13,35],[-63,41],[21,79]],[[42530,9550],[-44,47]],[[42486,9597],[8,18],[17,5],[-5,33],[29,32],[-25,21],[15,25]],[[42525,9731],[-78,27]],[[42447,9758],[-65,-8],[-58,62]],[[42324,9812],[-74,-10]],[[42250,9802],[-127,73]],[[42123,9875],[-110,165]],[[42013,10040],[8,33],[-10,27],[-55,67]],[[41956,10167],[-1032,1082],[5,74]],[[40929,11323],[85,49],[12,21]],[[41026,11393],[-1,29],[-13,26]],[[41012,11448],[-130,116]],[[40882,11564],[-24,91],[34,61]],[[56345,19314],[-41,-25]],[[56304,19289],[-26,18],[-15,-1],[-7,-39]],[[56256,19267],[-43,-21],[-10,-28]],[[56203,19218],[-40,5],[-30,-13],[-45,-2],[-10,-26]],[[56078,19182],[-36,-19],[11,-10],[-2,-24]],[[56051,19129],[-18,0],[8,-11]],[[56041,19118],[-10,-20],[-15,4],[-18,22]],[[55998,19124],[-50,-6],[-31,-867],[-27,-19],[-2,-16],[14,-16],[-12,-18],[-39,0]],[[55851,18182],[-20,-15],[-30,-3],[-16,-29],[2,-39]],[[55787,18096],[-7,-30],[6,-13],[14,1]],[[55800,18054],[-3,-6],[10,-24],[-45,-7],[-19,-34],[17,-125]],[[55760,17858],[-11,-26],[-23,-25],[-42,-14],[-18,10]],[[55666,17803],[-37,52]],[[55629,17855],[-10,134],[-7,15]],[[55612,18004],[-43,16]],[[55569,18020],[-50,-2],[-51,-30],[-102,-93],[-42,-2],[-34,33],[-22,66]],[[55268,17992],[-30,38]],[[55238,18030],[-34,20],[-57,17],[-55,35],[-35,13],[-26,-3],[-104,-56]],[[54927,18056],[-55,14],[-81,51],[-52,41]],[[54739,18162],[-60,85]],[[54679,18247],[-80,74],[-39,26]],[[54560,18347],[-42,67],[-47,28],[-57,6],[-44,-23],[-3,-27],[26,-66]],[[54393,18332],[-6,-21],[-18,-13]],[[54369,18298],[-57,-10]],[[54312,18288],[-93,21],[-34,17]],[[54185,18326],[-11,28],[4,34]],[[54178,18388],[75,137],[31,41],[1,14]],[[54285,18580],[-13,47],[-64,108],[-7,41]],[[54201,18776],[11,16],[47,20]],[[54259,18812],[112,16],[46,21]],[[54417,18849],[13,19],[4,26]],[[54434,18894],[-4,22]],[[54430,18916],[-17,19],[-58,22],[-105,-5]],[[54250,18952],[-20,24],[-12,35]],[[54218,19011],[-10,3],[-112,-23],[-59,8],[-34,-24],[-16,-57],[12,-113],[-17,-67],[-22,-20]],[[53960,18718],[-100,-6],[-18,35],[33,113],[0,25],[-17,24],[-14,10]],[[53844,18919],[-35,-7],[-81,-72],[-24,-6],[-27,49],[-45,41]],[[53632,18924],[-63,24],[-8,76],[-13,16],[-31,13]],[[53517,19053],[-8,16],[-16,3],[-19,31],[-19,1]],[[53455,19104],[-5,15],[-32,0]],[[53418,19119],[-9,8],[19,47],[1,25],[-5,14],[-28,20],[-3,16],[8,26],[23,27],[3,34],[25,35],[10,44],[2,33],[-11,38],[13,56],[-7,18],[4,29]],[[53463,19589],[9,4],[17,-8]],[[53489,19585],[8,33],[14,25],[-10,56],[65,69],[-3,69],[-7,14],[4,24],[-23,53],[0,18]],[[53537,19946],[75,36],[2,79]],[[53614,20061],[32,9],[39,-19]],[[53685,20051],[45,14],[17,14],[60,-4]],[[53807,20075],[52,22],[26,1],[26,-17]],[[53911,20081],[20,-46],[61,-55],[76,-42],[19,-11],[62,-9],[151,-8],[299,105],[213,9],[76,32],[61,12],[67,58],[32,38],[48,78],[55,68],[13,5],[110,-14],[167,33],[57,-10],[39,-17],[57,7],[83,53],[53,60],[79,119],[21,57],[45,54],[94,24],[112,-123],[26,-19],[41,-55],[26,-18],[55,-79],[-38,-39],[13,-98],[-2,-91],[-18,-137],[6,-24],[15,-20],[-6,-28],[4,-29],[-136,-233],[16,-3],[5,-68],[39,-42],[44,-13],[16,-17],[16,-30],[33,-37],[16,-42],[60,-81],[4,-17],[29,-24]],[[36741,20741],[-15,-52],[30,-1],[43,-30]],[[36799,20658],[48,-60],[-2,-120],[-64,-45]],[[36781,20433],[-39,23],[-37,6]],[[36705,20462],[-24,-42]],[[36681,20420],[-43,-5],[-20,-58],[-20,-14],[-3,-26],[-16,-18]],[[36579,20299],[22,-31],[4,-38],[-59,-49],[-56,-9],[-32,-33]],[[36458,20139],[-16,-34],[0,-50]],[[36442,20055],[-45,-16]],[[36397,20039],[0,-14],[-49,-72]],[[36348,19953],[9,-16],[19,-1]],[[36376,19936],[7,-35],[-21,-18],[-41,9]],[[36321,19892],[-41,-71],[-45,-52],[-12,-63]],[[36223,19706],[-42,-47],[-2,-34],[-9,-10],[-2,-80],[-21,-64]],[[36147,19471],[-77,13]],[[36070,19484],[-15,-48],[5,-24]],[[36060,19412],[-28,-18],[-30,-76],[22,-36]],[[36024,19282],[0,-47],[-10,-20]],[[36014,19215],[64,-94],[-26,-31]],[[36052,19090],[3,-24],[-10,-18],[-2,-31]],[[36043,19017],[-47,-64],[-2,-26]],[[35994,18927],[-77,-36]],[[35917,18891],[-4,-34],[-21,-19],[-11,-33]],[[35881,18805],[-25,5],[-13,-24],[-52,-12]],[[35791,18774],[-7,-45],[-26,-60],[11,-20],[-16,-22]],[[35753,18627],[-63,5],[-162,62]],[[35528,18694],[-56,-10]],[[35472,18684],[-27,-31],[-54,-20]],[[35391,18633],[32,-64]],[[35423,18569],[-38,-35],[-14,-27]],[[35371,18507],[-31,-1],[-75,-49]],[[35265,18457],[31,-65],[-23,-32]],[[35273,18360],[-40,4],[-27,-16]],[[35206,18348],[-13,-61]],[[35193,18287],[-62,-37],[-2,-21]],[[35129,18229],[-421,204],[-1217,249],[-442,265]],[[33049,18947],[-315,228],[57,32],[23,70],[-30,30],[2,42],[-48,101],[-20,20],[-42,0],[-10,73],[-50,67],[-1,25],[65,104],[23,10],[26,70],[55,53],[26,3],[10,29],[55,6],[52,43],[8,33],[38,65],[-4,21],[-19,18],[37,39],[-11,23],[24,35],[75,9],[113,-46],[58,23],[27,54],[42,23],[13,18],[-10,78],[-42,28],[19,87],[18,24],[8,41],[31,28],[13,59],[32,75],[38,38],[5,26],[28,24],[-1,28],[21,41],[51,51],[7,17],[38,21],[-14,34],[61,52],[-18,62],[1,26],[20,31],[-18,46],[28,46],[-2,71],[-23,77],[-17,14],[-21,45],[-30,14],[-3,47],[45,42],[6,21],[-1,11],[-16,3],[-18,64],[13,11],[11,63],[21,29],[33,-3],[45,57],[0,29],[15,11],[-4,31],[11,32],[53,-2],[31,-31],[17,52],[53,32],[-7,39],[-32,62],[-52,49],[51,107],[-34,30],[15,48],[2,35],[-7,20],[21,26],[18,92],[21,-4],[28,21],[-30,89],[41,32],[18,40],[6,69],[34,46],[17,47],[653,-315],[137,-33],[83,-63],[74,-40],[30,-52],[-4,-11],[15,-31],[29,-20],[16,-39],[44,-34],[378,-855],[1387,-504],[-48,-26],[-26,-35]],[[45720,24665],[13,-17],[21,-8],[49,32]],[[45803,24672],[30,36],[44,-14],[30,58],[39,22],[50,-12],[49,55],[50,20],[49,-8],[56,33],[38,40],[21,78],[37,15],[0,17],[35,27],[8,54],[18,26],[-7,10],[2,38],[23,75],[7,52],[-13,23],[18,11],[62,4],[-4,49],[12,30],[-10,34],[12,14],[9,36],[46,27],[22,-2],[5,9],[-12,21],[19,21],[1,26],[12,20],[34,18],[15,21],[-9,22],[-1,44],[77,11]],[[46677,25733],[11,50]],[[46688,25783],[33,-3],[45,27]],[[46766,25807],[19,-4],[7,13],[-6,23],[59,0]],[[46845,25839],[1,-50],[12,-47]],[[46858,25742],[39,-42]],[[46897,25700],[11,-43],[16,-24]],[[46924,25633],[55,-42],[14,-52]],[[46993,25539],[26,-49],[21,-11],[5,-22]],[[47045,25457],[26,-13],[19,4],[2,-15],[35,-1]],[[47127,25432],[25,-29],[27,-17]],[[47179,25386],[26,8],[61,-76]],[[47266,25318],[32,-6],[33,-25]],[[47331,25287],[5,-28],[31,-2],[35,-26],[60,-61]],[[47462,25170],[2,-14],[-15,-32],[3,-15]],[[47452,25109],[31,-7],[-4,24]],[[47479,25126],[3,11],[8,1]],[[47490,25138],[34,-18],[-6,-31],[66,31],[85,-53]],[[47669,25067],[-7,-12],[-42,-6]],[[47620,25049],[17,-36],[16,-6],[9,-20]],[[47662,24987],[-21,-6],[-3,-13]],[[47638,24968],[16,-28],[1,-26]],[[47655,24914],[49,-6],[-1,-24],[18,-11]],[[47721,24873],[-10,-17],[-22,-9]],[[47689,24847],[-8,18],[-14,-6],[-4,-25],[35,-45]],[[47698,24789],[-24,-48],[-19,-18]],[[47655,24723],[6,-20],[-10,-59]],[[47651,24644],[27,-32]],[[47678,24612],[13,8],[20,-13]],[[47711,24607],[21,17],[16,-14],[-19,-63]],[[47729,24547],[12,-13],[14,1]],[[47755,24535],[-1,-32]],[[47754,24503],[-5,-17],[-20,-12]],[[47729,24474],[-2,-22]],[[47727,24452],[11,-9],[38,3]],[[47776,24446],[14,-29],[-14,-15],[4,-31],[58,-5]],[[47838,24366],[-27,-18],[-3,-11]],[[47808,24337],[29,-8],[-2,-18],[-61,-4],[-13,-25],[31,-4]],[[47792,24278],[22,-23],[17,-35]],[[47831,24220],[46,-17]],[[47877,24203],[6,-17],[23,-14],[23,-54]],[[47929,24118],[91,-28],[48,-39],[48,-7],[26,-31],[64,-19],[58,-45],[21,1],[13,36],[27,-7],[14,-23]],[[48339,23956],[21,8],[8,21],[12,7]],[[48380,23992],[53,-33]],[[48433,23959],[-1306,-1101]],[[47127,22858],[-663,-811],[-63,-34]],[[46401,22013],[-18,65],[-40,-2],[-39,15],[-28,-42],[-60,37]],[[46216,22086],[-15,41],[-16,20]],[[46185,22147],[-19,3]],[[46166,22150],[-36,-28],[-22,26]],[[46108,22148],[-13,49]],[[46095,22197],[-19,12],[-13,-3],[-45,-42]],[[46018,22164],[-60,-2]],[[45958,22162],[-14,-17],[-13,-1]],[[45931,22144],[-267,326]],[[45033,23197],[27,16]],[[45060,23213],[33,-8],[31,9],[31,63],[15,46]],[[45170,23323],[0,18],[21,33],[0,36],[34,57],[-20,54],[-16,15],[-2,20],[18,65],[4,45],[-55,36],[27,61],[54,48],[-12,37],[-4,53],[-17,48],[-14,14],[0,24]],[[45188,23987],[-16,18],[-58,30]],[[45114,24035],[-25,0],[-4,33],[12,16],[9,49],[22,60],[28,49],[2,25],[17,41],[-4,23],[27,96],[43,-8],[86,19],[6,29],[25,33],[3,43],[29,31],[46,-8],[8,31]],[[45444,24597],[41,70],[41,26]],[[45526,24693],[72,-2],[28,-12]],[[45626,24679],[22,-22]],[[45648,24657],[26,0],[46,8]],[[53551,25838],[101,24],[33,-1]],[[53685,25861],[15,-4],[13,-11]],[[53713,25846],[10,-12],[4,-13]],[[53727,25821],[3,-1],[24,2]],[[53754,25822],[14,65]],[[53768,25887],[22,7],[41,11],[35,13]],[[53866,25918],[8,-5],[-9,-45],[177,-16]],[[54042,25852],[4,-5],[11,-33],[2,-30]],[[54059,25784],[-10,-49]],[[54049,25735],[8,-13],[-3,-8],[2,-15]],[[54056,25699],[-3,-7],[-14,-4]],[[54039,25688],[-6,-32],[15,-57],[-5,-27]],[[54043,25572],[-68,12],[0,-14],[-66,11]],[[53909,25581],[0,-34],[-8,0],[0,-22],[1,-1],[0,-5]],[[53902,25519],[-10,1],[0,3],[-19,0],[-51,9]],[[53822,25532],[1,-16],[-5,-10]],[[53818,25506],[-26,1],[1,2],[-18,1]],[[53775,25510],[0,-4],[4,-2],[4,-19]],[[53783,25485],[-15,-3],[-7,36],[-33,-3],[-2,12]],[[53726,25527],[-19,-2],[-1,3],[-13,-2]],[[53693,25526],[1,-5],[0,-7]],[[53694,25514],[-6,0],[-1,7],[-11,-3],[-1,-2],[-18,6]],[[53657,25522],[-20,-19],[-1,81],[-33,14],[-27,42],[-45,4]],[[53531,25644],[6,3],[1,9]],[[53538,25656],[-9,35],[-28,-4]],[[53501,25687],[-2,16],[1,12],[51,113],[-4,2],[4,8]],[[53655,25630],[0,-12],[65,-25]],[[53720,25593],[11,22],[4,3],[4,14]],[[53739,25632],[-14,4],[-2,-5],[-17,7],[-10,-3],[-3,-12],[-25,0],[3,8],[-16,-1]],[[48836,6714],[99,36]],[[49306,6999],[38,-12]],[[49580,7165],[3,50]],[[49583,7215],[26,29],[7,30],[18,8],[81,14],[151,-22]],[[49866,7274],[70,-32],[81,6],[94,87],[78,35],[12,20],[-6,5],[10,11],[-5,9],[13,13],[6,-8],[5,29],[20,7],[0,21],[16,1],[10,30],[24,-16],[32,40]],[[50326,7532],[18,-5],[2,10],[25,2]],[[50371,7539],[44,46],[79,-19],[37,16],[13,33],[28,13],[11,19],[-49,-13],[2,9],[-21,-1],[15,79],[35,7],[13,-17],[4,10],[20,-2],[27,20],[1,42],[17,13]],[[50647,7794],[59,-8],[3,-8]],[[50709,7778],[37,4],[-1,57],[44,12],[-8,42],[10,33]],[[50791,7926],[59,18],[-25,60]],[[50825,8004],[11,49]],[[50836,8053],[65,-16]],[[50901,8037],[87,66],[23,2],[26,-26],[47,-9],[33,37],[27,11],[54,-36],[41,-53],[1,-42],[19,-61]],[[51259,7926],[76,-48],[15,-32]],[[51350,7846],[48,-5],[30,-35]],[[51428,7806],[13,-56]],[[51441,7750],[19,-12],[25,-5]],[[51485,7733],[31,36],[15,-3],[8,-85],[34,-5]],[[51573,7676],[24,-62],[14,-11],[25,16],[72,9]],[[51708,7628],[94,-7],[84,-39]],[[51886,7582],[25,-58],[13,-6]],[[51924,7518],[57,12],[48,33],[48,7]],[[52077,7570],[25,26],[34,-8]],[[52136,7588],[34,18],[109,-5],[64,12]],[[52343,7613],[156,-32],[51,0]],[[52550,7581],[0,-78]],[[52550,7503],[38,2]],[[52588,7505],[13,-50]],[[52601,7455],[-37,-92],[6,-71]],[[52570,7292],[-83,-105],[74,10]],[[52561,7197],[165,-44],[31,-34],[-9,-17],[11,-5],[8,-65],[-16,-4]],[[52751,7028],[4,-93]],[[52755,6935],[66,21]],[[52821,6956],[40,-4]],[[52861,6952],[52,51]],[[52913,7003],[44,2]],[[52957,7005],[22,-230],[11,-606],[-13,-417],[19,-250],[-33,-475]],[[52963,5027],[-1861,-1280]],[[51102,3747],[-60,33]],[[51042,3780],[-42,76],[-55,-15]],[[50945,3841],[-9,-22]],[[50936,3819],[4,-23],[51,-39]],[[50991,3757],[0,-12],[-14,-34],[-51,-7],[-42,31]],[[50884,3735],[-24,45],[-2,31],[20,66]],[[50878,3877],[-3,37],[-25,55],[-30,-1],[-18,-35],[-78,1],[-103,106],[-64,11]],[[50557,4051],[-26,16],[-38,-17]],[[50493,4050],[-28,17],[-53,109]],[[50412,4176],[-31,1],[-76,-26],[-14,7],[-13,27],[17,55],[-3,45],[-68,71],[-39,120],[-39,24],[-47,7],[-7,48],[-19,32],[-24,-21],[-21,18],[2,20],[15,18],[-11,27],[-37,-26],[-47,-5],[-11,24],[-41,36],[-2,91],[-30,54],[-52,18],[-29,-17],[-24,3],[-24,15],[-9,35],[-72,18],[-22,14],[-11,22],[-133,-11],[-31,16],[-3,16],[-45,38],[-28,15],[-34,-6],[-49,10],[-17,16],[5,14],[-17,-3],[-32,24],[-25,-2],[-38,-41],[-24,-9],[2,-31],[-6,-4],[-12,35]],[[49136,5008],[-25,2],[-2,-16]],[[49109,4994],[-59,24],[-23,-41],[-16,19]],[[49011,4996],[-44,18],[-29,-19]],[[48938,4995],[-59,18]],[[48879,5013],[-34,-39],[-27,7]],[[48818,4981],[-56,930]],[[48762,5911],[-32,794],[59,26]],[[53416,2354],[803,478],[1055,675],[1034,717]],[[56308,4224],[1291,833],[-17,-62],[8,-37]],[[57590,4958],[-33,-77],[27,-54]],[[57584,4827],[-23,-25],[0,-38],[-21,-24],[9,-39],[-36,-63],[2,-19],[52,-35],[15,-45],[-10,-30],[59,-60]],[[57631,4449],[9,-31]],[[57640,4418],[-13,-41],[15,-31],[51,-35]],[[57693,4311],[55,11]],[[57748,4322],[-20,-57],[-21,-10],[17,-65],[29,2],[17,35],[53,-53]],[[57823,4174],[57,-19]],[[57880,4155],[-3,-59]],[[57877,4096],[-25,-26]],[[57852,4070],[30,-17],[4,-60],[-35,-33],[-2,-46]],[[57849,3914],[-52,-18]],[[57797,3896],[-3,-37],[-11,-5],[6,-27],[30,-13],[-2,-16],[28,13],[19,-17]],[[57864,3794],[-3,-17],[-26,-38]],[[57835,3739],[-10,13],[-16,-2],[-6,-25],[-26,11],[-26,-51]],[[57751,3685],[8,-23],[-72,-38]],[[57687,3624],[2,-19],[39,-22],[-24,-41]],[[57704,3542],[-24,0]],[[57680,3542],[-11,-41],[-20,5]],[[57649,3506],[-54,-34]],[[57595,3472],[-20,7],[9,-18],[-11,-3],[30,-21],[-9,-53],[-50,-41],[-3,-33],[-33,-43]],[[57508,3267],[25,-41]],[[57533,3226],[-2,-23],[16,0],[-3,-19],[-26,-28],[-11,30],[-20,-10]],[[57487,3176],[3,-35]],[[57490,3141],[-31,-72]],[[57459,3069],[13,-36],[-11,2],[-1,-35],[-8,10],[-20,-35],[18,-47],[33,3],[10,-42],[-2,-34],[-36,-40],[5,-49],[-17,-22],[-37,8]],[[57406,2752],[-18,-50]],[[57388,2702],[-92,-40],[-19,-37],[18,-15],[-38,-38],[21,-21]],[[57278,2551],[21,-65]],[[57299,2486],[-22,-5]],[[57277,2481],[-28,-37],[-22,0],[6,19],[-17,-2],[-2,14]],[[57214,2475],[-30,-13]],[[57184,2462],[6,-30],[-32,-24],[8,-15],[-11,-12],[16,0],[-8,-23],[11,6]],[[57174,2364],[39,-71],[-59,-50]],[[57154,2243],[-20,-41],[-41,32],[-10,-33]],[[57083,2201],[-43,-26]],[[57040,2175],[-14,-32],[28,-48],[-18,-5]],[[57036,2090],[20,-37]],[[57056,2053],[-26,-15],[21,-25]],[[57051,2013],[-27,-27]],[[57024,1986],[5,-15],[-19,19],[-16,-17],[20,-24],[-37,-3],[-14,-57],[15,-13]],[[56978,1876],[-16,-20]],[[56962,1856],[-210,10]],[[56752,1866],[-114,-44]],[[56638,1822],[6,-24]],[[56644,1798],[-42,0]],[[56602,1798],[-17,-52]],[[56585,1746],[-1,-19],[35,-21],[-14,-16]],[[56605,1690],[12,-34]],[[56617,1656],[-22,-52]],[[56595,1604],[14,-52]],[[56609,1552],[16,-17]],[[56625,1535],[128,-2]],[[56753,1533],[16,-31]],[[56769,1502],[-18,-34]],[[56751,1468],[-107,-59]],[[56644,1409],[99,-53]],[[56743,1356],[98,-26]],[[56841,1330],[244,-148]],[[57085,1182],[3,12]],[[57088,1194],[78,-28]],[[57166,1166],[40,-41]],[[57206,1125],[5,-70],[31,-55]],[[57242,1000],[-21,-56],[-32,-15]],[[57189,929],[-14,-41],[-15,-2]],[[57160,886],[-1,25]],[[57159,911],[-92,-51],[41,-67]],[[57108,793],[-46,-111]],[[57062,682],[28,-114]],[[57090,568],[1,-135],[-27,-30]],[[57064,403],[-65,6],[-5,-16],[26,-21],[-2,-19]],[[57018,353],[-69,-7]],[[56949,346],[-14,-35],[1,-71]],[[56936,240],[-28,-32],[124,-59],[-9,-91],[11,-25],[-1996,3],[-144,36],[-298,-30],[-775,2]],[[53821,44],[-46,41]],[[53775,85],[-6,-18],[-72,1],[-3,52],[-26,-30],[-9,16],[-55,0],[9,13]],[[53613,119],[-12,48]],[[53601,167],[-25,-23],[-13,32],[-35,12],[-12,-9],[20,-26],[-43,1],[-3,-44],[-36,-1],[-23,34],[-42,-36],[-3,23],[-27,9],[3,16],[-33,-7],[2,49],[-23,2],[9,27],[-15,14],[5,21],[-27,5],[13,42],[-15,13],[4,34],[-13,9],[9,34],[7,-13]],[[53285,385],[17,10],[23,71],[-9,2],[7,24]],[[53323,492],[-16,5],[6,18],[-14,4]],[[53299,519],[26,36],[-17,-7],[3,22],[-21,5]],[[53290,575],[22,89]],[[53312,664],[-59,11]],[[53253,675],[-7,30]],[[53246,705],[18,28],[-26,-20],[-2,18],[-43,7],[10,11],[-13,21],[13,22],[-14,22],[34,1],[-23,37],[-25,-2],[16,22],[-36,19],[22,14],[-27,20],[36,26],[-19,15],[7,24],[-33,33],[-41,5]],[[53100,1028],[-1,-24]],[[53099,1004],[-35,-15]],[[53064,989],[3,132],[-19,9]],[[53048,1130],[4,-24],[-21,-13],[-1,29],[-29,-2],[-20,56],[-14,-23],[-13,31],[-59,1],[-6,27],[-28,-1],[-11,35],[-29,15],[-25,-26],[-11,31],[-36,-24]],[[52749,1242],[-45,31]],[[52704,1273],[-17,-41],[-9,24],[-33,-17],[-10,33],[-18,-36],[6,-20],[-35,19],[-26,-4],[-12,-22],[-39,31]],[[52511,1240],[-45,-18],[-10,14],[29,22]],[[52485,1258],[-5,16],[-67,-37]],[[52413,1237],[5,17],[-31,21],[-22,50]],[[52365,1325],[-54,2],[-11,26]],[[52300,1353],[16,35],[-17,36],[-21,4],[-14,-26],[-23,-4],[-21,41],[-30,-8],[-24,27],[-11,-47],[-25,33],[-39,-2]],[[52091,1442],[177,120],[1148,792]],[[43297,27971],[760,-323],[-7,35],[27,14],[-1,18],[37,15],[-31,83],[56,56],[4,35],[-35,19],[-1,40]],[[44106,27963],[34,6],[29,24]],[[44169,27993],[-9,24],[8,22],[83,36],[1,42],[-13,17],[62,69],[-2,44],[31,-5],[20,16],[-5,30]],[[44345,28288],[18,9],[30,-10]],[[44393,28287],[52,75],[71,36]],[[44516,28398],[52,-29],[15,4]],[[44583,28373],[9,38]],[[44592,28411],[-24,57],[37,-11]],[[44605,28457],[49,-49],[8,-27],[50,-18],[117,58],[26,-17],[29,22],[54,7],[55,-27],[13,31],[-8,41]],[[44998,28478],[25,5],[31,-14],[18,-34],[-16,-50]],[[45056,28385],[8,-27],[11,-8],[22,14]],[[45097,28364],[13,-16],[-6,-19],[-57,-51]],[[45047,28278],[55,-28]],[[45102,28250],[48,-68],[-97,-22]],[[45053,28160],[22,-38],[-5,-7]],[[45070,28115],[-64,0],[3,-64],[48,-28],[-4,-14],[-78,19],[-16,-17],[28,-19],[9,-32],[55,-49],[19,-38]],[[45070,27873],[12,7],[1,23]],[[45083,27903],[18,-4]],[[45101,27899],[-19,-85],[5,-16]],[[45087,27798],[28,4],[27,38],[39,-39],[18,-59]],[[45199,27742],[77,-24],[-61,-35]],[[45215,27683],[-25,19],[-12,-15]],[[45178,27687],[57,-60],[-11,-38]],[[45224,27589],[16,-13],[-49,-25],[16,-13],[-9,-34]],[[45198,27504],[56,-62],[-68,-40]],[[45186,27402],[-40,-62]],[[45146,27340],[-55,16]],[[45091,27356],[-16,-12]],[[45075,27344],[42,-61]],[[45117,27283],[-14,-17],[16,-28]],[[45119,27238],[100,-83]],[[45219,27155],[-27,-25]],[[45192,27130],[2,-43],[-18,-34],[-14,-2],[-90,86]],[[45072,27137],[-22,1],[-22,-24],[93,-182]],[[45121,26932],[11,-84],[26,8]],[[45158,26856],[88,-54]],[[45246,26802],[32,17]],[[45278,26819],[74,-106]],[[45352,26713],[-43,-82]],[[45309,26631],[-25,-105]],[[45284,26526],[-53,-57],[-56,-36],[-61,-182],[-78,-115],[-5,-33]],[[45031,26103],[55,-3],[-19,-77],[-94,-147]],[[44973,25876],[-34,-19],[-101,-106]],[[44838,25751],[-280,-381]],[[44558,25370],[-91,-81],[-165,-188],[-82,-129],[-127,-143]],[[44093,24829],[-172,-239]],[[43921,24590],[-147,-117],[-55,-10]],[[43719,24463],[-128,-173]],[[43591,24290],[-334,145]],[[43257,24435],[-45,-121]],[[43212,24314],[-184,-263]],[[43028,24051],[-117,-197],[-82,-189],[-102,-286]],[[42727,23379],[-96,-223]],[[42631,23156],[-17,-12],[-16,-56]],[[42598,23088],[-125,-142]],[[42473,22946],[-929,838],[-991,922],[164,334],[175,284],[277,628],[39,28],[48,107],[57,56],[54,17],[29,36],[87,39],[38,58],[7,42],[29,24],[-2,48],[51,45],[-4,12],[49,67],[141,47],[45,52],[-25,-136],[6,-90],[-11,-17],[-2,-48],[8,-42],[17,-20],[45,48],[70,73],[58,-9],[11,31],[66,85],[66,6],[24,26],[59,68],[72,132],[26,19],[56,148],[49,83],[69,-15],[75,156],[33,19],[44,0],[15,-94],[63,23],[8,-63],[72,-66],[24,55],[47,27],[37,56],[10,42],[40,52],[21,57],[60,88],[91,97],[27,52],[75,69],[-58,37],[-19,34],[-53,20],[-51,64],[235,274]],[[35856,11947],[64,121],[144,0],[117,105],[58,76]],[[36239,12249],[49,24],[77,10]],[[36365,12283],[59,85],[1,29],[111,53],[-1,51]],[[36535,12501],[18,60],[15,14]],[[36568,12575],[-5,43],[14,32],[30,7],[-3,26],[42,56],[84,68]],[[36730,12807],[19,46],[1,35]],[[36750,12888],[28,36],[12,33],[-24,75],[21,46],[31,8],[-10,35],[23,57],[44,25],[0,23],[-28,42],[43,55],[0,26],[15,8]],[[36905,13357],[30,89],[45,64],[0,21]],[[36980,13531],[115,169],[49,90],[11,50]],[[37155,13840],[64,101],[31,-38]],[[37250,13903],[15,22],[29,5],[81,128]],[[37375,14058],[59,32],[66,56]],[[37500,14146],[27,-10],[-8,-32],[51,-29]],[[37570,14075],[15,-23],[0,-21]],[[37585,14031],[41,-16],[-18,-37],[6,-21],[44,-26],[27,-53],[28,9],[65,-19],[55,57],[98,22],[13,22],[65,34]],[[38009,14003],[-10,31]],[[37999,14034],[287,123]],[[38286,14157],[11,-14],[11,-59]],[[38308,14084],[25,-10],[34,-51],[52,5],[18,-13],[14,-51],[-14,-27]],[[38437,13937],[24,-61],[23,-27]],[[38484,13849],[23,-2],[15,-19],[19,16],[-1,15],[29,-1],[35,-28]],[[38604,13830],[41,14],[30,-4]],[[38675,13840],[18,26]],[[38693,13866],[27,-7],[17,-26]],[[38737,13833],[25,4],[1,-24]],[[38763,13813],[20,-14]],[[38783,13799],[39,-7],[-18,-24],[3,-12],[40,2],[14,-16],[10,-27],[-7,-19],[21,-37],[-30,-29]],[[38855,13630],[-15,-48],[36,-76],[18,-101],[-33,-172],[46,-64]],[[38907,13169],[-24,-68],[51,-31]],[[38934,13070],[6,-23],[26,-23]],[[38966,13024],[20,6],[30,-18],[107,-19]],[[39123,12993],[37,-31],[32,-48]],[[39192,12914],[39,0],[33,26],[62,8],[18,-41],[32,-15],[-1,-18],[23,-14],[69,24],[14,23],[36,-33]],[[39517,12874],[48,-12],[3,-24],[-19,-62],[50,-35]],[[39599,12741],[-7,-50],[70,-45]],[[39662,12646],[29,15],[38,-29],[-23,-27],[-16,-49],[64,-51],[44,-151],[22,-24],[54,-126],[433,-1047],[42,-8]],[[40349,11149],[24,20],[3,24],[23,9],[22,-17]],[[40421,11185],[12,43],[14,-26]],[[40447,11202],[45,-23],[13,11],[-6,13],[28,4]],[[40527,11207],[40,-46],[-14,-29],[-23,-6]],[[40530,11126],[3,-14],[-83,-92]],[[40450,11020],[-86,24]],[[40364,11044],[-54,-26],[-4,-24]],[[40306,10994],[29,-42]],[[40335,10952],[24,-64],[-6,-44]],[[40353,10844],[-21,-33],[-68,-44],[-36,-45],[-50,-16],[-52,-53],[-32,-16],[-45,-1]],[[40049,10636],[-125,69],[-49,-3]],[[39875,10702],[0,-26]],[[39875,10676],[63,-41],[13,-23],[16,-55],[-13,-68],[-28,-30],[-165,-60]],[[39761,10399],[-35,-23],[-88,-77]],[[39638,10299],[-46,-65],[-51,-34],[-78,-99]],[[39463,10101],[-100,-42],[-24,-44],[-10,-87]],[[39329,9928],[-23,-36],[-91,-17]],[[39215,9875],[-55,37]],[[39160,9912],[-76,10],[-11,-28]],[[39073,9894],[31,-52],[4,-47]],[[39108,9795],[-14,-41],[-37,-24],[-66,17],[-83,56],[-28,2],[-27,-17],[-3,-51],[23,-47],[31,-31]],[[38904,9659],[6,-101],[24,-106],[-33,-48]],[[38901,9404],[-29,-10],[-103,59],[-212,171]],[[38557,9624],[-26,5],[-21,-12]],[[38510,9617],[-4,-60]],[[38506,9557],[-15,-28],[-34,-4]],[[38457,9525],[-47,25]],[[38410,9550],[-84,101],[-51,87]],[[38275,9738],[-5,61]],[[38270,9799],[-35,110]],[[38235,9909],[-28,28],[6,-65],[-37,55]],[[38176,9927],[-205,169]],[[37971,10096],[-35,60]],[[37936,10156],[-46,45],[1,55]],[[37891,10256],[12,29]],[[37903,10285],[-16,2]],[[37887,10287],[-26,94],[-178,33]],[[37683,10414],[-61,89],[-8,33]],[[37614,10536],[-59,56]],[[37555,10592],[-6,20],[7,31]],[[37556,10643],[46,48]],[[37602,10691],[-6,35],[-63,14],[-112,-7]],[[37421,10733],[-155,-134],[-27,42],[3,114],[-20,22]],[[37222,10777],[-24,-5],[-50,-40]],[[37148,10732],[-79,-10],[-92,-65]],[[36977,10657],[-42,18],[-39,43],[-94,60]],[[36802,10778],[-121,25]],[[36681,10803],[-120,67],[-58,70]],[[36503,10940],[-31,80]],[[36472,11020],[-111,182],[-29,215]],[[36332,11417],[-92,162]],[[36240,11579],[0,92],[-8,15]],[[36232,11686],[-39,34],[-51,10],[-30,20]],[[36112,11750],[-32,70],[-47,40],[-90,-11],[-60,-56]],[[35883,11793],[-55,0],[-46,21]],[[35782,11814],[-12,22],[12,67],[-19,62]],[[35763,11965],[7,-1],[86,-17]],[[17279,789],[-3,19],[36,0],[21,29],[28,-17],[61,26]],[[17422,846],[37,131],[4,111]],[[17463,1088],[32,43]],[[17495,1131],[176,44]],[[17671,1175],[132,126]],[[17803,1301],[84,5]],[[17887,1306],[69,-15]],[[17956,1291],[69,89],[54,144],[13,80],[-17,68]],[[18075,1672],[15,30]],[[18090,1702],[-101,40]],[[17989,1742],[-5,50]],[[17984,1792],[94,27]],[[18078,1819],[65,38]],[[18143,1857],[137,-11]],[[18280,1846],[59,51]],[[18339,1897],[126,2]],[[18465,1899],[169,48]],[[18634,1947],[55,1],[4,18],[33,13],[72,-28],[64,7],[112,40],[102,84],[157,71],[99,65],[702,150],[16,-11],[260,111]],[[20310,2468],[167,13]],[[20477,2481],[60,-46]],[[20537,2435],[15,18],[54,-1],[24,31],[43,9],[14,-13],[3,-25],[34,-17]],[[20724,2437],[166,-4]],[[20890,2433],[56,-23],[59,9],[-7,46],[21,23]],[[21019,2488],[162,-23]],[[21181,2465],[15,8],[-3,24],[74,40],[50,-39],[61,-2],[43,-26],[30,8],[18,41],[71,-13],[62,20],[90,-9],[51,20]],[[21743,2537],[79,-20]],[[21822,2517],[37,122]],[[21859,2639],[-24,36],[3,29],[28,13],[-21,26],[49,30]],[[21894,2773],[70,6]],[[21964,2779],[26,45],[24,17],[67,14],[19,33],[-3,25]],[[22097,2913],[120,40],[941,-1518]],[[23158,1435],[-17,-13],[-47,37],[16,38],[-16,34]],[[23094,1531],[-28,-4]],[[23066,1527],[-20,-21],[4,-26],[28,-15]],[[23078,1465],[-36,-17],[-25,-46]],[[23017,1402],[-17,-44],[-4,-85]],[[22996,1273],[19,-77]],[[23015,1196],[62,-34]],[[23077,1162],[158,-20],[-84,-167]],[[23151,975],[4,-36]],[[23155,939],[85,3]],[[23240,942],[1,23],[42,19],[12,119],[-24,56],[1,23]],[[23272,1182],[27,35]],[[23299,1217],[643,-1013],[-802,42],[-637,11],[-358,34],[-389,5],[-902,50],[-700,35],[-608,-5],[-43,15],[-2,-15],[-82,-17],[-7,18],[-576,23],[-284,38],[-109,-13],[-257,16],[-675,71],[-652,14],[257,264],[163,-1]],[[30444,9846],[18,45]],[[30462,9891],[55,61],[94,79]],[[30611,10031],[38,66],[92,220],[14,75]],[[30755,10392],[78,146]],[[30833,10538],[58,69]],[[30891,10607],[-2,58],[16,16],[27,103],[133,134]],[[31065,10918],[125,170]],[[31190,11088],[27,13],[29,45],[28,12],[-495,887],[-37,160]],[[30742,12205],[186,178],[59,35],[36,5]],[[31023,12423],[257,226],[92,58]],[[31372,12707],[44,47],[29,59],[59,63]],[[31504,12876],[53,-18]],[[31557,12858],[95,4],[56,46],[50,84],[35,90]],[[31793,13082],[145,229],[131,61],[65,57]],[[32134,13429],[152,209],[1,23],[47,86]],[[32334,13747],[-16,56],[117,84],[124,123],[1204,-421]],[[33763,13589],[-34,-178],[-31,-76]],[[33698,13335],[-59,-62],[104,-400],[73,-48]],[[33816,12825],[-23,-98],[-13,-132]],[[33780,12595],[-25,-53],[-73,-81]],[[33682,12461],[931,-734]],[[34613,11727],[-16,-34],[7,12],[-2,-58],[-29,-84],[670,-533]],[[35243,11030],[-34,-35],[-22,-6]],[[35187,10989],[6,-89],[-36,-45],[-47,-9]],[[35110,10846],[-25,-35],[-14,-53]],[[35071,10758],[-115,-31],[-14,-43],[-26,-10],[-11,-58],[-62,-72]],[[34843,10544],[-24,32],[-7,30],[-26,11],[-20,37]],[[34766,10654],[-32,-30],[-36,-67],[-35,-30],[-17,-54]],[[34646,10473],[-34,-27],[-42,-76],[-23,-13]],[[34547,10357],[6,-44],[-24,-55],[21,-88],[-17,-41],[-92,-33],[-73,52],[-2,20],[-52,-1],[-72,31]],[[34242,10198],[-75,-29],[-17,-20]],[[34150,10149],[-54,40],[-33,47]],[[34063,10236],[-11,107],[-116,122],[-47,35],[-46,-23],[-104,6],[-26,-37],[-88,-47],[-130,-174],[-37,-9],[-10,-52]],[[33448,10164],[-43,-30],[-22,-37]],[[33383,10097],[-21,-3],[-43,-43],[-71,-43]],[[33248,10008],[-25,-34],[-75,-59]],[[33148,9915],[-41,-10],[-42,-75],[-57,-17]],[[33008,9813],[-40,-43],[-188,-120]],[[32780,9650],[-75,1],[-124,-55]],[[32581,9596],[5,-22],[29,-32]],[[32615,9542],[46,-28],[2,-50],[57,-76],[41,-24],[-3,-20]],[[32758,9344],[59,11],[71,-9]],[[32888,9346],[20,-46],[-6,-36]],[[32902,9264],[-23,-33],[-38,-21]],[[32841,9210],[-11,-30],[0,-48],[-18,-34],[3,-51],[-20,-57]],[[32795,8990],[-52,-47],[-59,-19],[-75,-91]],[[32609,8833],[-192,-118],[-23,-30],[-64,-42],[-7,-57]],[[32323,8586],[-25,-43]],[[32298,8543],[-147,213]],[[30484,9645],[-94,157],[54,44]],[[40807,16752],[78,72]],[[40885,16824],[28,4],[42,53],[110,32]],[[41065,16913],[133,83],[-8,92]],[[41190,17088],[66,43],[41,-10]],[[41297,17121],[16,30],[-1,63],[18,45]],[[41330,17259],[-32,41],[2,23],[-26,19]],[[41274,17342],[41,65],[-18,15],[4,55],[-43,18],[-15,32],[19,25]],[[41262,17552],[-16,21],[-8,60]],[[41238,17633],[72,56],[4,89],[31,15]],[[41345,17793],[11,96],[22,57]],[[41378,17946],[9,83],[-11,41]],[[41376,18070],[21,30],[17,73]],[[41414,18173],[32,32]],[[41446,18205],[13,47],[42,51],[10,51],[27,31]],[[41538,18385],[-2,29],[16,17]],[[41552,18431],[-9,43]],[[41543,18474],[58,131],[153,162],[5,33]],[[41759,18800],[126,74],[41,89],[74,-8],[40,17],[94,85],[48,-20],[54,-65],[9,37],[55,32],[60,80]],[[42360,19121],[-21,0],[-41,46],[-33,13]],[[42265,19180],[48,45]],[[42313,19225],[-22,53],[1,35]],[[42292,19313],[679,-310]],[[42971,19003],[1567,-647]],[[44538,18356],[443,-155]],[[44981,18201],[799,-361]],[[45780,17840],[352,-137]],[[46132,17703],[-390,-770]],[[45742,16933],[-472,-680],[-932,-1418],[-598,-872]],[[43740,13963],[-44,-34],[-16,-68],[29,-170]],[[43703,13623],[-30,-50],[-91,-44],[-135,11],[-164,60]],[[43283,13600],[-332,-97]],[[42951,13503],[-233,8],[-225,-186]],[[42454,13256],[-65,-11]],[[42389,13245],[-22,-30]],[[42367,13215],[-23,-1],[-16,-74],[-82,23],[-126,108],[-21,50],[16,66],[5,78],[-11,44]],[[42109,13509],[9,38],[43,6],[71,-32],[20,7],[3,20]],[[42255,13548],[-68,60],[-69,98],[-29,4],[-29,-31],[-23,1],[34,78]],[[42071,13758],[58,36]],[[42129,13794],[-42,37],[-34,132]],[[42053,13963],[-923,2070],[-323,719]],[[43499,16554],[1,-41]],[[43500,16513],[-26,3]],[[43474,16516],[-3,-76]],[[43471,16440],[34,-27]],[[43505,16413],[3,-70],[53,-13],[35,19]],[[43596,16349],[45,-13]],[[43641,16336],[108,79]],[[43749,16415],[54,-20]],[[43803,16395],[8,-39]],[[43811,16356],[64,31]],[[43875,16387],[8,-19]],[[43924,16350],[24,77]],[[43948,16427],[41,46]],[[43989,16473],[46,-15]],[[44035,16458],[31,49]],[[44071,16533],[-15,19]],[[44056,16552],[-47,-25]],[[44009,16527],[-12,19]],[[43997,16546],[10,46]],[[44007,16592],[46,61]],[[44053,16653],[-1,74]],[[44052,16727],[62,9]],[[44122,16772],[-12,87]],[[44051,16831],[10,-14]],[[44061,16817],[-26,24]],[[44017,16789],[15,-23]],[[44032,16766],[-60,8]],[[43972,16774],[-17,-42]],[[43955,16732],[-53,36]],[[43902,16768],[1,40]],[[43903,16808],[67,134]],[[43970,16942],[-22,35]],[[43948,16977],[-46,-3]],[[43916,16998],[-11,8]],[[43905,17006],[-27,-21]],[[43878,16985],[-16,-42]],[[43862,16943],[-32,10]],[[43830,16953],[-36,37]],[[43740,16911],[-29,38]],[[43649,16896],[9,-32]],[[43619,16729],[-46,-19]],[[43546,16722],[-24,-41]],[[43522,16681],[16,-50]],[[43538,16631],[63,-10]],[[43601,16621],[32,79]],[[43640,16632],[48,-39]],[[43688,16593],[-100,-12]],[[43588,16581],[-58,-40],[-31,13]],[[38672,5789],[299,-179]],[[38971,5610],[84,-11],[55,13]],[[39110,5612],[199,-66],[62,-92]],[[39371,5454],[29,-15],[37,10],[53,82]],[[39490,5531],[82,27]],[[39572,5558],[86,95],[31,9],[34,-49]],[[39723,5613],[258,-111],[117,-97]],[[40098,5405],[108,-13]],[[40206,5392],[47,-36],[20,-122]],[[40273,5234],[71,-58],[19,-41],[-16,-66],[-70,-105]],[[40277,4964],[4,-57],[28,-45],[68,-10]],[[40377,4852],[46,44],[121,54]],[[40544,4950],[220,-31]],[[40764,4919],[215,13],[109,-81],[44,-56],[41,-91]],[[41173,4704],[11,-96],[52,-28],[105,30]],[[41341,4610],[17,24],[-15,161],[8,99],[26,45]],[[41377,4939],[53,26],[84,-35],[54,20],[7,35],[-19,55]],[[41556,5040],[-61,40],[-18,41],[14,48]],[[41491,5169],[25,22],[40,10]],[[41556,5201],[33,-18],[51,-61],[-8,-63]],[[41632,5059],[37,-174],[-6,-109]],[[41663,4776],[21,-102],[1,-98]],[[41685,4576],[67,-149]],[[41752,4427],[-50,-75]],[[41702,4352],[-136,-39],[-18,-35],[3,-43],[233,-179]],[[41784,4056],[88,-107],[52,-100],[93,-86],[35,-112]],[[42052,3651],[38,-60],[126,-53],[55,-177],[-26,-63],[-135,-59]],[[42110,3239],[-22,-53]],[[42088,3186],[24,-64]],[[42112,3122],[148,-109],[-17,-47],[-75,-37],[-21,-28]],[[42147,2901],[-22,-103]],[[42125,2798],[26,-88]],[[42151,2710],[116,-225]],[[42267,2485],[-19,-50],[-70,-17],[-36,-36],[-36,-78],[-51,-69],[4,-39],[166,-195]],[[42225,2001],[14,-40],[-4,-45],[35,-71],[103,-54],[43,-45]],[[42416,1746],[36,0]],[[42452,1746],[25,-21],[140,-252],[269,-178]],[[42886,1295],[138,-113]],[[43024,1182],[138,-58],[66,-85],[26,-89]],[[43254,950],[-66,117],[-31,29]],[[43157,1096],[-158,-7]],[[42999,1089],[-120,150],[-76,20],[-97,105],[-89,42],[-131,193],[-81,62]],[[42405,1661],[-204,-13],[-130,-69]],[[42071,1579],[-25,-44],[-40,3],[-16,-27],[-31,-8],[36,-38],[-11,-21],[20,-20],[-5,-36],[-21,-15],[7,-37],[-22,-40],[0,-28],[-43,3],[-6,-95],[-11,-38]],[[41903,1138],[-23,-12]],[[41880,1126],[33,-46],[-45,-41],[19,-6],[15,-46],[-23,-29],[18,-13],[-6,-46],[11,-12],[-27,-28],[12,-16],[0,-65],[-12,-9],[15,-16],[-41,-50]],[[41849,703],[-15,-63]],[[41834,640],[42,-60]],[[41876,580],[-64,-46],[35,-36],[-27,-6]],[[41820,492],[29,-48],[-23,-52],[-29,1],[-24,25],[-17,-26],[14,-70],[-30,20],[-40,-23],[19,-26]],[[41719,293],[-19,-76],[-31,0],[18,-30],[-25,-20],[11,-40]],[[41673,127],[-31,-10],[46,-7]],[[41688,110],[0,-15],[25,-17],[-19,-65]],[[41694,13],[-4089,-4]],[[37605,9],[767,4154],[300,1626]],[[31000,15780],[-44,-20],[-33,-41],[-19,-3]],[[30904,15716],[-10,-25],[-47,-22],[-37,-71],[-31,-11]],[[30779,15587],[-240,102],[43,54],[22,7],[13,29],[20,0],[34,62],[30,3],[8,26],[57,65],[16,2],[11,22],[32,20],[13,30],[63,39],[8,49],[108,69],[5,54],[21,10],[12,38],[-5,34],[46,68],[33,11],[11,27],[-6,28],[45,94],[42,27],[-1,15],[14,13],[-3,20],[21,10],[-19,53],[66,120],[49,130],[6,20],[-19,17],[1,18],[33,51],[18,61],[12,11],[-2,21],[60,52],[39,69],[64,58],[10,29],[63,83],[-21,25],[-85,31],[-21,64],[7,39],[-22,25],[18,24],[-25,37],[-10,40],[21,24],[70,7],[15,13],[31,40],[3,57],[21,29],[0,23],[64,58],[0,36],[-10,7],[2,44],[28,5],[12,52],[-26,7],[-8,19],[20,75],[-6,18],[-32,17],[8,28],[33,19],[-2,23],[16,24],[60,-5],[85,60],[-1,27],[38,45],[9,50],[13,17],[33,23],[29,-11],[31,44],[39,23],[6,27],[110,109],[33,65],[56,25],[43,86],[86,9],[18,63],[17,24],[48,9],[40,-27],[28,16],[19,23],[-7,39],[32,59],[47,-13],[43,25],[35,52],[325,-235]],[[35129,18229],[4,-40]],[[35133,18189],[-90,-36],[-42,-31]],[[35001,18122],[0,-16],[18,-7],[30,-68]],[[35049,18031],[-94,-62],[-5,-25],[14,-27],[39,-6],[86,36]],[[35089,17947],[65,-1]],[[35154,17946],[43,32],[59,75]],[[35256,18053],[111,63],[76,-23],[41,-34]],[[35484,18059],[52,13],[45,-36]],[[35581,18036],[30,27],[25,-9],[53,41]],[[35689,18095],[76,-59],[-71,-172]],[[35694,17864],[-122,-168],[-93,-104]],[[35479,17592],[-191,-309],[92,-103]],[[35380,17180],[-11,-29],[-65,-90],[-69,-138]],[[35235,16923],[-83,-120]],[[35152,16803],[-65,-30],[-42,-49],[-21,-42]],[[35024,16682],[113,-66],[-111,-156],[-106,-179],[-31,-31]],[[34889,16250],[1,-26],[-95,-172],[-257,-338]],[[34538,15714],[-179,-174],[-46,-29]],[[34313,15511],[-113,-222],[-46,-68]],[[34154,15221],[-4,-43],[-50,-130]],[[34100,15048],[-85,-149],[-27,-71]],[[33988,14828],[-63,-74]],[[33925,14754],[-49,47],[-174,-212],[-98,-95],[-237,264],[-238,191],[-497,-52],[-669,136],[-58,56],[-330,615],[-17,12],[-340,-7],[-84,33],[-42,44],[-36,-15],[-56,9]],[[35479,17592],[215,272]],[[35694,17864],[69,174],[-74,57]],[[35689,18095],[-108,-59]],[[35484,18059],[-110,58],[-118,-64]],[[35256,18053],[-102,-107]],[[35089,17947],[-90,-36],[-37,8],[-12,40],[99,72]],[[35049,18031],[-48,91]],[[35001,18122],[132,67]],[[35133,18189],[-4,58],[64,40]],[[35206,18348],[67,12]],[[35265,18457],[106,50]],[[35371,18507],[52,62]],[[35391,18633],[81,51]],[[35528,18694],[225,-67]],[[35753,18627],[38,147]],[[35791,18774],[90,31]],[[35881,18805],[36,86]],[[35994,18927],[49,90]],[[36043,19017],[9,73]],[[36014,19215],[10,67]],[[36060,19412],[10,72]],[[36147,19471],[32,184],[44,51]],[[36223,19706],[8,55],[90,131]],[[36376,19936],[-28,17]],[[36348,19953],[49,86]],[[36442,20055],[16,84]],[[36458,20139],[148,94],[-27,66]],[[36579,20299],[57,114],[45,7]],[[36705,20462],[76,-29]],[[36781,20433],[66,48],[0,120],[-48,57]],[[36799,20658],[-71,26],[13,57]],[[36741,20741],[33,42],[98,57],[46,-4],[79,68],[66,-33],[27,63],[-26,89],[131,73],[108,196],[59,-29],[41,10],[4,116],[19,60],[131,87]],[[37557,21536],[2606,-1923],[47,-16],[138,36],[47,-35]],[[40395,19598],[81,-65]],[[40476,19533],[57,-100],[53,-22]],[[40586,19411],[979,-891]],[[41565,18520],[-22,-46]],[[41552,18431],[-14,-46]],[[41538,18385],[-92,-180]],[[41414,18173],[-38,-103]],[[41376,18070],[2,-124]],[[41378,17946],[-33,-153]],[[41238,17633],[24,-81]],[[41274,17342],[56,-83]],[[41330,17259],[-33,-138]],[[41190,17088],[14,-82],[-38,-35],[-101,-58]],[[40885,16824],[-167,-177]],[[40718,16647],[-46,-26],[-25,-71]],[[40647,16550],[-42,-18],[-89,9]],[[40516,16541],[-70,-116]],[[40446,16425],[1,-105],[-53,-101],[2,-34],[-30,-23],[-52,6]],[[40314,16168],[-80,-87],[-4,-124]],[[40230,15957],[34,-14],[84,26],[8,-24]],[[40356,15945],[-82,-188]],[[40274,15757],[11,-34],[-10,-40],[27,-29],[-88,-39],[-89,11],[-11,-39],[-46,-30],[-127,3],[-128,-161],[-18,-63],[34,-42],[-128,-42],[-92,-75],[-37,-49],[-16,-63]],[[39556,15065],[-149,-157]],[[39407,14908],[-92,65],[-10,65]],[[39305,15038],[-231,-28]],[[39074,15010],[-9,76],[-38,25]],[[39027,15111],[-18,142]],[[39009,15253],[-38,-1],[-48,55],[-56,-47],[-62,19]],[[38805,15279],[-125,-46]],[[38680,15233],[-64,-37],[-21,-43]],[[38595,15153],[-124,-19]],[[38471,15134],[-52,-67],[-60,-5]],[[38359,15062],[-140,-74]],[[38219,14988],[-40,41],[-57,-18]],[[38122,15011],[-224,258]],[[37898,15269],[-1551,1155],[-967,756]],[[39876,16859],[24,-18]],[[39900,16841],[-2,-39]],[[39898,16802],[65,-19],[6,20]],[[39969,16803],[26,-42]],[[39995,16761],[47,14]],[[40042,16775],[26,-71]],[[40068,16704],[9,8]],[[40077,16712],[12,-125]],[[40089,16587],[19,-13],[115,125]],[[40223,16699],[57,20]],[[40280,16719],[84,-62]],[[40364,16657],[118,29]],[[40482,16686],[47,-23]],[[40529,16663],[50,81],[-10,11],[22,11]],[[40591,16766],[-17,70]],[[40574,16836],[12,80]],[[40586,16916],[74,71]],[[40660,16987],[-19,19]],[[40641,17006],[27,46],[-58,36],[13,25],[-35,19],[22,93]],[[40610,17225],[-40,21]],[[40570,17246],[22,41],[-28,2]],[[40564,17289],[-35,-42]],[[40529,17247],[-49,-10]],[[40480,17237],[-26,45]],[[40454,17282],[-29,-4]],[[40425,17278],[-51,40]],[[40374,17318],[-9,-19]],[[40365,17299],[-91,17]],[[40274,17316],[-10,19],[-75,-88]],[[40189,17247],[-32,-13]],[[40157,17234],[-22,17],[-21,-44]],[[40114,17207],[-61,31]],[[40053,17238],[-54,-161]],[[39999,17077],[-33,-5]],[[39966,17072],[-96,-76]],[[39870,16996],[10,-14]],[[39880,16982],[-21,-41]],[[39859,16941],[73,-29]],[[39932,16912],[-56,-53]],[[38677,17692],[22,-37]],[[38699,17655],[50,-23]],[[38749,17632],[103,13]],[[38852,17645],[12,38]],[[38864,17683],[166,-113]],[[39030,17570],[101,96]],[[39131,17666],[92,52]],[[39223,17718],[72,120],[-7,31]],[[39288,17869],[18,13]],[[39306,17882],[41,188]],[[39347,18070],[-105,110]],[[39242,18180],[36,61]],[[39278,18241],[77,0]],[[39355,18241],[-115,118]],[[39240,18359],[16,41]],[[39256,18400],[-89,38]],[[39167,18438],[-92,-100]],[[39075,18338],[-39,-13]],[[39036,18325],[-248,-36]],[[38788,18289],[-35,28]],[[38753,18317],[-115,-31]],[[38638,18286],[-68,-115],[-78,-246]],[[38492,17925],[66,-150]],[[38558,17775],[119,-83]],[[16328,7658],[-9,-41],[-53,-27],[-21,-30],[-44,-14],[-3,-68],[-16,-35]],[[16182,7443],[5,-33],[-53,-69],[-88,32],[-38,-53]],[[16008,7320],[-51,-14],[-1,-49]],[[15956,7257],[-24,-29],[-28,-19],[-33,1],[-44,-46],[-25,8],[-26,-24]],[[15776,7148],[-16,18],[-37,0],[-80,-73]],[[15643,7093],[-51,22],[-49,-7],[-22,-29]],[[15521,7079],[-21,7],[-26,-19],[-21,-32]],[[15453,7035],[-37,-8],[-39,22],[-36,-4],[-30,-52],[-34,-19],[-22,5],[-36,-28],[-1,-32],[48,-48],[-8,-12],[-72,-60],[-56,-3],[-62,-32],[-66,34]],[[15002,6798],[-31,-108]],[[14971,6690],[-29,-21],[-38,-2],[-44,-109]],[[14860,6558],[-71,38],[-60,-29]],[[14729,6567],[-13,-54]],[[14716,6513],[-53,-3]],[[14663,6510],[-14,21],[-59,20],[-59,-47],[-34,26],[-27,-18],[-30,17]],[[14440,6529],[-26,-65],[-74,-19],[-21,1],[-14,29]],[[14305,6475],[-61,4]],[[14244,6479],[-27,57],[-39,-81]],[[14178,6455],[-35,-31],[-20,-9],[-28,23],[-23,0],[8,-48],[-44,-39]],[[14036,6351],[15,-53]],[[14051,6298],[-38,-9],[-19,-47],[31,-37]],[[14025,6205],[-27,-22],[-2,-57],[-32,-9],[-6,-21],[10,-17]],[[13968,6079],[-13,-12],[4,-31]],[[13959,6036],[48,-9],[12,-21],[1,-19],[-63,-52],[2,-16],[25,-11],[4,-38]],[[13988,5870],[-119,-40]],[[13869,5830],[-34,-102],[2,-47],[-29,-2],[-50,-54],[-21,12],[-43,-23],[-32,27],[-50,-39],[-43,-1],[-71,-71],[-16,15],[-34,0],[-19,23],[-34,-1],[-24,33],[2,25],[-50,23],[-3,36],[-91,-45],[15,-39],[-9,-29],[-24,4],[-32,-29],[-9,11],[-33,-18],[-10,29],[-35,-4],[-24,-26],[-32,33],[-34,-3]],[[13002,5568],[-13,24],[-30,-35],[-19,-6],[-24,20]],[[12916,5571],[-18,-18]],[[12898,5553],[-16,16]],[[12882,5569],[100,96]],[[12982,5665],[-23,76]],[[12959,5741],[28,20]],[[12987,5761],[3,26]],[[12990,5787],[-31,36]],[[12959,5823],[-42,5],[-1,29]],[[12916,5857],[33,24]],[[12949,5881],[-36,26]],[[12913,5907],[-5,55]],[[12908,5962],[-60,58],[6,32],[-19,4]],[[12835,6056],[-26,37]],[[12809,6093],[13,21]],[[12822,6114],[-22,66]],[[12800,6180],[-36,25]],[[12764,6205],[20,25]],[[12784,6230],[-22,29]],[[12762,6259],[10,27]],[[12772,6286],[23,5]],[[12795,6291],[9,43]],[[12804,6334],[-118,55]],[[12686,6389],[11,19],[-21,10],[11,15],[-26,22]],[[12661,6455],[11,47]],[[12672,6502],[-12,12],[23,27],[-19,14],[-3,31]],[[12661,6586],[-39,10]],[[12622,6596],[18,29]],[[12640,6625],[-56,-2]],[[12584,6623],[23,45]],[[12607,6668],[-27,33],[-43,20],[0,35],[-17,37],[15,26],[-14,24],[-32,-13]],[[12489,6830],[-18,45]],[[12471,6875],[-42,-35]],[[12429,6840],[-6,19],[23,16]],[[12446,6875],[-39,16]],[[12407,6891],[4,29],[-17,9],[-249,526],[-122,687],[-22,7],[-26,52],[-70,8],[-41,66],[-9,55],[-79,47],[-22,53]],[[11754,8430],[-44,18]],[[11710,8448],[-42,57],[-21,6],[-17,-20],[-26,-2]],[[11604,8489],[-120,-93],[2923,2691],[-9,-39],[16,-18],[83,27],[-2,-59],[13,-18],[26,-1],[56,40],[19,-7],[-30,-60],[34,-57],[-16,-49],[10,-34],[25,-9],[30,12],[34,66],[63,-66],[-12,-16],[-36,1],[-90,-38],[-13,-20],[2,-45],[-78,-18],[-10,-58],[14,-43],[-10,-8],[-94,22],[-18,-31],[-30,-9],[0,-16],[-43,-9],[-15,-34],[-69,12],[-44,-14],[-17,-16],[0,-36],[-30,-32],[4,-60],[26,-34],[-5,-42],[11,-41],[23,-3],[16,-23],[5,-42],[18,-6],[41,32],[33,0],[62,-63],[-13,-43],[34,-10],[74,26],[29,-31],[42,-8],[28,-60],[59,3],[27,-23],[3,-20],[-13,-5],[-3,-24],[13,-22],[-19,1],[-23,-34],[19,-55],[-5,-23],[9,-21],[24,-1],[21,-54],[37,-8],[44,-34],[-14,-16],[3,-29],[-49,-23],[-6,-40],[25,-32],[-19,-19],[11,-36],[-43,-36],[17,-57],[-33,-26],[-9,-27],[8,-24],[40,-31],[-24,-29],[5,-43],[30,-32],[32,-10],[-21,-56],[27,-39],[12,14],[18,-13],[35,-68],[0,-20],[62,-2],[5,-39],[15,-3],[-7,-14],[13,-15],[28,7],[36,-18],[-1,-23],[26,-46],[-10,-24],[33,-36],[30,21],[69,-19],[24,26],[17,-12],[-9,-29],[37,-13],[13,-59],[23,-21],[21,3],[57,-53],[5,-22],[-32,-20],[-17,-30],[51,-53],[44,21],[6,-65],[-10,-30],[17,0],[5,-17],[-15,-72],[5,-27],[30,-2],[0,-25],[94,13],[37,-11],[8,-9],[-9,-31],[51,-4],[23,-26],[76,9],[48,33],[32,3],[21,31],[35,-3],[59,-9],[4,-41],[33,36],[57,-23],[26,-26],[0,-29],[52,-39],[34,-7],[58,29],[45,2],[-5,-83],[63,-49],[34,-5],[4,-62],[40,-42],[-29,-120],[31,-34],[4,-31],[-22,-63],[21,-27]],[[58551,8514],[-3,3],[8,3]],[[58556,8520],[-10,13],[49,22],[21,-63],[8,3]],[[58624,8495],[5,-24]],[[58629,8471],[-1,-10],[1,-8],[-4,0],[-1,-3],[3,-23],[15,-40]],[[58642,8387],[10,5]],[[58652,8392],[43,-123],[15,-26],[18,-23],[24,-20],[20,-11]],[[58772,8189],[2,59]],[[58774,8248],[4,-2],[5,3],[3,-1],[10,0],[26,7],[11,-5],[15,0]],[[58848,8250],[3,7],[7,5],[6,13]],[[58864,8275],[19,8],[11,1],[24,14],[17,17]],[[58935,8315],[1,10],[-4,8],[0,4]],[[58932,8337],[6,11],[11,3],[2,8]],[[58951,8359],[8,3],[9,-1],[12,10]],[[58980,8371],[22,-11],[7,-1]],[[59009,8359],[-1,-45],[4,-28],[2,-54]],[[59014,8232],[23,-20]],[[59037,8212],[-2,-7],[5,-13],[0,-9]],[[59040,8183],[-16,-14],[-6,-7],[-2,-11],[-8,-6],[-23,-31],[2,-9],[4,-7],[34,-36],[5,-3],[-4,1],[-3,-2]],[[59023,8058],[4,-7],[0,-6],[4,-3]],[[59031,8042],[-10,-46]],[[59021,7996],[12,0],[9,-8]],[[59042,7988],[17,20],[71,-74]],[[59130,7934],[-3,-5],[8,-10],[11,-22]],[[59146,7897],[12,-3]],[[59158,7894],[-2,-4],[-25,-15],[-24,-12],[-17,-5],[-40,-6],[-62,0],[-46,4],[-68,18]],[[58874,7874],[-56,-13],[-30,0],[-150,22],[-13,6],[-12,8],[-8,11],[-8,15],[-6,-2],[-3,7],[2,3],[-24,17]],[[58566,7948],[-10,18],[-11,12],[-4,6],[-9,26],[-7,9],[-10,23]],[[58515,8042],[-4,10],[0,8],[7,38],[10,27],[0,5],[-7,20]],[[58521,8150],[-7,-4]],[[58514,8146],[-5,17],[-10,1],[0,7]],[[58499,8171],[5,-1],[1,5],[4,-1],[0,2],[23,-3]],[[58532,8173],[8,41]],[[58540,8214],[26,3],[5,-3],[9,9],[10,1]],[[58590,8224],[27,0],[11,-6],[16,-3]],[[58644,8215],[3,9],[1,35],[-10,15],[-29,10],[-13,0],[-15,-5],[-12,5]],[[58569,8284],[2,31],[18,3]],[[58589,8318],[-1,15],[2,14]],[[58590,8347],[-15,33]],[[58575,8380],[2,0],[3,21],[3,7]],[[58583,8408],[-11,9],[-2,15],[-15,18]],[[58555,8450],[-9,4],[-7,6],[-10,-5],[-5,0]],[[58524,8455],[-3,20],[2,17],[-1,18]],[[58522,8510],[6,1],[0,3],[23,0]],[[58521,8150],[7,9],[-13,5],[6,-14]],[[32307,8206],[-38,60]],[[32365,8452],[-67,91]],[[32323,8586],[4,52],[282,195]],[[32795,8990],[46,220]],[[32841,9210],[61,54]],[[32888,9346],[-130,-2]],[[32615,9542],[-34,54]],[[32780,9650],[228,163]],[[33148,9915],[100,93]],[[33248,10008],[135,89]],[[33383,10097],[65,67]],[[34063,10236],[87,-87]],[[34150,10149],[92,49]],[[34547,10357],[99,116]],[[34766,10654],[77,-110]],[[35071,10758],[39,88]],[[35187,10989],[61,46],[12,40]],[[35260,11075],[154,129],[30,10],[36,-18],[57,20],[46,83],[-1,30]],[[35582,11329],[94,15]],[[35676,11344],[60,31],[9,45]],[[35745,11420],[45,49],[-39,60]],[[35751,11529],[-32,-21]],[[35719,11508],[-55,26]],[[35664,11534],[22,62]],[[35686,11596],[-49,35]],[[35637,11631],[14,30],[-59,107]],[[35592,11768],[12,32],[-14,43],[79,82],[27,53]],[[35696,11978],[67,-13]],[[35782,11814],[101,-21]],[[36112,11750],[120,-64]],[[36232,11686],[8,-107]],[[36332,11417],[32,-222],[108,-175]],[[36503,10940],[91,-96],[87,-41]],[[36802,10778],[175,-121]],[[37148,10732],[74,45]],[[37421,10733],[172,-5],[9,-37]],[[37556,10643],[-1,-51]],[[37614,10536],[69,-122]],[[37683,10414],[168,-24],[22,-29],[14,-74]],[[37903,10285],[-62,11]],[[37841,10296],[-8,19]],[[37833,10315],[-18,-12],[-8,18],[-42,-11],[-2,-21]],[[37763,10289],[-29,27]],[[37734,10316],[-30,-14]],[[37704,10302],[-24,17]],[[37680,10319],[5,-31],[-24,6]],[[37661,10294],[-20,-37]],[[37641,10257],[-28,-5]],[[37613,10252],[-3,-21],[-19,4]],[[37591,10235],[-15,-36]],[[37576,10199],[-32,-17]],[[37544,10182],[2,29]],[[37546,10211],[-17,18]],[[37529,10229],[-46,-19]],[[37483,10210],[6,-39]],[[37489,10171],[-92,-53]],[[37397,10118],[-25,-37],[-87,-2]],[[37285,10079],[-43,31],[-49,-30]],[[37193,10080],[9,-87]],[[37202,9993],[-45,-31]],[[37157,9962],[26,-65]],[[37183,9897],[120,4]],[[37303,9901],[26,-17]],[[37329,9884],[8,-67]],[[37337,9817],[50,-43],[-102,-149]],[[37285,9625],[196,-119],[7,-24]],[[37488,9482],[-490,-996]],[[36998,8486],[-1285,-2760]],[[35713,5726],[-91,1]],[[35622,5727],[-216,95],[-57,-4]],[[35349,5818],[-39,-31],[6,-62]],[[35316,5725],[83,-128],[-32,-74],[5,-25],[187,-152],[21,-38],[-20,-34],[-90,-13],[-69,-88],[-38,16],[-118,187],[-113,90],[-131,42],[-70,55],[-25,39],[5,50],[-39,28],[-69,13],[-1,-25],[61,-22],[8,-40],[-55,-34],[-87,22],[-22,-26],[10,-60]],[[34717,5508],[-28,-17],[-127,21],[-176,90]],[[34386,5602],[-20,50],[77,-12]],[[34443,5640],[3,53],[-101,139]],[[34345,5832],[-150,163],[11,35],[80,-15],[3,52]],[[34289,6067],[-38,62],[-86,1]],[[34165,6130],[-124,122],[-10,63],[-66,121],[-10,79],[-103,121],[-11,70]],[[33841,6706],[-48,63],[-87,70],[-42,-66]],[[33664,6773],[-21,-3],[-75,139]],[[33568,6909],[-36,23],[-15,-20],[58,-107],[-36,-42]],[[33539,6763],[-20,4],[-69,145],[16,70],[-74,158]],[[33392,7140],[1,70],[-38,34],[-36,-5],[-53,-54]],[[33266,7185],[-65,26],[-133,2],[-30,34],[-18,98],[-21,-8],[-9,-34],[-23,0],[-70,55],[-28,120],[47,20],[2,18]],[[32918,7516],[-56,96]],[[32862,7612],[8,67],[-11,12],[-105,-8],[-22,-67],[12,-70],[-33,2],[-52,-51]],[[32659,7497],[-124,126],[-55,-40]],[[32480,7583],[-36,18],[1,-53],[-24,-40],[-89,10]],[[32332,7518],[-31,70],[4,30],[40,45]],[[32345,7663],[-40,124]],[[32260,8000],[-49,76],[96,130]],[[34874,8823],[-11,-114]],[[34863,8709],[-4,27]],[[34859,8736],[-36,-7],[3,-13]],[[34826,8716],[39,-27]],[[34865,8689],[5,-44]],[[34870,8645],[56,-34]],[[34926,8611],[49,91]],[[34975,8702],[226,-76]],[[35201,8626],[40,93]],[[35241,8719],[-11,10]],[[35230,8729],[109,220]],[[35339,8949],[-124,117]],[[35215,9066],[-285,-11]],[[34930,9055],[-32,-46]],[[34898,9009],[-21,-86]],[[34877,8923],[-113,21],[-15,-68]],[[34749,8876],[-19,2]],[[34730,8878],[11,-7],[133,-48]],[[46733,28171],[11,1],[33,32]],[[46777,28204],[4,21],[14,15],[0,24],[11,13],[8,32]],[[46814,28309],[32,37]],[[46846,28346],[16,5],[22,27]],[[46884,28378],[17,-1],[17,-19]],[[46918,28358],[19,7]],[[46937,28365],[16,40],[10,3],[21,47]],[[46984,28455],[-6,11],[-30,13]],[[46948,28479],[4,18],[55,5],[19,17]],[[47026,28519],[-4,17],[-14,9],[-7,19]],[[47001,28564],[13,26],[-3,35],[-31,20],[-6,23],[11,15]],[[46985,28683],[35,-7],[9,9]],[[47029,28685],[-10,34]],[[47019,28719],[17,18],[8,30],[8,12]],[[47052,28779],[15,15],[21,6]],[[47088,28800],[5,24],[-7,15]],[[47086,28839],[19,43],[-22,18]],[[47083,28900],[6,10],[23,5],[18,23]],[[47130,28938],[-8,38],[20,23],[-3,27]],[[47139,29026],[24,1],[6,9]],[[47169,29036],[-31,40],[5,20],[11,13]],[[47154,29109],[37,-10],[5,6]],[[47196,29105],[-9,17],[-22,7]],[[47165,29129],[-11,37]],[[47154,29166],[32,23],[26,-2],[12,8]],[[47224,29195],[-3,13],[-17,18],[-7,26]],[[47197,29252],[9,2],[2,16],[6,7],[32,9],[23,30]],[[47269,29316],[3,23],[-16,19],[-9,63]],[[47247,29421],[7,31],[-19,25]],[[47235,29477],[13,14],[41,2]],[[47289,29493],[-4,17],[-34,28]],[[47251,29538],[4,16]],[[47255,29554],[35,-5],[10,10]],[[47300,29559],[-2,14],[-40,46]],[[47258,29619],[10,7],[43,-7],[5,5]],[[47316,29624],[6,15]],[[47322,29639],[-20,31],[-6,14],[3,6]],[[47299,29690],[17,5],[40,-20],[8,3]],[[47364,29678],[4,25]],[[47368,29703],[-27,28],[1,15]],[[47342,29746],[44,20]],[[47386,29766],[1,22],[-11,38]],[[47376,29826],[4,15],[15,10],[-4,10]],[[47391,29861],[12,13],[22,9]],[[47425,29883],[36,-6]],[[47461,29877],[9,18],[1,27],[11,31]],[[47482,29953],[19,16],[32,6]],[[47533,29975],[-1,22],[-23,22],[-4,15]],[[47505,30034],[12,2],[13,17],[10,3],[11,23]],[[47551,30079],[3,49],[17,74],[-3,23]],[[47568,30225],[5,14],[28,22],[7,22]],[[47608,30283],[1729,-1470],[-36,-54]],[[49301,28759],[-28,-20],[-26,-44],[-41,-23],[-84,-208],[-17,-91],[-60,-132],[-93,-9],[-31,-23]],[[48921,28209],[-98,-175],[-35,-77]],[[48788,27957],[-49,-28],[-65,-79],[-91,-75],[-75,-40],[-29,-58],[-95,-75],[-128,-29]],[[48256,27573],[-55,-88],[-19,-45]],[[48182,27440],[-63,-45],[-19,-22]],[[48100,27373],[-10,-6],[-36,2],[-17,-8]],[[48037,27361],[-63,-55],[-7,-11],[5,-28]],[[47972,27267],[-36,-34],[-27,-46],[-31,-21]],[[47878,27166],[-9,-33],[-16,-20]],[[47853,27113],[-462,439],[-321,-70],[-464,262]],[[46606,27744],[3,8],[124,419]],[[58312,16269],[36,27]],[[58348,16296],[12,45]],[[58360,16341],[-11,33],[0,62]],[[58349,16436],[39,72]],[[58388,16508],[-13,16],[-2,40],[-19,18]],[[58354,16582],[-72,25]],[[58282,16607],[-23,51]],[[58259,16658],[-79,56]],[[58180,16714],[-24,40]],[[58156,16754],[-55,45]],[[58101,16799],[-25,9],[-42,66],[-51,19],[-46,-20],[-45,5],[-14,48]],[[57878,16926],[-58,22]],[[57820,16948],[-246,302],[-28,22],[-14,45],[-54,47],[-29,84],[2,32],[-11,16],[-2,23]],[[57438,17519],[-31,23]],[[57407,17542],[-9,38],[-33,27],[-211,-205]],[[57154,17402],[-33,-21],[-48,-75],[-29,-2],[-16,-24],[-49,-27],[-14,-31]],[[56965,17222],[-59,-37]],[[56906,17185],[-56,-18],[3,-25],[25,-9],[-7,-2],[-13,-51]],[[56858,17080],[-397,116]],[[56461,17196],[-45,46],[-11,29],[24,90],[-10,41],[-54,39],[-37,8],[-25,-2],[-18,-20],[-43,-108]],[[56242,17319],[-40,-56],[-121,-31],[-34,16],[-8,25],[0,64]],[[56039,17337],[-9,20]],[[56030,17357],[-78,64],[-46,23]],[[55906,17444],[-19,31],[12,91]],[[55899,17566],[-11,35],[-9,105]],[[55879,17706],[10,63],[-4,59],[-51,165],[-29,27],[-5,34]],[[55787,18096],[-4,36],[17,31],[51,19]],[[55998,19124],[19,-23],[16,-1],[8,18]],[[56041,19118],[-9,9],[19,2]],[[56078,19182],[5,22],[68,18],[52,-4]],[[56256,19267],[9,40],[39,-18]],[[56345,19314],[58,-49],[80,10],[163,-196],[12,-82],[27,-80],[4,-54],[-10,-38],[-35,-46],[112,-239],[103,-67],[174,-29],[15,-18],[24,-7],[86,-88],[91,-70],[81,-90],[70,-39],[117,-8],[14,-25],[24,-16],[56,-7],[79,-35],[122,2],[202,58],[30,-7],[69,11],[115,-24],[89,7],[106,-34],[516,-46],[458,-89],[58,10],[66,-31],[134,-19],[4,-11],[-46,6],[73,-260],[16,-119],[-5,-15],[36,-71],[68,-50],[55,-70],[152,-89],[59,-22],[124,-102],[41,-15],[14,-19],[-2,-69],[12,-44],[66,-116],[86,-91],[-1,-113]],[[60407,16609],[-77,3],[-111,-32],[-75,-60],[-47,-13],[-62,20],[-48,-13],[-59,7],[-13,-38],[24,-5],[-11,-29],[3,-24],[-28,-7],[-41,-40],[-3,-19],[-27,-25],[1,-16],[-32,-38]],[[59801,16280],[-61,-28],[-13,12]],[[59727,16264],[-80,-25],[-71,10]],[[59576,16249],[-14,-9],[-52,-106],[-1,-24]],[[59509,16110],[-43,-58],[-5,-38],[-29,-38],[-5,-71],[-18,-32],[3,-21]],[[59412,15852],[-34,-12]],[[59378,15840],[-82,30],[-5,36],[-11,12],[-17,56],[-37,51],[-128,31],[-56,-9],[-29,-18],[-3,-17],[-11,19],[-43,7],[-8,18],[-96,-5],[-240,163],[-123,-5],[-5,-20],[-39,-23],[-80,35]],[[58365,16201],[-64,43],[11,25]],[[41719,293],[-20,13],[2,17],[40,19],[28,-21],[-7,86],[14,11],[21,-25],[26,-3],[26,48],[-29,54]],[[41820,492],[26,8],[-34,32],[64,48]],[[41834,640],[18,42],[-3,21]],[[41880,1126],[12,17],[11,-5]],[[42071,1579],[82,53],[76,20],[176,9]],[[42999,1089],[117,16],[41,-9]],[[43254,950],[-21,77],[-51,80],[-158,75]],[[42886,1295],[-254,164],[-40,48],[-100,200],[-40,39]],[[42416,1746],[1312,2150]],[[43728,3896],[83,-95],[64,0],[11,-28],[55,-40],[0,-24],[35,-7],[2,-21],[74,1],[19,14],[19,-29],[40,8],[0,-25],[22,-5],[1,12],[30,-2],[39,24],[35,-5],[-2,-74]],[[44255,3600],[72,-67]],[[44327,3533],[8,-25],[-19,-19],[11,-1],[7,-32],[53,59]],[[44387,3515],[71,7]],[[44458,3522],[45,-14]],[[44503,3508],[30,84]],[[44533,3592],[21,-19]],[[44554,3573],[1,-30]],[[44555,3543],[53,10]],[[44608,3553],[16,23],[16,-11],[46,10]],[[44686,3575],[18,-37],[35,-12],[40,39]],[[44779,3565],[19,-16],[55,-4]],[[44853,3545],[23,-23],[-11,-23]],[[44865,3499],[37,-15]],[[44902,3484],[37,-91]],[[44939,3393],[37,-42],[6,26]],[[44982,3377],[22,14],[31,-7],[-9,8],[6,25],[-18,7],[16,4],[-7,19],[43,-26],[25,27],[17,-13],[7,25],[-12,23]],[[45103,3483],[10,4],[28,-30]],[[45141,3457],[1,-33],[50,6],[56,-53],[21,18],[28,-35],[17,2],[11,-72]],[[45325,3290],[79,-8]],[[45404,3282],[5,-58],[66,-68],[21,9]],[[45496,3165],[29,-51]],[[45525,3114],[39,-12],[59,10],[70,-17],[97,-58],[44,6]],[[45834,3043],[0,-42]],[[45834,3001],[16,-31],[25,-3],[36,28],[47,-49],[73,26],[82,-36]],[[46113,2936],[129,-28]],[[46242,2908],[85,15],[63,-19]],[[46390,2904],[53,5]],[[46443,2909],[438,-171]],[[46881,2738],[85,20],[2,68],[-31,45],[59,19],[32,-17],[19,-37],[119,-30]],[[47166,2806],[172,-121]],[[47338,2685],[59,-61]],[[47397,2624],[60,5]],[[47457,2629],[12,60],[18,18],[70,-28],[43,-40],[57,-4]],[[47657,2635],[-159,-2598]],[[47498,37],[-1718,3],[-2206,-39],[-1880,12]],[[41688,110],[-46,8],[31,9]],[[44981,18201],[-213,76]],[[44768,18277],[513,726],[186,239]],[[45467,19242],[56,-40],[104,-46]],[[45627,19156],[-14,-38]],[[45613,19118],[17,3]],[[45643,18998],[43,-85]],[[45766,18828],[57,11]],[[46334,19022],[17,24]],[[46349,19134],[9,21]],[[46346,19199],[70,1]],[[46456,19156],[19,61]],[[46541,19179],[63,1],[1,19],[-44,34],[-11,35],[36,81],[46,31]],[[46632,19380],[36,-9],[-24,-31]],[[46644,19340],[10,-45],[33,9]],[[46687,19304],[43,57]],[[46730,19361],[85,0]],[[46815,19361],[11,-40]],[[46826,19321],[17,0],[12,16]],[[46855,19337],[-3,46],[20,38]],[[46944,19434],[61,97]],[[47087,19604],[-4,80],[25,-11]],[[47108,19673],[33,10],[46,50]],[[47187,19733],[48,7]],[[47235,19740],[39,-30],[37,-57],[29,43]],[[47340,19696],[43,13],[51,47],[20,-8],[28,-44],[71,-16],[40,12],[13,18],[-20,72],[35,42],[7,37],[122,43],[60,80]],[[47810,19992],[80,63],[35,43]],[[47925,20098],[26,11],[59,-29],[80,3],[15,29],[-19,30],[1,26]],[[48087,20168],[7,24],[23,23]],[[48117,20215],[52,-16],[49,-40],[23,-3]],[[48241,20156],[63,74],[77,26],[54,-2],[127,31],[72,61]],[[48634,20346],[17,50],[5,65]],[[48656,20461],[18,23],[59,8],[68,55],[43,-10]],[[48844,20537],[13,-26],[0,-62],[11,-16]],[[48868,20433],[66,0],[44,21],[142,20],[44,-5],[47,-44],[25,-5],[22,15],[12,33],[75,3],[91,-38],[29,7],[71,-21],[88,-76],[59,-19],[53,-53],[53,15],[2,31],[-12,23],[-33,4],[-57,47]],[[49689,20391],[-10,13],[2,22]],[[49681,20426],[26,20],[23,71],[54,57],[43,19],[56,-23],[43,-55]],[[49926,20515],[60,-23],[31,7],[21,-15]],[[50038,20484],[1,-33],[-42,-15],[-6,-18],[48,-24],[35,20],[39,-17],[24,5],[62,-48],[122,-51]],[[50321,20303],[71,-71]],[[50392,20232],[-4,-22]],[[50388,20210],[-34,1],[21,-18]],[[50375,20193],[0,-23],[-36,3],[15,-30],[-27,1],[1,-19],[-19,5]],[[50309,20130],[-13,-25],[18,-41]],[[50314,20064],[-36,-24],[-18,-33],[34,-48]],[[50294,19959],[-41,-6],[2,-11],[-15,-6],[-46,-112],[-477,-576],[-429,-474],[-343,-449],[-676,-796]],[[48269,17529],[-59,14],[-58,44]],[[48152,17587],[-38,-25]],[[48114,17562],[-21,9],[-13,-15],[-53,9],[-30,44]],[[47997,17609],[-28,5],[4,32],[-47,37],[-56,81]],[[47870,17764],[-73,17]],[[47797,17781],[-37,-7],[-18,8],[-3,16],[-24,-6],[-9,11],[-26,-63],[-44,36],[-19,-30],[-34,-17],[-28,-6],[0,22]],[[47555,17745],[-68,-12]],[[47487,17733],[-62,37],[-13,-3],[-11,17],[-55,-4],[-8,17],[-40,17],[-49,-20],[-44,45],[2,18],[-43,-3],[-60,54],[-43,-7],[-32,18],[-88,-54],[4,-33]],[[46945,17832],[-42,-52],[-143,-17]],[[46760,17763],[-39,35],[-31,-7],[-25,18],[-20,-37],[-21,-12],[-43,-16],[-74,-1]],[[46507,17743],[-63,-75],[-78,4]],[[46366,17672],[-58,-29]],[[46308,17643],[-155,53],[-373,144]],[[37202,9993],[4,34],[-13,53]],[[37193,10080],[19,19],[36,10],[-2,-6],[6,2],[10,-16],[23,-10]],[[37397,10118],[10,1],[17,16],[12,3],[17,16],[36,17]],[[37489,10171],[2,6],[-7,17],[-1,16]],[[37483,10210],[23,10],[7,-5],[16,14]],[[37529,10229],[4,-2],[0,-9],[9,2],[4,-9]],[[37546,10211],[-6,-12],[5,-6],[-1,-11]],[[37544,10182],[17,14],[4,-3],[1,4],[10,2]],[[37576,10199],[6,19],[6,1],[3,16]],[[37613,10252],[15,-4],[13,9]],[[37641,10257],[0,19],[8,4],[6,-2],[0,6],[6,10]],[[37680,10319],[10,-14],[14,-3]],[[37704,10302],[14,2],[8,10],[8,2]],[[37734,10316],[6,-8],[13,0],[10,-19]],[[37763,10289],[3,5],[-1,16],[10,-7],[12,11],[2,9],[8,-6],[11,4],[4,-15],[3,-3],[18,12]],[[37833,10315],[2,-12],[6,-7]],[[37841,10296],[19,-3],[5,-5],[15,-5],[23,2]],[[37903,10285],[-1,-10],[-11,-19]],[[37891,10256],[0,-17],[-6,-29],[14,-20],[37,-34]],[[37971,10096],[24,-14],[38,-34],[-3,-6],[32,-30],[81,-55],[33,-30]],[[38235,9909],[13,-28],[22,-82]],[[38270,9799],[7,-32],[-6,-3],[4,-26]],[[38410,9550],[24,-17],[23,-8]],[[38506,9557],[-3,29],[7,31]],[[38510,9617],[16,11],[16,0],[15,-4]],[[38557,9624],[30,-16],[40,-36],[104,-78]],[[38731,9494],[-146,-188]],[[38585,9306],[-11,-3],[-14,5],[-18,-6]],[[38542,9302],[-16,-21],[-27,-18],[-25,-39],[-20,-16]],[[38454,9208],[-16,-2]],[[38438,9206],[-5,22],[-12,14]],[[38421,9242],[-27,6],[-35,27],[-47,10]],[[38312,9285],[0,-7],[8,-4]],[[38320,9274],[-25,-9],[4,-9],[-199,-177]],[[38100,9079],[-112,-143],[-16,-27]],[[37972,8909],[-34,1],[-10,7],[-15,-8],[-25,-1]],[[37888,8908],[-14,12]],[[37874,8920],[-6,-10],[-3,-16]],[[37865,8894],[-40,39],[-41,3]],[[37784,8936],[-34,-21],[-8,5]],[[37742,8920],[-15,-31],[-19,14]],[[37708,8903],[-8,-24],[-64,-72],[1,-4]],[[37637,8803],[-29,29],[-24,5],[-12,14],[-101,72]],[[37471,8923],[17,36]],[[37488,8959],[-66,19],[-6,1],[-8,-7],[-25,12],[-29,3]],[[37354,8987],[-2,16],[-7,5]],[[37345,9008],[-32,4],[30,53],[-9,17]],[[37334,9082],[-14,-3],[-26,-19],[-14,-1]],[[37280,9059],[116,243],[7,-3],[1,7],[-6,3],[38,75],[5,3],[-5,2],[9,7],[-4,6],[7,-1],[2,6],[-4,1],[24,51],[18,23]],[[37488,9482],[-4,4],[3,6],[6,4],[-31,22],[-155,90],[-22,17]],[[37337,9817],[3,29],[-11,38]],[[37303,9901],[-71,-8],[-49,4]],[[37157,9962],[7,5],[38,26]],[[34044,3506],[-24,-14],[-25,-55],[-88,-100],[-15,-71],[-52,-27],[-34,-47],[-48,16],[-106,-48],[0,34],[-32,8]],[[33620,3202],[-181,-107]],[[33439,3095],[-72,0],[-90,-61],[-39,-9]],[[33238,3025],[-33,-63]],[[33205,2962],[-29,-10],[-18,-56],[-38,-27]],[[33120,2869],[9,-53]],[[33129,2816],[-21,-19],[-39,-3],[-41,-42]],[[33028,2752],[-22,40]],[[33006,2792],[20,38],[-18,36],[-49,-46],[-22,27],[-48,20],[-34,-14],[-43,37],[-46,-20]],[[32766,2870],[-83,-76]],[[32683,2794],[-1669,429],[-103,-457],[-37,44]],[[30874,2810],[-67,1],[-25,-20],[68,-63]],[[30850,2728],[46,2],[5,-29],[-31,-30],[-70,-3]],[[30800,2668],[-47,19],[-42,43]],[[30711,2730],[-48,81],[-16,76],[-93,78],[-69,95]],[[30485,3060],[-81,67],[-5,28],[20,61],[-19,15],[-38,-6],[-15,55],[12,12],[70,-26],[23,72]],[[30452,3338],[-61,58],[-97,32]],[[30294,3428],[-38,-40],[-81,2],[-1149,293]],[[29026,3683],[308,327],[9,218]],[[29343,4228],[51,10]],[[29394,4238],[20,51],[-2,33],[22,8],[4,36],[35,18],[-20,25],[0,26],[12,20],[34,9]],[[29499,4464],[11,49],[38,65],[96,28]],[[29644,4606],[3,-28],[30,-43],[36,-2],[21,36],[56,-25],[10,29],[-16,27]],[[29784,4600],[50,67]],[[29834,4667],[-2,36],[32,-4],[14,18]],[[29878,4717],[-39,51]],[[29839,4768],[2,23],[-26,28]],[[29815,4819],[-17,66]],[[29798,4885],[53,30],[4,36],[132,59],[-33,54]],[[29954,5064],[-84,-1]],[[29870,5063],[9,66]],[[29879,5129],[-13,22]],[[29866,5151],[48,29]],[[29914,5180],[18,-24],[42,2],[13,39],[29,-12],[38,23],[-23,23]],[[30031,5231],[29,38]],[[30060,5269],[-32,34],[19,-2],[15,19],[-38,65]],[[30024,5385],[107,14]],[[30131,5399],[-61,53],[5,58],[-28,44],[22,61]],[[30069,5615],[-65,41]],[[30004,5656],[-8,13],[10,14],[-30,41],[40,96],[46,15],[-1,31],[43,54],[-14,20],[9,41],[-31,56],[18,22],[-30,15],[-21,34],[31,49],[-7,39],[-88,104],[-3,22],[21,19],[-22,46],[12,21]],[[29979,6408],[-6,28],[-18,31],[-24,5]],[[29931,6472],[52,58]],[[30022,6572],[87,69],[-9,58]],[[30100,6699],[32,75]],[[30132,6774],[51,-2]],[[30250,6846],[15,43]],[[31896,7130],[30,61]],[[32261,7591],[30,21],[12,0]],[[32303,7612],[0,-33],[29,-61]],[[32480,7583],[34,34],[33,3],[112,-123]],[[32862,7612],[44,-57],[12,-39]],[[33266,7185],[65,60],[45,-17],[18,-23],[-2,-65]],[[33539,6763],[36,50],[-55,91],[4,28],[44,-23]],[[33664,6773],[38,64],[27,-6],[112,-125]],[[34165,6130],[68,9],[23,-15],[33,-57]],[[34289,6067],[1,-45],[-27,-10],[-65,16],[0,-48],[147,-148]],[[34345,5832],[91,-121],[16,-42],[-9,-29]],[[34443,5640],[-78,7],[21,-45]],[[34386,5602],[51,-31],[-102,-464],[-291,-1601]],[[46919,20485],[78,-6]],[[47079,20516],[36,46],[-36,33]],[[47092,20660],[-15,58],[-94,52]],[[46983,20826],[-6,-23]],[[46852,20956],[-34,2],[23,29]],[[46846,21019],[40,33]],[[46886,21052],[-34,64],[-63,11]],[[46752,21171],[-42,44],[2,44]],[[46712,21259],[-28,7],[-55,71]],[[46593,21358],[-662,786]],[[45931,22144],[27,18]],[[46018,22164],[58,45],[19,-12]],[[46108,22148],[22,-26],[36,28]],[[46185,22147],[31,-61]],[[46216,22086],[55,-35],[34,40],[79,-13],[17,-65]],[[46401,22013],[50,22],[676,823]],[[48433,23959],[37,-3],[-7,26]],[[48463,23982],[31,12]],[[48494,23994],[183,-32],[37,-62]],[[48714,23900],[-16,-71],[102,-34],[-70,-66],[-19,-2],[6,-39],[-15,-15],[16,-46],[46,-43],[31,22],[39,-6],[18,33],[16,-2]],[[48868,23631],[3,-22],[24,-26],[78,-149]],[[48973,23434],[-5,-41],[-17,-12],[5,-42],[-41,-14],[-19,-25],[25,-26],[5,-36],[61,15],[-15,-26],[25,-73]],[[48997,23154],[60,-14],[13,-15]],[[49070,23125],[-13,-74],[-57,-4],[-43,-40],[1,-47],[17,-3],[9,-32],[65,-48],[-30,-58]],[[49019,22819],[-39,-4],[-35,-23]],[[48945,22792],[-20,-69],[88,-94],[24,-42],[10,-81],[16,-32],[14,-22],[23,-1],[4,-39],[40,-2],[18,-19],[49,-119],[40,-51],[27,-16],[30,7]],[[49308,22212],[43,-35],[54,-72]],[[49405,22105],[55,14],[19,-62],[90,-141],[0,-105],[33,-46],[76,-61],[1,-54],[52,3]],[[49731,21653],[-4,-34],[13,-91]],[[49740,21528],[46,-45],[-26,-46],[16,-44],[19,-26],[109,-48],[-6,-89],[11,-55]],[[49909,21175],[-10,-67],[56,-112],[32,-28],[89,-17],[47,-137]],[[50123,20814],[38,1],[45,64],[56,25],[66,20],[75,-21],[36,56],[61,11]],[[50500,20970],[70,-29],[58,-6]],[[50628,20935],[44,-36],[96,-29],[159,-94]],[[50927,20776],[53,-1]],[[50980,20775],[9,-23]],[[50989,20752],[-17,-92],[18,-26]],[[50990,20634],[-7,-40],[72,-21]],[[51055,20573],[27,-28]],[[51082,20545],[5,-97]],[[51087,20448],[16,-35],[-11,-39]],[[51092,20374],[13,-61]],[[51105,20313],[-72,10],[-52,-96]],[[50981,20227],[-54,-11],[-37,30]],[[50890,20246],[0,53],[15,31]],[[50905,20330],[45,27],[-34,59],[-39,11],[-61,-30]],[[50816,20397],[-33,0],[-73,-52],[-50,-3],[-48,-58]],[[50612,20284],[-16,-57],[-84,-11]],[[50512,20216],[-55,-30]],[[50457,20186],[-78,55],[-58,62]],[[50038,20484],[-112,31]],[[49681,20426],[8,-35]],[[48868,20433],[-24,104]],[[48656,20461],[-22,-115]],[[48241,20156],[-124,59]],[[48117,20215],[-30,-47]],[[47925,20098],[-115,-106]],[[47340,19696],[-35,-43],[-28,53],[-42,34]],[[47187,19733],[-43,-48],[-36,-12]],[[47108,19673],[-27,21],[-29,-13]],[[47052,19681],[-52,12],[93,150]],[[47124,19864],[66,2]],[[46981,20040],[11,51]],[[46928,20161],[-22,53],[5,35],[-16,11]],[[46895,20260],[-5,52],[38,98]],[[30904,15716],[96,64]],[[33925,14754],[34,41]],[[33959,14795],[47,-47],[36,50]],[[34042,14798],[59,-32],[12,-29]],[[34113,14737],[111,-58],[61,-60],[-38,-40]],[[34247,14579],[-16,-36],[-1,-44],[-36,-77],[-21,-93],[-44,-49],[-56,-116],[-42,-5],[-42,-111],[-79,-134],[2,-27],[-58,-111],[-26,-81]],[[33828,13695],[-55,-67],[-10,-39]],[[32334,13747],[-68,-146],[-132,-172]],[[31793,13082],[-69,-152],[-59,-60],[-108,-12]],[[31504,12876],[-132,-169]],[[31023,12423],[-69,-21],[-115,-99]],[[30839,12303],[-103,143],[-106,-112]],[[30630,12334],[-197,-116]],[[30433,12218],[-11,-41],[-52,-44],[-65,-26],[-31,-35],[-146,-44],[-155,-170]],[[29973,11858],[-115,-57]],[[29858,11801],[-67,-64],[-134,75]],[[29657,11812],[-52,48],[-13,86]],[[29592,11946],[-16,10]],[[29576,11956],[-46,9]],[[29530,11965],[-54,-36]],[[29476,11929],[-22,17],[-173,11]],[[29281,11957],[-120,118],[-168,120],[-238,94],[-100,121],[-140,398],[75,40],[89,101],[35,64],[36,18],[31,65],[53,21],[43,59],[9,43],[-70,41],[-21,54],[5,37],[24,37],[2,36],[-10,18],[24,69],[55,-6],[13,22],[-19,64],[27,55],[33,-13],[26,11],[5,49],[42,8],[4,14],[29,13],[13,30],[28,6],[16,-21],[29,15],[44,-26],[6,67],[-27,16],[-26,-18],[-11,7],[-9,24],[12,24],[-54,62],[15,62],[77,132],[20,1],[82,68],[31,92],[83,117],[24,1],[32,32],[59,22],[-36,79],[7,50],[12,18],[39,-2],[5,28],[38,41],[-3,35],[26,56],[32,21],[-2,20],[27,48],[75,79],[29,12],[7,39],[63,-49],[30,43],[51,35],[18,52],[23,7],[29,35],[26,-13],[24,11],[-11,65],[15,8],[3,22],[30,14],[16,33],[36,22],[0,20],[29,22],[7,29],[54,-8],[38,60],[8,37],[26,18],[29,55],[71,61],[14,37],[149,106],[246,-100]],[[31075,13424],[79,33],[36,29],[105,37],[-9,19]],[[31286,13542],[-44,12]],[[31242,13554],[-22,46]],[[31220,13600],[-24,10]],[[31196,13610],[29,97],[-11,41]],[[31214,13748],[-33,41]],[[31181,13789],[26,34]],[[31207,13823],[22,0]],[[31229,13823],[1,48]],[[31230,13871],[65,45]],[[31295,13916],[4,88],[-9,33],[-139,-15],[-8,111]],[[31143,14133],[-24,17]],[[31119,14150],[-16,-29]],[[31103,14121],[-85,-57]],[[31018,14064],[61,-67]],[[31079,13997],[-7,-30]],[[31072,13967],[-71,-71]],[[31001,13896],[46,-94]],[[31047,13802],[-23,-22]],[[31024,13780],[6,-38]],[[31030,13742],[-28,-89]],[[31002,13653],[-16,-10]],[[30986,13643],[-7,-28],[-30,-3]],[[30949,13612],[-13,-29],[64,-90]],[[31000,13493],[31,-10]],[[31031,13483],[14,-22],[30,-37]],[[59558,6926],[82,57],[21,19]],[[59661,7002],[58,85],[21,2],[37,34]],[[59777,7123],[41,-15],[15,10]],[[59833,7118],[1,19],[15,-9],[11,6],[1,31]],[[59861,7165],[27,19],[-18,18],[14,3],[5,17],[-21,4],[3,21],[-26,7],[9,17],[-13,4],[-15,60],[-42,59]],[[59784,7394],[-6,39],[1,46]],[[59779,7479],[-6,17]],[[59773,7496],[33,-22]],[[59806,7474],[43,-5],[66,5]],[[59915,7474],[5,30],[28,0]],[[59948,7504],[5,11],[18,5],[24,38]],[[59995,7558],[333,-489]],[[60328,7069],[9,-2],[-1,4],[64,21]],[[60400,7092],[8,-7],[12,-24],[-3,-30],[90,-164],[-9,-14],[9,-11]],[[60507,6842],[-15,-22],[173,-274]],[[60665,6546],[26,-27],[184,-268],[10,-6],[10,-21]],[[60895,6224],[28,-20],[31,-8]],[[60954,6196],[8,-16],[75,-30]],[[61037,6150],[52,10]],[[61089,6160],[5,-6],[-4,-12],[5,-9],[-15,-29],[-19,3]],[[61061,6107],[-11,-57],[-21,2]],[[61029,6052],[-73,-92]],[[60956,5960],[34,-56],[11,-28]],[[61001,5876],[-37,-108],[1,-30],[17,-25]],[[60982,5713],[-18,-37],[-3,-42],[12,-72]],[[60973,5562],[1,-41],[56,-97],[-1,-18],[16,-62],[-2,-7],[-18,-12],[7,-15],[148,74],[168,-348],[47,-28],[-21,69],[5,3],[39,-36],[10,11],[284,-294]],[[61712,4761],[-204,-216]],[[61508,4545],[-116,-208]],[[61392,4337],[-66,-1],[-231,50]],[[61095,4386],[-65,44],[-24,29]],[[61006,4459],[-38,71],[-87,194]],[[60881,4724],[-37,62],[-59,74],[-255,247]],[[60530,5107],[-805,741]],[[59725,5848],[-231,247],[-31,41]],[[59463,6136],[-149,361]],[[59314,6497],[-1,31],[20,101],[21,195],[204,102]],[[60400,7092],[-72,-23]],[[59995,7558],[-47,-54]],[[59915,7474],[-109,0]],[[59773,7496],[-2,-9],[-16,31],[-12,46],[0,103]],[[59743,7667],[-45,58],[-7,28],[-186,-35],[-38,-30]],[[59467,7688],[-43,45],[-124,36]],[[59300,7769],[-32,-5]],[[59268,7764],[-29,23],[-44,58],[-6,35]],[[59189,7880],[-22,36],[-7,85],[-14,40],[-34,23],[-82,-5],[-42,44],[-3,12],[55,68]],[[59040,8183],[-3,29]],[[59014,8232],[-5,127]],[[59009,8359],[-29,12]],[[58980,8371],[-29,-12]],[[58951,8359],[-19,-22]],[[58932,8337],[3,-22]],[[58935,8315],[-71,-40]],[[58864,8275],[-16,-25]],[[58848,8250],[-74,-2]],[[58772,8189],[-54,43],[-26,44],[-40,116]],[[58642,8387],[-15,41],[2,43]],[[58629,8471],[-23,121],[-35,50]],[[58571,8642],[-17,55],[11,96]],[[58565,8793],[-149,69]],[[58416,8862],[-22,29],[16,60]],[[58410,8951],[-21,93]],[[58389,9044],[34,34],[15,36],[31,21]],[[58469,9135],[27,78],[33,17]],[[58529,9230],[72,6],[35,-7],[8,-21]],[[58644,9208],[46,2],[27,-31]],[[58717,9179],[59,-14],[71,14]],[[58847,9179],[9,-11],[2,25],[16,6]],[[58874,9199],[-7,-16],[34,-18],[19,21]],[[58920,9186],[-16,-3]],[[58904,9183],[8,13],[24,-8]],[[58936,9188],[-15,-18],[16,3],[13,40]],[[58950,9213],[47,6]],[[58997,9219],[2,-29],[27,-8],[17,24]],[[59043,9206],[42,-10],[121,135]],[[59206,9331],[77,-65],[103,-207]],[[59386,9059],[107,-170]],[[59493,8889],[70,-81]],[[59563,8808],[116,-190],[115,-126]],[[59794,8492],[103,-86]],[[59897,8406],[67,-99],[64,-50],[98,-48]],[[60126,8209],[111,-90]],[[60237,8119],[137,-184]],[[60374,7935],[35,-64]],[[60409,7871],[29,-27],[90,-51]],[[60528,7793],[279,-88],[138,0],[329,81]],[[61274,7786],[80,7],[248,93],[592,314]],[[62194,8200],[1419,42]],[[63613,8242],[7,-1003]],[[63620,7239],[-1645,-11]],[[61975,7228],[1,77],[-523,-337]],[[61453,6968],[-173,-131]],[[61280,6837],[9,-85]],[[61289,6752],[-16,-113]],[[61273,6639],[30,-49]],[[61303,6590],[-26,-51],[26,-42]],[[61303,6497],[20,44]],[[61323,6541],[101,-244],[-16,4],[-37,-39]],[[61371,6262],[9,-14],[26,13],[-7,-21]],[[61399,6240],[18,-24],[-24,3]],[[61393,6219],[13,-13]],[[61406,6206],[-15,-13],[20,3],[-10,-13]],[[61401,6183],[9,-10],[-22,9]],[[61388,6182],[-3,-13],[-22,-1]],[[61363,6168],[-17,-23]],[[61346,6145],[-13,8]],[[61333,6153],[8,-15]],[[61341,6138],[-18,2],[0,-11]],[[61323,6129],[-57,17]],[[61266,6146],[-92,-15],[-42,37]],[[61132,6168],[-95,-18]],[[60954,6196],[-59,28]],[[60895,6224],[-230,322]],[[60665,6546],[-172,273],[14,23]],[[51577,1807],[0,31],[3,4],[-3,2],[5,8]],[[51582,1852],[17,-8]],[[51599,1844],[3,8],[8,3],[3,5],[3,3]],[[51616,1863],[0,3],[-3,1],[1,30],[2,-3],[7,22]],[[51623,1916],[5,-1],[1,7],[25,-5],[1,-6],[29,-6],[46,-13]],[[51730,1892],[16,23],[22,25]],[[51768,1940],[0,-8],[32,-1],[0,-3],[31,-2]],[[51831,1926],[1,-16]],[[51832,1910],[47,-1],[5,11],[39,-8]],[[51923,1912],[46,85]],[[51969,1997],[5,-1],[11,3]],[[51985,1999],[20,-13],[1,-2],[-1,-7],[12,-1],[3,-4],[2,-7],[6,-3]],[[52028,1962],[0,-10],[-38,-69]],[[51990,1883],[9,-1],[-40,-117]],[[51959,1765],[40,21],[35,8]],[[52034,1794],[-4,-128],[20,-6],[-21,-79]],[[52029,1581],[-52,13],[-39,14]],[[51938,1608],[-2,-13],[-4,-10],[-1,-10],[-6,-9],[-3,-8],[-6,-8],[-1,-2],[2,-3],[-2,-7]],[[51915,1538],[-4,-4],[-15,11],[0,-3],[4,-4],[0,-3],[-12,1]],[[51888,1536],[-1,-3],[2,-2],[6,-1],[1,-2],[-2,-2],[0,-2],[3,-3],[0,-2]],[[51897,1519],[-6,-1],[0,-2],[2,-2],[-1,-3],[-5,-1],[-3,-2],[-2,-5]],[[51882,1503],[1,-2],[0,-6],[3,-4],[0,-3],[2,-2],[-1,-6],[2,-3],[4,-1],[0,-3]],[[51893,1473],[-3,-5],[-5,-2]],[[51885,1466],[-5,3],[-21,6],[-2,1],[-1,4],[1,4],[-8,6],[-6,-3],[-8,9],[-17,2],[-7,4]],[[51811,1502],[-15,-1],[-5,-2],[-9,-6],[-3,-1],[-10,4],[-5,-1]],[[51764,1495],[-6,-4],[-10,-13],[-13,-9],[0,-12],[-1,-1],[-3,-1]],[[51731,1455],[-22,3],[-9,-1],[-15,3]],[[51685,1460],[-28,17],[-2,5],[2,3],[-2,5],[-13,7]],[[51642,1497],[-6,-7],[-6,0]],[[51630,1490],[-11,101],[-1,14],[2,19],[-14,76]],[[51606,1700],[-10,0]],[[51596,1700],[-3,21],[-4,35],[1,4],[-2,2],[4,5],[0,5],[-2,6]],[[51590,1778],[-7,8],[-1,3],[-13,7],[0,5],[-1,3]],[[51568,1804],[3,1],[6,2]],[[33780,12595],[36,230]],[[33698,13335],[47,131],[23,146],[60,83]],[[34247,14579],[38,37],[-69,69],[-103,52]],[[34113,14737],[-15,31],[-56,30]],[[33959,14795],[29,33]],[[33988,14828],[112,220]],[[34154,15221],[159,290]],[[34313,15511],[225,203]],[[34889,16250],[245,361],[-110,71]],[[35024,16682],[52,81],[76,40]],[[35235,16923],[145,257]],[[35380,17180],[1222,-955],[1296,-956]],[[37898,15269],[272,-314],[-1,-83],[48,-44]],[[38217,14828],[-17,-25],[14,-26],[-41,-45],[67,-72]],[[38240,14660],[-10,-42]],[[38230,14618],[-69,-72],[-4,-44],[-49,-73],[39,-57],[-24,-33],[-4,-30],[-18,-12],[19,-14],[-19,-32],[18,-30],[-55,-45],[-21,-80]],[[38043,14096],[-39,-44],[5,-49]],[[37585,14031],[-15,44]],[[37500,14146],[-125,-88]],[[37250,13903],[-36,32],[-59,-95]],[[36980,13531],[-75,-174]],[[36750,12888],[-20,-81]],[[36568,12575],[-33,-74]],[[36365,12283],[-126,-34]],[[35856,11947],[-160,31]],[[35592,11768],[62,-116],[-17,-21]],[[35637,11631],[26,-11],[8,-28],[15,4]],[[35686,11596],[-16,-16],[-6,-46]],[[35664,11534],[24,-23],[31,-3]],[[35751,11529],[39,-64],[-21,-8],[-24,-37]],[[35745,11420],[-13,-50],[-56,-26]],[[35676,11344],[-44,4],[-50,-19]],[[35260,11075],[-17,-45]],[[34613,11727],[-299,235],[-632,499]],[[35605,13612],[68,41]],[[35673,13653],[-5,11]],[[35668,13664],[135,104],[44,68]],[[35847,13836],[46,-5]],[[35893,13831],[-15,20],[10,27]],[[35888,13878],[43,-17]],[[35931,13861],[18,12]],[[35949,13873],[-190,72]],[[35759,13945],[-78,-45]],[[35681,13900],[-57,22]],[[35624,13922],[-71,-76]],[[35553,13846],[4,-35],[11,4],[38,-42]],[[35606,13773],[-43,-76],[37,-31]],[[35600,13666],[-24,-18]],[[35576,13648],[13,-24],[16,-12]],[[36240,13374],[-8,-35]],[[36232,13339],[56,-14],[-21,-53],[9,-4]],[[36276,13268],[-6,-61]],[[36270,13207],[41,11]],[[36311,13218],[18,-24]],[[36329,13194],[24,4],[5,-20]],[[36358,13178],[-33,4]],[[36325,13182],[-49,-57]],[[36276,13125],[-8,-24]],[[36268,13101],[17,-86]],[[36285,13015],[-64,-57]],[[36221,12958],[36,-33]],[[36257,12925],[43,-77]],[[36300,12848],[11,12],[10,-20],[93,74]],[[36414,12914],[-10,27]],[[36404,12941],[47,23]],[[36451,12964],[1,21]],[[36452,12985],[55,-40]],[[36507,12945],[-61,54]],[[36446,12999],[128,215]],[[36574,13214],[52,-15],[7,22],[-50,19]],[[36583,13240],[25,55]],[[36608,13295],[30,15]],[[36638,13310],[-6,56]],[[36632,13366],[55,2]],[[36687,13368],[-36,7]],[[36651,13375],[25,186]],[[36676,13561],[-36,7],[-8,-21],[-78,25],[-50,-73]],[[36504,13499],[-64,-4]],[[36440,13495],[-10,-28]],[[36430,13467],[-30,-9]],[[36400,13458],[-27,-75]],[[36373,13383],[-43,12],[-90,-21]],[[15778,5310],[-109,270],[-75,125],[-309,352],[-4,22],[-68,67],[-36,62],[-110,130]],[[15067,6338],[-24,149]],[[15043,6487],[-78,176]],[[14965,6663],[37,135]],[[15453,7035],[42,48],[26,-4]],[[15521,7079],[19,28],[28,6],[75,-20]],[[15776,7148],[21,22],[49,5],[29,37],[31,-3],[50,48]],[[16008,7320],[37,53],[77,-36],[23,13],[43,63],[-6,30]],[[16328,7658],[-20,34],[28,61],[51,0],[17,21],[59,7],[18,-23],[22,-2],[9,-32],[19,-14],[4,-61],[33,-13],[33,-42],[34,-7],[8,-28],[31,-9],[5,-21],[22,-11],[11,-41],[65,0],[9,-20],[20,1],[3,-67],[43,-45],[992,57],[22,21],[15,-13],[76,95],[14,47],[37,-2],[143,88],[30,-10],[110,74],[12,58],[-2,71],[28,87],[34,54],[11,-1],[-2,-36],[49,-41],[36,11],[66,-9],[34,50],[118,48],[9,29],[19,4],[-15,29],[97,45],[12,30],[69,-15],[20,35],[13,1],[65,-35],[100,29],[1,59],[37,16],[46,144],[32,28],[-23,33],[69,63],[-15,64],[28,27],[9,42],[29,5],[15,31],[23,11],[12,-23],[44,-11],[45,17],[16,16],[9,41],[32,30],[-14,61],[15,5],[17,54],[22,4],[360,-431],[802,-717]],[[20675,7716],[-131,-104],[-101,-48],[-88,-36]],[[20355,7528],[-183,-23],[176,-475],[-421,-152]],[[19927,6878],[-163,-114]],[[19764,6764],[42,-113],[101,2],[39,-42],[64,-1],[88,-51],[80,2],[113,-30],[47,-32],[31,-118],[-16,-92],[-36,-55],[-25,-99],[-111,-79],[-48,-24],[-17,7],[-28,-28],[-128,-61],[-41,-43],[-246,-112],[-123,-42],[-133,-20]],[[19417,5733],[-27,-33]],[[19390,5700],[-29,25],[-79,-5],[-75,27]],[[19207,5747],[-316,-184]],[[18891,5563],[-177,-22],[-40,-41]],[[18674,5500],[212,-283]],[[18886,5217],[-24,-4],[-145,-110]],[[18717,5103],[-39,-50],[-59,-44],[-99,-55]],[[18520,4954],[-24,32],[20,35],[70,63]],[[18586,5084],[-28,44],[27,21],[-23,57]],[[18562,5206],[52,53]],[[18614,5259],[2,31],[-44,20],[-80,-36],[-39,10],[-24,-23],[-37,13],[-48,-65],[-47,-2],[-28,-63],[-58,-29],[-81,-9],[-56,-42],[-141,-23],[-94,-41],[-133,-11],[-43,-51]],[[17663,4938],[-89,-55]],[[17574,4883],[-60,-73],[-35,-13],[-177,-135]],[[17302,4662],[-139,-133]],[[17163,4529],[-132,-79],[-75,-17],[-66,-53],[-79,-20]],[[16811,4360],[-218,487],[-70,-42]],[[16523,4805],[-33,0],[-64,-34],[-26,3],[-23,-26]],[[16377,4748],[-65,-24]],[[16312,4724],[-21,4],[-36,-30],[-62,-9],[-33,-22],[-91,8]],[[16069,4675],[-75,-30],[-68,199],[-148,466]],[[55188,25460],[-3,15],[32,13],[29,40],[28,7],[-11,20]],[[55263,25555],[7,2],[-6,13],[10,7]],[[55274,25577],[1,-6],[25,6]],[[55300,25577],[3,-3],[-1,-4],[0,-5]],[[55302,25565],[89,35]],[[55391,25600],[15,-7],[9,-8]],[[55415,25585],[8,4],[3,-8],[-3,-4],[9,-15],[8,8],[18,-13],[5,-12],[16,-14],[3,-1]],[[55482,25530],[0,-2],[-6,-7]],[[55476,25521],[43,-33],[65,-67],[12,11],[10,26],[-1,44],[5,18],[1,22],[-8,52],[0,15],[46,-10],[25,6],[54,5],[24,-4],[35,12]],[[55787,25618],[7,-2],[34,-24]],[[55828,25592],[32,-17],[15,-2],[45,3],[5,-7],[6,0],[8,-5],[-6,-3],[4,-9],[7,-7],[-2,-6],[4,-20],[-2,-2],[7,-24],[5,-5],[5,-21],[4,-3],[6,3],[-5,21],[2,3],[4,1],[24,-18],[7,-10],[4,-12],[1,-7],[-6,-25],[-4,-31],[-8,-8],[-7,-1],[-4,-4],[0,-4],[3,-9],[10,-5],[0,-5],[-4,-6],[0,-4],[2,-5],[7,-4],[1,-4],[-2,-3],[6,-31],[9,-16],[0,-46],[-16,-111],[2,-99],[-3,0],[-2,-12],[-8,-1],[3,-6],[-1,-52],[-9,2]],[[55977,24955],[-82,49],[-14,11],[-17,8],[-43,28],[-32,15],[2,4],[-2,1]],[[55789,25071],[-70,38],[-42,12]],[[55677,25121],[-205,30]],[[55472,25151],[-44,-3],[-47,-13]],[[55381,25135],[-6,17]],[[55375,25152],[-35,-18],[-35,-11]],[[55305,25123],[-140,-26],[-2,29],[-17,-6],[-21,61]],[[55125,25181],[-2,2],[-5,-7]],[[55118,25176],[-10,56]],[[55108,25232],[4,1],[1,4],[0,38]],[[55113,25275],[22,36]],[[55135,25311],[8,-6],[4,2]],[[55147,25307],[6,13],[5,6]],[[55158,25326],[-10,9],[20,21],[-11,27],[-31,-1]],[[55126,25382],[4,11],[-1,8],[9,17],[50,42]],[[33418,12],[874,4860],[146,703],[136,-67],[117,-16],[26,16]],[[35316,5725],[-12,42],[11,28],[34,23]],[[35349,5818],[69,2],[204,-93]],[[35622,5727],[64,-4],[113,54]],[[35799,5777],[135,1]],[[35934,5778],[97,30],[19,64]],[[36050,5872],[0,183],[-15,70],[61,20],[80,-9]],[[36176,6136],[113,89]],[[36289,6225],[30,57],[11,44],[-9,32]],[[36321,6358],[-94,35]],[[36227,6393],[-13,15],[9,25],[56,18],[99,-18],[103,36],[91,79],[-35,43]],[[36537,6591],[40,42],[30,-16],[8,-62]],[[36615,6555],[28,-51]],[[36643,6504],[85,-49],[140,-115],[42,-56]],[[36910,6284],[32,-11],[122,6]],[[37064,6279],[85,62]],[[37149,6341],[70,174],[88,68],[29,-16],[54,-80]],[[37390,6487],[46,-117]],[[37436,6370],[17,-120],[41,-46],[47,1],[35,27],[0,156],[34,36],[43,-8]],[[37653,6416],[85,-124],[17,-107],[-11,-140]],[[37744,6045],[-31,-108],[43,-126],[65,-98]],[[37821,5713],[38,18],[30,105],[39,58],[35,-1],[65,-41],[68,51]],[[38096,5903],[174,61]],[[38270,5964],[28,86],[35,38],[71,16]],[[38404,6104],[56,-35],[59,-209]],[[38519,5860],[48,-8],[105,-63]],[[38672,5789],[-1067,-5780]],[[37605,9],[-1046,-3]],[[36559,6],[-62,88]],[[36497,94],[56,111]],[[36553,205],[-4,26],[-21,-8],[9,22],[16,-12]],[[36553,233],[95,73]],[[36648,306],[-43,46]],[[36605,352],[22,15]],[[36627,367],[2,-24]],[[36629,343],[26,8]],[[36655,351],[19,-19]],[[36674,332],[-6,-14]],[[36668,318],[28,0]],[[36696,318],[54,44]],[[36750,362],[48,-52],[64,6],[34,56],[-15,88]],[[36881,460],[-99,2]],[[36782,462],[-19,17]],[[36763,479],[-84,-19]],[[36679,460],[-5,71]],[[36674,531],[-20,0],[3,147]],[[36657,678],[-157,-26]],[[36500,652],[-14,5]],[[36486,657],[-28,100],[-56,9]],[[36402,766],[-31,-23]],[[36371,743],[-33,101],[-5,204]],[[36333,1048],[-55,18]],[[36278,1066],[-28,-30]],[[36250,1036],[-51,43]],[[36199,1079],[-57,-6]],[[36142,1073],[-2,65]],[[36140,1138],[-28,-14],[-27,29],[-15,-7],[5,-21],[-25,-6]],[[36050,1119],[-22,-57],[-8,-28]],[[36020,1034],[20,-14]],[[36040,1020],[-10,-32]],[[36030,988],[-84,-133],[6,-56]],[[35952,799],[-53,-61]],[[35899,738],[-13,-43]],[[35886,695],[19,-6],[-57,-41],[-35,1],[-60,100]],[[35753,749],[-46,-18]],[[35707,731],[-19,31]],[[35688,762],[-19,-27]],[[35669,735],[-12,41]],[[35657,776],[-28,18],[-37,-6],[-43,22]],[[35549,810],[-10,-16]],[[35539,794],[-24,26]],[[35515,820],[-77,-4]],[[35438,816],[-27,23]],[[35411,839],[-52,-6]],[[35359,833],[-23,-33],[-6,17]],[[35330,817],[-45,0]],[[35285,817],[-63,44]],[[35222,861],[-92,-73]],[[35130,788],[1,-66]],[[35131,722],[-52,0]],[[35079,722],[-4,-40]],[[35075,682],[68,-56],[7,-28],[9,14],[68,-30]],[[35227,582],[-17,-17]],[[35210,565],[24,-10]],[[35234,555],[77,-115]],[[35311,440],[49,38]],[[35360,478],[53,3]],[[35413,481],[184,-82]],[[35597,399],[-47,-142]],[[35550,257],[-20,16],[-59,-62],[-14,-102],[44,-67],[-18,-42]],[[35483,0],[-1340,8],[-725,4]],[[23734,5146],[-125,107],[-134,157]],[[23475,5410],[-315,975]],[[23160,6385],[5,5],[89,6]],[[23254,6396],[135,45],[139,79],[144,139]],[[23672,6659],[219,138]],[[23891,6797],[220,156],[52,51],[53,73],[33,25],[358,156]],[[24607,7258],[66,12],[82,32]],[[24755,7302],[62,5],[50,46],[88,18],[171,81],[105,59],[109,86]],[[25340,7597],[206,72],[194,90],[98,56],[54,13]],[[25892,7828],[8,-17],[-12,-51]],[[25888,7760],[-57,-54],[-6,-19],[-2,-45],[15,-54],[-7,-59],[7,-59],[90,-101]],[[25928,7369],[71,-171],[54,-55],[18,-5]],[[26071,7138],[33,12],[134,149],[111,52]],[[26349,7351],[96,20],[43,22],[94,14]],[[26582,7407],[38,-7],[30,-28],[15,-59]],[[26665,7313],[-17,-47],[-17,-18]],[[26631,7248],[-59,-13],[-98,33],[-93,-22],[-48,-28],[-26,-52],[-44,-43],[-19,-41],[0,-41]],[[26244,7041],[26,-32],[45,-27]],[[26315,6982],[35,-71],[21,-69],[43,-8],[84,27]],[[26498,6861],[38,-26]],[[26536,6835],[24,-61],[9,-55]],[[26569,6719],[-11,-98]],[[26558,6621],[-10,-19],[-32,-5]],[[26516,6597],[-22,42]],[[26494,6639],[-113,96]],[[26381,6735],[-40,1]],[[26341,6736],[-164,-76]],[[26177,6660],[-167,-133],[-20,-31]],[[25990,6496],[-7,-39]],[[25983,6457],[0,-64]],[[25983,6393],[48,-154]],[[26031,6239],[87,-138],[18,-82],[19,-24],[0,-16]],[[26155,5979],[52,-18],[8,-26],[12,-4],[37,47],[12,42]],[[26276,6020],[10,0],[15,-130],[19,-21],[-3,-30],[50,-22],[34,-59]],[[26401,5758],[-1,-9],[-34,-15]],[[26366,5734],[-17,-51],[55,-7]],[[26404,5676],[25,-24],[4,-41]],[[26433,5611],[-8,-52],[-27,-13],[-20,9],[-5,48]],[[26373,5603],[-40,51],[-70,14]],[[26263,5668],[-24,-34],[29,-75],[-5,-59],[20,0],[20,28],[20,-26],[-10,-58],[10,-228]],[[26323,5216],[100,-280],[-40,-29],[-8,-30]],[[26375,4877],[13,-19],[-2,-19],[-23,-22]],[[26363,4817],[-16,-44],[-95,-14]],[[26252,4759],[-8,-42],[-24,-15],[-5,-38],[-96,-30],[-69,-77],[-18,-4],[-11,-40],[-48,-40],[-38,6],[-32,-15],[-51,0],[-62,-53],[-71,1]],[[25719,4412],[-31,-21],[-21,-28],[-27,-69]],[[25640,4294],[-41,-9],[-31,7]],[[25568,4292],[-73,-55],[-40,-52]],[[25455,4185],[6,-22],[-10,-20],[-97,-31],[-47,-29],[-39,13],[15,-73]],[[25283,4023],[-10,-25],[3,-16]],[[25276,3982],[-23,-43],[-46,7],[-35,-11],[-9,-19],[-280,-118]],[[24883,3798],[-119,-38]],[[24764,3760],[-423,615],[-103,137]],[[24238,4512],[10,-32],[-64,-37],[-2,57],[-22,78],[23,9]],[[24183,4587],[-340,430],[-109,129]],[[61029,6052],[22,0],[10,55]],[[61089,6160],[43,8]],[[61266,6146],[14,-1],[27,-18],[5,10],[11,-8]],[[61341,6138],[-7,5],[-1,10]],[[61333,6153],[8,2],[5,-10]],[[61346,6145],[3,8],[8,-1],[-1,8],[7,8]],[[61388,6182],[22,-8],[-9,9]],[[61406,6206],[-12,4],[-1,9]],[[61399,6240],[8,20],[-5,5],[-6,-13],[-18,-3],[-7,13]],[[61371,6262],[10,5],[-3,12],[26,11],[7,12],[23,-17],[6,25],[26,-14]],[[61466,6296],[30,-6],[4,-16],[19,0],[0,29],[-20,2],[-8,10],[12,14],[17,2]],[[61520,6331],[12,20],[15,-2],[42,-40]],[[61589,6309],[74,53],[139,-70],[53,-110],[231,69],[47,-12],[86,14],[35,43],[30,73],[26,24]],[[62310,6393],[130,60]],[[62440,6453],[0,-57]],[[62440,6396],[1185,17]],[[63625,6413],[10,-850],[-978,-456]],[[62657,5107],[-209,-169],[21,-18],[-209,-164]],[[62260,4756],[-230,-45]],[[62030,4711],[-70,17],[-50,-455]],[[61910,4273],[-31,-4]],[[61879,4269],[28,178],[-28,0],[-18,21],[-140,0],[-84,21]],[[61637,4489],[-117,71],[192,201]],[[60973,5562],[-9,43],[-1,67],[19,41]],[[61001,5876],[-45,84]],[[60956,5960],[14,18],[59,74]],[[49688,17072],[-28,-3],[-31,27],[-104,-1],[-42,12],[-14,19],[-1,44],[-21,18],[-20,-13],[-18,25],[0,51],[-31,12],[-14,33],[-42,11],[-7,19],[-45,21]],[[49270,17347],[-1,37],[-16,20],[-62,-21]],[[49191,17383],[22,-32],[-27,-35],[-11,5],[-8,34],[-26,18],[2,10],[-24,-1],[-3,-37],[-23,-10],[-13,9],[4,25],[-13,24],[-119,12],[-69,28],[-54,48],[-17,-19],[-43,-16],[-21,16],[-5,-22],[-32,-15],[-44,41],[-41,-3],[-13,61]],[[48613,17524],[-22,15],[-51,-39],[-28,2],[-28,-15],[-42,4]],[[48442,17491],[-53,54],[-54,13],[-15,-25],[-33,10],[-18,-14]],[[50294,19959],[-31,41],[-1,19],[52,45]],[[50314,20064],[-18,39],[13,27]],[[50375,20193],[-12,1],[-7,18],[32,-2]],[[50392,20232],[65,-46]],[[50512,20216],[80,8],[20,60]],[[50816,20397],[45,26],[50,-4],[39,-64],[-45,-25]],[[50890,20246],[33,-27],[58,8]],[[50981,20227],[43,88],[13,9],[68,-11]],[[51105,20313],[3,-13]],[[51108,20300],[48,-27],[27,-81]],[[51183,20192],[58,-92]],[[51241,20100],[-38,-123],[40,-55],[22,1],[42,36],[85,120]],[[51392,20079],[109,14],[28,-14],[14,-28],[-25,-50]],[[51518,20001],[11,-40],[29,-17],[57,-10]],[[51615,19934],[100,-88],[16,-25],[13,-73]],[[51744,19748],[33,-48],[74,-40]],[[51851,19660],[-20,-7],[150,-33]],[[51981,19620],[-10,-61]],[[51971,19559],[-16,-28]],[[51955,19531],[7,-23]],[[51962,19508],[30,9]],[[51992,19517],[7,-18]],[[51999,19499],[44,-28]],[[52043,19471],[-36,-135]],[[52007,19336],[32,6]],[[52039,19342],[56,-16]],[[52095,19326],[23,11]],[[52118,19337],[9,33]],[[52127,19370],[26,-8]],[[52153,19362],[3,-28]],[[52156,19334],[11,-11],[-16,-56],[104,-9]],[[52255,19258],[76,-30]],[[52331,19228],[53,106]],[[52384,19334],[15,0]],[[52399,19334],[36,-22]],[[52435,19312],[28,-75]],[[52463,19237],[61,42]],[[52524,19279],[-17,25]],[[52507,19304],[-17,73],[24,9]],[[52514,19386],[16,-15]],[[52530,19371],[23,16]],[[52553,19387],[12,-17]],[[52565,19370],[58,-16],[16,-75],[22,-40],[86,-51],[34,-97],[14,-13],[109,-30]],[[52904,19048],[124,-95],[53,-3]],[[53081,18950],[27,40],[29,12],[64,-38]],[[53201,18964],[-414,-527],[-176,-243]],[[52611,18194],[-277,-328],[-1292,-1605]],[[51042,16261],[-135,-139],[-6,20],[-53,16]],[[50848,16158],[-87,-24],[-11,61],[-54,-4]],[[50696,16191],[-8,41],[-23,33],[-59,34],[-52,16],[-89,-13],[-12,5],[-37,57]],[[50416,16364],[-44,10],[-53,-10],[-17,28],[-50,20],[6,36],[-26,33],[-29,-1],[-42,-25],[-8,7],[5,37],[22,13],[2,13],[-35,50],[-64,14],[-9,-41],[-31,-59],[-20,-3],[-13,57],[8,46],[-11,42],[46,28],[9,-23],[12,7],[-17,33],[-45,15],[6,73],[20,28],[-37,18],[-55,-51],[-54,26],[-12,29],[-19,2],[-20,-18],[-27,28],[7,23],[-9,13],[-55,14],[-27,43],[-24,8],[-3,20]],[[49703,16947],[20,27],[-35,98]],[[57025,7600],[143,-16],[616,22],[124,-17],[30,-12]],[[57938,7577],[61,-50],[238,-322]],[[58237,7205],[111,-134],[61,-46]],[[58409,7025],[64,-15],[104,12],[53,43]],[[58630,7065],[48,127],[1,25],[32,73]],[[58711,7290],[72,91],[60,38],[83,31]],[[58926,7450],[131,-4],[134,-71]],[[59191,7375],[120,-116],[21,-38],[9,-49],[9,-357]],[[59350,6815],[-263,-136],[-23,-28],[-2,-28],[27,-39],[-44,-22],[-22,-53],[3,-96],[25,-37],[-20,-32],[35,-34],[-23,-47],[-27,30],[-26,-33],[18,-58],[-17,-18],[21,-36],[-22,-18],[-2,-45],[-29,-9],[-4,-20],[-35,-5],[-26,-20],[19,-16],[-14,-58],[16,-29],[-26,-16],[-42,-71],[5,-29],[25,-34]],[[58877,5778],[-14,-23],[-58,-30]],[[58805,5725],[-31,6],[-7,-12],[-547,-288]],[[58220,5431],[-524,-301],[-978,-643]],[[56718,4487],[-106,620],[-20,378],[9,23],[-18,44],[14,19],[36,13],[-6,51],[-14,26]],[[56613,5661],[6,50],[-41,1]],[[56578,5712],[-63,-43],[-16,30],[-31,4],[-1,-33],[-12,-13],[-155,20],[-16,6]],[[56284,5683],[-3,20],[-11,9]],[[56270,5712],[7,28],[-4,12]],[[56273,5752],[-71,-3],[-18,37],[-121,62],[-20,-4]],[[56043,5844],[-10,36],[-9,4]],[[56024,5884],[-26,-12],[-49,14],[-5,-51],[-37,-34]],[[55907,5801],[-16,11],[-23,-2]],[[55868,5810],[-13,15],[-31,-4],[-32,26],[-28,-11],[-17,24]],[[55747,5860],[-31,-16],[-28,1]],[[55688,5845],[-25,21],[26,43],[-16,21],[5,31],[-20,9],[12,44]],[[55670,6014],[-11,8],[-8,27]],[[55651,6049],[-14,-1],[-19,-20]],[[55618,6028],[-22,4],[-15,-9]],[[55581,6023],[-19,3]],[[55562,6026],[-14,32],[-13,7]],[[55535,6065],[-30,-9],[-16,-19]],[[55489,6037],[-26,6],[-12,24]],[[55451,6067],[5,25],[-44,27],[-1,30],[17,15],[-27,13],[0,25]],[[55401,6202],[-19,24],[-61,1]],[[55321,6227],[-22,-29],[-34,7]],[[55265,6205],[-13,-20],[-12,0]],[[55240,6185],[-24,5],[-5,41],[-42,4],[-18,28]],[[55151,6263],[-12,-2],[-25,-30]],[[55114,6231],[-45,4],[-37,32]],[[55032,6267],[2,20],[-22,34]],[[55012,6321],[4,25],[-7,17],[272,276]],[[55281,6639],[304,346],[90,55],[25,43],[12,74],[121,71],[51,2],[30,13],[23,-9],[23,15]],[[55960,7249],[6,10],[-4,24]],[[55962,7283],[-27,29],[21,42]],[[55956,7354],[15,-9],[39,4]],[[56010,7349],[20,16],[10,-6],[5,-32],[15,-13],[20,35]],[[56080,7349],[12,-5],[3,-14]],[[56095,7330],[28,10],[1,68],[51,-2],[51,61],[-17,35],[-36,20],[-6,25],[17,40],[31,22],[-9,38]],[[56206,7647],[12,42],[17,10],[37,-18],[22,4]],[[56294,7685],[17,74],[17,6],[31,-32],[22,2],[177,133]],[[56558,7868],[58,-50]],[[56616,7818],[113,-56],[134,-100]],[[56863,7662],[58,-28],[104,-34]],[[53627,8535],[11,3],[18,-1],[8,2],[20,13],[17,7],[2,4],[5,2],[3,4],[15,1],[3,5],[6,-1],[9,4],[7,-3],[5,5]],[[53756,8580],[7,-2],[28,6],[22,0]],[[53813,8584],[9,-36],[5,-6],[4,4],[-5,10],[-3,23]],[[53823,8579],[23,-1],[27,10]],[[53873,8588],[7,7],[4,9],[5,2],[10,10],[3,12]],[[53902,8628],[48,-77]],[[53950,8551],[2,9],[7,4],[12,16]],[[53971,8580],[6,22],[0,26],[5,5],[11,0],[14,-5],[12,-8],[11,-15],[3,-11],[5,-6],[1,-6],[9,-11],[-3,-6],[0,-8],[-3,-4],[5,-5],[-2,-8]],[[54045,8540],[8,-6],[5,-11],[8,-6],[17,5]],[[54083,8522],[1,-4],[-15,-6]],[[54069,8512],[8,-11],[7,-17]],[[54084,8484],[8,-8],[11,-6],[13,-12],[3,-7],[26,-20],[21,-22],[13,-4],[10,-13]],[[54189,8392],[4,-17],[-1,-5],[-1,-6]],[[54191,8364],[-4,-5],[-14,-12],[-5,-14],[-9,-10]],[[54159,8323],[-38,-24]],[[54121,8299],[-1,-4],[2,-20],[-3,-10],[7,-11],[0,-4],[-2,-5]],[[54124,8245],[-2,-2],[-11,-4],[-10,-1],[-20,12],[-9,1],[-25,-7]],[[54047,8244],[-11,-14],[-7,-28],[-5,-6],[-4,-1]],[[54020,8195],[-7,3],[-9,16],[-8,7]],[[53996,8221],[-5,0],[-8,-4],[-7,1]],[[53976,8218],[-2,-4],[3,-14],[-2,-10]],[[53975,8190],[-16,-7],[-17,1]],[[53942,8184],[0,-13],[-2,-5],[-9,-11]],[[53931,8155],[-16,-6],[-19,1],[-50,-13]],[[53846,8137],[-6,-11],[-19,-5],[-7,-6],[-7,-2]],[[53807,8113],[-14,-16],[-4,-9],[-12,-12]],[[53777,8076],[0,-8],[-4,-8],[-1,-9],[-3,-8]],[[53769,8043],[-14,-8],[-2,-12],[-3,-5]],[[53750,8018],[-6,-1],[-9,2],[-8,-9],[-22,3]],[[53705,8013],[3,15],[-4,37]],[[53704,8065],[-55,-18],[-10,-9]],[[53639,8038],[0,18],[-33,0]],[[53606,8056],[-16,-37],[-14,-18]],[[53576,8001],[-22,-19],[-18,-10]],[[53536,7972],[-2,41],[48,60]],[[53582,8073],[-4,12],[-14,13],[6,9],[-8,9],[-7,13]],[[53555,8129],[2,12],[3,12],[-2,30]],[[53558,8183],[2,5],[23,33],[1,4]],[[53584,8225],[-45,-3]],[[53539,8222],[-3,19],[5,12],[-3,15]],[[53538,8268],[1,5],[12,18],[3,16]],[[53554,8307],[-5,15],[0,10]],[[53549,8332],[6,18],[12,11]],[[53567,8361],[-30,3],[8,61]],[[53545,8425],[-12,8],[-4,7],[-5,18]],[[53524,8458],[-18,-2],[0,12],[-27,15],[2,68]],[[53481,8551],[4,5],[26,35],[21,-19],[15,-8],[21,-7],[34,-19],[25,-3]],[[35624,13922],[9,-5],[6,-10],[3,-1],[5,5],[4,2],[6,-7],[7,-3],[14,-3],[3,0]],[[35681,13900],[13,9],[65,36]],[[35759,13945],[3,-4],[9,-8],[23,-5],[14,0],[2,1],[4,1],[4,1],[12,-2],[5,-6],[2,-1],[7,-11],[5,-3],[27,-6],[4,0],[12,-3],[1,-1],[11,-2],[8,-3],[3,-2],[12,-3],[7,-3],[3,-2],[3,0],[2,-1],[4,-4],[3,-5]],[[35949,13873],[-1,-4],[-2,-2],[-7,-4],[-8,-2]],[[35931,13861],[-9,2],[-10,8],[-9,3],[-4,3],[-11,1]],[[35888,13878],[-8,-6],[-2,-14],[1,-12],[3,-6],[11,-9]],[[35893,13831],[-38,3],[-8,2]],[[35847,13836],[-15,-12],[-2,-11],[-6,-5],[-8,-9],[-4,-15],[-4,-10],[-13,-14],[-18,-1],[-7,-21],[-18,-16],[-38,-30],[-36,-28],[-10,0]],[[35668,13664],[1,-5],[1,-3],[3,-3]],[[35673,13653],[-6,-3],[-29,-24],[-9,-3],[-6,0],[-18,-11]],[[35605,13612],[-15,9],[-14,27]],[[35576,13648],[17,9],[7,9]],[[35600,13666],[-37,27],[0,1],[0,3],[13,16],[4,6],[3,11],[2,2],[-1,12],[2,4],[10,9],[0,6],[1,2],[9,8]],[[35553,13846],[21,26],[5,5],[8,1],[0,2],[11,22],[9,-3],[11,16],[6,7]],[[47608,30283],[-40,-58]],[[47568,30225],[-17,-146]],[[47551,30079],[-46,-45]],[[47505,30034],[28,-59]],[[47533,29975],[-51,-22]],[[47482,29953],[-21,-76]],[[47425,29883],[-34,-22]],[[47391,29861],[-15,-35]],[[47376,29826],[10,-60]],[[47342,29746],[26,-43]],[[47364,29678],[-65,12]],[[47299,29690],[23,-51]],[[47316,29624],[-58,-5]],[[47258,29619],[42,-60]],[[47300,29559],[-45,-5]],[[47251,29538],[38,-45]],[[47289,29493],[-54,-16]],[[47247,29421],[22,-105]],[[47269,29316],[-72,-64]],[[47197,29252],[27,-57]],[[47224,29195],[-70,-29]],[[47165,29129],[31,-24]],[[47196,29105],[-42,4]],[[47169,29036],[-30,-10]],[[47130,28938],[-47,-38]],[[47086,28839],[2,-39]],[[47088,28800],[-36,-21]],[[47052,28779],[-33,-60]],[[47029,28685],[-44,-2]],[[47001,28564],[25,-45]],[[46948,28479],[36,-24]],[[46984,28455],[-47,-90]],[[46918,28358],[-34,20]],[[46884,28378],[-38,-32]],[[46814,28309],[-37,-105]],[[46777,28204],[-44,-33]],[[46733,28171],[-141,-478]],[[46592,27693],[-74,-109],[-14,-44]],[[46504,27540],[-1267,-110],[18,16],[-21,7],[-36,51]],[[45224,27589],[14,28],[-60,70]],[[45215,27683],[61,38],[-77,21]],[[45087,27798],[14,101]],[[45083,27903],[-13,-30]],[[45070,28115],[-17,45]],[[45053,28160],[55,5],[43,22],[-49,63]],[[45047,28278],[65,65],[-15,21]],[[45056,28385],[14,56],[-18,31],[-34,12],[-20,-6]],[[44605,28457],[-33,14],[20,-60]],[[44583,28373],[-67,25]],[[44393,28287],[-48,1]],[[44169,27993],[-63,-30]],[[43297,27971],[10,11],[95,98],[75,51],[50,72],[3,47],[49,38],[131,176],[131,94],[36,-22],[73,60],[58,5],[172,209],[23,106],[79,123],[113,63],[87,101],[-28,38],[-52,30],[-14,47],[-35,-5],[-43,57],[-19,3],[-20,49],[37,55],[-5,13],[-13,9],[-19,-16],[-18,40],[-67,20],[153,186],[127,182],[11,112],[39,29],[-80,97],[-87,55],[140,200],[8,14],[-9,21],[26,30],[17,-9],[38,27],[63,132],[157,170],[28,61],[-1,36],[34,-12],[36,104],[16,9],[64,124],[7,21],[-16,27],[31,37],[20,-13],[17,34],[-9,56],[-224,62],[102,138],[98,191],[-65,24],[12,70],[-71,77],[-17,53],[5,39],[24,33],[-4,16],[48,41],[38,78],[-55,102],[57,65],[-7,56],[19,131],[-40,26],[23,47],[712,-575],[882,-788],[146,-108],[909,-768]],[[46345,28797],[101,143]],[[46446,28940],[55,137]],[[46501,29077],[75,98]],[[46576,29175],[39,89]],[[46615,29264],[117,129]],[[46732,29393],[-174,133],[23,48],[-43,22]],[[46538,29596],[-32,-44]],[[46506,29552],[-203,65]],[[46303,29617],[-68,-123]],[[46235,29494],[-15,-45]],[[46220,29449],[26,-1],[-52,-102]],[[46194,29346],[98,-60]],[[46292,29286],[-41,-105]],[[46251,29181],[-12,-116]],[[46239,29065],[-37,-24],[16,-41]],[[46218,29000],[3,-65]],[[46221,28935],[124,-71]],[[46345,28864],[0,-67]],[[44403,8709],[26,-70]],[[44429,8639],[27,5]],[[44456,8644],[38,-28]],[[44494,8616],[-2,-24],[17,-18],[13,-38],[36,-39],[18,-4],[2,19],[20,9],[47,-12],[27,22],[46,-12],[48,4],[47,32],[24,2],[19,-14],[-11,-24]],[[44845,8519],[40,-13]],[[44885,8506],[4,-26],[22,-22],[12,17],[-9,15],[1,46],[16,17],[3,27]],[[44934,8580],[57,70],[72,-24]],[[45063,8626],[-11,-52],[19,-33]],[[45071,8541],[101,3],[84,73]],[[45256,8617],[1,29],[16,27],[30,6],[53,37]],[[45356,8716],[43,-14],[19,7],[-10,102]],[[45408,8811],[36,39],[69,-14],[21,42],[8,82],[14,21],[32,-2]],[[45588,8979],[116,-61]],[[45704,8918],[18,43],[3,62],[-34,34]],[[45691,9057],[2,54],[110,-14]],[[45803,9097],[71,51],[31,50]],[[45905,9198],[32,-800]],[[45868,6440],[-40,-37],[-35,-8],[-31,-26],[-117,-23],[-70,-86],[-86,-26],[-39,3],[-39,-14],[-18,25],[-44,-35],[-18,13],[-18,-17],[-23,-3],[-36,7],[-21,31],[-38,-6],[-48,14],[-102,-11],[-46,15],[-55,-13],[-94,41],[-85,-51],[-13,-19],[6,-32],[-96,-82],[-57,-16],[-64,-1],[-6,-21],[-101,-1],[-111,-56]],[[44323,6005],[-183,-18],[-32,-13]],[[44108,5974],[-88,82],[-87,-13],[-72,23],[-37,-8],[-51,55]],[[43773,6113],[-108,156],[-27,18],[2,70],[13,18]],[[43653,6375],[-68,145],[-42,41]],[[43543,6561],[-6,22],[-53,34],[-57,57],[-36,9]],[[43391,6683],[-85,-9]],[[43306,6674],[-39,104],[-175,-21],[-46,-23]],[[43046,6734],[-34,-55]],[[43012,6679],[-30,2],[-19,-12],[-48,34]],[[42915,6703],[-28,2],[-21,27]],[[42866,6732],[-3,47],[-11,20],[-38,11],[-33,-18],[-98,63],[-30,3],[-29,75],[-93,63]],[[42531,6996],[-13,27],[2,31],[-20,82]],[[42500,7136],[13,50]],[[42513,7186],[-26,61],[-46,21]],[[42441,7268],[-42,-7],[-77,10]],[[42322,7271],[-57,30],[-118,-1],[-48,-39],[-2,65]],[[42097,7326],[-34,17],[-18,27],[32,105]],[[42077,7475],[-14,38],[-1,43]],[[42062,7556],[64,181],[11,134]],[[42137,7871],[19,40],[-4,72],[54,107],[14,7],[54,92],[37,38]],[[42311,8227],[82,138]],[[42393,8365],[35,20],[12,37],[31,21]],[[42471,8443],[2,25],[41,43]],[[42514,8511],[51,130],[29,41],[113,65]],[[42707,8747],[35,47],[3,43]],[[42745,8837],[24,0]],[[42769,8837],[21,25],[22,-2],[7,33]],[[42819,8893],[53,47],[-13,23]],[[42859,8963],[-38,23],[-8,26],[59,518]],[[42872,9530],[15,-2],[45,-47],[55,-23]],[[43051,9175],[8,-13],[48,-11],[4,21]],[[43111,9172],[-51,48],[16,25]],[[43092,9226],[29,-3],[-4,-17]],[[43144,9153],[36,32],[11,-16],[-41,-44]],[[43261,8957],[18,-2],[15,20],[67,27],[46,-43]],[[43450,8937],[60,-5],[8,-17]],[[43786,8892],[9,1],[7,-22],[41,-50],[46,-1],[16,69]],[[43929,8902],[63,-34]],[[43992,8868],[29,-46],[56,14],[37,-17],[3,12],[10,-5],[27,-64],[14,-10],[0,-19],[-15,6],[3,-22],[25,-17]],[[44181,8700],[10,21],[37,20],[55,-11],[79,-33],[41,12]],[[59521,11624],[-16,-4],[-10,41]],[[59495,11661],[-30,20],[-6,-9]],[[59459,11672],[-11,10],[-5,-15],[-12,12]],[[59431,11679],[-42,-5]],[[59389,11674],[-49,69]],[[59340,11743],[-79,48],[-19,23],[-58,20]],[[59184,11834],[-11,39],[-29,5],[-15,30],[-22,-1],[-21,36],[-33,1]],[[59053,11944],[-46,24],[-35,47],[6,16],[-18,13],[-2,16]],[[58958,12060],[-12,0],[-1,10],[-13,-5]],[[58932,12065],[0,15],[-16,1],[-24,34]],[[58892,12115],[-4,49],[7,32],[-11,25],[-50,15],[-26,30]],[[58808,12266],[-1,81],[-7,16]],[[58800,12363],[-28,31],[-70,28],[13,28],[-38,41]],[[58677,12491],[3,16],[-20,43]],[[58660,12550],[8,16],[-1,29]],[[58667,12595],[-50,23]],[[58617,12618],[13,123],[15,24],[-2,34]],[[58643,12799],[-13,-2],[-16,-33]],[[58614,12764],[-36,-4],[-48,64]],[[58530,12824],[-1,27],[-28,24]],[[58501,12875],[-5,43],[-38,34]],[[58458,12952],[-32,71],[14,36],[-7,15],[7,39]],[[58440,13113],[-9,18],[-5,75]],[[58426,13206],[236,312],[87,41],[82,-52],[91,86],[41,58],[163,108]],[[59188,13704],[110,-50],[247,-87],[91,-48],[60,-62],[113,-157]],[[61009,12095],[241,-95]],[[61250,12000],[266,-164]],[[63483,11620],[92,-487]],[[63575,11133],[-1309,-70],[-115,-105]],[[62151,10958],[-77,-126]],[[62074,10832],[-38,-24],[-32,-3]],[[62004,10805],[-81,26]],[[61923,10831],[-99,111],[-54,26],[-205,50]],[[61565,11018],[-100,-18]],[[61465,11000],[-35,12]],[[61430,11012],[-73,48],[-44,-85]],[[61313,10975],[-23,-144],[-49,-47],[-47,-6]],[[61194,10778],[-27,7]],[[61167,10785],[-49,45]],[[61118,10830],[-63,-5],[-141,72]],[[60914,10897],[-60,81],[-70,21],[-72,64],[-165,13],[-29,72]],[[60518,11148],[-35,44],[-40,14]],[[60443,11206],[-103,1],[-16,18],[-7,39],[-32,35],[-30,17],[-70,6],[-2,54],[-22,9],[-5,21],[-16,13],[-34,-14],[11,-60],[-23,-19],[4,-41],[-7,-8]],[[60091,11277],[-30,10]],[[60061,11287],[-4,16],[10,24],[-26,22],[-72,9],[-18,-11],[-30,22],[-8,56],[-11,13],[16,12],[-16,7]],[[59902,11457],[7,36]],[[59909,11493],[-47,12],[1,15]],[[59863,11520],[-18,19]],[[59845,11539],[-8,-10],[-4,9],[-15,-5]],[[59818,11533],[-22,16]],[[59796,11549],[-6,41],[-13,-3]],[[59777,11587],[-9,29]],[[59768,11616],[-12,15],[-14,-6],[-5,18]],[[59737,11643],[-47,2]],[[59690,11645],[-40,-55]],[[59650,11590],[-44,-18],[-32,26],[5,28],[17,11],[3,34]],[[59599,11671],[-30,2],[-35,-24],[-13,-25]],[[56949,346],[24,12],[45,-5]],[[57064,403],[26,23],[-7,97],[7,45]],[[57062,682],[37,69],[9,42]],[[57108,793],[-9,26],[-33,37],[11,16],[82,39]],[[57159,911],[6,-4],[-5,-21]],[[57189,929],[37,22],[16,49]],[[57206,1125],[-16,23]],[[57190,1148],[460,438],[240,247],[298,259],[198,190],[1293,1310],[494,490],[52,49],[17,1],[20,34],[36,13],[19,-14],[-2,-50],[12,-23]],[[60327,4092],[21,-23],[22,-6]],[[60370,4063],[69,47],[91,35],[71,127],[27,29]],[[60628,4301],[23,12],[83,0],[59,15]],[[60793,4328],[213,131]],[[61006,4459],[52,-53],[37,-20]],[[61392,4337],[-34,-334],[-35,-47],[34,-36],[-8,-25],[-21,-10],[12,-20],[1,-28],[11,-12]],[[61352,3825],[-20,-71]],[[61332,3754],[-58,-48]],[[61274,3706],[-232,-351]],[[61042,3355],[3,-11]],[[61045,3344],[-142,-297]],[[60903,3047],[-183,-1811]],[[60720,1236],[-77,-906]],[[60643,330],[-27,-221]],[[60616,109],[-2625,-1],[-956,17],[-6,26],[-21,0],[-16,18],[-20,-3],[-63,44],[27,30]],[[45091,27356],[35,-17],[20,1]],[[45186,27402],[51,28],[1267,110]],[[46592,27693],[14,51]],[[47853,27113],[-50,-56],[-61,-47]],[[47742,27010],[-1,-49],[-24,-19]],[[47717,26942],[-14,-48],[-41,-68],[-4,-18]],[[47658,26808],[-15,-21]],[[47643,26787],[-29,4],[-17,-11]],[[47597,26780],[-26,-38]],[[47571,26742],[-19,-77],[-18,-13],[-11,3],[-51,-17]],[[47472,26638],[-55,-44],[-49,-5]],[[47368,26589],[-4,-27],[-22,-29]],[[47342,26533],[7,-38]],[[47349,26495],[-48,-74],[-42,-42]],[[47259,26379],[-11,-57],[33,-37],[-1,-15]],[[47280,26270],[70,-23],[0,-13],[22,-8]],[[47372,26226],[-5,-49],[5,-44]],[[47372,26133],[-46,-9]],[[47326,26124],[-5,6],[3,9],[-11,7]],[[47313,26146],[0,-9],[-38,-11]],[[47275,26126],[-6,-51],[-17,-6],[-18,19],[-15,-15]],[[47219,26073],[-68,-7],[-28,6]],[[47123,26072],[-15,-12],[-18,-59],[-60,-7],[-82,16],[-20,-42]],[[46928,25968],[-23,-3],[-77,-38]],[[46828,25927],[-16,-23],[-25,-11]],[[46787,25893],[1,-88],[-22,2]],[[46688,25783],[-6,-7],[-5,-43]],[[45803,24672],[-52,-33],[-31,26]],[[45720,24665],[-72,-8]],[[45626,24679],[-69,18],[-31,-4]],[[45526,24693],[-42,-29],[-53,108]],[[45431,24772],[-3,34],[19,43],[-8,46]],[[45439,24895],[-39,44],[-41,10]],[[45359,24949],[-14,-11],[-17,3],[-18,16],[-27,3]],[[45283,24960],[-76,40],[-29,0]],[[45178,25000],[-21,22]],[[45157,25022],[-28,2],[-25,16],[-18,24]],[[45086,25064],[-37,28],[-1,16]],[[45048,25108],[-17,28],[-35,40],[-51,10],[-320,267]],[[44625,25453],[107,160],[30,31],[76,107]],[[44973,25876],[81,121],[34,94],[-5,15],[-52,-3]],[[45284,26526],[2,28],[23,77]],[[45352,26713],[-34,40],[-40,66]],[[45246,26802],[-55,40],[-33,14]],[[45121,26932],[-72,150],[-20,27],[1,14],[21,16],[21,-2]],[[45072,27137],[29,-20],[55,-64],[16,-3],[25,46],[-5,34]],[[45219,27155],[-72,71],[-28,12]],[[45117,27283],[-37,43],[-5,18]],[[51530,22006],[316,398]],[[51846,22404],[282,300]],[[52128,22704],[7,39],[17,26],[19,7],[7,17],[40,12],[27,-8],[23,13],[8,-7],[32,2],[41,-29]],[[52349,22776],[2,-27]],[[52351,22749],[9,-15],[15,-5]],[[52375,22729],[-2,-12],[36,-59]],[[52409,22658],[42,6],[33,19],[18,-6],[37,8]],[[52539,22685],[19,-21],[-1,-22],[11,-15]],[[52568,22627],[46,-30],[24,-3]],[[52638,22594],[14,-30],[20,-3],[20,-43]],[[52692,22518],[60,-18],[4,-15]],[[52756,22485],[19,5],[-11,-23]],[[52764,22467],[18,-5]],[[52782,22462],[11,-25],[24,-11],[12,-21],[26,2],[15,-18],[1,-12]],[[52871,22377],[18,5],[34,-25],[24,-24],[-7,-25],[17,7],[29,-24],[9,-16],[-11,-15],[5,-20],[25,-15]],[[53014,22225],[-1,-22],[10,-16]],[[53023,22187],[24,-16],[3,-19],[32,-3],[-5,-24],[33,-14]],[[53110,22111],[-13,-18],[2,-17]],[[53099,22076],[55,-1]],[[53154,22075],[22,-27],[-1,-14],[30,-34],[33,-3],[15,17],[16,-1]],[[53269,22013],[57,-45],[49,5],[75,-31]],[[53450,21942],[34,8],[15,-5]],[[53499,21945],[22,-43]],[[53521,21902],[45,-35],[12,-22]],[[53578,21845],[21,-12],[20,2],[37,-29],[62,-27],[8,0]],[[53726,21779],[3,17],[-20,16]],[[53709,21812],[-7,17],[4,12]],[[53706,21841],[35,8],[36,-16],[15,2],[15,26]],[[53807,21861],[-8,34],[30,18],[1,-49],[-62,-91],[-57,-43],[-4,-41],[-44,-123],[2,-23],[-27,-45],[5,-15],[-6,-2],[-3,-54],[-12,-365],[-18,-7],[-4,-13],[36,-175],[32,-72],[24,-105],[14,-19],[-3,-35],[50,-241],[68,-53],[26,-57],[47,-66],[-3,-23],[11,-47],[-10,-19],[19,-49]],[[53911,20081],[-43,18],[-61,-24]],[[53685,20051],[-28,16],[-28,2],[-15,-8]],[[53614,20061],[-3,-81],[-74,-34]],[[53489,19585],[-26,4]],[[53418,19119],[25,4],[12,-19]],[[53455,19104],[16,1],[17,-29],[22,-7],[7,-16]],[[53517,19053],[18,-4],[25,-23],[7,-85],[-56,20],[-40,61],[-31,11],[-33,-6],[-29,-17],[-93,-92]],[[53285,18918],[-48,6],[-45,50],[-46,28],[-34,-9],[-31,-43]],[[53081,18950],[-28,-3],[-42,15],[-107,86]],[[52565,19370],[-12,16],[-72,187]],[[52481,19573],[-38,74]],[[52443,19647],[-32,38]],[[52411,19685],[7,2]],[[52418,19687],[-9,44]],[[52409,19731],[-24,35]],[[52385,19766],[-51,12]],[[52334,19778],[-5,13]],[[52329,19791],[-16,-2]],[[52313,19789],[-29,-45]],[[52284,19744],[-20,-2]],[[52264,19742],[-21,9]],[[52243,19751],[-48,52]],[[52195,19803],[-5,-5]],[[52190,19798],[-73,43]],[[52117,19841],[-43,11]],[[52074,19852],[-31,-11]],[[52043,19841],[-42,-1],[-42,-26]],[[51959,19814],[-49,-3]],[[51910,19811],[-36,-28],[-7,-18]],[[51867,19765],[20,-31]],[[51887,19734],[2,-54]],[[51889,19680],[-4,-16],[-23,-10]],[[51862,19654],[-62,26],[-35,32],[-21,36]],[[51744,19748],[-16,81],[-48,53],[-65,52]],[[51518,20001],[25,59],[-32,31],[-119,-12]],[[51392,20079],[-73,-107],[-44,-42],[-26,-10],[-30,24],[-14,23],[-1,20],[25,59],[12,54]],[[51241,20100],[-16,36],[-42,56]],[[51108,20300],[-16,74]],[[51092,20374],[11,27],[-16,47]],[[51087,20448],[3,62],[-8,35]],[[51055,20573],[-62,13],[-11,11],[8,37]],[[50990,20634],[-18,30],[17,88]],[[50980,20775],[-11,3]],[[50969,20778],[9,29],[-13,34],[9,14],[1,31],[28,13],[9,21]],[[51012,20920],[-17,65],[23,20],[8,37]],[[51026,21042],[-7,18],[0,39],[-42,41],[1,31],[30,8]],[[51008,21179],[3,37]],[[51011,21216],[15,10],[-3,23],[-27,39],[4,41]],[[51000,21329],[-21,20]],[[50979,21349],[16,15],[-18,15],[-1,27],[13,16],[7,27],[37,2]],[[51033,21451],[12,58],[18,-1]],[[51063,21508],[293,320],[174,178]],[[10706,3730],[115,55],[27,48],[52,11],[117,76],[37,-3],[57,-56],[16,16],[-25,36],[9,21],[27,6],[39,-31],[73,45],[21,-19],[5,-59],[27,-24],[16,39],[27,-5],[20,15],[-10,76],[14,13],[19,-14],[39,-116],[18,-7],[21,111],[-36,68],[16,43],[20,5],[-5,-54],[29,-11]],[[11491,4015],[36,1],[34,28],[56,10]],[[11617,4054],[-248,728]],[[11369,4782],[301,230]],[[11670,5012],[6,26],[27,14]],[[11703,5052],[13,25],[63,14]],[[11779,5091],[42,30],[19,-15],[28,-61]],[[11868,5045],[33,-17],[24,-42],[17,11]],[[11942,4997],[21,-14],[59,46]],[[12022,5029],[29,3],[3,24]],[[12054,5056],[29,-1],[2,32]],[[12085,5087],[23,45]],[[12108,5132],[50,11]],[[12158,5143],[2,16],[16,1],[305,290],[7,-35],[93,-12]],[[12581,5403],[8,47]],[[12589,5450],[27,44]],[[12616,5494],[54,44]],[[12670,5538],[15,-7]],[[12685,5531],[29,33],[34,-19]],[[12748,5545],[12,8]],[[12760,5553],[18,-35],[42,34]],[[12820,5552],[52,17],[26,-16]],[[12916,5571],[28,-20],[43,41],[15,-24]],[[13869,5830],[71,20],[10,15],[20,-11],[18,16]],[[13959,6036],[-4,25],[13,18]],[[14025,6205],[-29,23],[7,40],[15,26],[33,4]],[[14051,6298],[2,20],[-17,33]],[[14178,6455],[37,80],[27,-34],[2,-22]],[[14244,6479],[37,-12],[24,8]],[[14305,6475],[25,-30],[83,18],[7,36],[20,30]],[[14663,6510],[30,11],[23,-8]],[[14729,6567],[56,29],[23,-1],[52,-37]],[[14971,6690],[-6,-27]],[[14965,6663],[15,-46],[63,-130]],[[15043,6487],[19,-94],[-7,-29],[12,-26]],[[15778,5310],[210,-665],[-214,-70]],[[15774,4575],[-110,-53],[-32,-82],[-38,-33],[-52,-84]],[[15542,4323],[-46,-17],[-37,-36]],[[15459,4270],[-133,-185],[-215,-206],[-155,-66],[-216,-125],[-44,-8],[-114,-79],[-16,-3],[-34,24],[-53,-14],[-40,54],[-100,-7]],[[14339,3655],[-21,27],[2,19],[-32,61]],[[14288,3762],[-72,-23],[-21,-20],[-324,-90],[-218,-88],[-174,-48],[-28,-34],[-33,-8],[-84,-70],[-44,-51],[-6,-26],[-57,-31],[-23,-65],[-34,-32],[-1,-47],[-17,-47],[16,-23],[29,-112],[21,-40],[41,-39],[-27,-25],[-52,2]],[[13180,2845],[-6,-13],[-91,-32]],[[13083,2800],[-28,-32]],[[13055,2768],[-48,-7],[-26,-21],[-30,2]],[[12951,2742],[-231,-95],[-86,-13],[-69,-41],[-37,4],[-58,-41],[-32,1],[-155,-84],[-41,-5],[-73,-59],[-40,-5],[-27,-40],[-49,-3],[-25,-16],[-11,-31]],[[12017,2314],[-28,1],[-81,-34]],[[11908,2281],[-226,-135],[-76,-32]],[[11606,2114],[-24,-30],[-48,-18],[-57,-49]],[[11477,2017],[-140,-144],[-114,454],[-96,336]],[[11127,2663],[-116,290],[-305,777]],[[26999,9807],[91,36],[64,68],[120,65],[147,131],[364,228],[89,41],[21,28],[53,38],[-31,54],[195,81],[99,18],[41,18],[55,39],[95,44],[-4,11],[85,49],[147,281],[-79,33],[-149,-102],[-177,99],[17,15],[7,28],[51,14],[24,27],[35,3],[19,24],[-138,201],[284,161],[97,71],[31,4],[79,62],[97,49],[77,73],[80,54],[36,53],[84,93],[43,86],[133,-128]],[[29476,11929],[38,15],[16,21]],[[29530,11965],[18,-12],[28,3]],[[29592,11946],[-2,-21],[12,-15],[-2,-46],[57,-52]],[[29657,11812],[85,-40],[44,-36],[72,65]],[[29858,11801],[23,3],[43,35],[49,19]],[[30433,12218],[75,35],[122,81]],[[30839,12303],[-97,-98]],[[31190,11088],[-5,-16],[-59,-59],[-61,-95]],[[30891,10607],[-20,-13],[-38,-56]],[[30833,10538],[-39,-88],[-39,-58]],[[30611,10031],[-77,-63],[-72,-77]],[[30444,9846],[-88,-72],[-86,-49],[-35,-35]],[[30130,9612],[-99,-53],[-93,-72],[-79,-44]],[[29117,9161],[-112,-85],[-34,-12],[-57,-47],[-14,0]],[[28900,9017],[-28,-32],[-15,-36]],[[28857,8949],[-55,-56]],[[28802,8893],[-556,290],[-87,-108],[-106,-84]],[[28053,8991],[-154,-90],[-75,-32],[-80,-57],[-89,-47]],[[27655,8765],[-139,-46]],[[27516,8719],[-160,-113]],[[27356,8606],[-36,74],[-35,-4],[-48,70],[26,14],[-15,32],[62,45]],[[27310,8837],[-52,163],[-259,807]],[[40164,21087],[37,81],[25,78]],[[40226,21246],[33,29],[30,54]],[[40289,21329],[42,-23],[47,-15],[9,-5]],[[40387,21286],[24,108],[24,50],[-2,2],[23,71]],[[40456,21517],[20,41],[36,85]],[[40512,21643],[8,0],[-2,7],[18,15]],[[40536,21665],[7,-25],[-4,-80]],[[40539,21560],[110,-51],[76,-118],[-9,-18],[26,-39],[-14,-83]],[[40728,21251],[36,21],[51,15],[31,1]],[[40846,21288],[10,-46],[1,-20]],[[40857,21222],[-4,-35],[-7,-16],[2,-11]],[[40848,21160],[2,-5],[32,-6],[38,-39]],[[40920,21110],[5,-14],[-3,-20],[6,-5],[4,-11]],[[40932,21060],[-18,-63],[-8,1],[-24,-77]],[[40882,20921],[28,-22],[-203,-76]],[[40707,20823],[-61,22],[-31,-30]],[[40615,20815],[-112,-6],[-54,-8],[-2,4]],[[40447,20805],[-14,-7]],[[40433,20798],[10,-13],[3,-7]],[[40446,20778],[-8,-80],[-38,16]],[[40400,20714],[-17,-81],[-5,-65]],[[40378,20568],[-107,9],[-25,12]],[[40246,20589],[-49,-33],[-26,4]],[[40171,20560],[4,10],[-32,35]],[[40143,20605],[5,15],[-3,7],[43,91],[-4,4]],[[40184,20722],[30,50],[-3,3],[49,61]],[[40260,20836],[-20,14]],[[40240,20850],[4,9],[9,15],[-3,4],[7,27]],[[40257,20905],[-12,0],[-1,15]],[[40244,20920],[9,3],[2,5],[20,13]],[[40275,20941],[-7,18],[-31,53],[-10,25],[-10,17]],[[40217,21054],[-8,-2],[-3,13],[-42,22]],[[16673,2766],[-119,146],[-1041,1404]],[[15513,4316],[29,7]],[[15774,4575],[76,18],[219,82]],[[16312,4724],[34,22],[31,2]],[[16523,4805],[14,19],[53,24],[221,-488]],[[17163,4529],[46,49],[70,50],[23,34]],[[17574,4883],[76,55],[13,0]],[[18614,5259],[-27,-38],[-25,-15]],[[18586,5084],[-89,-90],[4,-23],[19,-17]],[[18520,4954],[136,80],[61,69]],[[18886,5217],[932,-1229]],[[19818,3988],[92,-271],[215,-519],[153,-403],[89,-324]],[[20367,2471],[-57,-3]],[[18634,1947],[-21,-14],[-115,-19],[-33,-15]],[[18339,1897],[-36,-43],[-23,-8]],[[18143,1857],[-35,-11],[-30,-27]],[[17984,1792],[-5,-14],[10,-36]],[[18090,1702],[-9,-3],[-6,-27]],[[17956,1291],[-31,-1],[-38,16]],[[17803,1301],[-49,-37],[-32,-43],[-51,-46]],[[17671,1175],[-46,-2],[-40,-27],[-90,-15]],[[17495,1131],[-23,-38],[-122,-54]],[[17350,1039],[-250,639],[-427,1088]],[[44608,3553],[-29,2],[-24,-12]],[[44555,3543],[-7,8],[6,22]],[[44533,3592],[-8,-16],[2,-25],[-24,-43]],[[44458,3522],[-15,-9],[-56,2]],[[44327,3533],[-29,39],[-10,-6],[-13,26],[-20,8]],[[43728,3896],[227,1183]],[[43955,5079],[189,908],[179,18]],[[45981,6166],[14,-64],[33,-2]],[[46028,6100],[88,-73]],[[47310,5227],[43,20]],[[47457,5298],[31,-20]],[[47624,5269],[28,37],[49,6],[7,-13],[36,34],[40,14]],[[47784,5347],[47,-6],[26,17],[-200,-2723]],[[47457,2629],[-20,-12],[-40,7]],[[47338,2685],[-94,55],[-78,66]],[[46881,2738],[-45,12],[-132,68],[-105,24],[-156,67]],[[46443,2909],[-28,6],[-25,-11]],[[46242,2908],[-41,17],[-88,11]],[[45834,3001],[7,23],[-7,19]],[[45525,3114],[-18,15],[-11,36]],[[45404,3282],[-49,-5],[-30,13]],[[45141,3457],[-25,29],[-13,-3]],[[44982,3377],[-8,-26],[-35,42]],[[44939,3393],[-40,77],[3,14]],[[44865,3499],[12,18],[-24,28]],[[44779,3565],[-31,-37],[-27,-1],[-20,14],[-15,34]],[[52963,5027],[1256,813]],[[54219,5840],[447,299],[64,55]],[[54730,6194],[284,157]],[[55014,6351],[-2,-30]],[[55032,6267],[42,-34],[40,-2]],[[55114,6231],[37,32]],[[55240,6185],[25,20]],[[55321,6227],[65,-3],[15,-22]],[[55451,6067],[17,-28],[21,-2]],[[55535,6065],[27,-39]],[[55581,6023],[37,5]],[[55618,6028],[33,21]],[[55651,6049],[19,-35]],[[55688,5845],[59,15]],[[55868,5810],[39,-9]],[[56024,5884],[19,-40]],[[56273,5752],[-3,-40]],[[56270,5712],[14,-29]],[[56578,5712],[42,-3],[-7,-48]],[[56718,4487],[-410,-263]],[[53416,2354],[-720,-499]],[[52696,1855],[-32,44],[-50,-18],[3,22],[-64,-1],[-44,21],[-22,-7],[-15,19],[-29,6],[-60,-2],[-34,42],[-62,7],[-32,25],[-64,-10],[264,1579]],[[52455,3582],[-63,-18],[-76,-3]],[[52316,3561],[-135,-141],[-84,-37],[-78,0],[-34,32],[-129,54],[-113,3]],[[51743,3472],[-27,-9],[-62,-67]],[[51654,3396],[-26,-9],[-62,38]],[[51566,3425],[-27,47],[-53,-23],[-24,6],[-31,52],[-55,33],[-21,65],[-48,67],[-25,11],[-59,-16],[-6,19],[11,31],[-17,24],[-64,-16]],[[51147,3725],[-45,22]],[[51102,3747],[24,15],[1837,1265]],[[47882,5378],[39,-22],[1,-37]],[[48055,5107],[47,-76]],[[48175,4966],[34,32]],[[48541,4939],[14,-27]],[[48586,4957],[30,-13],[51,1],[28,10]],[[48720,4986],[71,-11],[33,8],[8,-12],[47,42]],[[48938,4995],[34,18],[39,-17]],[[49011,4996],[12,-19],[22,41],[64,-24]],[[49109,4994],[-2,13],[8,4],[21,-3]],[[50412,4176],[59,-114],[22,-12]],[[50557,4051],[60,-9],[93,-99],[63,-11]],[[50773,3932],[19,-2012],[-939,-1869]],[[49853,51],[-2355,-14]],[[47657,2635],[206,2732],[19,11]],[[52335,24988],[122,-11],[-8,-100],[0,-2]],[[52449,24875],[53,-40],[4,-6],[2,-6]],[[52508,24823],[9,-2],[7,4],[3,-1]],[[52527,24824],[20,-11],[22,-21]],[[52569,24792],[26,56]],[[52595,24848],[0,12],[-9,27]],[[52586,24887],[22,37]],[[52608,24924],[28,-24],[24,-27]],[[52660,24873],[10,6],[6,8],[6,5],[8,4]],[[52690,24896],[-6,-78],[79,-46],[13,-74]],[[52776,24698],[-15,-13],[-4,-16],[1,-7],[-3,-8],[-10,-19],[-10,-14],[-6,-6],[-10,-16]],[[52719,24599],[-27,28]],[[52692,24627],[-18,-1],[-12,6],[-9,6],[-6,7],[-2,4],[-9,4],[-27,20],[-2,-1],[-3,-5],[-5,1],[-8,8],[-13,6]],[[52578,24682],[4,30]],[[52582,24712],[-3,8],[-4,7],[-11,6],[5,9]],[[52569,24742],[-4,3],[-16,12]],[[52549,24757],[-5,-7],[-3,-9]],[[52541,24741],[-40,31],[-15,8],[5,7],[-41,26]],[[52450,24813],[-2,3]],[[52448,24816],[-22,18],[-55,38],[-51,39]],[[52320,24911],[-8,-3]],[[52312,24908],[-22,12],[-5,3]],[[52285,24923],[0,1],[31,39],[11,17],[8,8]],[[22319,3043],[28,-8],[22,-33],[1450,425],[24,-22],[29,-6],[50,30],[53,3],[83,37],[28,-9],[69,13],[151,113]],[[24306,3586],[577,212]],[[25276,3982],[7,41]],[[25455,4185],[49,62],[64,45]],[[25640,4294],[23,53]],[[25663,4347],[1434,-2484],[49,-13]],[[27146,1850],[25,-21]],[[27171,1829],[13,-52],[-29,-24]],[[27155,1753],[-10,-47],[-17,-11],[2,-57],[-30,-68],[4,-30],[-17,-21],[-7,-49]],[[27080,1470],[-28,-13],[-39,-40]],[[27013,1417],[-41,-11],[-15,-27],[-34,11],[-18,-33],[-21,-9],[-3,-56],[19,-36]],[[26900,1256],[-13,-39],[-18,26]],[[26869,1243],[-32,0],[-56,44],[-28,-23],[-6,-20],[-45,-16],[-25,-27]],[[26677,1201],[-29,7],[-14,-23],[-53,-36]],[[26581,1149],[-31,19],[-62,-35],[-6,-14],[-28,-5],[-37,18]],[[26417,1132],[-44,-2],[-10,20]],[[26363,1150],[11,29],[-5,22],[-30,48],[-13,4]],[[26326,1253],[-28,-25],[-50,13],[4,22],[-19,29],[-31,-5],[-68,62],[-24,6]],[[26110,1355],[-73,0],[-45,-15]],[[25992,1340],[27,-46]],[[26019,1294],[-6,-21],[-52,-45]],[[25961,1228],[-36,15],[-11,-27],[11,-77],[-5,-52],[-41,-54],[-22,-7],[-14,-60],[-21,-21],[9,-27],[-28,3],[-37,-43],[-4,-19],[25,-56],[-27,-58]],[[25760,745],[-26,-18],[22,-158]],[[25756,569],[31,-7],[36,-32],[4,-113],[16,-51],[-4,-53],[-14,-28],[33,-43],[-15,-18],[5,-35]],[[25848,189],[-781,50],[-218,0],[-364,-22],[-221,8],[-320,-22],[-645,1014]],[[23299,1217],[99,144]],[[23398,1361],[18,7]],[[23416,1368],[-13,1]],[[23403,1369],[58,82],[52,46]],[[23513,1497],[97,186]],[[23610,1683],[-61,32],[-41,-27],[-15,37]],[[23493,1725],[-101,-34]],[[23392,1691],[10,-32]],[[23402,1659],[25,2]],[[23427,1661],[8,-18]],[[23435,1643],[-63,-19]],[[23372,1624],[-6,35]],[[23366,1659],[-7,12],[-8,-5]],[[23351,1666],[-22,47]],[[23329,1713],[-59,-9]],[[23270,1704],[10,-9]],[[23280,1695],[6,-45]],[[23286,1650],[-12,-2]],[[23274,1648],[-11,-64]],[[23263,1584],[14,-30],[-32,-27]],[[23245,1527],[-26,27]],[[23219,1554],[0,19],[-18,-4],[-51,-58]],[[23150,1511],[16,-55],[-4,-9],[-16,7]],[[23146,1454],[-570,907],[-357,593],[100,89]],[[20355,7528],[165,70],[155,118]],[[20675,7716],[187,101],[264,191],[487,189],[253,70],[404,65],[411,124],[47,-6],[19,16],[4,-19],[-26,-51],[17,-36]],[[22742,8360],[-39,-23]],[[22703,8337],[-31,-48],[-21,-6],[-62,-65],[-13,11],[-47,-34],[-77,-28]],[[22452,8167],[296,-281],[721,-787]],[[23469,7099],[191,160],[83,-169],[-60,-33],[-40,-39],[-66,-11],[224,-262]],[[23801,6745],[-129,-86]],[[23672,6659],[-139,-135],[-85,-53],[-194,-75]],[[23254,6396],[-94,-11]],[[23160,6385],[151,-464]],[[23311,5921],[-72,-16],[-112,-58],[-34,-1],[-164,-63],[-21,-21],[-78,-23],[-27,-24],[-57,-19],[-446,-70],[-71,-50]],[[22229,5576],[-332,-92]],[[21897,5484],[-146,-79],[-141,-49]],[[21610,5356],[-144,175],[-245,-138],[-48,-14]],[[21173,5379],[-108,5],[-63,55],[-46,78]],[[20956,5517],[-60,41],[-88,51],[-129,28],[-151,-122],[-146,-52],[-87,-81],[-72,-46],[-66,-20],[-85,-74],[-96,-105],[-63,-48],[-34,-57],[-89,-88],[-69,-90],[-1,-22],[-24,-10],[-58,-78],[-58,-33],[-66,6],[-43,23],[-43,-43]],[[19428,4697],[-55,-121]],[[19373,4576],[-699,924]],[[18674,5500],[8,18],[34,24],[22,-7],[58,21],[45,-7],[50,14]],[[18891,5563],[91,44],[40,34],[185,106]],[[19390,5700],[25,18],[2,15]],[[19764,6764],[41,19],[122,95]],[[60530,5107],[283,-280],[68,-103]],[[60881,4724],[125,-265]],[[60793,4328],[-165,-27]],[[60370,4063],[-43,29]],[[57190,1148],[-24,18]],[[57166,1166],[-61,17],[-42,39]],[[57063,1222],[5,56]],[[57068,1278],[-15,39]],[[57053,1317],[-30,17]],[[57023,1334],[-3,17]],[[57020,1351],[47,77]],[[57067,1428],[1,38]],[[57068,1466],[-24,21]],[[57044,1487],[-31,-4]],[[57013,1483],[18,55]],[[57031,1538],[-34,27]],[[56997,1565],[-34,3]],[[56963,1568],[-6,17]],[[56957,1585],[5,6]],[[56962,1591],[2,-17],[9,16],[9,-15]],[[56982,1575],[11,8]],[[56993,1583],[-1,31]],[[56992,1614],[29,13]],[[57021,1627],[-18,21]],[[57003,1648],[21,12]],[[57024,1660],[1,36]],[[57025,1696],[14,-1]],[[57039,1695],[-7,23]],[[57032,1718],[10,-8]],[[57042,1710],[17,16]],[[57059,1726],[7,26]],[[57066,1752],[-30,29]],[[57036,1781],[-9,-12]],[[57027,1769],[-13,9]],[[57014,1778],[-14,-19]],[[57000,1759],[-5,14]],[[56995,1773],[-43,-21]],[[56952,1752],[-2,17]],[[56950,1769],[-16,6]],[[56934,1775],[4,24]],[[56938,1799],[-24,26]],[[56914,1825],[39,7],[-10,10]],[[56943,1842],[35,34]],[[57024,1986],[10,-1],[-2,13],[19,15]],[[57056,2053],[-4,25],[-16,12]],[[57040,2175],[20,10],[4,16],[19,0]],[[57154,2243],[59,48],[-39,73]],[[57184,2462],[22,-2],[8,15]],[[57277,2481],[5,-10],[17,15]],[[57299,2486],[-1,21],[-24,32],[4,12]],[[57388,2702],[14,15],[4,35]],[[57459,3069],[10,6],[-1,26],[22,40]],[[57490,3141],[-9,19],[6,16]],[[57533,3226],[-17,10],[-8,31]],[[57595,3472],[34,10],[20,24]],[[57680,3542],[17,11],[7,-11]],[[57687,3624],[19,21],[10,-8],[32,13],[14,25],[-11,10]],[[57835,3739],[29,55]],[[57797,3896],[29,1],[1,14],[22,3]],[[57852,4070],[1,13],[24,13]],[[57880,4155],[-43,25],[-14,-6]],[[57748,4322],[-14,8],[-41,-19]],[[57640,4418],[-13,15],[4,16]],[[57584,4827],[-28,41],[34,90]],[[57590,4958],[-8,32],[15,39],[-3,34],[626,368]],[[58220,5431],[557,302],[28,-8]],[[58805,5725],[67,38],[5,15]],[[59350,6815],[-36,-318]],[[59463,6136],[262,-288]],[[59725,5848],[516,-479],[289,-262]],[[49070,23125],[-73,29]],[[48973,23434],[-105,197]],[[48714,23900],[-25,51],[-46,24],[-111,3],[-38,16]],[[48463,23982],[8,-25],[-17,-6],[-74,41]],[[48380,23992],[-41,-36]],[[47929,24118],[-52,85]],[[47831,24220],[-39,58]],[[47808,24337],[30,29]],[[47776,24446],[-49,6]],[[47729,24474],[25,29]],[[47755,24535],[-26,12]],[[47711,24607],[-33,5]],[[47651,24644],[4,79]],[[47655,24723],[43,66]],[[47689,24847],[32,26]],[[47655,24914],[-17,54]],[[47638,24968],[24,19]],[[47662,24987],[-42,62]],[[47620,25049],[49,18]],[[47490,25138],[-11,-12]],[[47452,25109],[10,61]],[[47331,25287],[-65,31]],[[47179,25386],[-52,46]],[[47127,25432],[-82,25]],[[47045,25457],[-52,82]],[[46924,25633],[-27,67]],[[46858,25742],[-13,97]],[[46845,25839],[-59,1],[1,53]],[[46787,25893],[41,34]],[[46828,25927],[100,41]],[[47123,26072],[96,1]],[[47275,26126],[38,20]],[[47313,26146],[13,-22]],[[47372,26133],[0,93]],[[47372,26226],[-92,44]],[[47259,26379],[90,116]],[[47342,26533],[26,56]],[[47472,26638],[76,22],[23,82]],[[47597,26780],[46,7]],[[47658,26808],[59,134]],[[47742,27010],[102,89],[34,67]],[[47878,27166],[94,101]],[[47972,27267],[-3,33],[68,61]],[[48037,27361],[63,12]],[[48100,27373],[82,67]],[[48182,27440],[27,55]],[[48209,27495],[2589,-792]],[[50798,26703],[-21,-88],[-17,-9],[-34,-73],[9,-21],[-27,-106],[-125,-252],[-102,-63]],[[50481,26091],[-47,-136],[-35,-289],[-22,-65]],[[50377,25601],[-89,0],[1,-126],[382,-781],[115,-175],[52,-141],[243,-490],[765,-1484]],[[51530,22006],[-467,-498]],[[51033,21451],[-42,-9],[-16,-56],[20,-23],[-16,-14]],[[51000,21329],[-5,-38],[31,-66],[-15,-9]],[[51008,21179],[-30,-6],[-1,-32],[42,-41],[7,-58]],[[51012,20920],[-37,-35],[-6,-107]],[[50969,20778],[-42,-2]],[[50628,20935],[-128,35]],[[50123,20814],[-39,129],[-104,29],[-70,102],[-12,52],[11,49]],[[49740,21528],[-9,125]],[[49405,22105],[-97,107]],[[48945,22792],[74,27]],[[56644,1798],[0,17],[-6,0],[0,7]],[[56638,1822],[11,3],[103,41]],[[56752,1866],[163,0],[40,0],[7,-10]],[[56962,1856],[-9,-9],[-9,-2],[-1,-3]],[[56943,1842],[12,-7],[-4,-6],[-21,-7],[-12,7],[-3,0],[-1,-4]],[[56914,1825],[2,-4],[10,-5],[6,-12],[6,-5]],[[56938,1799],[2,-8],[-1,-6],[-5,-10]],[[56934,1775],[4,-3],[8,1],[4,-4]],[[56950,1769],[1,-4],[-3,-8],[4,-5]],[[56952,1752],[5,0],[2,3],[1,5],[6,0],[2,-4],[3,1],[3,2],[2,8],[5,3],[9,-3],[5,6]],[[56995,1773],[2,-1],[1,-13],[2,0]],[[57000,1759],[12,8],[3,5],[-2,5],[1,1]],[[57014,1778],[3,-5],[5,0],[5,-4]],[[57036,1781],[6,-3],[22,-21],[2,-5]],[[57066,1752],[-1,-6],[-7,-10],[1,-10]],[[57042,1710],[-3,1],[-3,7],[-4,0]],[[57032,1718],[-2,-5],[1,-9],[3,-4],[5,-1],[0,-4]],[[57039,1695],[-3,-2],[-11,3]],[[57025,1696],[-2,-3],[3,-26],[-2,-7]],[[57024,1660],[-2,-1],[-5,4],[-5,-7],[0,-5],[-3,-2],[-5,2],[-1,-3]],[[57003,1648],[1,-3],[9,-1],[8,-10],[0,-7]],[[57021,1627],[-20,-11],[-9,-2]],[[56992,1614],[-1,-3],[2,-4],[3,-3],[-1,-14],[-2,-7]],[[56993,1583],[-8,-6],[0,-2],[-3,0]],[[56982,1575],[-3,4],[-1,8],[-3,3],[-4,-2],[-5,-14],[-3,0],[-1,17]],[[56962,1591],[-3,0],[-2,-6]],[[56957,1585],[2,-13],[4,-4]],[[56963,1568],[11,-5],[6,-1],[8,5],[9,-2]],[[56997,1565],[26,-18],[8,-9]],[[57031,1538],[0,-5],[-6,-29],[-16,-16],[4,-5]],[[57013,1483],[7,-2],[13,6],[11,0]],[[57044,1487],[12,-6],[12,-15]],[[57068,1466],[2,-7],[-3,-31]],[[57067,1428],[-25,-30],[-5,-9],[-17,-38]],[[57020,1351],[0,-12],[3,-5]],[[57023,1334],[15,-11],[8,-1],[7,-5]],[[57053,1317],[-1,-16],[16,-23]],[[57068,1278],[0,-11],[-8,-30],[0,-7],[3,-8]],[[57063,1222],[17,-10],[8,-18]],[[57085,1182],[-131,83],[-113,65]],[[56841,1330],[-25,11],[-32,1],[-41,14]],[[56743,1356],[-41,20],[-25,23],[-33,10]],[[56644,1409],[23,10],[84,49]],[[56751,1468],[-2,13],[14,7],[0,7],[6,7]],[[56753,1533],[-42,-8],[-86,10]],[[56625,1535],[-11,14],[-5,3]],[[56609,1552],[-13,28],[1,12],[-2,12]],[[56617,1656],[-2,15],[-10,19]],[[56585,1746],[7,11],[0,19],[11,11],[-1,11]],[[6142,1501],[90,71],[245,156],[32,35],[137,84]],[[7191,2140],[-6,41],[7,10]],[[7314,2580],[17,2],[60,56]],[[7486,2686],[18,38],[0,27]],[[7583,2806],[26,75],[42,-6],[-19,32],[-24,11]],[[7608,2918],[6,37],[30,44],[26,9],[89,164]],[[7759,3172],[26,18],[37,56]],[[7822,3246],[28,-37],[31,16]],[[7881,3225],[16,-31],[20,-11]],[[7917,3183],[14,27],[59,-4],[21,30],[23,6],[8,-19],[-10,-40],[10,-19],[56,-29],[75,4],[27,-28]],[[8200,3111],[4,-34],[40,-8]],[[8244,3069],[62,39],[75,120],[32,16],[38,55]],[[8451,3299],[22,14],[38,0]],[[8511,3313],[82,70],[27,91]],[[8620,3474],[27,7],[-18,30],[24,23],[-6,34]],[[8647,3568],[22,19],[24,49]],[[8693,3636],[25,16]],[[8718,3652],[3,22],[16,13],[11,32]],[[8748,3719],[34,35],[146,27],[1802,52]],[[10730,3833],[14,-38],[-16,-29]],[[10728,3766],[-29,-10],[0,-13],[428,-1080]],[[11127,2663],[73,-252],[182,-726]],[[11382,1685],[156,-810]],[[11538,875],[119,-265],[-1457,-13],[-172,14],[-719,-13],[-771,-11],[-2714,1]],[[56082,15043],[-12,17],[7,14],[-11,20]],[[56066,15094],[30,8],[-3,40],[17,0],[13,24]],[[56123,15166],[-28,60],[-16,14]],[[56079,15240],[7,42],[-36,19],[9,49],[-17,42],[-55,31],[-32,-14],[-38,19],[-14,29],[-42,-1],[-3,73],[-31,60]],[[55827,15589],[-40,2],[-29,25],[-49,8]],[[55709,15624],[8,36],[35,22],[31,79]],[[55783,15761],[-49,70]],[[55734,15831],[12,80],[-40,122]],[[55706,16033],[1,34]],[[55707,16067],[-32,48],[38,50]],[[55713,16165],[-22,24],[-18,50],[-41,15]],[[55632,16254],[-23,72],[-34,49],[-64,-7],[-30,-23]],[[55481,16345],[-27,4],[-13,20],[-27,13],[-32,3],[-18,18]],[[55364,16403],[-36,-17],[-8,-19]],[[55320,16367],[-25,30],[-16,-10],[-47,16],[-10,49],[29,92],[40,32],[5,29]],[[55296,16605],[-36,58],[-13,1]],[[55247,16664],[-13,59],[-90,37],[-32,56],[-24,5],[-2,23],[17,17]],[[55103,16861],[-14,7],[-15,33],[-96,37]],[[54978,16938],[-4,23]],[[54974,16961],[-11,1],[-25,39]],[[54938,17001],[5,23]],[[54943,17024],[-24,15],[-19,34],[-10,34]],[[54890,17107],[10,17],[50,27],[15,-5]],[[54965,17146],[23,35],[45,20]],[[55033,17201],[11,31],[-2,28]],[[55042,17260],[57,10],[13,15]],[[55112,17285],[-3,39],[13,37],[-21,75],[26,65],[-20,66],[17,24]],[[55124,17591],[20,2],[28,-23]],[[55172,17570],[39,26],[32,-2],[66,-9],[4,-17]],[[55313,17568],[15,7],[12,-11]],[[55340,17564],[27,15],[6,28],[63,21],[-2,74],[-15,-14],[-17,23]],[[55402,17711],[-11,-9],[-6,9],[-25,-4]],[[55360,17707],[9,5]],[[55369,17712],[-7,1],[-15,177]],[[55347,17890],[31,13],[122,105],[69,12]],[[55612,18004],[17,-149]],[[55666,17803],[23,-11],[47,23],[24,43]],[[55760,17858],[-19,119],[17,36],[40,10],[34,-26],[54,-176],[-7,-115]],[[55879,17706],[20,-140]],[[55906,17444],[124,-87]],[[56039,17337],[2,-77],[21,-25],[38,0],[106,31],[36,53]],[[56461,17196],[444,-131]],[[56905,17065],[27,-22],[79,-252],[56,-253]],[[57067,16538],[-21,-89],[11,-74]],[[57057,16375],[67,-113],[0,-30],[-31,-66],[-4,-34],[4,-37],[22,-36],[50,-35],[216,-30],[23,-16],[29,-62]],[[57433,15916],[50,-208]],[[57483,15708],[35,-77],[79,-130],[38,-49],[86,-69],[265,-165],[137,-120],[27,-37],[46,-111],[30,-139],[177,-210]],[[58403,14601],[235,-380],[68,-68]],[[58706,14153],[285,-185]],[[58991,13968],[71,-88]],[[59062,13880],[28,-68],[36,-53]],[[58426,13206],[-37,170],[-35,31]],[[58354,13407],[-9,45],[-35,40],[-34,18]],[[58276,13510],[-27,71],[-65,30],[-82,68],[-21,85],[-4,56],[12,32],[-97,90]],[[57992,13942],[-54,-15],[-53,7],[-46,-18]],[[57839,13916],[-34,3],[-99,50],[-52,9]],[[57654,13978],[-110,-91]],[[57544,13887],[-54,-21],[-78,-54],[-46,-12],[-57,16],[-43,79]],[[57266,13895],[-93,28],[-53,33],[-77,-5],[-28,-16],[-44,-1],[-24,-32]],[[56947,13902],[-45,1],[-43,-31],[-28,-52],[-27,-11],[-2,107],[17,122]],[[56819,14038],[-6,36],[-29,55]],[[56784,14129],[2,184],[-73,15],[-133,-10],[-110,119],[-70,-26],[-12,-28],[-115,31],[-106,84],[7,43],[-19,137],[-94,28],[-35,25],[-1,23],[-47,13],[-15,37],[29,50],[88,2],[52,28],[-16,22],[39,47],[-40,18],[-3,32],[-54,11],[24,29]],[[45946,15984],[211,-235],[102,-55]],[[46259,15694],[161,-24],[181,-110],[753,-392]],[[47354,15168],[-525,-1070]],[[46829,14098],[-222,-427]],[[46607,13671],[-63,-244],[-34,10],[-41,-7],[-50,-13],[-61,-31],[-24,-20],[-27,-45],[-33,-36],[-178,-137]],[[46096,13148],[-86,-90]],[[46010,13058],[-19,-31],[-20,-120],[-13,-45],[-56,-61],[-47,-21],[-137,14]],[[45648,12819],[-32,19],[-17,20],[-108,90]],[[45180,13043],[-67,19],[-61,5],[-71,31],[-78,49],[-35,39],[-31,15],[-17,30],[-16,11]],[[44804,13242],[-34,-1],[-70,25]],[[44700,13266],[-51,-5],[-66,16],[-102,-3]],[[44481,13274],[-15,6],[-25,32]],[[44441,13312],[-38,4],[-95,31]],[[44191,13432],[-35,5],[-47,25]],[[44005,13531],[-47,40],[-37,49],[-30,59]],[[43891,13679],[-59,139],[-38,119],[-23,23],[-31,3]],[[43740,13963],[598,872],[456,703],[507,756]],[[45301,16294],[204,-134],[83,-47],[358,-129]],[[58192,11176],[14,52]],[[58206,11228],[-5,41],[-63,163]],[[58138,11432],[-94,16],[-27,34],[48,118],[-15,57],[-40,22],[-117,-26],[-74,29],[-25,25],[1,39],[32,29],[45,7],[19,20],[-2,21],[-38,19],[-81,-6],[-38,18],[-52,112],[-28,2],[-80,-43],[-134,48],[-18,58],[104,50],[26,53],[-8,44],[-208,233],[-59,5],[-129,-37],[-81,28],[-8,31],[62,136],[-85,144]],[[57034,12718],[4,95],[-10,22]],[[57028,12835],[-34,-7],[-57,-46]],[[56937,12782],[-72,-14],[-171,-13],[-89,19],[-28,35],[-5,104],[-36,68],[-91,-28],[-107,20],[-70,71],[-25,80],[-22,17],[-107,3],[-85,-23],[-9,46],[-110,102],[-40,108],[-35,19],[-11,42]],[[55824,13438],[-120,1],[-63,-30]],[[55641,13409],[-64,76],[-7,16]],[[55570,13501],[78,116]],[[55648,13617],[28,-13],[22,32]],[[55698,13636],[-11,20],[17,46],[-26,53],[-38,-4]],[[55640,13751],[1,35],[-46,-1],[-15,19],[-46,-10]],[[55534,13794],[-21,30]],[[55513,13824],[-20,-15],[-4,28]],[[55489,13837],[-39,16],[2,33]],[[55452,13886],[-25,34],[0,67]],[[55427,13987],[32,31],[31,-10],[54,14],[-4,87]],[[55540,14109],[-58,39]],[[55482,14148],[-15,-15],[-20,6]],[[55447,14139],[-11,-27],[-30,8],[-43,-67],[-23,16],[12,7],[-10,16],[-36,-8],[42,80],[-26,26]],[[55322,14190],[1,25],[-24,31],[6,11]],[[55305,14257],[-46,30],[40,65],[4,24],[-15,1],[14,12],[-2,22],[-17,25],[-59,19],[-14,21],[10,45],[-70,51],[-17,43],[14,55],[22,16],[15,-12],[-6,23]],[[55178,14697],[24,11],[-2,23],[-37,16]],[[55163,14747],[-78,-32],[-2,20],[-61,37]],[[55022,14772],[-48,-44],[-29,3],[-12,21],[16,53]],[[54949,14805],[97,18],[23,32]],[[55069,14855],[-1,52],[-38,15]],[[55030,14922],[-14,-25],[-75,30],[-10,32]],[[54931,14959],[18,18],[8,36]],[[54957,15013],[-59,50],[-1,18],[-8,-26],[-25,3],[6,-42],[-34,14],[2,-17],[-26,4]],[[54812,15017],[5,-27],[-22,28],[14,65]],[[54809,15083],[-17,18]],[[54792,15101],[-44,-7],[1,31],[40,37],[25,-42],[38,32],[-5,19],[-94,66]],[[54753,15237],[13,31],[16,2],[35,162],[-44,141],[18,37]],[[54791,15610],[26,18],[-27,34],[51,81],[30,16],[59,77],[73,11],[69,65],[46,0],[19,-18]],[[55137,15894],[23,16],[136,-16],[132,14],[31,-24],[25,-56],[37,-9],[84,15]],[[55605,15834],[43,41],[71,-7],[64,-107]],[[55709,15624],[118,-35]],[[56079,15240],[44,-74]],[[56066,15094],[16,-51]],[[56784,14129],[35,-91]],[[56947,13902],[34,36],[131,18],[154,-61]],[[57266,13895],[62,-91],[75,3],[141,80]],[[57654,13978],[185,-62]],[[57839,13916],[153,26]],[[58276,13510],[68,-55],[10,-48]],[[58354,13407],[32,-25],[21,-67],[1,-53],[14,-17],[18,-132]],[[58440,13113],[0,-65],[-14,-31],[32,-65]],[[58458,12952],[37,-31],[6,-46]],[[58530,12824],[51,-67],[33,7]],[[58643,12799],[-26,-181]],[[58667,12595],[-7,-45]],[[58660,12550],[17,-59]],[[58800,12363],[8,-97]],[[58808,12266],[86,-61],[-2,-90]],[[58932,12065],[26,-5]],[[58958,12060],[42,-86],[53,-30]],[[59184,11834],[61,-23]],[[59245,11811],[-65,-405]],[[59180,11406],[-13,-12]],[[59167,11394],[15,-86]],[[59182,11308],[-52,-254]],[[59130,11054],[10,-20],[-24,-53]],[[59116,10981],[14,-91]],[[59130,10890],[88,-131]],[[59218,10759],[50,-100]],[[59268,10659],[-1,-21],[30,-22],[-9,-18]],[[59288,10598],[19,-60]],[[59307,10538],[-16,-21],[27,-10],[-12,-52],[-21,-18]],[[59285,10437],[-3,23]],[[59282,10460],[-16,-10]],[[59266,10450],[20,-43]],[[59286,10407],[-27,-6],[11,-16],[-8,-26],[-30,14],[13,-32]],[[59245,10341],[-73,-102]],[[59172,10239],[4,-44]],[[59176,10195],[-51,-26],[-24,55],[-24,10],[-96,-88],[-14,-61],[-36,-4],[-66,38],[-38,-14],[-10,-19],[12,-38],[-7,-45]],[[58822,10003],[-69,-103]],[[58753,9900],[-174,211]],[[58579,10111],[-158,375],[-146,132],[-173,89]],[[58102,10707],[-17,50],[-6,103]],[[58079,10860],[40,35],[11,49],[-23,122],[85,110]],[[42631,23156],[54,142],[42,81]],[[43028,24051],[125,167],[59,96]],[[43212,24314],[21,36],[24,85]],[[43591,24290],[78,116],[50,57]],[[43921,24590],[68,101],[79,92],[25,46]],[[44558,25370],[29,44],[38,39]],[[45048,25108],[0,-15],[38,-29]],[[45086,25064],[10,-19],[32,-21],[29,-2]],[[45178,25000],[31,-1],[74,-39]],[[45359,24949],[25,-12],[13,5],[42,-47]],[[45431,24772],[51,-113],[-38,-62]],[[45114,24035],[74,-48]],[[45170,23323],[-32,-88],[-30,-30],[-48,8]],[[45060,23213],[-50,-34],[-30,-33],[1,-29]],[[44967,23093],[-22,-19],[-32,-9]],[[44552,22400],[-79,-40],[-24,-4]],[[44191,22125],[-40,-35],[56,-67]],[[44201,21995],[-19,-29],[-17,-5]],[[44162,21675],[-31,-21],[-16,-56]],[[44097,21584],[-35,-84],[-21,-33]],[[44041,21467],[-14,-45],[-1,-31]],[[44026,21391],[-42,-59]],[[43984,21332],[7,-42],[-26,-42],[-1,-55],[-63,7],[-15,-23],[1,-14],[-30,-64],[-2,-43],[12,-28]],[[43867,21028],[-43,-18],[-16,-39],[-6,-38]],[[43802,20933],[-15,-24]],[[43787,20909],[-439,91]],[[43348,21000],[-14,-28],[-17,-11]],[[43317,20961],[-56,1],[-55,155],[3,28],[-34,48]],[[43175,21193],[-58,6],[-64,29]],[[43053,21228],[-27,33],[-55,23],[-104,4]],[[42867,21288],[-28,44],[-18,11]],[[42821,21343],[-47,16],[-38,-10],[-11,26],[-93,26],[41,69],[2,30]],[[42675,21500],[-25,32],[-66,48],[-30,40]],[[42554,21620],[-6,38],[22,63],[-22,26],[-27,5],[-75,-54],[-56,6],[-335,189]],[[42055,21893],[51,100],[6,30],[28,37],[46,100]],[[42186,22160],[59,196]],[[42245,22356],[18,113],[30,116]],[[42293,22585],[73,217],[62,114]],[[42428,22916],[35,17],[12,16],[10,23],[113,116]],[[60656,14424],[-68,34],[-28,-23]],[[60476,14369],[3,65]],[[60479,14434],[-29,117],[-50,35]],[[60400,14586],[-168,62]],[[60232,14648],[-26,23],[-18,45],[-27,9]],[[60161,14725],[-18,22],[-5,18],[7,32],[17,56],[30,57]],[[60192,14910],[7,90],[-35,92],[6,70],[-20,92],[-31,87],[-29,38],[-1,56],[-17,27],[-78,48],[-78,12],[-34,23],[-14,33],[-25,29],[-86,43],[-91,6],[-7,-9],[-19,52],[-20,5],[-24,32],[-13,-2],[-38,22],[-30,42],[-30,12],[-15,26],[7,22],[-13,16],[-24,2]],[[59440,15876],[-6,-16],[-22,-8]],[[59509,16110],[0,23],[20,30],[23,66],[24,20]],[[59727,16264],[14,-11],[60,27]],[[60407,16609],[-3,-88],[70,-39],[99,-48],[101,-33],[41,-9],[42,2],[12,9],[71,-33],[193,-263],[43,-39],[26,-47],[72,-55],[105,-117],[188,-84],[265,-73],[165,-72],[467,-296],[139,-78],[87,-70],[82,-122],[60,-47],[35,-5],[24,-167],[490,-2263]],[[61687,13237],[26,54],[-4,55]],[[61658,13508],[-8,23],[9,38]],[[61659,13569],[32,50],[-22,33]],[[61658,13704],[-62,44],[-53,23],[-28,4],[-44,-15]],[[61277,13991],[-54,79],[-5,81]],[[61230,14254],[-11,10],[-81,58]],[[61107,14281],[-62,-33],[-177,-21],[-57,26],[-65,139],[-13,23]],[[32014,1898],[55,42],[316,-124]],[[32385,1816],[-54,-353],[-5,-17]],[[32326,1446],[10,-3],[2,-5],[-1,-11],[6,-5]],[[32343,1422],[12,3],[2,2],[13,0],[1,2],[19,-9]],[[32390,1420],[0,-12],[2,-7],[14,-19],[0,-14],[3,-10]],[[32409,1358],[8,-5],[10,-1],[10,-12],[14,-4],[13,-14],[11,-4]],[[32475,1318],[-2,-13],[5,-3]],[[32478,1302],[-23,-43],[0,-8],[-5,-2]],[[32450,1249],[19,-61],[-34,-15]],[[32435,1173],[0,3],[-2,1],[2,8],[3,0],[1,3],[1,20]],[[32440,1208],[-4,27],[-10,13]],[[32426,1248],[-3,-2],[-11,-12],[-6,-2]],[[32406,1232],[-2,3],[-11,5],[-23,1]],[[32370,1241],[2,8],[14,7]],[[32386,1256],[0,4],[-4,-1],[0,14],[-3,9],[2,3],[-3,10],[4,3],[-1,8],[5,3],[-7,8]],[[32379,1317],[-3,-18],[-4,-4],[0,-14],[3,-15]],[[32375,1266],[-12,-26],[8,-5],[-17,0],[0,-9],[16,-9],[-11,-13],[4,-15],[23,-20],[-31,-19]],[[32355,1150],[-12,-5],[-15,3]],[[32328,1148],[-8,9],[-4,22],[-4,5]],[[32312,1184],[-37,18],[-79,16],[-2,54]],[[32194,1272],[4,5],[9,18],[1,25],[3,8]],[[32211,1328],[-11,16]],[[32200,1344],[-152,55],[-24,5]],[[32024,1404],[-13,38],[-27,17]],[[31984,1459],[-79,0]],[[31905,1459],[-1,17],[-10,18]],[[31894,1494],[-18,15],[-1,12],[-5,8],[-15,17],[-7,19],[-4,7],[-22,21]],[[31822,1593],[3,6],[189,299]],[[12109,618],[18,12],[5,8],[35,21]],[[12167,659],[-2,9],[6,10],[0,9],[-6,20],[6,5]],[[12171,712],[15,-13],[16,-3]],[[12202,696],[9,1],[26,12]],[[12237,709],[9,9],[9,3],[103,62],[9,10],[20,8],[126,86],[37,18],[71,51]],[[12621,956],[15,4],[69,2],[98,-7]],[[12803,955],[-4,44],[153,83],[27,-58],[18,19],[107,-2],[67,45],[-63,85]],[[13108,1171],[40,31],[-15,18],[-46,-1]],[[13087,1219],[-18,29],[13,17],[8,-9],[3,4]],[[13093,1260],[-2,4],[11,9],[-6,6],[20,20],[-3,5]],[[13113,1304],[-23,7],[-25,41],[-8,5]],[[13057,1357],[-7,31],[-13,15],[-2,14]],[[13035,1417],[-9,0],[-3,7],[-14,5],[-39,2],[-4,-2],[-30,7],[-4,-2],[-5,4],[-4,-3],[-6,1]],[[12917,1436],[0,19]],[[12917,1455],[25,-12],[11,1],[9,-5],[25,2],[3,5],[3,-6],[16,0],[1,-4],[10,6],[20,-5]],[[13040,1437],[0,7],[5,4],[-5,8],[-7,34],[-15,7],[7,2],[-5,9],[1,5],[10,-4],[7,-13]],[[13038,1496],[9,3],[6,7]],[[13053,1506],[-6,-11]],[[13047,1495],[7,-16],[5,1],[-2,-7],[5,-6]],[[13062,1467],[16,-3],[7,6]],[[13085,1470],[17,-25],[7,7]],[[13109,1452],[43,-40],[21,-35]],[[13173,1377],[-3,-30]],[[13170,1347],[-13,-9],[-8,-12],[-23,-11],[-10,-9],[3,-6]],[[13119,1300],[10,13]],[[13129,1313],[3,-7],[-3,-6],[16,-23]],[[13145,1277],[7,5],[55,-74],[23,19],[28,-2]],[[13258,1225],[0,-32],[9,-16]],[[13267,1177],[-30,-21],[4,-9]],[[13241,1147],[-10,-3],[2,-4],[-5,-5],[-1,-8],[-19,-18],[-7,-24]],[[13201,1085],[-19,-8],[62,-99],[-41,-22],[-157,-160],[-142,-197]],[[12904,599],[-234,-1],[-412,16],[-12,-4],[-162,0],[13,8],[12,0]],[[13108,1171],[-21,-17],[-8,23]],[[13079,1177],[-4,3],[-17,0]],[[13058,1180],[-5,26]],[[13053,1206],[4,4],[8,-8],[10,12]],[[13075,1214],[33,-43]],[[39662,12646],[-69,44],[6,51]],[[39599,12741],[-50,33],[19,66],[-6,25],[-45,9]],[[39192,12914],[-69,79]],[[38966,13024],[-32,46]],[[38934,13070],[-51,31],[24,68]],[[38855,13630],[30,36],[-20,29],[6,23],[-21,39],[-46,2],[17,34],[-38,6]],[[38763,13813],[-3,25],[-23,-5]],[[38737,13833],[-16,25],[-28,8]],[[38675,13840],[-71,-10]],[[38484,13849],[-47,88]],[[38308,14084],[-22,73]],[[37999,14034],[44,62]],[[38230,14618],[-3,18],[13,24]],[[38217,14828],[-39,24],[-16,49],[10,50],[-50,60]],[[38219,14988],[76,30],[64,44]],[[38471,15134],[69,18],[23,-14],[32,15]],[[38680,15233],[57,9],[68,37]],[[39009,15253],[21,-91],[-3,-51]],[[39074,15010],[73,19],[104,-6],[54,15]],[[39407,14908],[56,72],[32,15],[61,70]],[[40274,15757],[24,45],[-4,24],[62,119]],[[40230,15957],[-3,31],[17,66],[-9,30],[44,34],[35,50]],[[40446,16425],[25,24],[45,92]],[[40516,16541],[117,-1],[14,10]],[[40718,16647],[89,105]],[[40807,16752],[1202,-2688],[44,-101]],[[42129,13794],[-15,-20],[-43,-16]],[[42255,13548],[-4,-21],[-20,-6],[-69,32],[-42,-3],[-11,-41]],[[42109,13509],[11,-46],[-21,-131],[4,-37],[142,-131],[61,-24],[26,3],[13,72],[22,0]],[[42389,13245],[66,10],[-24,-120]],[[42368,12974],[-15,-47],[15,-34]],[[42368,12893],[81,-72],[31,-98],[-23,-37],[-70,-43]],[[42387,12643],[-71,-3],[-34,27]],[[42282,12667],[-38,98],[-70,81]],[[42174,12846],[-52,25],[-71,-2],[-27,-29]],[[41821,12460],[53,-221]],[[40939,12018],[111,-152]],[[40892,11716],[-28,-38],[-8,-39],[26,-75]],[[41012,11448],[14,-55]],[[41026,11393],[-19,-28],[-78,-42]],[[40929,11323],[-8,-59],[25,-91],[-2,-55],[-17,-39],[-50,-19]],[[40877,11060],[-134,30],[-99,78],[-90,-37],[13,33],[-40,43]],[[40447,11202],[-14,26],[-12,-43]],[[40349,11149],[-42,7],[-521,1242],[-34,113],[-62,47],[38,77],[-38,26],[-28,-15]],[[61274,3706],[21,22],[31,17],[6,9]],[[61332,3754],[15,65],[5,6]],[[61508,4545],[12,16],[117,-72]],[[61879,4269],[-31,-3]],[[61848,4266],[28,-211],[12,-44],[104,-93],[-70,-202],[50,-74],[143,-107],[107,-90],[59,-100],[-9,-66],[3,-27],[42,-125]],[[62317,3127],[-11,-40],[10,-108],[-13,-98],[-10,-31]],[[62293,2850],[-10,2],[-7,10],[5,7],[-7,-1]],[[62274,2868],[-20,-11]],[[62254,2857],[-24,1],[-8,-4],[-78,-16],[-16,2],[-64,-12]],[[62064,2828],[-23,-11],[1,-3]],[[62042,2814],[-448,-87]],[[61594,2727],[-22,28],[-75,113]],[[61497,2868],[-1,20]],[[61496,2888],[-14,19],[-20,13]],[[61462,2920],[-6,20],[-26,17],[-8,-12],[-37,8],[-28,85],[70,156],[50,54],[13,2],[-4,13],[42,36],[-41,82],[0,45],[9,24],[-9,20],[-25,16],[-5,24],[-63,8],[7,97]],[[61401,3615],[-25,6],[-159,-2]],[[61217,3619],[2,5],[55,82]],[[51298,11172],[-2,112]],[[51296,11284],[36,2]],[[51332,11286],[58,28],[68,5],[51,-10],[85,-28],[22,6],[26,20],[37,10],[32,19]],[[51711,11336],[33,0],[49,-14],[58,1]],[[51851,11323],[11,19],[27,81]],[[51889,11423],[-80,1]],[[51809,11424],[-7,3],[-8,39],[-5,5]],[[51789,11471],[-32,-7],[-7,-13]],[[51750,11451],[-30,21],[-5,11]],[[51715,11483],[6,27],[36,47],[-22,12],[42,15],[9,-16]],[[51786,11568],[16,9],[16,23]],[[51818,11600],[12,-22],[7,4]],[[51837,11582],[-6,32],[4,75]],[[51835,11689],[135,-118]],[[51970,11571],[14,3],[6,-5],[7,10]],[[51997,11579],[111,-80],[55,76],[96,-99],[81,64]],[[52340,11540],[-50,98],[-8,1]],[[52282,11639],[-2,28],[3,31],[16,55]],[[52299,11753],[-8,11],[61,-6],[41,5],[2,-23],[96,8],[-7,48],[65,11]],[[52549,11807],[1,-7],[33,-7],[50,-32]],[[52633,11761],[-24,-11],[-2,-13]],[[52607,11737],[-1,-27],[29,-31]],[[52635,11679],[-5,-18],[3,-27],[-12,-22]],[[52621,11612],[67,-50]],[[52688,11562],[15,8],[90,6]],[[52793,11576],[46,-23],[0,-36]],[[52839,11517],[27,-55],[5,-39]],[[52871,11423],[-13,-32],[-41,-28],[19,-9],[8,-30],[35,-21],[-27,-57],[104,-32],[38,3],[-8,-33]],[[52986,11184],[8,-11],[-6,-4],[17,-45],[-6,-2],[9,-25],[-4,-2],[5,-15]],[[53009,11080],[46,-8]],[[53055,11072],[-1,-8],[20,-11]],[[53074,11053],[-6,-67],[-44,9]],[[53024,10995],[-5,-18],[-14,-13]],[[53005,10964],[-2,-27],[54,-83]],[[53057,10854],[-40,-21],[-2,4],[-17,-8]],[[52998,10829],[6,-25],[-2,-80]],[[53002,10724],[-58,36],[-64,24]],[[52880,10784],[3,34]],[[52883,10818],[-7,8],[-9,26]],[[52867,10852],[-56,3]],[[52811,10855],[1,-71],[-5,-46]],[[52807,10738],[-11,-38],[-34,-55],[3,-5],[-7,-8],[0,-14]],[[52758,10618],[11,-54],[2,-55],[3,-2]],[[52774,10507],[-10,-151]],[[52764,10356],[9,-42],[7,-6],[-4,0],[3,-21],[13,-66],[8,-22],[0,-9]],[[52800,10190],[-6,18]],[[52794,10208],[9,-79],[-12,-59],[-16,6]],[[52775,10076],[-129,117],[-61,28]],[[52585,10221],[-53,-3]],[[52532,10218],[0,6],[-81,43]],[[52451,10267],[-6,-17],[-15,-5]],[[52430,10245],[-44,21]],[[52386,10266],[2,-6],[-49,-26],[-9,-13]],[[52330,10221],[-16,8],[-26,-14]],[[52288,10215],[-12,5],[-2,15],[-12,9]],[[52262,10244],[-5,-11],[-13,-3],[-9,-18],[-11,0],[-17,-25],[-10,-6]],[[52197,10181],[-31,43],[-11,-2]],[[52155,10222],[-1,32],[-40,24]],[[52114,10278],[-1,-8],[-11,-7]],[[52102,10263],[-56,42],[-33,40]],[[52013,10345],[-19,39],[-8,27],[5,22],[-19,17],[-66,209]],[[51906,10659],[5,26],[-19,17],[-14,48]],[[51878,10750],[-7,67],[10,25],[-6,1],[-5,13],[-3,163]],[[51867,11019],[-142,-43],[-61,145],[-21,17]],[[51643,11138],[-31,-35],[-77,-52]],[[51535,11051],[-91,-29]],[[51444,11022],[-87,14],[-27,-4]],[[51330,11032],[-38,16]],[[51292,11048],[-10,45],[-10,17],[-3,25],[-14,28]],[[51255,11163],[5,2],[38,7]],[[6724,3919],[16,31],[51,18],[22,26],[-79,93],[64,90],[20,8],[2,21],[80,106],[-39,141],[20,87],[36,56],[-21,-4],[-27,39],[-39,11],[-13,65],[-22,9],[-10,36],[21,15],[-7,42],[18,52],[41,25],[19,-21],[29,5],[4,35],[24,37],[32,-19],[39,2],[35,37],[32,2],[19,46],[41,32],[10,39],[-14,38],[16,51],[30,6],[22,-25],[22,23],[24,-2],[2,16],[30,-24],[21,19],[60,3],[49,25],[36,-45],[43,36],[48,-10],[48,91],[45,-3],[46,82],[58,46],[59,-12],[18,-33],[21,14],[43,204],[78,19],[65,-25],[29,31],[-7,100],[9,43],[-5,45],[-24,37],[-9,86],[26,28],[47,4],[12,17],[-10,32],[-43,50],[1,56],[-19,22],[25,33],[3,69],[-15,26],[12,25],[-35,70],[-4,32],[45,67],[28,18],[24,-6],[89,67],[142,64],[42,37],[52,-23],[76,78],[92,31],[29,72],[26,8],[26,-19],[37,31],[79,16],[108,134],[75,41],[44,42],[76,34],[38,38],[6,29],[149,84],[175,136]],[[9463,7360],[65,-865],[19,0],[399,-685],[-15,-16],[30,-16],[18,-50]],[[9979,5728],[-19,-76]],[[9960,5652],[18,-46]],[[9978,5606],[73,-52]],[[10051,5554],[56,-64]],[[10107,5490],[-2,-104]],[[10105,5386],[-13,-9]],[[10092,5377],[41,-27],[60,1]],[[10193,5351],[532,-403],[22,7]],[[10747,4955],[48,-46]],[[10795,4909],[26,1],[35,-30]],[[10856,4880],[84,11]],[[10940,4891],[-11,-58]],[[10929,4833],[19,-9]],[[10948,4824],[45,15]],[[10993,4839],[61,-72]],[[11054,4767],[-3,-20],[17,-33]],[[11068,4714],[-14,-28]],[[11054,4686],[19,-20],[-7,-4],[15,-21]],[[11081,4641],[-1,-27],[38,22]],[[11118,4636],[16,-16]],[[11134,4620],[70,25]],[[11204,4645],[165,137]],[[11617,4054],[-126,-39]],[[10706,3730],[-7,25],[29,11]],[[10728,3766],[17,32],[-15,35]],[[8748,3719],[-30,-67]],[[8693,3636],[-46,-68]],[[8620,3474],[-25,-89],[-84,-72]],[[8511,3313],[-60,-14]],[[8244,3069],[-31,1],[-13,41]],[[7917,3183],[-36,42]],[[7822,3246],[-63,-74]],[[7608,2918],[36,-23],[4,-25],[-561,546],[-30,9]],[[8650,4177],[-1,-42],[33,22],[-19,-58]],[[8663,4099],[42,-100]],[[8705,3999],[57,45],[-3,22]],[[8759,4066],[159,3]],[[8918,4069],[28,-17],[22,81],[-44,1],[32,12],[-34,20],[-19,-8]],[[8903,4158],[7,36]],[[8910,4194],[-25,70]],[[8885,4264],[2,38]],[[8887,4302],[33,25]],[[8920,4327],[-6,14],[12,14],[46,19]],[[8972,4374],[118,21]],[[9090,4395],[61,-14]],[[9151,4381],[-11,64]],[[9140,4445],[23,30]],[[9163,4475],[-78,-13]],[[9085,4462],[60,48]],[[9145,4510],[23,52]],[[9168,4562],[-37,54]],[[9131,4616],[-36,26]],[[9095,4642],[17,-22]],[[9112,4620],[-11,-16]],[[9101,4604],[-37,28]],[[9064,4632],[-10,28]],[[9054,4660],[-23,-10]],[[9031,4650],[-23,-89]],[[9008,4561],[-27,-29]],[[8981,4532],[-34,32]],[[8947,4564],[20,-5]],[[8967,4559],[14,44]],[[8981,4603],[-35,21]],[[8946,4624],[-27,-18]],[[8919,4606],[-46,2]],[[8873,4608],[12,-21]],[[8885,4587],[-48,-23]],[[8837,4564],[-49,14]],[[8788,4578],[-30,-66]],[[8758,4512],[-72,-97]],[[8686,4415],[5,-34]],[[8691,4381],[-62,-36]],[[8629,4345],[0,-22],[-15,3]],[[8614,4326],[-8,-70]],[[8606,4256],[-63,-27]],[[8543,4229],[11,-29]],[[8554,4200],[11,2],[85,-25]],[[54225,9099],[35,87],[5,39],[-16,82],[-30,45]],[[54219,9352],[11,7]],[[54230,9359],[0,12],[-18,33],[-30,7]],[[54182,9411],[26,20],[-5,10],[6,24]],[[54209,9465],[20,8]],[[54229,9473],[-2,21],[21,-2],[11,-18]],[[54259,9474],[-19,-3],[6,-20],[22,0],[11,-22]],[[54279,9429],[25,-4],[11,-12]],[[54315,9413],[-2,-12],[27,-24],[7,-30],[19,22]],[[54366,9369],[0,-16],[23,9]],[[54389,9362],[11,-9],[0,-13]],[[54400,9340],[30,-13],[1,21]],[[54431,9348],[80,44],[-23,10]],[[54488,9402],[22,44],[5,36]],[[54515,9482],[-45,21],[-10,35],[7,18],[-48,56],[34,31]],[[54453,9643],[376,917],[5,-22]],[[54834,10538],[47,-16]],[[54881,10522],[12,-71],[25,10]],[[54918,10461],[28,42]],[[54946,10503],[48,6],[1,-26]],[[54995,10483],[-17,-18]],[[54978,10465],[-16,-62],[7,-14],[25,-8]],[[54994,10381],[63,31],[25,-18]],[[55082,10394],[47,6],[6,-32]],[[55135,10368],[-18,-32],[11,-23],[88,35],[19,-9],[20,9],[23,-41]],[[55278,10307],[11,-43],[-5,-3]],[[55284,10261],[29,-27],[13,2],[8,-38],[-14,-23],[11,-17],[16,0],[5,-19],[6,10],[44,-10],[32,-47],[41,-13],[-4,-29]],[[55471,10050],[24,-17],[-1,-12],[21,-21],[15,8],[39,-4],[9,10]],[[55578,10014],[21,-2]],[[55599,10012],[-6,-10],[5,-7]],[[55598,9995],[47,2],[6,8],[13,-7]],[[55664,9998],[17,14]],[[55681,10012],[4,-9],[22,0],[0,-10]],[[55707,9993],[26,4]],[[55733,9997],[9,-6],[2,-17],[21,-15]],[[55765,9959],[7,7],[28,-15],[7,8]],[[55807,9959],[14,-16],[-3,-21]],[[55818,9922],[-6,6],[-6,-10]],[[55806,9918],[8,-26],[11,2],[-7,-9],[7,-11],[14,3]],[[55839,9877],[0,13],[15,14]],[[55854,9904],[12,4],[12,-15],[0,17]],[[55878,9910],[10,-8],[18,8],[12,-11]],[[55918,9899],[5,12],[25,-32],[10,8],[53,-11],[13,-26]],[[56024,9850],[11,0],[-3,12],[24,18]],[[56056,9880],[26,-25],[-3,23],[12,-14],[11,10],[24,-68],[-4,-20],[19,2],[-24,-12],[10,-26],[56,-40],[30,13],[11,26],[10,-23],[35,-21],[71,50],[58,-37],[21,1]],[[56419,9719],[18,10],[9,18],[15,4]],[[56461,9751],[6,27],[11,6]],[[56478,9784],[15,-15],[72,-13],[17,-18],[1,-16],[-27,-56],[33,-41],[125,-34],[46,27],[39,45],[26,-1]],[[56825,9662],[29,-50],[3,-47],[-70,-78]],[[56787,9487],[-7,-34],[11,-79]],[[56791,9374],[33,-3],[65,48]],[[56889,9419],[14,39],[3,53]],[[56906,9511],[31,36],[91,-46]],[[57028,9501],[49,46],[15,52],[19,14],[17,-6],[6,-23],[-18,-114],[-16,-19],[-77,-19]],[[57023,9432],[-12,-20],[-1,-21]],[[57010,9391],[31,-32]],[[57041,9359],[143,-80]],[[57184,9279],[4,-18],[-28,-42],[-72,-52],[-52,-142],[21,-29]],[[57057,8996],[31,-15],[14,4]],[[57102,8985],[22,19],[50,93]],[[57174,9097],[26,20],[44,14]],[[57244,9131],[54,72],[65,7],[30,-64],[-59,-137],[3,-27],[46,-30],[9,-38],[-25,-104],[16,-142],[-5,-31],[-40,-87],[14,-55],[54,-72],[3,-23],[-10,-29],[-68,-72],[-19,-126],[9,-50]],[[57321,8123],[75,-148],[-13,-25]],[[57383,7950],[-79,-64],[-19,-45],[27,-256]],[[57312,7585],[-183,1],[-104,14]],[[57025,7600],[-162,62]],[[56863,7662],[-104,82],[-143,74]],[[56616,7818],[-73,68],[-144,310]],[[56399,8196],[-12,86],[22,87],[-7,31],[-43,51],[-49,29],[-67,20],[-194,-121],[-309,-275],[-39,12],[-47,38],[-50,382],[-5,26],[-18,24],[-79,-12]],[[55502,8574],[-232,-101],[-91,9]],[[55179,8482],[-436,86],[-303,89],[-44,-16],[-71,-72]],[[54325,8569],[-66,-25],[-55,-5],[-95,57]],[[54109,8596],[-67,75]],[[54042,8671],[-8,65]],[[54034,8736],[31,115],[28,79],[132,169]],[[54301,12898],[84,141],[-44,43]],[[54341,13082],[15,34],[-9,44],[-19,26],[-32,-14],[-27,14]],[[54269,13186],[15,22],[-22,23],[-26,0],[-20,-44]],[[54216,13187],[11,-21],[-27,-29],[38,-12],[1,-21],[-24,-21],[35,-17],[18,-41]],[[54268,13025],[-44,-33],[-92,49]],[[54132,13041],[-26,66],[-55,44],[-41,-34],[-47,-75],[-66,18],[-37,-12],[-10,62],[-32,52],[1,61],[31,53],[0,57],[-104,-51]],[[53746,13282],[-141,-20],[15,35]],[[53620,13297],[0,76],[72,5]],[[53692,13378],[40,-30],[29,31]],[[53761,13379],[23,79],[-22,44],[-109,-26]],[[53653,13476],[-42,26],[-76,-24],[-31,17],[-32,103],[50,42]],[[53522,13640],[69,-6]],[[53591,13634],[18,34],[-65,90]],[[53544,13758],[12,16],[-13,27],[6,69]],[[53549,13870],[-23,45],[-113,-34]],[[53413,13881],[-3,32]],[[53410,13913],[463,490]],[[53873,14403],[20,79]],[[53893,14482],[76,11],[144,217]],[[54113,14710],[101,95],[27,84],[-12,68]],[[54229,14957],[47,151],[-22,52],[35,59],[47,4],[42,-30],[22,-40],[-1,-43],[15,-14],[28,45],[17,-5],[13,19],[69,-31],[5,-50],[-45,-63],[63,-59],[37,16],[-6,17],[-32,-1],[20,29],[12,-9],[-1,18],[37,-10]],[[54631,15012],[18,-31],[56,39]],[[54705,15020],[35,0],[13,-26]],[[54753,14994],[35,30],[31,-33],[-7,26]],[[54957,15013],[-26,-54]],[[55030,14922],[34,-10],[8,-20],[-3,-37]],[[54949,14805],[-9,-69],[33,-9],[49,45]],[[55163,14747],[39,-20],[-4,-24],[-20,-6]],[[55305,14257],[17,-67]],[[55447,14139],[35,9]],[[55540,14109],[5,-85],[-102,-14],[-16,-23]],[[55427,13987],[-2,-51],[27,-50]],[[55452,13886],[1,-38],[36,-11]],[[55489,13837],[1,-26],[23,13]],[[55534,13794],[95,-2],[16,-13],[-5,-28]],[[55698,13636],[-14,-22],[-15,-11],[-21,14]],[[55570,13501],[55,-81],[16,-11]],[[55641,13409],[101,34],[82,-5]],[[56937,12782],[91,53]],[[57028,12835],[6,-117]],[[58138,11432],[68,-204]],[[58192,11176],[-84,-100],[18,-163],[-47,-53]],[[58079,10860],[-33,26],[-84,123],[-101,216],[-38,22]],[[57823,11247],[-37,-17],[-42,-110]],[[57744,11120],[-211,-200]],[[57533,10920],[-58,2],[-111,70],[-9,21],[11,56],[98,118]],[[57464,11187],[96,266],[-2,44]],[[57558,11497],[-19,36],[-104,36],[-67,-24],[-51,-41],[20,-84],[58,-116],[-2,-38],[-20,-26]],[[57373,11240],[-152,-68]],[[57221,11172],[-58,5],[-42,45],[22,87],[0,87]],[[57143,11396],[-49,37],[-81,4],[-162,-73],[-42,-38],[-4,-169],[-26,-95],[-56,0]],[[56723,11062],[-178,61],[-19,30]],[[56526,11153],[5,22],[148,101]],[[56679,11276],[26,97],[-17,91]],[[56688,11464],[-81,154]],[[56607,11618],[-79,1]],[[56528,11619],[-149,-67]],[[56379,11552],[13,-32]],[[56392,11520],[88,-42],[9,-35]],[[56489,11443],[-20,-51]],[[56469,11392],[-82,-9]],[[56387,11383],[-62,-32],[-140,45],[-79,93],[58,86]],[[56164,11575],[-1,20]],[[56163,11595],[-142,20]],[[56021,11615],[-102,113]],[[55919,11728],[-160,91],[-19,-12]],[[55740,11807],[-7,-48],[-20,-17],[-43,-8],[-47,19],[-67,74]],[[55556,11827],[-9,42]],[[55547,11869],[19,113]],[[55566,11982],[-60,-18],[-72,81],[-99,-4]],[[55335,12041],[-70,55],[-30,81]],[[55235,12177],[126,7]],[[55361,12184],[-29,62],[73,128],[10,54],[-21,56],[-79,-41]],[[55315,12443],[-109,27],[-33,51]],[[55173,12521],[-42,-17],[13,28]],[[55144,12532],[-26,11],[-5,39],[-33,30],[-13,-11],[21,-93],[-15,-22],[-37,3],[-18,50],[-12,-34],[-41,5],[-15,26],[-8,-48],[-30,-41]],[[54912,12447],[-152,-30],[-39,52],[-12,52]],[[54709,12521],[27,8],[54,70],[-22,24],[17,41]],[[54785,12664],[-15,79],[-30,-5]],[[54740,12738],[-43,45],[-57,-8],[-20,-33],[11,-48],[-11,-40]],[[54620,12654],[-25,-18],[-55,-1],[-9,42],[36,28]],[[54567,12705],[-11,32],[-35,30]],[[54521,12767],[-177,-41],[-50,13],[-9,21]],[[54285,12760],[21,4],[22,38]],[[54328,12802],[-57,78],[30,18]],[[8606,4256],[-2,12],[7,3],[0,5],[-5,-1],[-1,29],[9,22]],[[8629,4345],[9,1],[19,8],[11,3],[23,24]],[[8691,4381],[3,9],[-7,11],[-1,14]],[[8686,4415],[25,37],[-1,9],[10,13],[5,5],[10,5],[10,9],[13,19]],[[8758,4512],[5,9],[10,34],[15,23]],[[8788,4578],[26,-11],[23,-3]],[[8837,4564],[23,15],[25,8]],[[8873,4608],[30,-4],[4,6],[1,-4],[11,0]],[[8919,4606],[4,7],[13,11],[10,0]],[[8946,4624],[1,-6],[5,-3],[22,-4],[7,-8]],[[8981,4603],[1,-3],[-2,-10],[-13,-31]],[[8967,4559],[-3,-1],[-12,10],[-5,-4]],[[8947,4564],[2,-8],[32,-24]],[[9008,4561],[10,26],[5,27],[-2,0],[3,13],[3,2],[4,21]],[[9054,4660],[4,-6],[-3,-7],[3,-3],[0,-2],[6,-10]],[[9064,4632],[16,-2],[3,-3],[-1,-4],[5,-2],[-5,-5],[19,-12]],[[9112,4620],[-11,0],[-6,12],[-3,4],[3,6]],[[9131,4616],[32,-52],[5,-2]],[[9168,4562],[-15,-39],[-8,-13]],[[9145,4510],[-23,-14],[-21,-15],[-16,-19]],[[9085,4462],[3,-3],[8,8],[25,-1],[42,9]],[[9163,4475],[1,-9],[-24,-21]],[[9140,4445],[16,-56],[-5,-8]],[[9151,4381],[-42,11],[-19,3]],[[9090,4395],[-3,-1],[1,-5],[-116,-15]],[[8920,4327],[-20,-6],[-13,-19]],[[8887,4302],[-3,-26],[1,-12]],[[8885,4264],[7,-25],[15,-32],[3,-13]],[[8910,4194],[1,-21],[-8,-15]],[[8918,4069],[-53,-3],[-78,-2],[0,2],[-28,0]],[[8705,3999],[-26,45],[-16,55]],[[8650,4177],[-9,6],[-32,2],[0,4],[-32,17],[-23,-6]],[[8543,4229],[45,19],[18,8]],[[49191,17383],[66,19],[14,-25],[-1,-30]],[[49688,17072],[34,-87],[-4,-24],[-15,-14]],[[50416,16364],[41,-60],[69,8]],[[50526,16312],[-925,-3101]],[[49601,13211],[-299,265]],[[49302,13476],[-477,88],[-94,84],[-132,414],[-275,450],[-336,120],[-245,397]],[[47743,15029],[-326,125],[-63,14]],[[46259,15694],[-104,56],[-209,234]],[[45946,15984],[-391,145],[-254,165]],[[45301,16294],[441,639]],[[46132,17703],[176,-60]],[[46366,17672],[75,-4],[66,75]],[[46760,17763],[144,18],[41,51]],[[47487,17733],[34,-2],[34,14]],[[47797,17781],[26,-15],[21,5],[26,-7]],[[47997,17609],[21,-36],[35,-19],[28,2],[14,15],[19,-9]],[[48152,17587],[56,-42],[41,-14],[20,-2]],[[48442,17491],[90,5],[29,28],[36,12],[16,-12]],[[54732,26188],[140,-34]],[[54872,26154],[1,1]],[[54873,26155],[1,-1],[54,-56],[6,-5],[37,-39],[12,-12],[43,-46],[25,-22],[12,-16]],[[55063,25958],[-1,-25]],[[55062,25933],[-11,1],[-4,0],[-7,-2],[-11,-6],[-13,0],[-3,-3]],[[55013,25923],[-3,2],[-9,11],[-11,8]],[[54990,25944],[-1,-1],[8,-8],[0,-2]],[[54997,25933],[-5,1],[-2,-4],[-1,1],[-125,60],[-48,10]],[[54816,26001],[-3,-3],[-72,-6],[-16,-7]],[[54725,25985],[-28,66],[-7,13],[-2,7],[-2,3]],[[54686,26074],[1,1],[45,113]],[[26315,6982],[-71,59]],[[26631,7248],[34,65]],[[26582,7407],[-233,-56]],[[26071,7138],[-32,13],[-54,72],[-57,146]],[[25888,7760],[11,36],[-7,32]],[[25892,7828],[63,42]],[[25955,7870],[121,37]],[[26076,7907],[112,56],[349,94]],[[26537,8057],[249,109],[110,76]],[[26896,8242],[72,34],[356,308],[192,135]],[[27655,8765],[398,226]],[[28802,8893],[29,-360]],[[29303,7789],[70,-52],[-2,-13],[23,-20],[19,-4]],[[29413,7700],[-2,-10],[-12,4]],[[29524,6585],[-14,-219]],[[29510,6366],[-295,-144],[-596,-240],[-521,-577],[1,-36],[-18,-21],[-131,-19],[-41,21],[-67,-39],[-37,18],[-58,-64],[2,-31],[-21,7],[-45,-29],[-22,2],[-50,37],[-39,57],[-51,44],[-19,-27],[-8,-44]],[[27494,5281],[49,-65],[-5,-50],[-6,-25],[-39,-17],[-51,16],[0,83],[-31,46],[-34,16],[-47,-3],[-2,-49]],[[27328,5233],[-32,-40],[-23,-4]],[[27273,5189],[-14,22]],[[27259,5211],[-10,108],[-17,23],[-30,2],[-16,-48]],[[27186,5296],[19,-50],[-98,-17]],[[27107,5229],[10,-88],[-43,-39]],[[27074,5102],[-36,36],[-23,3],[17,-86],[-4,-29],[-42,7],[-38,50],[-39,13],[9,-124],[-68,-11]],[[26850,4961],[6,-62],[-23,16]],[[26833,4915],[-23,70],[-52,33],[-29,62]],[[26729,5080],[-9,64],[-58,85],[-23,6],[-27,-13],[-8,-18],[11,-20],[27,-11]],[[26642,5173],[8,-21],[0,-19],[-31,-62]],[[26619,5071],[-44,-17],[-45,-64],[-20,10]],[[26510,5000],[-48,-16],[-15,-37]],[[26447,4947],[-24,-13],[-100,282]],[[26263,5668],[62,-10],[48,-55]],[[26373,5603],[9,-52],[40,3],[11,57]],[[26433,5611],[-5,44],[-24,21]],[[26366,5734],[35,24]],[[26276,6020],[-39,-82],[-20,-4],[-9,26],[-53,19]],[[26155,5979],[-37,122]],[[26118,6101],[15,9]],[[26133,6110],[-2,32]],[[26131,6142],[54,6]],[[26185,6148],[0,-14]],[[26185,6134],[134,78]],[[26319,6212],[-20,51],[14,23]],[[26313,6286],[40,4]],[[26353,6290],[-20,19]],[[26333,6309],[33,20],[-9,23],[-17,0],[5,11],[-18,9],[19,7],[0,13]],[[26346,6392],[-23,2]],[[26323,6394],[5,17]],[[26328,6411],[40,10]],[[26368,6421],[68,-8]],[[26436,6413],[8,-20]],[[26444,6393],[-7,-49]],[[26437,6344],[17,0],[0,60]],[[26454,6404],[17,7]],[[26471,6411],[10,-30]],[[26481,6381],[36,-18]],[[26517,6363],[15,-30]],[[26532,6333],[11,11]],[[26543,6344],[8,41]],[[26551,6385],[-33,33]],[[26518,6418],[4,10]],[[26522,6428],[62,21]],[[26584,6449],[-9,38]],[[26575,6487],[17,6],[4,-9]],[[26596,6484],[25,17]],[[26621,6501],[10,-15]],[[26631,6486],[-5,49]],[[26626,6535],[54,15],[-14,29]],[[26666,6579],[6,11]],[[26672,6590],[24,3]],[[26696,6593],[39,32]],[[26735,6625],[-28,29]],[[26707,6654],[5,96]],[[26712,6750],[-77,-10],[0,45]],[[26635,6785],[-52,-30]],[[26583,6755],[-15,-131]],[[26568,6624],[-24,-40]],[[26544,6584],[14,37]],[[26569,6719],[-33,116]],[[26498,6861],[-106,-28],[-26,15],[-13,55],[-38,79]],[[51851,19660],[11,-6]],[[51862,19654],[5,1],[8,2],[11,9],[3,14]],[[51889,19680],[0,19],[-2,35]],[[51887,19734],[-15,19],[-5,12]],[[51867,19765],[3,11],[7,12],[33,23]],[[51959,19814],[26,13],[8,8],[11,6],[23,-2],[16,2]],[[52043,19841],[10,8],[21,3]],[[52074,19852],[3,-3],[3,1],[9,-5],[4,1],[24,-5]],[[52117,19841],[48,-26],[25,-17]],[[52195,19803],[7,-10],[41,-42]],[[52243,19751],[12,-7],[9,-2]],[[52264,19742],[13,0],[7,2]],[[52284,19744],[7,7],[3,11],[7,14],[9,6],[3,7]],[[52313,19789],[7,3],[9,-1]],[[52329,19791],[3,-11],[2,-2]],[[52334,19778],[18,-3],[5,-4],[16,0],[12,-5]],[[52409,19731],[3,-13],[-1,-2],[4,-14],[3,-15]],[[52411,19685],[7,-5],[25,-33]],[[52443,19647],[9,-17],[10,-29],[19,-28]],[[52481,19573],[16,-44],[4,-4],[9,-25],[6,-25],[16,-45],[21,-43]],[[52553,19387],[-12,-5],[2,-8],[-13,-3]],[[52530,19371],[-3,6],[-13,9]],[[52507,19304],[6,-10],[11,-15]],[[52524,19279],[-13,-11],[-48,-31]],[[52463,19237],[-24,54],[-4,21]],[[52435,19312],[-9,1],[-26,12],[-1,9]],[[52384,19334],[-32,-72],[-21,-34]],[[52331,19228],[-77,27],[1,3]],[[52156,19334],[-2,9],[-1,19]],[[52153,19362],[-13,-2],[-7,9],[-6,1]],[[52127,19370],[-3,-2],[0,-13],[-4,-6],[-2,-12]],[[52118,19337],[-7,-5],[-5,0],[-4,-4],[-7,-2]],[[52095,19326],[-5,1],[-11,10],[-18,0],[-22,5]],[[52039,19342],[-11,-1],[-21,-5]],[[52043,19471],[-14,12],[-17,7],[-9,8],[-4,1]],[[51992,19517],[-27,-13],[-1,4],[-2,0]],[[51962,19508],[-6,16],[1,4],[-2,3]],[[51955,19531],[8,10],[8,18]],[[51971,19559],[7,28],[3,33]],[[51981,19620],[-13,1],[1,9],[-28,3],[-23,-1],[-12,3],[-20,3],[-29,14],[-26,1],[3,3],[12,0],[5,4]],[[58521,8150],[7,-24],[-17,-64],[4,-20]],[[58515,8042],[51,-94]],[[58566,7948],[65,-63],[165,-25],[78,14]],[[58874,7874],[100,-22],[132,11],[52,31]],[[59146,7897],[-16,37]],[[59042,7988],[-21,8]],[[59031,8042],[-8,16]],[[59023,8058],[88,6],[38,-28],[17,-69],[-2,-39],[25,-48]],[[59189,7880],[3,-30],[76,-86]],[[59300,7769],[120,-34],[47,-47]],[[59743,7667],[1,-116],[35,-72]],[[59779,7479],[5,-85]],[[59861,7165],[-6,-35],[-24,5],[2,-17]],[[59833,7118],[-8,-8],[-48,13]],[[59661,7002],[-103,-76]],[[59558,6926],[-208,-111]],[[59191,7375],[-107,61],[-56,14],[-102,0]],[[58926,7450],[-116,-50],[-61,-54],[-38,-56]],[[58630,7065],[-42,-39],[-98,-18],[-81,17]],[[58237,7205],[-214,293],[-85,79]],[[57938,7577],[-122,29],[-504,-21]],[[57383,7950],[13,27],[-75,146]],[[57244,9131],[-70,-34]],[[57102,8985],[-45,11]],[[57184,9279],[-52,25]],[[57132,9304],[31,82],[18,9]],[[57181,9395],[3,-37],[33,-5],[19,14],[-6,60],[-33,36],[-28,-4],[-7,38],[26,12],[-1,38],[32,8],[-9,30],[11,26],[-10,17],[16,31],[1,35],[-14,18],[24,41],[-7,15],[20,7],[-14,10],[3,28],[-15,7],[8,3],[-28,46],[19,14]],[[57224,9883],[6,36],[57,-7]],[[57287,9912],[28,51],[39,31],[104,19],[74,72],[58,8],[44,-12],[125,25],[27,-8],[26,19]],[[57812,10117],[58,-17],[76,-43]],[[57946,10057],[52,-54],[81,-56],[48,30],[78,-27],[3,-21],[21,9],[2,24],[30,25],[-7,-42],[7,-3],[26,30],[-10,10],[6,6],[20,-6],[-5,-16],[15,-3],[7,17],[-19,19],[18,16],[-2,15],[30,-2],[9,15],[-25,5],[7,22],[19,-19],[10,9]],[[58367,10060],[-24,22],[-13,32]],[[58330,10114],[-28,13],[18,28],[26,-20]],[[58346,10135],[-6,32],[7,37]],[[58347,10204],[16,-22],[18,-2],[-10,34],[7,24],[125,60]],[[58503,10298],[76,-187]],[[58579,10111],[45,-68],[467,-537]],[[59091,9506],[115,-175]],[[59206,9331],[-126,-139],[-18,16],[-19,-2]],[[59043,9206],[-22,-24],[-24,11],[0,26]],[[58997,9219],[-26,-11],[-21,5]],[[58936,9188],[-23,9],[-9,-14]],[[58920,9186],[-17,-21],[-28,8],[-8,11],[7,15]],[[58847,9179],[-72,-14],[-58,14]],[[58644,9208],[-14,24],[-101,-2]],[[58529,9230],[-28,-10],[-32,-85]],[[58389,9044],[6,-52],[12,-9],[3,-32]],[[58410,8951],[-13,-64],[19,-25]],[[58416,8862],[26,-3],[123,-66]],[[58571,8642],[34,-48],[19,-99]],[[58556,8520],[-5,-6]],[[58551,8514],[-29,-4]],[[58522,8510],[2,-55]],[[58524,8455],[31,-5]],[[58555,8450],[28,-42]],[[58583,8408],[-8,-28]],[[58590,8347],[-1,-29]],[[58569,8284],[68,-9],[11,-20],[-4,-40]],[[58644,8215],[-54,9]],[[58590,8224],[-50,-10]],[[58532,8173],[-33,-2]],[[58499,8171],[15,-25]],[[53555,27982],[-1750,-2337]],[[51805,25645],[-71,32]],[[51734,25677],[-25,-14],[16,-16],[-15,-14],[-20,6]],[[51690,25639],[-8,22]],[[51682,25661],[28,48],[-44,36],[38,71]],[[51704,25816],[-41,17],[28,38],[-22,85],[19,38],[-27,88],[-31,21],[-64,-28],[-75,53],[-73,1],[-36,47],[-48,16],[-4,40],[-44,21],[-49,98],[-48,23],[-25,51],[-10,73],[-34,37],[-10,37],[-47,1]],[[51063,26573],[-24,25],[-24,4]],[[51015,26602],[-67,90],[-150,11]],[[48209,27495],[47,78]],[[48788,27957],[133,252]],[[49301,28759],[45,85],[17,2],[26,53],[-11,61],[15,69],[41,67],[27,73],[8,-2],[10,31],[45,52],[17,76],[-7,6],[57,149],[0,91],[47,93],[-1,26],[57,92],[-3,24],[33,40],[15,39],[27,9],[51,75],[35,139],[-31,5],[2,65],[26,28],[39,5],[10,53],[29,23],[3,80],[41,56],[3,67],[41,123],[110,202],[35,34],[84,37],[11,26],[100,5],[123,-37],[55,20],[40,41],[48,7],[93,-86],[120,-66],[57,-23],[111,-12],[127,-57],[39,9],[21,-11],[21,15],[115,-28],[113,43],[103,13],[44,-53],[-8,-78],[18,-95],[55,-50],[28,-64],[45,-49],[17,-44],[22,-23],[171,-76],[84,-57],[102,-19],[68,-27],[49,-34],[30,-47],[85,-84],[98,-73],[15,-35],[-10,-50],[-93,-88],[-43,-66],[-9,-49],[9,-61],[-16,-54],[-69,-58],[-168,-44],[-44,-32],[-71,-130],[-52,-207],[-23,-31],[3,-109],[16,-81],[42,-92],[37,-26],[237,-90],[57,-54],[36,-60],[28,-70],[40,-51],[-2,-42],[54,-103],[54,-36],[180,-33],[119,-43],[188,-18],[106,-28],[148,-7],[238,15],[49,-17],[6,-22],[44,-19]],[[12803,955],[-182,1]],[[12621,956],[-384,-247]],[[12237,709],[-35,-13]],[[12202,696],[-31,16]],[[12171,712],[-4,-53]],[[12167,659],[-58,-41]],[[12109,618],[-454,-8],[-117,265]],[[11382,1685],[-47,189],[142,143]],[[11606,2114],[302,167]],[[11908,2281],[109,33]],[[12951,2742],[104,26]],[[13083,2800],[97,45]],[[14288,3762],[51,-107]],[[15459,4270],[54,46]],[[15513,4316],[1160,-1550]],[[16673,2766],[677,-1727]],[[17350,1039],[113,49]],[[17463,1088],[4,-50],[-45,-192]],[[17279,789],[-923,7],[-1567,42],[-97,-244],[-1788,5]],[[13201,1085],[40,62]],[[13267,1177],[-9,48]],[[13145,1277],[-16,36]],[[13119,1300],[51,47]],[[13173,1377],[-64,75]],[[13085,1470],[-23,-3]],[[13062,1467],[-15,28]],[[13053,1506],[-15,-10]],[[13038,1496],[-18,15],[20,-74]],[[13040,1437],[-123,18]],[[12917,1436],[118,-19]],[[13035,1417],[22,-60]],[[13057,1357],[35,-49],[21,-4]],[[13113,1304],[-20,-44]],[[13093,1260],[-24,-11],[18,-30]],[[13075,1214],[-22,-8]],[[13058,1180],[21,-3]],[[26177,6660],[30,16],[31,11],[31,21],[72,28]],[[26341,6736],[30,1],[10,-2]],[[26381,6735],[59,-54],[54,-42]],[[26494,6639],[8,-11],[5,-17],[9,-14]],[[26516,6597],[20,-4],[7,3],[3,-10],[-2,-2]],[[26544,6584],[6,3],[10,13],[8,24]],[[26568,6624],[2,20],[12,71],[1,40]],[[26583,6755],[7,7],[45,23]],[[26712,6750],[-1,-88],[-4,-8]],[[26735,6625],[-6,-4],[3,-7],[-36,-21]],[[26672,6590],[-2,-8],[-4,-3]],[[26626,6535],[7,-30],[-8,-4],[6,-15]],[[26631,6486],[-4,-2],[-6,17]],[[26621,6501],[-14,-7],[2,-4],[-13,-6]],[[26575,6487],[7,-19],[2,0],[0,-19]],[[26584,6449],[-40,-6],[-22,-15]],[[26522,6428],[4,-5],[-8,-5]],[[26518,6418],[24,-22],[9,-11]],[[26551,6385],[-1,-12],[-7,-29]],[[26532,6333],[-5,3],[0,8],[-10,19]],[[26481,6381],[-4,11],[0,7],[-6,6],[0,6]],[[26471,6411],[-3,0],[0,-7],[-14,0]],[[26437,6344],[7,8],[-7,10],[0,26],[7,5]],[[26444,6393],[-3,11],[-3,-7],[-2,0],[0,16]],[[26436,6413],[-28,-1],[-40,9]],[[26328,6411],[0,-6],[-2,0],[-3,-11]],[[26323,6394],[3,0],[0,-2],[20,0]],[[26333,6309],[8,-15],[7,1],[5,-5]],[[26353,6290],[-27,-7],[-8,-5],[-5,8]],[[26319,6212],[-59,-40],[-75,-38]],[[26185,6148],[-9,1],[-1,-7],[-5,1],[-3,-2],[-3,6],[-5,-6],[-2,3],[-3,-2],[-23,0]],[[26131,6142],[0,-22],[2,-10]],[[26118,6101],[-44,79],[-31,39],[-12,20]],[[26031,6239],[-13,35],[-28,87],[-7,32]],[[25983,6393],[-3,34],[3,30]],[[25983,6457],[4,24],[3,15]],[[26630,6571],[6,-4],[5,8],[0,4],[-8,0],[-3,-8]],[[30986,13643],[12,11],[4,-1]],[[31002,13653],[12,32],[0,13],[16,44]],[[31024,13780],[12,11],[11,11]],[[31047,13802],[-21,32],[-12,23],[-3,3],[-10,26],[0,10]],[[31001,13896],[4,8],[6,9],[6,2],[6,7],[27,22],[22,23]],[[31072,13967],[3,8],[4,22]],[[31079,13997],[-2,7],[-7,9],[-15,9],[-28,21],[-6,9],[-3,7],[0,5]],[[31018,14064],[2,5],[3,3],[31,14],[12,15],[6,6],[10,6],[21,8]],[[31103,14121],[10,15],[6,14]],[[31119,14150],[8,-2],[16,-15]],[[31295,13916],[-36,-31],[-29,-14]],[[31230,13871],[4,-13],[1,-16],[0,-8],[-6,-11]],[[31229,13823],[-6,-8],[-2,2],[-3,-2],[-11,8]],[[31207,13823],[-9,-15],[2,-3],[-19,-16]],[[31181,13789],[9,-6],[24,-35]],[[31196,13610],[6,3],[6,-1],[12,-12]],[[31220,13600],[2,-7],[8,-14],[12,-25]],[[31242,13554],[38,-15],[6,3]],[[31075,13424],[-31,39],[-6,-1],[-1,5],[-6,16]],[[31031,13483],[-9,-4],[-8,2],[-7,5],[-7,7]],[[31000,13493],[-23,35],[-16,20],[-16,12],[-7,13],[-2,8],[1,7],[9,19],[3,5]],[[55315,26611],[28,-52],[4,-17],[9,-9],[19,-30],[35,-33],[15,-18],[9,-19],[1,-8],[12,-19],[5,-18],[1,-11],[12,-15],[74,-69],[89,-39],[37,1],[42,-13],[23,0],[16,-9],[10,-12],[-1,-13],[4,-10],[11,-26],[-1,-4],[2,0],[5,-11],[4,-20],[6,-9],[2,-8],[-6,-7],[2,-7],[28,-55],[10,-25],[9,-14],[7,-2],[22,0],[10,-9],[2,-7],[2,2],[17,-27],[-1,-30],[9,-21],[11,-8],[23,8],[3,5],[-3,6],[1,11],[-7,11],[10,7],[22,-15],[15,-19],[12,-19],[13,-27],[6,-19],[2,-21],[-4,-9],[-23,-4],[-13,0],[1,3],[-3,-6],[9,-2],[11,-9],[4,3],[1,6],[15,1],[3,-22],[7,-2],[1,-3],[14,-17],[19,-48],[5,-37],[-1,-41],[-6,-38],[-7,-20],[-3,-21],[-3,-1],[-1,-9],[-18,-7],[-18,-1],[-32,5],[-3,1],[-2,8],[-5,-4],[-7,0],[-7,9],[-10,4],[-66,-4],[-37,19]],[[55828,25592],[-32,23],[-9,3]],[[55476,25521],[6,9]],[[55415,25585],[-24,15]],[[55391,25600],[5,15]],[[55396,25615],[-523,540]],[[54873,26155],[2,2],[440,454]],[[55179,8482],[95,-9],[228,101]],[[56399,8196],[128,-282],[31,-46]],[[56294,7685],[-72,9],[-16,-47]],[[56095,7330],[-15,19]],[[56010,7349],[-54,5]],[[55962,7283],[-2,-34]],[[55281,6639],[-271,-267],[4,-21]],[[55014,6351],[-149,-74],[-135,-83]],[[54219,5840],[-1120,-733],[-136,-80]],[[52957,7005],[120,47]],[[53077,7052],[31,35],[-1,14],[40,11]],[[53147,7112],[4,-60]],[[53151,7052],[94,-3]],[[53245,7049],[2,-36],[16,3],[0,-8]],[[53263,7008],[33,9]],[[53296,7017],[3,-9]],[[53299,7008],[107,37]],[[53406,7045],[-7,45],[10,6],[0,40],[41,24],[-16,54],[99,74],[3,15]],[[53536,7303],[-14,44]],[[53522,7347],[-59,64]],[[53463,7411],[-2,29]],[[53461,7440],[-44,15]],[[53417,7455],[-2,-11],[-14,4],[19,35]],[[53420,7483],[-27,6]],[[53393,7489],[5,39],[-15,5],[3,9]],[[53386,7542],[-35,4]],[[53351,7546],[-14,29]],[[53337,7575],[29,27],[-86,134]],[[53280,7736],[1,20]],[[53281,7756],[-76,57]],[[53205,7813],[-58,16]],[[53147,7829],[-6,117]],[[53141,7946],[31,127],[42,63],[70,52],[29,49],[37,181]],[[53350,8418],[-7,66],[8,69]],[[53351,8553],[41,35]],[[53392,8588],[63,20],[48,-29],[-22,-28]],[[53524,8458],[21,-33]],[[53567,8361],[-18,-29]],[[53549,8332],[5,-25]],[[53554,8307],[-16,-39]],[[53538,8268],[1,-46]],[[53584,8225],[-26,-42]],[[53558,8183],[-3,-54]],[[53555,8129],[27,-56]],[[53536,7972],[40,29]],[[53576,8001],[30,55]],[[53639,8038],[65,27]],[[53704,8065],[1,-52]],[[53705,8013],[45,5]],[[53750,8018],[19,25]],[[53769,8043],[8,33]],[[53777,8076],[30,37]],[[53807,8113],[39,24]],[[53846,8137],[85,18]],[[53931,8155],[11,29]],[[53942,8184],[33,6]],[[53975,8190],[1,28]],[[53976,8218],[20,3]],[[53996,8221],[24,-26]],[[54020,8195],[27,49]],[[54047,8244],[77,1]],[[54124,8245],[-3,54]],[[54159,8323],[32,41]],[[54191,8364],[-2,28]],[[54189,8392],[-105,92]],[[54084,8484],[-15,28]],[[54069,8512],[14,10]],[[54083,8522],[-19,-4],[-19,22]],[[54045,8540],[2,32],[-35,53],[-32,7],[-9,-52]],[[53971,8580],[-21,-29]],[[53950,8551],[-21,34]],[[53929,8585],[15,13],[3,54]],[[53947,8652],[68,22],[27,-3]],[[54109,8596],[110,-60],[106,33]],[[11710,8448],[23,-1],[21,-17]],[[12407,6891],[6,-10],[23,3],[10,-9]],[[12429,6840],[10,-2],[32,37]],[[12471,6875],[18,-23],[0,-22]],[[12607,6668],[-1,-16],[-22,-29]],[[12640,6625],[1,-9],[-20,-7],[1,-13]],[[12622,6596],[22,-15],[17,5]],[[12672,6502],[-1,-27],[-10,-20]],[[12686,6389],[37,-20],[38,-5],[43,-30]],[[12804,6334],[-10,-24],[1,-19]],[[12772,6286],[1,-15],[-11,-12]],[[12784,6230],[-18,-11],[-2,-14]],[[12800,6180],[16,-33],[-1,-21],[7,-12]],[[12809,6093],[21,-21],[5,-16]],[[12908,5962],[9,-38],[-4,-17]],[[12949,5881],[-8,-15],[-25,-9]],[[12959,5823],[16,-10],[15,-26]],[[12990,5787],[-7,-14],[4,-12]],[[12987,5761],[-19,-5],[-9,-15]],[[12959,5741],[2,-31],[21,-45]],[[12882,5569],[-62,-17]],[[12820,5552],[-37,-34],[-9,3],[-14,32]],[[12748,5545],[-30,19],[-33,-33]],[[12670,5538],[-26,-29],[-28,-15]],[[12616,5494],[-7,-24],[-20,-20]],[[12589,5450],[2,-22],[-10,-25]],[[12158,5143],[-26,-13],[-24,2]],[[12085,5087],[-4,-34],[-27,3]],[[12022,5029],[-27,-16],[-3,-13],[-14,-10],[-18,-7],[-18,14]],[[11868,5045],[-1,16],[-43,59],[-45,-29]],[[11779,5091],[-55,-10],[-21,-29]],[[11670,5012],[-28,-12],[-438,-355]],[[11204,4645],[-32,-14],[-13,6],[-25,-17]],[[11118,4636],[-11,-17],[-31,-2],[5,24]],[[11054,4686],[4,26],[10,2]],[[11054,4767],[-19,12],[-2,14],[-24,18],[-6,21],[-10,7]],[[10993,4839],[-8,-9],[-37,-6]],[[10929,4833],[-4,23],[15,35]],[[10940,4891],[-65,-1],[-19,-10]],[[10795,4909],[-5,13],[-43,33]],[[10193,5351],[-85,6],[-16,20]],[[10105,5386],[-4,24],[6,80]],[[10107,5490],[-28,21],[-28,43]],[[10051,5554],[-9,-2],[-3,12],[-21,12],[-13,-1],[-27,31]],[[9978,5606],[-10,44],[-8,2]],[[9960,5652],[6,47],[11,11],[2,18]],[[9463,7360],[32,19],[10,-20],[14,9],[13,-5],[36,38],[16,5],[56,-4],[18,19],[-11,21],[6,27],[57,26],[11,-7],[6,-19],[16,-6],[47,50],[43,24],[14,22],[-1,21],[100,55],[13,-25],[32,-3],[34,29],[6,22],[-7,9],[8,8],[118,50],[25,-7],[13,13],[25,-6],[20,32],[45,-3],[18,23],[20,8],[6,16],[25,14],[29,5],[20,-10],[7,20],[23,22],[80,-2],[155,72],[28,-2],[40,18],[44,6],[22,17],[88,31],[76,2],[100,48],[78,11],[30,15],[28,17],[-2,43],[57,23],[-13,77],[27,3],[30,-18],[7,22],[17,-4],[80,21],[45,49],[16,67],[11,15],[42,25],[92,81]],[[29394,4238],[-23,-15],[-28,5]],[[29026,3683],[-30,0],[-5,-19],[-21,-5],[-95,8]],[[28875,3667],[-16,-66],[-72,-13]],[[28787,3588],[-8,-16],[-35,8],[-11,-31],[-15,-9],[-24,31],[-41,-8],[-11,-23],[-51,-12],[-9,12],[-28,-39],[2,-37],[-20,-6],[6,-20],[-15,-1],[3,-24],[-47,-17],[-47,-46],[-37,24],[-66,-7],[-31,-34],[-2,-34],[-46,-12],[-11,-28],[11,-18],[-15,-20],[-62,24]],[[28177,3245],[-67,-2],[-16,-28]],[[28094,3215],[21,-23],[16,-66],[-27,-73],[2,-22],[-19,-18],[-22,0],[-14,-39],[-79,-34],[-11,-24],[-35,14],[-44,-17],[-27,19],[-16,-7],[-46,-51],[-45,-18],[-10,-45],[-24,-12],[3,-30],[45,-60],[-5,-16],[-49,-33],[-4,-28],[12,-33],[24,-10],[4,-38],[-85,-66],[-1,-79],[-8,-11],[12,-6],[5,-49],[29,-31],[-23,-20],[8,-25],[-38,-22],[-42,20],[-16,-19],[-47,-8],[-118,26],[-51,-8],[-15,20],[-84,30]],[[27270,2303],[-49,-32],[-47,-62]],[[27174,2209],[-31,-11],[50,-60]],[[27193,2138],[0,-27],[-7,-19],[-25,0],[-4,-27],[-41,-20],[-7,-76],[-12,-15]],[[27097,1954],[-1,-87],[-1433,2480]],[[25663,4347],[17,36],[39,29]],[[26252,4759],[95,15],[16,43]],[[26375,4877],[10,34],[62,36]],[[26447,4947],[10,31],[16,12],[37,10]],[[26619,5071],[32,66],[-9,36]],[[26642,5173],[-38,29],[17,28],[35,4],[30,-39],[37,-56],[6,-59]],[[26833,4915],[21,-16],[7,8],[-11,54]],[[27074,5102],[32,27],[16,23],[-17,47],[2,30]],[[27186,5296],[11,44],[10,6],[28,-6],[17,-28],[7,-101]],[[27273,5189],[28,8],[27,36]],[[27328,5233],[0,46],[28,12],[44,-15],[27,-26],[17,-34],[-6,-56],[7,-23],[67,-8],[23,18],[9,66],[-50,68]],[[29510,6366],[29,-15]],[[29559,6308],[28,16],[10,-7]],[[29865,6451],[21,-18],[27,45]],[[29913,6478],[31,-4],[24,-26],[11,-40]],[[30004,5656],[31,-8],[34,-33]],[[30131,5399],[-17,-13],[-90,-1]],[[30060,5269],[2,-10],[-31,-28]],[[29914,5180],[-30,-8],[-18,-21]],[[29879,5129],[-12,-33],[3,-33]],[[29870,5063],[24,9],[24,-13],[36,5]],[[29798,4885],[12,-19],[5,-47]],[[29839,4768],[20,-21],[4,-26],[15,-4]],[[29834,4667],[-30,-26],[-20,-41]],[[29644,4606],[-83,-18],[-33,-36],[-29,-88]],[[39870,16996],[25,24],[1,-1],[13,12],[5,-5],[52,46]],[[39966,17072],[2,-11],[31,16]],[[39999,17077],[2,14],[15,41],[16,38],[2,40],[15,-2],[4,30]],[[40053,17238],[38,-21],[1,-9],[3,-2],[0,9],[19,-8]],[[40157,17234],[20,21],[12,-8]],[[40274,17316],[3,7],[30,-12],[5,0],[12,-4],[12,-6],[29,-2]],[[40374,17318],[2,-4],[49,-36]],[[40425,17278],[6,-3],[10,7],[13,0]],[[40454,17282],[8,-8],[10,-32],[8,-5]],[[40480,17237],[10,11],[39,-1]],[[40529,17247],[9,27],[18,-4],[8,19]],[[40570,17246],[17,-1],[23,-20]],[[40641,17006],[22,-14],[-3,-5]],[[40660,16987],[-48,-51],[-26,-20]],[[40586,16916],[-11,-63],[-1,-17]],[[40574,16836],[5,-44],[12,-26]],[[40529,16663],[-10,10],[-10,7],[-12,4],[-15,2]],[[40482,16686],[-17,-4],[-60,-25],[-21,-2],[-20,2]],[[40364,16657],[-16,6],[-21,13],[-47,43]],[[40280,16719],[-2,-11],[-51,-15],[-4,6]],[[40223,16699],[-57,-57],[-27,-21],[-30,-47],[-20,13]],[[40089,16587],[9,11],[-2,5],[-19,109]],[[40068,16704],[-1,4],[4,5],[-29,62]],[[39995,16761],[-11,29],[-15,13]],[[39898,16802],[2,6],[-10,4],[10,29]],[[39876,16859],[19,13],[-2,2],[36,22],[3,16]],[[39859,16941],[13,25],[8,16]],[[37149,6341],[-64,-33],[-21,-29]],[[37064,6279],[-105,-9],[-49,14]],[[36910,6284],[-74,84],[-146,116],[-47,20]],[[36615,6555],[-12,68],[-14,10],[-28,-7],[-24,-35]],[[36227,6393],[68,-13],[26,-22]],[[36289,6225],[-95,-61],[-18,-28]],[[36050,5872],[-14,-59],[-102,-35]],[[35799,5777],[-86,-51]],[[36998,8486],[282,573]],[[37280,9059],[54,23]],[[37345,9008],[9,-21]],[[37354,8987],[134,-28]],[[37471,8923],[166,-120]],[[37637,8803],[71,100]],[[37742,8920],[42,16]],[[37865,8894],[9,26]],[[37888,8908],[84,1]],[[37972,8909],[128,170]],[[38320,9274],[-8,11]],[[38312,9285],[109,-43]],[[38421,9242],[17,-36]],[[38454,9208],[88,94]],[[38542,9302],[43,4]],[[38731,9494],[105,-85],[38,-16],[27,11]],[[38904,9659],[-51,70],[-3,53],[24,21],[27,2],[105,-64],[70,-4],[32,58]],[[39073,9894],[17,31],[70,-13]],[[39215,9875],[82,4],[558,-1283]],[[39855,8596],[30,-261],[74,13]],[[39959,8348],[-8,-86]],[[39951,8262],[50,-18],[39,-38],[45,-135],[24,-24]],[[40109,8047],[-6,-163]],[[40103,7884],[12,-40],[28,-38]],[[40143,7806],[22,-8],[27,26]],[[40192,7824],[46,-13]],[[40238,7811],[130,59]],[[40368,7870],[235,-90],[23,-23]],[[40626,7757],[51,-140],[-9,-59],[-20,-41]],[[40648,7517],[8,-46],[277,-83]],[[40933,7388],[-423,-1296],[-255,-739]],[[40255,5353],[-49,39]],[[40206,5392],[-69,-1],[-39,14]],[[39723,5613],[-39,50],[-35,-18],[-77,-87]],[[39490,5531],[-47,-74],[-34,-19],[-38,16]],[[39371,5454],[-38,73],[-40,27],[-183,58]],[[38971,5610],[-335,208],[-117,42]],[[38519,5860],[-58,208],[-57,36]],[[38404,6104],[-53,-7],[-42,-33],[-39,-100]],[[38096,5903],[-56,-47],[-36,-1],[-51,41],[-30,-5],[-38,-65],[-21,-86],[-20,-24],[-23,-3]],[[37744,6045],[11,154],[-36,138],[-66,79]],[[37653,6416],[-51,4],[-29,-46],[11,-94],[-6,-45],[-51,-34],[-48,11],[-27,40],[-16,118]],[[37436,6370],[-26,45],[-20,72]],[[37390,6487],[-67,92],[-47,-8],[-47,-42],[-45,-77],[-35,-111]],[[32683,2794],[67,49],[16,27]],[[33006,2792],[4,-21],[18,-19]],[[33129,2816],[3,21],[-16,14],[4,18]],[[33205,2962],[17,49],[16,14]],[[33439,3095],[54,44],[127,63]],[[34044,3506],[-626,-3494]],[[33418,12],[-2857,6]],[[30561,18],[28,744],[-32,41],[19,75],[-26,35],[6,33],[-13,23],[7,25],[-12,22],[-35,20],[11,27],[7,90],[-17,54],[15,126],[-15,42],[-43,20],[-31,65],[-8,49],[-49,48],[-49,249],[-36,34],[-65,169],[-3,41],[42,62],[-5,36],[41,68],[-42,17],[-43,52],[27,25],[16,39],[6,88],[-1,20],[-21,16],[-5,63],[-20,45],[-5,58],[13,22],[77,53],[16,34],[46,7]],[[30362,2755],[17,24],[100,-7]],[[30479,2772],[16,39],[66,-28],[16,15],[85,21]],[[30662,2819],[49,-89]],[[30800,2668],[78,6],[24,40],[-14,21],[-38,-7]],[[30850,2728],[-32,23],[-35,33],[8,23],[83,3]],[[32024,1404],[176,-60]],[[32211,1328],[-17,-56]],[[32312,1184],[16,-36]],[[32328,1148],[27,2]],[[32375,1266],[4,51]],[[32379,1317],[7,-61]],[[32386,1256],[-16,-15]],[[32370,1241],[36,-9]],[[32406,1232],[20,16]],[[32426,1248],[14,-40]],[[32440,1208],[-5,-35]],[[32450,1249],[28,53]],[[32478,1302],[-3,16]],[[32475,1318],[-66,40]],[[32409,1358],[-19,62]],[[32390,1420],[-47,2]],[[32343,1422],[-17,24]],[[32326,1446],[59,370]],[[32014,1898],[-192,-305]],[[31822,1593],[72,-99]],[[31894,1494],[11,-35]],[[31984,1459],[28,-20],[12,-35]],[[53213,11696],[-107,19],[-48,40],[-31,-2]],[[53027,11753],[-74,91],[-31,-12],[-12,14],[0,46]],[[52910,11892],[-33,48],[29,45],[5,60],[-111,97],[-53,172],[-52,34],[-2,71],[-78,115],[-4,101]],[[52611,12635],[-29,59],[-41,21],[-22,-51],[-28,7]],[[52491,12671],[-16,-28],[-32,2],[-6,24],[-29,4]],[[52408,12673],[-14,34],[-47,43],[-41,-25]],[[52306,12725],[-6,-47],[-13,-3],[-80,55]],[[52207,12730],[-17,34]],[[52190,12764],[18,19],[-41,71],[7,19]],[[52174,12873],[-26,29],[-64,-20]],[[52084,12882],[-74,25],[-16,-24]],[[51994,12883],[-57,-23]],[[51937,12860],[-17,29],[-21,-34]],[[51899,12855],[-22,0],[9,-30],[-46,0],[-18,-44],[-55,-26],[-27,-39]],[[51740,12716],[-62,18]],[[51678,12734],[8,-41],[-59,25],[-9,-32],[-77,22],[-52,58],[-46,-7],[-53,61],[-81,26],[0,43]],[[51309,12889],[-103,108],[-37,6]],[[51169,13003],[-96,-61]],[[51073,12942],[-309,61]],[[50764,13003],[-57,-32],[-141,-24],[-100,21],[-146,-10],[-320,116]],[[50000,13074],[-290,54]],[[49710,13128],[-109,83]],[[50526,16312],[57,-5],[76,-38],[27,-34],[10,-44]],[[50848,16158],[56,-19],[-5,-147]],[[50899,15992],[58,-16],[46,-65],[-19,-33]],[[50984,15878],[8,-44],[38,-5]],[[51030,15829],[45,27],[29,-24]],[[51104,15832],[5,-40]],[[51109,15792],[37,-25],[-38,-84],[17,-24],[42,10],[22,46]],[[51189,15715],[41,14],[120,-69],[75,19]],[[51425,15679],[8,51],[23,26],[54,-31],[56,-95]],[[51566,15630],[-18,-46],[28,-22],[6,-43],[50,-8],[39,-56],[50,-33],[-14,-21],[-65,-4],[-16,-22],[5,-19],[91,-68]],[[51722,15288],[73,60]],[[51795,15348],[70,-5],[14,-55],[43,-43],[31,-62],[210,-100],[8,-93],[42,-16],[28,-46],[51,1],[72,66],[61,-14],[56,22],[38,38],[54,10],[21,-65],[53,-42],[25,-110],[33,-23],[8,-45],[53,-45],[4,-28],[24,-21],[-3,-17],[-18,-1],[-31,30],[-25,-46]],[[52717,14638],[-4,-71]],[[52713,14567],[13,-37],[-21,-63],[22,-20],[-18,-47],[17,-33],[-11,-44],[17,-40],[118,-23],[21,-37],[-36,-17],[14,-23],[-9,-11],[-64,-1],[-16,-67],[34,1]],[[52794,14105],[102,-72]],[[52896,14033],[40,32],[56,-34],[-26,-136]],[[52966,13895],[62,-43],[-30,-28],[-76,19]],[[52922,13843],[-19,-41],[10,-26],[42,-1],[19,-27],[78,18]],[[53052,13766],[110,-28],[29,49]],[[53191,13787],[2,77],[44,12]],[[53237,13876],[-5,48],[34,24]],[[53266,13948],[3,27],[77,-30]],[[53346,13945],[32,-68]],[[53378,13877],[146,39],[25,-46]],[[53544,13758],[64,-96],[-17,-28]],[[53522,13640],[-43,-32],[-9,-18],[24,-79],[34,-33],[79,25],[46,-27]],[[53653,13476],[111,25],[20,-50],[-23,-72]],[[53761,13379],[-34,-32],[-35,31]],[[53620,13297],[-17,-31],[143,16]],[[54132,13041],[109,-44],[27,28]],[[54216,13187],[14,34],[24,14],[29,-26],[-14,-23]],[[54341,13082],[43,-38],[-83,-146]],[[54301,12898],[-31,-19],[58,-77]],[[54285,12760],[6,-18],[44,-17],[186,42]],[[54567,12705],[-37,-30],[15,-41],[75,20]],[[54740,12738],[28,7],[16,-33],[1,-48]],[[54709,12521],[2,-32],[39,-67],[38,-10],[124,35]],[[55144,12532],[-10,-31],[39,20]],[[55173,12521],[22,-45],[120,-33]],[[55315,12443],[73,43],[25,-41],[-13,-87],[-67,-103],[28,-71]],[[55235,12177],[47,-102]],[[55282,12075],[-20,-26]],[[55262,12049],[-43,14]],[[55219,12063],[-34,-20],[12,-50],[-35,-24],[40,-86],[-34,-65],[-2,-83],[-25,-46]],[[55141,11689],[-84,-7]],[[55057,11682],[-168,54]],[[54889,11736],[-337,-357]],[[54552,11379],[-100,-150]],[[54452,11229],[-102,-41],[-7,-34],[23,9],[35,-72]],[[54401,11091],[-3,-22]],[[54398,11069],[-30,36],[-74,-21]],[[54294,11084],[-50,16]],[[54244,11100],[-163,142],[-135,29]],[[53946,11271],[-90,66]],[[53856,11337],[-61,-10],[-51,15],[-27,38],[-35,2],[-28,32],[-47,8],[-66,44],[-3,29],[-31,25],[-170,40],[-2,20],[-28,7]],[[53307,11587],[-30,50],[-64,59]],[[52430,25069],[20,24],[25,-20],[34,2],[23,49],[-6,19],[25,18],[37,-1],[33,-53],[22,-88],[32,-47],[-4,-77],[30,13],[145,-103],[-27,-50],[24,-20],[2,-32],[-38,-20],[14,-32],[78,-51],[-44,-65],[0,-31],[69,16],[-11,37],[22,30],[32,-34],[84,-6],[-14,-63],[48,-30],[49,-68],[7,-52],[-23,-48],[-1,-45],[57,-107],[41,-10],[10,35],[37,21],[28,80]],[[53290,24260],[31,29],[44,-44]],[[53365,24245],[149,-31],[10,-14],[-4,-56],[11,-12],[89,8],[7,-33],[-62,-54]],[[53565,24053],[13,-30],[37,-8]],[[53615,24015],[66,14]],[[53681,24029],[36,50],[60,16],[27,-45],[88,-45]],[[53892,24005],[64,-52],[36,-5]],[[53992,23948],[56,-56],[109,-68],[43,-62],[14,-45],[52,-30],[193,-233],[19,-65],[-60,-139],[-24,-88],[29,-206]],[[54423,22956],[-176,-135],[-85,-365],[-36,-11],[-13,-39],[-100,-66],[-21,-44],[2,-75],[-22,-33],[-33,-122],[-37,-45],[16,-20],[-15,8],[-22,-26],[-48,-98],[-5,30],[-27,-17],[6,-37]],[[53807,21861],[-11,-23],[-90,3]],[[53706,21841],[3,-29]],[[53726,21779],[-148,66]],[[53578,21845],[-57,57]],[[53499,21945],[-49,-3]],[[53269,22013],[-59,-15],[-56,77]],[[53099,22076],[11,35]],[[53023,22187],[-9,38]],[[52871,22377],[-22,34],[-24,-3],[-43,54]],[[52764,22467],[10,23],[-18,-5]],[[52692,22518],[-54,76]],[[52638,22594],[-70,33]],[[52568,22627],[-29,58]],[[52539,22685],[-130,-27]],[[52409,22658],[-34,71]],[[52375,22729],[-24,20]],[[52349,22776],[-46,31],[-126,-15],[-41,-48],[-8,-40]],[[50377,25601],[29,100],[16,176],[32,146],[27,68]],[[50798,26703],[149,-11],[68,-90]],[[51015,26602],[48,-29]],[[51704,25816],[-37,-69],[42,-34],[-27,-52]],[[51690,25639],[32,-2],[3,13],[-18,10],[27,17]],[[51734,25677],[80,-34],[-15,-59],[17,-29]],[[51816,25555],[43,-25],[55,-1]],[[51914,25529],[120,48],[12,-45]],[[52046,25532],[-28,-11],[2,-33],[-16,-29],[75,-63],[-24,-49],[10,-45],[37,-30],[82,-27],[17,-28],[-5,-35],[-39,-59],[6,-31],[112,-12],[4,27],[24,4]],[[52303,25111],[20,-29],[52,-7],[55,-6]],[[51991,24517],[-26,-33],[-50,-23]],[[51915,24461],[26,-65]],[[51941,24396],[-39,3]],[[51902,24399],[-18,-32]],[[51884,24367],[18,-59]],[[51902,24308],[-4,-36]],[[51898,24272],[32,-18]],[[51930,24254],[-23,-50]],[[51907,24204],[61,-27]],[[51968,24177],[27,8]],[[51995,24185],[60,-116]],[[52055,24069],[32,74]],[[52087,24143],[2,34]],[[52089,24177],[-29,36]],[[52060,24213],[4,16]],[[52064,24229],[-31,18]],[[52033,24247],[8,14],[-50,91]],[[51991,24352],[8,16]],[[51999,24368],[-14,42],[60,46],[49,-24],[16,-13]],[[52110,24419],[1,-32]],[[52111,24387],[48,-98],[27,39],[5,32]],[[52191,24360],[16,-7]],[[52207,24353],[20,19]],[[52227,24372],[42,-9]],[[52269,24363],[68,-47]],[[52337,24316],[153,85]],[[52490,24401],[3,34]],[[52493,24435],[22,-3],[20,118]],[[52535,24550],[-7,45]],[[52528,24595],[22,90]],[[52550,24685],[-77,53]],[[52473,24738],[13,18]],[[52486,24756],[-7,12]],[[52479,24768],[-40,15]],[[52439,24783],[11,30]],[[52450,24813],[91,-72]],[[52541,24741],[8,16]],[[52549,24757],[20,-15]],[[52569,24742],[13,-30]],[[52578,24682],[114,-55]],[[52719,24599],[57,99]],[[52690,24896],[-30,-23]],[[52660,24873],[-52,51]],[[52586,24887],[9,-39]],[[52569,24792],[-42,32]],[[52527,24824],[-19,-1]],[[52508,24823],[-59,52]],[[52449,24875],[7,102],[-121,11]],[[52335,24988],[-50,-65]],[[52285,24923],[27,-15]],[[52312,24908],[-104,-134]],[[52208,24774],[-67,17],[-150,-274]],[[52258,24594],[7,34]],[[52265,24628],[27,-16]],[[52292,24612],[0,-20]],[[52292,24592],[23,-7]],[[52315,24585],[-24,-18]],[[52291,24567],[-29,10]],[[52262,24577],[-4,17]],[[50878,3877],[-20,-89],[26,-53]],[[50884,3735],[31,-26],[26,-8],[41,16],[9,40]],[[50991,3757],[-44,32],[-11,30]],[[50945,3841],[46,19],[51,-80]],[[51042,3780],[65,-37],[40,-18]],[[51566,3425],[55,-37],[33,8]],[[51654,3396],[18,31],[71,45]],[[52316,3561],[139,21]],[[52696,1855],[-605,-413]],[[52300,1353],[4,-17],[39,-17],[22,6]],[[52413,1237],[63,38],[9,-17]],[[52485,1258],[-26,-14],[2,-20],[50,16]],[[52704,1273],[14,-21],[22,6],[9,-16]],[[53048,1130],[13,-4],[9,-12],[-6,-125]],[[53099,1004],[-7,18],[8,6]],[[53246,705],[11,-14],[-4,-16]],[[53312,664],[-11,-11],[5,-33],[-13,-4],[-3,-41]],[[53299,519],[24,-27]],[[53323,492],[0,-51],[-24,-50],[-14,-6]],[[53601,167],[-3,-25],[15,-23]],[[53775,85],[27,-11],[2,-24],[17,-6]],[[53821,44],[-3968,7]],[[50773,3932],[18,0],[16,5],[21,36],[29,-12],[21,-84]],[[51630,1490],[12,7]],[[51642,1497],[43,-37]],[[51685,1460],[46,-5]],[[51731,1455],[33,40]],[[51764,1495],[47,7]],[[51811,1502],[74,-36]],[[51885,1466],[8,7]],[[51893,1473],[-11,30]],[[51882,1503],[15,16]],[[51897,1519],[-9,17]],[[51888,1536],[27,2]],[[51915,1538],[23,70]],[[51938,1608],[91,-27]],[[52034,1794],[-75,-29]],[[51990,1883],[38,79]],[[52028,1962],[-43,37]],[[51985,1999],[-16,-2]],[[51923,1912],[-91,-2]],[[51831,1926],[-63,14]],[[51768,1940],[-38,-48]],[[51730,1892],[-107,24]],[[51623,1916],[-7,-53]],[[51616,1863],[-17,-19]],[[51582,1852],[-5,-45]],[[51577,1807],[-9,-3]],[[51568,1804],[22,-26]],[[51590,1778],[6,-78]],[[51606,1700],[24,-210]],[[48963,9758],[117,-44]],[[49080,9714],[45,45],[35,-40],[20,1],[25,39],[30,-4]],[[49235,9755],[53,48],[87,2]],[[49375,9805],[123,38],[10,12],[-5,32],[31,51]],[[49534,9938],[-1,32]],[[49533,9970],[55,88]],[[49588,10058],[6,150]],[[49594,10208],[1214,1152]],[[50808,11360],[52,-37]],[[50860,11323],[345,-43]],[[51205,11280],[91,4]],[[51298,11172],[-43,-9]],[[51255,11163],[37,-115]],[[51330,11032],[114,-10]],[[51535,11051],[108,87]],[[51867,11019],[11,-269]],[[51906,10659],[107,-314]],[[52013,10345],[89,-82]],[[52102,10263],[12,15]],[[52155,10222],[42,-41]],[[52197,10181],[65,63]],[[52262,10244],[26,-29]],[[52288,10215],[42,6]],[[52330,10221],[56,45]],[[52430,10245],[21,22]],[[52451,10267],[81,-49]],[[52585,10221],[70,-33],[120,-112]],[[52775,10076],[-67,-145],[-2,-38],[18,-50]],[[52724,9843],[54,-50],[42,-2]],[[52820,9791],[12,-19],[-3,21]],[[52829,9793],[70,15],[-5,-34]],[[52894,9774],[27,-24],[16,31]],[[52937,9781],[-35,30],[23,3],[35,-27],[24,-112]],[[52984,9675],[3,-39],[-12,-5],[12,0],[7,-24],[-31,4]],[[52963,9611],[121,-92],[-14,-115]],[[53070,9404],[-15,-5]],[[53055,9399],[34,-22],[66,-28]],[[53155,9349],[20,35],[6,59],[34,20],[58,-34],[31,-47],[-1,-39],[-31,-57],[13,-13],[95,40],[185,-13]],[[53565,9300],[70,30],[28,30],[58,109]],[[53721,9469],[6,45],[-15,39],[3,32],[23,27],[33,5],[39,-26],[3,-112]],[[53813,9479],[-64,-148],[-16,1],[13,-4],[-3,-13],[-46,-60],[7,-84],[46,-73],[-4,-15],[6,8]],[[53752,9091],[152,-72],[121,14]],[[54025,9033],[47,75],[-7,126],[12,46],[39,22]],[[54116,9302],[-16,9],[35,14],[29,2],[-16,-8],[22,0],[4,-22],[0,23],[29,3]],[[54203,9323],[16,29]],[[54219,9352],[27,-37],[19,-104],[-40,-112]],[[54225,9099],[-153,-213],[-38,-150]],[[54042,8671],[-95,-19]],[[53947,8652],[-9,-62],[-9,-5]],[[53929,8585],[-27,43]],[[53902,8628],[-29,-40]],[[53873,8588],[-50,-9]],[[53823,8579],[2,-18],[-12,23]],[[53813,8584],[-57,-4]],[[53756,8580],[-129,-45]],[[53627,8535],[-167,73],[-68,-20]],[[53351,8553],[-1,-135]],[[53350,8418],[-41,-194],[-130,-137],[-38,-141]],[[53147,7829],[-60,-68]],[[53087,7761],[-49,-9]],[[53038,7752],[-15,22],[-103,-30]],[[52920,7744],[26,31]],[[52946,7775],[47,-9]],[[52993,7766],[85,22]],[[53078,7788],[39,47]],[[53117,7835],[7,231]],[[53124,8066],[12,46]],[[53136,8112],[29,54]],[[53165,8166],[67,36],[37,40]],[[53269,8242],[-2,32]],[[53267,8274],[-24,32],[6,37],[-31,42]],[[53218,8385],[1,39]],[[53219,8424],[-39,-17]],[[53180,8407],[-53,-144]],[[53127,8263],[-90,37]],[[53037,8300],[-17,-52]],[[53020,8248],[-48,14]],[[52972,8262],[-31,-12]],[[52941,8250],[-17,-31]],[[52924,8219],[5,-34]],[[52929,8185],[38,-18]],[[52967,8167],[-2,-27]],[[52965,8140],[-15,-12]],[[52950,8128],[-25,-2]],[[52925,8126],[-24,24]],[[52901,8150],[-20,74]],[[52881,8224],[-39,30]],[[52842,8254],[-21,-11]],[[52821,8243],[-94,9]],[[52727,8252],[-3,-51]],[[52724,8201],[32,-45]],[[52756,8156],[-73,22]],[[52683,8178],[0,-21]],[[52683,8157],[77,-134]],[[52760,8023],[8,4]],[[52768,8027],[-10,14]],[[52758,8041],[35,21]],[[52793,8062],[33,-36]],[[52826,8026],[-25,-173]],[[52801,7853],[19,-72]],[[52820,7781],[-9,-84]],[[52811,7697],[-104,-38]],[[52707,7659],[-42,-56]],[[52665,7603],[-93,-25]],[[52572,7578],[-229,35]],[[52343,7613],[-170,-7],[-37,-18]],[[52077,7570],[-153,-52]],[[51924,7518],[-38,64]],[[51708,7628],[-104,-21],[-31,69]],[[51485,7733],[-44,17]],[[51428,7806],[-23,29],[-55,11]],[[51259,7926],[-24,113],[-78,75],[-33,-2],[-32,-41],[-41,3],[-46,32],[-104,-69]],[[50901,8037],[-71,17],[-89,132]],[[50741,8186],[-24,119]],[[50717,8305],[-30,56],[-114,-8]],[[50573,8353],[-33,-96]],[[50540,8257],[-58,-23]],[[50482,8234],[-47,70]],[[50435,8304],[-45,117],[-33,19]],[[50357,8440],[-36,-1],[-45,-49],[-5,-50]],[[50271,8340],[17,-40],[-27,-38],[-21,-8],[-67,30],[-53,-19]],[[50120,8265],[-24,-111]],[[50096,8154],[2,-43]],[[50098,8111],[-14,-19],[-44,-20]],[[50040,8072],[-115,21],[-42,22]],[[49883,8115],[-37,49],[-5,81],[-18,41],[-129,122],[-94,26],[-81,57],[-18,127]],[[49501,8618],[64,29]],[[49565,8647],[42,60]],[[49607,8707],[1,18],[-21,23],[19,50],[-9,17],[-169,49],[-175,5],[-104,73],[-18,42],[6,76],[-76,72]],[[49061,9132],[-108,2],[-24,21],[0,140]],[[48929,9295],[-14,74],[31,35],[14,60],[30,-9],[17,18],[-37,73]],[[48970,9546],[-30,190],[23,22]],[[38638,18286],[23,12],[40,10],[52,9]],[[38788,18289],[109,16],[46,-5],[93,25]],[[39036,18325],[35,10],[4,3]],[[39075,18338],[2,10],[26,23],[19,9],[45,58]],[[39167,18438],[73,-38],[16,0]],[[39240,18359],[38,-26],[77,-92]],[[39355,18241],[-16,-4],[-12,2],[-13,-2],[-9,4],[-19,-3],[-8,3]],[[39242,18180],[96,-84],[9,-26]],[[39347,18070],[-3,-10],[-1,-7],[-37,-171]],[[39288,17869],[13,-11],[-11,-34],[-67,-106]],[[39223,17718],[-67,-50],[-17,-5],[-8,3]],[[39131,17666],[5,-6],[-4,-3],[-4,-11],[-30,-24],[-10,1],[-33,-23],[-25,-30]],[[39030,17570],[-33,20],[-53,40],[-80,53]],[[38864,17683],[-1,-13],[-8,-9],[3,-11],[-6,-5]],[[38852,17645],[-5,7],[-49,-19],[-49,-1]],[[38749,17632],[-19,4],[-16,8],[-15,11]],[[38699,17655],[-7,9],[-9,15],[1,12],[-7,1]],[[38677,17692],[-6,10],[-28,14],[-7,8],[-72,46],[-6,5]],[[38558,17775],[-35,74],[-22,60],[-9,16]],[[38492,17925],[0,7],[29,90],[14,53],[15,45],[29,70],[49,85],[10,11]],[[59091,9506],[-338,394]],[[58753,9900],[51,66],[18,37]],[[59176,10195],[5,10],[-9,34]],[[59172,10239],[26,24],[47,78]],[[59286,10407],[-18,20],[-2,23]],[[59282,10460],[-4,-18],[7,-5]],[[59307,10538],[-10,11],[2,38],[-9,0],[6,8],[-8,3]],[[59268,10659],[-50,85],[0,15]],[[59130,10890],[1,29],[-7,9],[-8,53]],[[59130,11054],[16,52],[36,202]],[[59182,11308],[2,25],[-17,61]],[[59180,11406],[7,77],[58,328]],[[59245,11811],[53,-47],[42,-21]],[[59340,11743],[10,-20],[13,-5],[1,-19],[18,-7],[7,-18]],[[59389,11674],[22,-4],[20,9]],[[59459,11672],[3,9],[25,-13],[8,-7]],[[59521,11624],[12,24],[21,20],[45,3]],[[59599,11671],[-6,-39],[-19,-20],[2,-19],[20,-18],[54,15]],[[59690,11645],[14,-7],[33,5]],[[59768,11616],[-3,-8],[12,-21]],[[59796,11549],[7,4],[15,-20]],[[59845,11539],[5,-14],[13,-5]],[[59909,11493],[3,-9],[-10,-27]],[[60061,11287],[12,-11],[18,1]],[[60443,11206],[32,-9],[43,-49]],[[60914,10897],[103,-57],[54,-16]],[[61071,10824],[-6,-30],[21,-25],[-10,-34],[-64,-135],[-6,-27],[-35,-30],[-6,-32],[-15,-22],[26,-39],[-6,-38]],[[60970,10412],[20,-48]],[[60990,10364],[-5,-71]],[[60985,10293],[11,-15],[0,-50]],[[60996,10228],[14,-2],[-2,-13],[9,1],[-6,-22],[14,-10]],[[61025,10182],[8,-42]],[[61033,10140],[-2,-9],[-38,-15],[-17,-18]],[[60976,10098],[30,-42]],[[61006,10056],[-13,-30],[22,-39],[-30,-22],[12,-41],[-31,-24],[1,-37],[16,-45],[1,-43],[27,-17]],[[61011,9758],[316,-64]],[[61327,9694],[12,-37]],[[61339,9657],[25,-186]],[[61364,9471],[-7,-63],[11,-27],[55,-83],[60,-45],[32,-38],[26,-49],[38,-131],[64,-122],[194,-198],[137,-170],[97,-141],[123,-204]],[[61274,7786],[-281,-73],[-106,-14],[-106,13],[-253,81]],[[60528,7793],[-69,37],[-50,41]],[[60374,7935],[-56,67],[-81,117]],[[60126,8209],[-143,80],[-86,117]],[[59794,8492],[-87,89],[-82,114],[-62,113]],[[59493,8889],[-40,74],[-67,96]],[[59386,9059],[-104,209],[-107,100],[-84,138]],[[45905,9198],[12,21]],[[45917,9219],[-51,46],[-8,31],[29,5],[35,35],[15,33]],[[45937,9369],[65,25]],[[46002,9394],[27,27],[28,109],[22,36]],[[46079,9566],[69,65]],[[46148,9631],[9,23],[2,73],[30,41],[-3,77],[59,17],[43,-27],[13,5],[26,86],[-9,63],[11,61],[32,4]],[[46361,10054],[87,-27]],[[46448,10027],[25,32],[37,15],[24,28],[17,45],[74,-11]],[[46625,10136],[67,56],[10,21],[15,3],[58,-57],[36,-11],[28,-91]],[[46839,10057],[67,-6],[95,50],[36,-14],[-10,-60],[13,-22],[15,-2],[35,49],[19,121],[36,18],[109,-56],[49,13],[29,-17],[61,54],[7,79]],[[47400,10264],[61,55]],[[47461,10319],[0,28],[11,9],[70,14],[41,-22],[61,2],[48,28],[32,-35]],[[47724,10343],[19,4],[8,126],[-6,15]],[[47745,10488],[-18,6],[36,33],[5,21],[-10,18],[14,14],[17,-8],[12,25],[25,2],[7,26],[12,-6],[46,23]],[[47891,10642],[73,-95]],[[47964,10547],[40,-36]],[[48004,10511],[146,-3]],[[48150,10508],[79,-37]],[[48229,10471],[32,7],[15,-17],[22,2],[22,-25],[84,-22],[15,-26],[54,23],[20,37],[28,16],[97,-85]],[[48618,10381],[122,8]],[[48740,10389],[42,-57]],[[48782,10332],[1,-41],[-32,-104]],[[48751,10187],[21,-74],[19,-16],[56,3]],[[48847,10100],[89,88]],[[48936,10188],[45,5]],[[48981,10193],[37,-12],[0,-33]],[[49018,10148],[-21,-73],[31,-82],[-2,-22],[76,-63]],[[49102,9908],[-23,-104],[25,-27],[7,-26],[-31,-37]],[[48963,9758],[-23,-19],[30,-193]],[[48929,9295],[-5,-130],[20,-29],[117,-4]],[[49607,8707],[-21,-16],[-21,-44]],[[49565,8647],[-27,-3],[-37,-26]],[[49883,8115],[84,-31],[73,-12]],[[50040,8072],[31,11],[27,28]],[[50096,8154],[15,34],[9,77]],[[50271,8340],[11,66],[28,28],[47,6]],[[50357,8440],[50,-43],[28,-93]],[[50482,8234],[42,8],[16,15]],[[50573,8353],[121,4],[23,-52]],[[50741,8186],[40,-53],[24,-56],[31,-24]],[[50825,8004],[25,-57],[-59,-21]],[[50709,7778],[-62,16]],[[50371,7539],[-45,-7]],[[49866,7274],[-155,23],[-94,-23],[-7,-28]],[[49610,7246],[-509,193]],[[49101,7439],[-2361,712],[-803,247]],[[46829,14098],[525,1071],[389,-140]],[[49302,13476],[296,-263],[112,-85]],[[49710,13128],[103,-10],[187,-44]],[[50764,13003],[194,-44],[51,6]],[[51009,12965],[-66,-231],[-30,13]],[[50913,12747],[-1,-75],[-10,-14]],[[50902,12658],[16,-14],[-48,-209],[-25,-1]],[[50845,12434],[-5,-23],[12,0],[-9,-69]],[[50843,12342],[-26,-64],[-17,-78]],[[50800,12200],[21,-33],[14,-67]],[[50835,12100],[0,-64],[-12,-34],[1,-38]],[[50824,11964],[46,-35],[29,0],[20,-54],[-8,-26],[12,-43],[54,-8],[64,-35],[3,-24],[-19,-27],[32,-49],[56,-11],[-9,-44]],[[51104,11608],[4,-40],[16,-38],[-63,-23],[-44,11],[-26,-14],[-30,-48],[-3,-32]],[[50958,11424],[19,-11]],[[50977,11413],[-9,-17],[-32,10],[-82,-5],[-39,-11],[-10,-12]],[[50805,11378],[9,-12],[-6,-6]],[[50808,11360],[-45,42],[-393,253],[-119,-19],[-99,22],[-148,122]],[[50004,11780],[-83,111],[-44,21],[-241,4]],[[49636,11916],[-54,-16],[-58,-43]],[[49524,11857],[-74,-9],[-60,37],[-21,29],[-6,32],[23,62],[-3,36],[-74,110]],[[49309,12154],[-114,80],[-49,7],[-78,42],[-135,139]],[[48933,12422],[-183,119],[-39,56],[-61,162],[-50,32],[-80,-5],[-143,-97],[-38,-35],[-45,-87],[-32,-77],[-2,-44],[20,-59],[28,-24]],[[48308,12363],[45,-82]],[[48353,12281],[11,-72],[-18,-63]],[[48346,12146],[-34,-51]],[[48312,12095],[-55,-38],[-162,-18]],[[48095,12039],[-46,5],[-85,45],[-100,73],[-37,42]],[[47827,12204],[-77,42],[-49,7]],[[47701,12253],[-85,-14]],[[47616,12239],[-129,19],[-152,70],[-97,144],[-77,73]],[[47161,12545],[-45,19]],[[47116,12564],[-114,-4],[-29,21],[-16,38],[7,56],[74,67]],[[47038,12742],[86,110],[7,51]],[[47131,12903],[-18,64],[-57,78]],[[47056,13045],[-42,30],[-7,22]],[[47007,13097],[-99,36],[-78,104]],[[46830,13237],[-76,71],[-208,125],[61,238]],[[34877,8923],[-2,19],[1,5],[5,4],[0,3],[2,1],[1,5],[6,1],[1,4],[9,8],[-2,10],[2,4],[-1,12],[-1,4],[0,6]],[[34898,9009],[31,43],[1,3]],[[35215,9066],[18,-16],[106,-101]],[[35339,8949],[-44,-92],[-65,-128]],[[35241,8719],[-8,-14],[-32,-79]],[[35201,8626],[-11,-1],[-23,9],[-72,34],[-15,5],[-33,18],[-72,11]],[[34926,8611],[-14,9],[-8,7],[-34,18]],[[34870,8645],[-1,3],[-2,20],[-3,12],[1,3],[0,6]],[[34865,8689],[-20,22],[-19,5]],[[34859,8736],[1,-3],[4,1],[1,-2],[-5,-1],[3,-22]],[[34863,8709],[4,9],[0,10],[-2,3],[2,5],[0,6],[2,6],[-1,5],[2,4],[-3,8],[-2,12],[3,15],[7,2],[2,3],[-3,9],[-2,10],[0,4],[2,3]],[[34874,8823],[-71,16],[-52,31],[-2,-2],[-19,10]],[[34730,8878],[1,3],[2,3],[16,-8]],[[62856,3326],[74,-72]],[[62930,3254],[28,-13]],[[62958,3241],[60,3]],[[63018,3244],[57,-52]],[[63075,3192],[24,2],[22,30],[-2,28],[29,68],[47,39]],[[63195,3359],[62,95],[14,61]],[[63271,3515],[-85,62]],[[63186,3577],[-24,-1],[-29,31]],[[63133,3607],[24,46]],[[63157,3653],[5,47]],[[63162,3700],[11,5]],[[63173,3705],[-39,37],[-45,103],[38,80],[101,143],[-69,73],[-22,55],[31,8],[14,46]],[[63182,4250],[90,-23]],[[63272,4227],[-4,118]],[[63268,4345],[-35,2],[35,197]],[[63268,4544],[366,1016]],[[63634,5560],[1132,-307],[761,-251]],[[65527,5002],[-159,-584],[13,-19],[440,-2137],[106,-336],[153,-381],[120,-391],[84,-216],[188,-826],[-2741,-4]],[[63731,108],[4,1281]],[[63735,1389],[179,52],[7,32],[116,28],[54,31],[24,-15],[25,13],[40,-11],[30,90],[-22,76],[-101,142],[-17,81],[-130,40],[-386,457],[-364,73],[-145,66],[-187,633],[-16,81],[22,35],[-8,33]],[[30730,8028],[30,-10]],[[30760,8018],[34,0]],[[30794,8018],[9,31]],[[30803,8049],[20,1],[34,-7],[5,43],[13,1],[-4,10],[2,15],[3,-1],[3,12],[13,-6]],[[30892,8117],[7,72],[-5,37]],[[30894,8226],[-19,0]],[[30875,8226],[-22,14]],[[30853,8240],[-8,0],[1,-7],[-17,1]],[[30829,8234],[-3,50]],[[30826,8284],[3,2]],[[30829,8286],[-10,7],[-2,12]],[[30817,8305],[-1,27]],[[30816,8332],[15,0]],[[30831,8332],[-12,14]],[[30819,8346],[2,20],[22,-1],[2,51],[4,1]],[[30849,8417],[1,16],[1,45]],[[30851,8478],[-15,2],[-2,48],[-4,-2],[-5,7]],[[30825,8533],[23,27],[17,37],[29,22]],[[30894,8619],[33,5],[45,-10]],[[30972,8614],[29,38],[66,62]],[[31067,8714],[122,84],[42,36],[7,-15],[32,21],[8,8],[-1,8],[15,1],[1,-23],[28,-28]],[[31503,8692],[0,-11],[7,2],[1,-5]],[[31511,8678],[14,4],[66,-13],[19,-10]],[[31610,8659],[-4,15],[-8,9]],[[31751,8659],[32,8],[27,16]],[[31961,8536],[-5,-7],[40,-12],[3,-7],[-4,-2],[36,-23]],[[32031,8485],[-6,-15],[-6,-3]],[[32037,8350],[-16,-14],[0,-31],[-20,-22],[-12,-24]],[[31941,8266],[9,28],[11,10]],[[31888,8258],[-21,-2],[-22,14]],[[31845,8270],[-8,-9],[-3,-17],[-9,-7]],[[31805,8269],[-8,-9],[-28,-9],[-1,-6],[-60,-16],[-3,-13],[4,-9]],[[31728,8214],[24,-16],[25,-3]],[[31821,8117],[1,-33],[-8,-25]],[[31847,8050],[0,-20],[-5,1],[-3,-6],[-3,9],[-4,-1],[4,-7],[-2,-7]],[[31834,8019],[-8,3],[-1,-5],[-11,0],[-15,11]],[[31799,8028],[-5,-8],[-5,3],[-10,-19]],[[31823,7966],[23,6],[10,-6]],[[31833,7918],[-4,2],[-8,-18],[-8,3]],[[31810,7865],[-15,3],[-4,-7]],[[31791,7861],[0,-14],[22,-22]],[[31813,7825],[-120,-37],[-9,-11]],[[31684,7777],[-7,-15],[2,-4],[-8,-34]],[[31681,7721],[-5,-15],[-8,0],[-1,-5]],[[31682,7692],[-7,-17],[2,-12]],[[31583,7597],[-5,3],[4,11]],[[31550,7630],[-20,-5],[-33,-27]],[[31474,7570],[-9,-37],[6,-24],[-5,-34]],[[31466,7475],[-20,-17],[-45,-4],[-15,17],[-20,0]],[[31366,7471],[-19,29],[-47,43]],[[31300,7543],[-16,26],[-31,88]],[[31208,7730],[-23,-60],[-16,-13]],[[31169,7698],[-22,29],[-10,5]],[[31062,7783],[-7,14],[4,3],[-5,8]],[[31038,7803],[3,7],[-17,24]],[[31069,7837],[-23,31],[-10,4]],[[31036,7872],[-5,15],[7,7],[-6,5],[-4,10]],[[30981,7876],[-4,-8],[4,-18],[-7,-7]],[[30951,7874],[-69,-14],[-28,4]],[[30854,7864],[-47,-18],[-38,-32]],[[30769,7814],[-27,33],[-37,32],[-7,18],[-2,24],[4,14],[23,37]],[[21897,5484],[117,25],[109,44],[106,23]],[[23311,5921],[164,-511]],[[23475,5410],[156,-180],[103,-84]],[[23734,5146],[233,-277],[216,-282]],[[24238,4512],[526,-752]],[[24764,3760],[-458,-174]],[[22319,3043],[-35,-38],[-97,-71],[-25,9],[-65,-30]],[[21964,2779],[-44,-12],[-26,6]],[[21859,2639],[-31,-79],[3,-33],[-9,-10]],[[21822,2517],[-48,3],[-31,17]],[[21181,2465],[-55,4],[-32,17],[-75,2]],[[20890,2433],[-100,-6],[-25,12],[-41,-2]],[[20537,2435],[-37,18],[-23,28]],[[20477,2481],[-110,-10]],[[19818,3988],[-445,588]],[[19373,4576],[24,55],[31,66]],[[20956,5517],[56,-90],[59,-44],[102,-4]],[[21610,5356],[83,38],[35,4],[169,86]],[[58706,14153],[-95,105],[-208,343]],[[57483,15708],[-23,71],[-27,137]],[[57057,16375],[-12,54],[20,76],[2,33]],[[56905,17065],[-47,15]],[[56906,17185],[20,20],[39,17]],[[57154,17402],[209,204],[28,-17],[16,-47]],[[57407,17542],[20,-7],[11,-16]],[[57820,16948],[17,-14],[23,5],[18,-13]],[[58101,16799],[13,-18],[42,-27]],[[58180,16714],[15,-3],[64,-53]],[[58282,16607],[24,-15],[48,-10]],[[58388,16508],[-7,-23],[-32,-49]],[[58360,16341],[-10,-17],[-2,-28]],[[58312,16269],[-11,-29],[10,5],[54,-44]],[[59378,15840],[51,17],[11,19]],[[60192,14910],[-30,-58],[-24,-84],[3,-17],[20,-26]],[[60232,14648],[124,-52],[44,-10]],[[60400,14586],[47,-31],[32,-121]],[[60479,14434],[-34,-6]],[[59442,14028],[10,-29],[-13,-18],[-313,-222]],[[59062,13880],[-26,39],[-45,49]],[[58991,13968],[-90,63],[-195,122]],[[52299,11753],[-17,-114]],[[52282,11639],[58,-99]],[[51997,11579],[-27,-8]],[[51835,11689],[2,-107]],[[51837,11582],[-19,18]],[[51818,11600],[-32,-32]],[[51715,11483],[35,-32]],[[51750,11451],[39,20]],[[51789,11471],[20,-47]],[[51889,11423],[-38,-100]],[[51851,11323],[-140,13]],[[51711,11336],[-115,-55],[-151,40],[-113,-35]],[[51332,11286],[-127,-6]],[[50860,11323],[-36,19],[-19,36]],[[50805,11378],[12,13],[90,16],[62,-10],[8,16]],[[50958,11424],[4,34],[44,58],[50,-10],[68,28],[-20,74]],[[50824,11964],[11,136]],[[50800,12200],[43,142]],[[50843,12342],[2,92]],[[50902,12658],[11,89]],[[51009,12965],[64,-23]],[[51169,13003],[37,-7],[16,-29],[54,-34],[7,-26],[26,-18]],[[51678,12734],[31,-19],[31,1]],[[51899,12855],[21,34],[17,-29]],[[51994,12883],[17,24],[73,-25]],[[52084,12882],[48,22],[24,-7],[18,-24]],[[52174,12873],[-7,-19],[21,-54],[20,-18],[-18,-18]],[[52190,12764],[17,-14],[0,-20]],[[52306,12725],[40,25],[48,-42],[14,-35]],[[52491,12671],[27,-8],[4,32],[17,19],[25,-5],[47,-74]],[[52910,11892],[-4,-36],[12,-23],[34,11],[75,-91]],[[53213,11696],[58,-49],[36,-60]],[[53856,11337],[40,-42],[50,-24]],[[53946,11271],[103,-32],[31,4],[53,-34],[5,-23],[52,-51],[54,-35]],[[54244,11100],[29,3],[21,-19]],[[54294,11084],[75,21],[45,-64],[45,-8],[8,-66]],[[54467,10967],[66,-46]],[[54533,10921],[31,-74]],[[54564,10847],[24,-10],[-9,-23],[35,-6],[39,-44],[36,-16],[20,-74],[29,-7],[-2,-26],[20,1],[30,-45],[46,-29]],[[54832,10568],[-379,-925]],[[54515,9482],[-27,-80]],[[54488,9402],[23,-11],[-80,-43]],[[54400,9340],[-11,22]],[[54366,9369],[-20,-22],[-31,66]],[[54315,9413],[-36,16]],[[54259,9474],[-31,21],[1,-22]],[[54209,9465],[-1,-35],[-26,-19]],[[54182,9411],[31,-7],[17,-45]],[[54230,9359],[-27,-36]],[[54116,9302],[-42,-28],[-9,-43],[8,-114],[-13,-37],[-35,-47]],[[54025,9033],[-105,-15],[-65,17],[-103,56]],[[53813,9479],[-2,109],[-19,23],[-38,7],[-31,-19],[-3,-42],[-8,-2],[13,-15],[-4,-71]],[[53721,9469],[-74,-128],[-82,-41]],[[53155,9349],[-100,50]],[[53070,9404],[15,113],[-122,94]],[[52984,9675],[-23,111],[-36,28],[-22,-2],[34,-31]],[[52937,9781],[-16,-31],[-27,24]],[[52894,9774],[4,35],[-69,-16]],[[52829,9793],[3,-21],[-12,19]],[[52724,9843],[-18,72],[55,137],[14,24]],[[52775,10076],[17,-4],[10,56],[-8,80]],[[52800,10190],[0,10],[-36,156]],[[52774,10507],[-16,111]],[[52758,10618],[49,120]],[[52807,10738],[4,117]],[[52867,10852],[16,-34]],[[52880,10784],[122,-60]],[[53002,10724],[-4,105]],[[52998,10829],[59,25]],[[53005,10964],[19,31]],[[53074,11053],[-19,19]],[[53009,11080],[-23,104]],[[52871,11423],[-32,94]],[[52793,11576],[-105,-14]],[[52621,11612],[14,67]],[[52607,11737],[26,24]],[[52633,11761],[-84,46]],[[62030,4711],[206,44],[24,1]],[[62657,5107],[977,453]],[[63634,5560],[-167,-453],[-199,-563]],[[63268,4345],[8,-107],[-4,-11]],[[63272,4227],[-23,2],[-34,10],[1,6],[-34,5]],[[63173,3705],[-1,-5],[-10,0]],[[63157,3653],[-9,-26],[-15,-20]],[[63186,3577],[16,-10],[-1,-8],[70,-44]],[[63271,3515],[-10,-50],[-12,-31],[-54,-75]],[[63075,3192],[-14,21],[-43,31]],[[63018,3244],[-28,4],[-32,-7]],[[62930,3254],[-12,18],[-62,54]],[[62856,3326],[-149,-35],[-20,-49],[-96,-130]],[[62591,3112],[-25,18],[-120,63]],[[62446,3193],[-19,-35],[-25,-17],[-85,-14]],[[61848,4266],[26,2],[36,5]],[[63606,9276],[-31,1857]],[[63575,11133],[1575,69],[147,15],[46,56],[137,-19]],[[65480,11254],[55,10],[69,37]],[[65604,11301],[35,-15],[35,-44]],[[65674,11242],[76,-30],[71,26],[99,-12]],[[65920,11226],[47,13],[29,26]],[[65996,11265],[46,-16],[63,34]],[[66105,11283],[24,-3],[423,-296],[-36,-84]],[[66516,10900],[-55,-41],[1,-30],[-57,-10],[22,-100],[40,10],[56,-27],[-30,-36]],[[66493,10666],[18,-97],[-5,-29]],[[66506,10540],[-44,-35],[-48,-65],[-54,-23],[-15,-26]],[[66345,10391],[16,-84],[44,-51],[54,-9],[102,23],[44,-30],[44,-81],[107,97],[37,-19],[241,-12]],[[67034,10225],[75,-47],[74,-71],[35,-15]],[[67218,10092],[218,69]],[[67436,10161],[22,19],[51,104]],[[67509,10284],[55,22],[596,-187]],[[68160,10119],[-55,-204],[0,-118],[-120,-220],[-54,-59],[-159,-267],[26,-100],[-34,-241],[-103,-204],[-189,-126],[-308,-410],[1,-63],[-105,-221],[-38,-49],[34,-112],[-8,-208],[-115,-267],[-15,-118],[-312,-502],[-130,-134],[-75,-101],[-154,-66],[-97,-168],[-159,-174],[-126,-60],[-44,-71],[-127,-145],[-167,-709]],[[63634,5560],[-17,2125],[-11,1591]],[[61042,3355],[175,264]],[[61217,3619],[184,-4]],[[61462,2920],[34,-32]],[[61497,2868],[97,-141]],[[62042,2814],[22,14]],[[62064,2828],[190,29]],[[62274,2868],[19,-18]],[[62446,3193],[145,-81]],[[63735,1389],[-5,-539],[7,-321],[-9,-99],[3,-322]],[[63731,108],[-3115,1]],[[60643,330],[13,218],[64,688]],[[60720,1236],[105,1048],[78,763]],[[60903,3047],[11,23],[131,274]],[[26581,1149],[73,63],[23,-11]],[[26869,1243],[22,-23],[9,36]],[[27013,1417],[67,53]],[[27155,1753],[28,22],[-12,54]],[[27146,1850],[-43,6],[-8,20],[2,78]],[[27193,2138],[-49,62],[30,9]],[[27174,2209],[42,57],[54,37]],[[28094,3215],[13,25],[18,11],[52,-6]],[[28787,3588],[69,11],[14,22],[5,46]],[[30294,3428],[91,-28],[67,-62]],[[30485,3060],[30,-55],[101,-82],[44,-64],[2,-40]],[[30479,2772],[-104,5],[-13,-22]],[[30561,18],[-2036,17],[-2677,154]],[[25756,569],[-23,155],[27,21]],[[25961,1228],[49,41],[9,25]],[[25992,1340],[118,15]],[[26326,1253],[16,-6],[29,-52],[-8,-45]],[[26417,1132],[47,-18],[40,22],[49,33],[28,-20]],[[36240,13374],[53,14],[37,7],[43,-12]],[[36400,13458],[16,7],[4,-1],[6,9],[4,-6]],[[36440,13495],[20,-7],[44,11]],[[36676,13561],[-2,-51],[-19,-95],[-4,-40]],[[36651,13375],[20,-1],[16,-6]],[[36687,13368],[-2,-2],[-24,5],[-5,-2],[-8,3],[-1,-3],[-15,-3]],[[36632,13366],[3,-25],[-4,-5],[7,-26]],[[36608,13295],[-8,-32],[-7,2],[-10,-25]],[[36574,13214],[-71,-103],[0,-14],[-57,-98]],[[36446,12999],[27,-22],[37,-26],[-3,-6]],[[36507,12945],[-8,9],[-6,0],[-5,6],[-9,5],[-9,11],[-18,9]],[[36451,12964],[-27,-22],[-10,2],[-10,-3]],[[36404,12941],[1,-18],[5,3],[4,-12]],[[36300,12848],[-14,23],[-14,32],[-22,17],[7,5]],[[36257,12925],[-20,16],[-5,-2],[-11,19]],[[36221,12958],[18,10],[23,26],[23,21]],[[36285,13015],[2,12],[-2,28],[-3,8],[-5,4],[-1,7],[-5,11],[-3,16]],[[36276,13125],[23,17],[9,12],[6,12],[2,2],[2,7],[7,7]],[[36325,13182],[26,-7],[7,3]],[[36329,13194],[0,5],[-18,19]],[[36311,13218],[-3,1],[-11,-11],[-8,-4],[-19,3]],[[36270,13207],[-4,11],[2,27],[2,10],[5,-1],[1,14]],[[36232,13339],[2,20],[2,1],[4,6],[0,8]],[[51042,16261],[1569,1933]],[[52611,18194],[590,770]],[[53201,18964],[41,-43],[43,-3]],[[53285,18918],[104,99],[63,15],[66,-76],[114,-32]],[[53632,18924],[83,-91],[83,72],[46,14]],[[53844,18919],[32,-42],[-34,-114],[10,-43],[20,-10],[88,8]],[[53960,18718],[28,31],[11,76],[-13,89],[25,71],[187,30],[20,-4]],[[54218,19011],[32,-59]],[[54250,18952],[137,-3],[43,-33]],[[54434,18894],[-17,-45]],[[54417,18849],[-21,-12],[-137,-25]],[[54259,18812],[-58,-36]],[[54285,18580],[-107,-192]],[[54178,18388],[7,-62]],[[54185,18326],[127,-38]],[[54369,18298],[24,34]],[[54560,18347],[119,-100]],[[54739,18162],[114,-81],[74,-25]],[[54927,18056],[94,53],[48,3],[169,-82]],[[55268,17992],[28,-76],[51,-26]],[[55347,17890],[22,-178]],[[55360,17707],[42,4]],[[55340,17564],[-27,4]],[[55172,17570],[-48,21]],[[55112,17285],[-70,-25]],[[55042,17260],[-9,-59]],[[54965,17146],[-47,-6],[-28,-33]],[[54890,17107],[19,-54],[34,-29]],[[54938,17001],[36,-40]],[[54978,16938],[92,-33],[33,-44]],[[55247,16664],[49,-59]],[[55320,16367],[44,36]],[[55364,16403],[117,-58]],[[55632,16254],[47,-22],[34,-67]],[[55713,16165],[-37,-52],[31,-46]],[[55706,16033],[40,-125],[-12,-77]],[[55734,15831],[-18,40],[-68,5],[-43,-42]],[[55137,15894],[-28,20],[-43,-6],[-64,-62],[-74,-12],[-130,-155],[-7,-18],[26,-32],[-26,-19]],[[54753,15237],[99,-79],[-31,-37],[-17,7],[-12,34],[-44,-38],[2,-32],[42,9]],[[54809,15083],[-5,-59],[-51,-30]],[[54705,15020],[-51,-40],[-23,32]],[[54229,14957],[7,-110],[-30,-53],[-93,-84]],[[54113,14710],[-152,-226],[-68,-2]],[[53873,14403],[-132,-155],[-201,-185],[-25,-47],[-105,-103]],[[53413,13881],[-35,-4]],[[53346,13945],[-79,29],[-1,-26]],[[53237,13876],[-34,0],[-12,-18],[0,-71]],[[53191,13787],[-15,-35],[-31,-16],[-93,30]],[[52922,13843],[84,-18],[23,29],[-63,41]],[[52966,13895],[24,142],[-59,28],[-35,-32]],[[52896,14033],[-50,22],[-52,50]],[[52713,14567],[10,34],[-6,37]],[[51795,15348],[-43,-23],[-13,-30],[-17,-7]],[[51566,15630],[-52,92],[-50,35],[-29,-22],[-10,-56]],[[51425,15679],[-46,-18],[-58,11],[-86,57],[-46,-14]],[[51189,15715],[-26,-49],[-34,-9],[-18,12],[-2,22],[36,79],[-36,22]],[[51104,15832],[-24,23],[-50,-26]],[[51030,15829],[-40,8],[-6,41]],[[50899,15992],[4,119],[139,150]],[[40933,7388],[135,-39]],[[41068,7349],[18,9],[122,169]],[[41208,7527],[126,127],[108,-7]],[[41442,7647],[89,-88]],[[41531,7559],[104,43]],[[41635,7602],[15,-32]],[[41650,7570],[42,-16],[61,57]],[[41753,7611],[25,90],[32,40],[25,-5],[32,17]],[[41867,7753],[50,-9]],[[41917,7744],[111,63]],[[42028,7807],[33,38],[76,26]],[[42137,7871],[-14,-151],[-61,-164]],[[42077,7475],[-14,-27],[2,-31],[-21,-38],[18,-35],[35,-18]],[[42322,7271],[119,-3]],[[42441,7268],[45,-21],[27,-61]],[[42500,7136],[31,-140]],[[42866,6732],[19,-25],[30,-4]],[[42915,6703],[46,-34],[51,10]],[[43046,6734],[48,24],[178,19],[18,-76],[16,-27]],[[43391,6683],[36,-9],[112,-93],[4,-20]],[[43543,6561],[43,-44],[67,-142]],[[43773,6113],[57,-61],[28,15],[73,-24],[83,14],[94,-83]],[[44108,5974],[39,14],[-192,-909]],[[42225,2001],[-86,113],[-63,57],[-23,56],[105,177],[39,23],[40,1],[30,57]],[[42267,2485],[-9,37],[-107,188]],[[42125,2798],[3,53],[19,50]],[[42112,3122],[-20,30],[-4,34]],[[42110,3239],[123,49],[34,44],[-3,66],[-31,98],[-28,54],[-92,29],[-32,23],[-29,49]],[[41784,4056],[-74,65],[-148,95],[-14,27],[3,46],[22,30],[129,33]],[[41752,4427],[-18,57],[-49,92]],[[41663,4776],[7,96],[-38,187]],[[41632,5059],[8,55],[-5,23],[-79,64]],[[41491,5169],[-13,-62],[27,-36],[51,-31]],[[41556,5040],[17,-79],[-41,-31],[-43,6],[-44,29],[-68,-26]],[[41341,4610],[-81,-30],[-72,23],[-15,101]],[[40764,4919],[-100,25],[-120,6]],[[40377,4852],[-50,1],[-35,28],[-16,42],[1,41]],[[40273,5234],[-18,119]],[[40255,5353],[117,335],[561,1700]],[[54994,10381],[-31,14],[15,70]],[[54995,10483],[-4,28],[-45,-8]],[[54918,10461],[-28,-8],[-9,69]],[[54834,10538],[-2,30]],[[54564,10847],[-6,33],[-24,22],[-1,19]],[[54533,10921],[-21,26],[-45,20]],[[54467,10967],[-3,61],[-55,18],[-11,23]],[[54401,11091],[-25,34],[-9,36],[-19,-13],[-4,26],[8,15],[100,40]],[[54452,11229],[84,111],[16,39]],[[54889,11736],[62,-31],[40,2],[66,-25]],[[55057,11682],[65,-6],[19,13]],[[55219,12063],[32,-1],[11,-13]],[[55282,12075],[53,-34]],[[55566,11982],[3,-25],[-22,-88]],[[55556,11827],[60,-69],[34,-20],[78,12],[12,57]],[[55919,11728],[72,-93],[30,-20]],[[56021,11615],[39,6],[35,-22],[68,-4]],[[56164,11575],[-54,-65],[-2,-29],[56,-67],[56,-35],[108,-28],[24,4],[35,28]],[[56469,11392],[16,18],[4,33]],[[56392,11520],[-12,11],[-1,21]],[[56379,11552],[73,45],[76,22]],[[56607,11618],[26,-30],[19,-77],[36,-47]],[[56688,11464],[16,-97],[-25,-91]],[[56679,11276],[-133,-87],[-20,-36]],[[56723,11062],[49,-3],[22,26],[11,75],[-1,153],[42,48],[153,73],[110,-7],[34,-31]],[[57143,11396],[5,-22],[-25,-162],[52,-40],[46,0]],[[57373,11240],[23,36],[-5,41],[-68,146],[-2,52],[103,52],[96,-19],[38,-51]],[[57558,11497],[-9,-89],[-85,-221]],[[57533,10920],[50,34],[161,166]],[[57744,11120],[49,117],[30,10]],[[57823,11247],[27,-13],[35,-47],[75,-173],[55,-93],[64,-61]],[[58102,10707],[146,-70],[130,-103],[60,-75],[65,-161]],[[58347,10204],[-1,-69]],[[58330,10114],[37,-54]],[[57946,10057],[-134,60]],[[57287,9912],[-56,8],[-7,-37]],[[57181,9395],[-13,-1],[-36,-90]],[[57132,9304],[-91,55]],[[57010,9391],[13,41]],[[57028,9501],[-76,45],[-28,-8],[-18,-27]],[[56889,9419],[-78,-53],[-20,8]],[[56791,9374],[-6,23],[2,90]],[[56787,9487],[62,60],[10,43],[-34,72]],[[56478,9784],[-17,-33]],[[56461,9751],[-42,-32]],[[56056,9880],[-32,-30]],[[55918,9899],[-40,11]],[[55854,9904],[-15,-27]],[[55806,9918],[12,4]],[[55807,9959],[-42,0]],[[55765,9959],[-32,38]],[[55707,9993],[-26,19]],[[55664,9998],[-66,-3]],[[55598,9995],[1,17]],[[55578,10014],[-63,-14],[-44,50]],[[55284,10261],[-6,46]],[[55135,10368],[-5,32],[-48,-6]],[[61975,7228],[682,1],[963,10]],[[63620,7239],[5,-826]],[[63625,6413],[-968,-18],[-217,1]],[[62440,6453],[-83,-34],[-47,-26]],[[61589,6309],[-47,43],[-14,-2],[-8,-19]],[[61466,6296],[-25,14],[-5,-22],[-5,-1],[-34,73],[-23,71],[-7,2],[-44,108]],[[61323,6541],[-16,-21],[-4,-23]],[[61303,6590],[-4,14],[-13,13],[-13,22]],[[61289,6752],[-7,38],[-2,47]],[[61280,6837],[30,24],[143,107]],[[22703,8337],[22,17],[17,6]],[[22742,8360],[53,-15],[193,40],[58,17],[10,7],[-2,10],[102,53],[100,37],[75,56],[94,50],[161,147],[110,120],[149,80],[-285,412],[170,306],[-21,60],[2,36],[16,47],[33,57],[18,-25],[43,-6],[50,-37],[18,2],[27,29],[32,-8],[7,-16],[205,-180],[30,-14],[20,-28],[-7,-26],[11,-41],[27,3],[26,-28],[128,-13],[7,-44],[54,-64],[58,-139],[87,28],[39,27],[32,7],[23,23],[45,-2],[50,39],[36,4],[45,30],[18,-10],[18,31],[24,12],[37,-7],[7,22],[87,43],[65,56],[28,3],[37,31],[39,16],[92,66],[148,84],[36,34],[55,16],[76,60],[-4,21],[25,20],[32,14],[17,-4],[19,14],[31,0],[5,29],[45,39],[140,75],[74,58],[47,58],[25,0],[12,28],[169,118],[79,42],[67,13],[61,-8],[21,8],[17,27],[75,-3],[41,27],[30,-8],[31,34],[156,-266],[-37,-144],[21,-108],[162,-135]],[[26999,9807],[311,-970]],[[27356,8606],[-151,-132],[-137,-102],[-93,-90],[-79,-40]],[[26537,8057],[-303,-78],[-158,-72]],[[25955,7870],[-76,-50],[-59,-11],[-202,-108],[-278,-104]],[[24755,7302],[-148,-44]],[[23891,6797],[-90,-52]],[[23469,7099],[-708,772],[-309,296]],[[52683,8178],[7,-2],[66,-20]],[[52724,8201],[7,23],[-4,28]],[[52727,8252],[16,7],[78,-16]],[[52842,8254],[8,-5],[4,1],[15,-11],[6,-5],[6,-10]],[[52881,8224],[6,-13],[5,-41],[2,-9],[7,-11]],[[52925,8126],[10,-1],[15,3]],[[52950,8128],[13,8],[2,4]],[[52965,8140],[-1,15],[3,12]],[[52967,8167],[-16,8],[-12,2],[-10,8]],[[52929,8185],[1,7],[5,4],[-2,8],[-7,8],[-2,7]],[[52924,8219],[11,22],[6,9]],[[52941,8250],[8,4],[23,8]],[[52972,8262],[14,-2],[11,-8],[11,-4],[12,0]],[[53020,8248],[2,6],[-3,13],[6,12],[2,12],[5,7],[5,2]],[[53037,8300],[7,0],[25,-8],[20,-16],[9,-1],[7,-4],[22,-8]],[[53127,8263],[7,5],[6,15],[5,18],[4,25],[8,17],[4,16],[12,34],[7,14]],[[53219,8424],[0,-20],[-2,-14],[1,-5]],[[53218,8385],[2,-4],[25,-29],[6,-15],[-1,-7],[-5,-7],[-1,-18],[1,0],[1,-5],[9,-10],[5,-9],[7,-7]],[[53267,8274],[0,-5],[4,-7],[-2,-20]],[[53269,8242],[-14,-20],[-6,-3],[-20,-18],[-14,-4],[-33,-20],[-3,0],[-5,-7],[-9,-4]],[[53165,8166],[-7,-8],[-22,-46]],[[53136,8112],[2,1],[3,5],[-4,-17],[-11,-21],[-2,-14]],[[53124,8066],[0,-25],[2,-33],[-3,-28],[1,-33],[-2,-42],[2,-37],[-7,-33]],[[53117,7835],[-11,-20],[-8,-10],[-20,-17]],[[53078,7788],[-7,-2],[-53,-3],[-16,-11],[-3,-4],[-6,-2]],[[52993,7766],[-31,4],[-6,6],[-10,-1]],[[52946,7775],[-13,-7],[-10,-13],[0,-7],[-15,-18]],[[52908,7730],[-12,-5],[-6,-7]],[[52890,7718],[-7,-5],[-10,-3]],[[52873,7710],[-6,-6],[-26,6],[-5,-4],[-16,-2]],[[52820,7704],[-9,-7]],[[52820,7781],[0,7],[-9,23],[-10,42]],[[52801,7853],[20,104],[8,49],[-3,20]],[[52826,8026],[-5,11],[-10,10],[-4,1],[-1,3],[-13,11]],[[52793,8062],[-14,-16],[-2,0],[-5,8],[-3,-3],[0,-2],[3,-8],[-1,-4],[-11,5],[-2,-1]],[[52758,8041],[-1,-2],[1,-7],[10,-5]],[[52760,8023],[-34,72],[-43,62]],[[52683,8157],[-1,15],[1,6]],[[65996,11265],[-76,-39]],[[65674,11242],[-70,59]],[[65604,11301],[-124,-47]],[[63575,11133],[-174,922]],[[63401,12055],[-633,2907],[944,468],[613,277],[495,-1],[419,-82],[-76,-437],[588,50],[690,10],[334,324],[481,148],[112,9],[220,-66],[81,-46],[67,17],[-4,221],[84,140],[73,-38],[6,20],[-42,75],[70,59],[9,48],[3163,362],[702,12],[-636,-1070],[-280,-627],[-237,-411],[-77,-84],[-217,-171],[-187,-56],[-169,2],[-115,35],[-131,82],[-66,1],[-370,-552],[-114,-358],[-108,-159],[-173,-403],[-69,-190],[2,-117],[-23,-129],[-59,-133],[-66,-84],[-72,-264],[72,-119],[40,-117],[13,-154],[-25,-159],[-92,-198],[-120,-136],[-208,-357],[-135,-323],[-15,-162]],[[67509,10284],[-73,-123]],[[67218,10092],[-184,133]],[[66345,10391],[161,149]],[[66506,10540],[-13,126]],[[66516,10900],[36,85],[-408,290],[-39,8]],[[42473,22946],[-45,-30]],[[42293,22585],[-48,-229]],[[42186,22160],[-131,-267]],[[42554,21620],[121,-120]],[[42821,21343],[46,-55]],[[43053,21228],[122,-35]],[[43317,20961],[31,39]],[[43787,20909],[-7,-64]],[[43780,20845],[-55,-56],[4,-46]],[[43729,20743],[-44,-30]],[[43685,20713],[-7,-41],[-25,-34],[-57,-44],[-57,7],[-25,-133]],[[43514,20468],[-34,-21],[-34,-79]],[[43446,20368],[31,-35]],[[43477,20333],[-78,-37]],[[43399,20296],[-91,-15]],[[43308,20281],[-19,-28]],[[43289,20253],[12,-42]],[[43301,20211],[-21,-22],[-6,-44],[-63,-41]],[[43211,20104],[24,-142]],[[43235,19962],[-68,-56],[-48,-3]],[[43119,19903],[-21,-30]],[[43098,19873],[-102,-1]],[[42996,19872],[-12,-27],[-56,-10],[-40,-44],[-25,-2]],[[42863,19789],[-21,-49]],[[42842,19740],[-27,-17]],[[42815,19723],[-11,-84]],[[42804,19639],[-150,-43]],[[42654,19596],[-73,-40]],[[42581,19556],[-54,-89]],[[42527,19467],[-42,-13]],[[42485,19454],[-98,34]],[[42387,19488],[-61,-78]],[[42326,19410],[-40,-111],[27,-74]],[[42265,19180],[95,-59]],[[41759,18800],[-2,-28],[-84,-103],[-49,-28],[-59,-121]],[[41565,18520],[-549,484],[-430,407]],[[40476,19533],[-48,23],[-33,42]],[[37557,21536],[29,32],[-4,45],[91,90],[17,43],[14,75],[-34,50],[43,184],[37,36],[22,48],[-2,32],[127,184],[27,93],[57,75],[27,16],[0,67],[26,60],[37,37],[44,114],[-13,22],[4,65],[42,62],[-10,44],[36,113],[45,69],[27,84],[43,40],[66,189],[46,9],[9,35],[24,14],[38,-15],[37,10],[44,-39],[114,40],[5,92],[37,63],[30,142],[-55,66],[-18,106],[54,156],[2,76],[61,159],[44,55],[13,63],[124,138],[17,119],[34,19],[-1,60],[-33,55],[5,30],[71,72],[138,-13],[25,13],[36,72],[-9,118],[36,28],[2,68],[110,65],[35,142],[28,40],[-10,59],[53,52],[2972,-2728]],[[40447,20805],[168,10]],[[40707,20823],[200,74],[-25,24]],[[40882,20921],[50,139]],[[40932,21060],[-12,50]],[[40920,21110],[-72,50]],[[40848,21160],[9,62]],[[40857,21222],[-11,66]],[[40846,21288],[-118,-37]],[[40539,21560],[-3,105]],[[40536,21665],[-24,-22]],[[40512,21643],[-56,-126]],[[40456,21517],[-69,-231]],[[40387,21286],[-98,43]],[[40289,21329],[-63,-83]],[[40226,21246],[-62,-159]],[[40164,21087],[53,-33]],[[40217,21054],[58,-113]],[[40275,20941],[-31,-21]],[[40244,20920],[13,-15]],[[40257,20905],[-17,-55]],[[40260,20836],[-76,-114]],[[40184,20722],[-41,-117]],[[40143,20605],[28,-45]],[[40246,20589],[132,-21]],[[40378,20568],[22,146]],[[40446,20778],[-13,20]],[[60985,10293],[5,16],[-4,21],[4,34]],[[60990,10364],[-8,31],[-12,17]],[[61071,10824],[47,6]],[[61118,10830],[25,-16],[24,-29]],[[61194,10778],[36,2],[38,21],[26,37],[0,46],[19,91]],[[61313,10975],[41,84],[76,-47]],[[61465,11000],[29,-1],[71,19]],[[61923,10831],[45,-21],[36,-5]],[[62074,10832],[18,20],[22,50],[37,56]],[[63606,9276],[7,-1034]],[[63613,8242],[-956,-35],[-463,-7]],[[61364,9471],[-18,98],[-7,88]],[[61327,9694],[-102,15],[-214,49]],[[61006,10056],[-29,31],[-1,11]],[[61033,10140],[-7,19],[-1,23]],[[60996,10228],[3,8],[-7,11],[5,10],[-2,25],[-10,11]],[[45787,12171],[78,611],[40,22],[54,61],[27,149],[24,44]],[[46096,13148],[186,144],[69,89],[70,37],[96,18],[231,-123],[82,-76]],[[46830,13237],[76,-102],[101,-38]],[[47007,13097],[8,-24],[41,-28]],[[47056,13045],[42,-54],[16,-28],[17,-60]],[[47038,12742],[-69,-58],[-13,-41],[3,-37],[17,-29],[25,-17],[43,-5],[72,9]],[[47161,12545],[55,-46],[62,-85],[-26,-2],[-45,-52]],[[47207,12360],[11,-23],[-7,-22],[-33,-13],[20,-39]],[[47198,12263],[-15,-33],[-19,-14]],[[47164,12216],[-15,10],[-17,-9],[26,-14],[-17,-24],[12,-24],[-34,-35],[27,0],[3,-37],[-18,-30],[9,-11]],[[47140,12042],[-366,-1882]],[[46774,10160],[-51,52],[-15,4],[-31,-38],[-23,-10],[-29,-32]],[[46448,10027],[-52,8],[-35,19]],[[46148,9631],[-35,-42],[-34,-23]],[[46002,9394],[-32,-5],[-33,-20]],[[45917,9219],[-39,-65],[-75,-57]],[[45803,9097],[-101,18],[-10,-7],[-1,-51]],[[45704,8918],[-21,4],[-95,57]],[[45408,8811],[13,-93],[-7,-13],[-58,11]],[[45256,8617],[-37,-39],[-52,-36],[-96,-1]],[[45063,8626],[-57,12],[-4,15],[-9,-1],[-59,-72]],[[44885,8506],[-20,14],[-20,-1]],[[44494,8616],[-18,4],[-2,12],[-18,12]],[[44429,8639],[-14,23],[-12,47]],[[44403,8709],[-55,-10],[-69,38],[-44,5],[-31,-11],[-23,-31]],[[43992,8868],[-28,14],[266,490],[665,1217]],[[52601,7455],[-1,9],[-12,41]],[[52588,7505],[-5,2],[-33,-4]],[[52550,7581],[22,-3]],[[52572,7578],[13,6],[5,-1],[34,11],[20,1],[7,6],[14,2]],[[52665,7603],[3,2],[-1,5],[3,3],[5,12],[25,17],[7,17]],[[52707,7659],[26,1],[22,13],[4,7],[11,5],[14,10],[3,0],[3,-7],[3,0],[27,16]],[[52873,7710],[17,8]],[[52908,7730],[12,14]],[[52920,7744],[17,13],[27,-6],[16,0],[27,12],[13,9],[8,2],[4,-1],[6,-21]],[[53038,7752],[33,1],[16,8]],[[53087,7761],[22,19],[24,25],[12,16],[2,8]],[[53147,7829],[13,-4],[7,2],[7,-4],[7,0],[13,-9],[11,-1]],[[53205,7813],[10,-12],[7,0],[7,-8],[11,-5],[2,-5],[17,-7],[22,-20]],[[53281,7756],[2,-6],[-4,-5],[1,-9]],[[53337,7575],[13,-13],[1,-16]],[[53351,7546],[16,-4],[2,5],[17,-5]],[[53393,7489],[14,-10],[13,4]],[[53417,7455],[15,-5],[0,-6],[29,-4]],[[53463,7411],[56,-68],[3,4]],[[53522,7347],[1,-17],[13,-27]],[[53406,7045],[-34,-7],[-7,-3],[-1,-9],[-65,-18]],[[53296,7017],[-25,-2],[0,-7],[-8,0]],[[53245,7049],[-43,-1],[-11,10],[-40,-6]],[[53151,7052],[3,32],[-7,28]],[[53077,7052],[-60,-21],[-34,-23],[-70,-5]],[[52913,7003],[-10,-18],[-42,-33]],[[52861,6952],[-36,-2],[-4,6]],[[52755,6935],[-4,36],[0,57]],[[52561,7197],[0,-2],[-27,6],[-45,-16],[-2,3],[83,104]],[[42292,19313],[9,29],[18,23],[7,45]],[[42387,19488],[78,-17],[20,-17]],[[42527,19467],[18,13],[36,76]],[[42581,19556],[58,26],[15,14]],[[42654,19596],[30,2],[120,41]],[[42804,19639],[2,63],[9,21]],[[42842,19740],[23,31],[-2,18]],[[42996,19872],[36,6],[26,-8],[40,3]],[[43098,19873],[16,8],[5,22]],[[43235,19962],[-9,19],[-3,74],[-12,49]],[[43301,20211],[-10,16],[-2,26]],[[43308,20281],[37,13],[54,2]],[[43399,20296],[47,18],[12,17],[19,2]],[[43477,20333],[-26,14],[-5,21]],[[43514,20468],[-2,23],[12,19],[2,50],[8,32],[14,17],[36,-16],[17,4],[70,64],[14,52]],[[43685,20713],[34,29],[10,1]],[[43729,20743],[-12,30],[43,64],[20,8]],[[43780,20845],[0,54],[22,34]],[[43802,20933],[17,70],[22,17],[26,8]],[[43984,21332],[27,46],[15,13]],[[44041,21467],[25,43]],[[44105,21441],[8,-42],[24,-61]],[[44137,21338],[12,-12],[20,-4]],[[44226,21069],[-5,-8],[6,-23],[-5,-35]],[[44202,20616],[35,-25],[33,-10]],[[44279,20267],[28,-8],[21,-46]],[[44328,20213],[20,-4],[30,-26]],[[44424,20089],[-1,-12],[16,-28],[4,-40]],[[44443,20009],[27,-32],[3,-14],[20,-10],[20,-26],[40,-22]],[[44815,19737],[2,-10],[-15,-44]],[[44837,19652],[3,-14],[-9,-27]],[[44866,19556],[-25,10],[-35,1]],[[45072,19276],[1,-19],[11,-13]],[[45157,19232],[32,-21],[27,1]],[[45232,19256],[31,-14],[16,-17]],[[45314,19273],[34,7],[25,-6]],[[45373,19274],[6,27],[10,6],[41,-41]],[[45430,19266],[37,-24]],[[44768,18277],[-173,66],[-57,13]],[[44538,18356],[-88,46],[-106,42],[-1373,559]],[[30117,8347],[-14,16],[-3,9]],[[30178,8361],[10,9],[52,21],[48,16],[23,11]],[[30311,8418],[22,15],[66,57]],[[30399,8490],[-20,31],[2,2],[-2,7]],[[30379,8530],[2,4],[9,2],[8,-2],[1,-3],[7,1]],[[30406,8532],[5,22],[-3,17]],[[30423,8571],[0,-29],[9,-23]],[[30455,8539],[-4,23],[-3,7],[4,4]],[[30452,8573],[7,0],[16,-19]],[[30604,8635],[22,9],[46,13],[16,7]],[[30688,8664],[19,16],[22,31]],[[30729,8711],[16,-21],[10,-38],[19,-39]],[[30774,8613],[5,-26],[-2,-22]],[[30777,8565],[6,-6],[3,1],[4,-6],[35,-21]],[[30851,8478],[-1,-48],[-1,-13]],[[30819,8346],[11,-10],[1,-4]],[[30831,8332],[0,-2],[-15,2]],[[30817,8305],[2,-12],[10,-7]],[[30826,8284],[3,-35],[-2,0],[2,-15]],[[30853,8240],[16,-9],[1,-3],[4,1],[1,-3]],[[30894,8226],[0,-18],[5,-14],[-1,-23],[-6,-54]],[[30803,8049],[-7,-28],[-2,-3]],[[30760,8018],[-34,10],[-32,-11],[-26,-2],[-14,-20],[-22,-19]],[[30632,7976],[2,-18],[-10,-15],[-2,-14]],[[30622,7929],[-2,-2],[0,4],[-36,-17]],[[30555,7926],[-41,27],[-1,-5],[-20,3]],[[30493,7951],[-3,1],[6,12]],[[30496,7964],[-17,11],[-13,26]],[[30385,7973],[-3,11],[-12,3],[-3,17],[-3,-2],[-4,5]],[[30360,8007],[7,4],[3,-5],[7,4]],[[30373,8027],[-3,-3],[-13,2],[-3,9],[2,6],[-30,14]],[[30326,8055],[-1,7],[12,21],[12,10],[-4,9],[7,10]],[[30319,8133],[5,11],[-10,8]],[[30290,8174],[5,1],[-2,8],[8,15]],[[30281,8194],[-8,29],[-4,21]],[[30222,8246],[-39,-22],[-58,-27]],[[30077,8206],[-6,15],[-11,-4]],[[30060,8217],[-3,11],[7,2],[-6,14]],[[30036,8274],[-39,21],[-1,2]],[[29996,8297],[2,2],[31,16],[88,32]],[[23017,1402],[20,40],[9,9],[22,0],[7,7],[3,7]],[[23066,1527],[16,5],[12,-1]],[[23158,1435],[-12,19]],[[23146,1454],[11,-7],[7,2],[1,11],[-9,22],[-7,22],[1,7]],[[23150,1511],[27,39],[29,23],[6,2],[5,-1],[4,-5],[-2,-15]],[[23219,1554],[9,-6],[17,-21]],[[23245,1527],[4,0],[10,9],[12,9],[7,15],[-11,0],[-4,24]],[[23263,1584],[1,2],[3,16],[5,16],[-1,15],[3,15]],[[23286,1650],[-3,5],[-4,14],[0,21],[1,5]],[[23270,1704],[12,6],[2,-3],[8,5],[3,-4],[8,4],[13,3],[13,-2]],[[23329,1713],[9,-12],[2,-13],[11,-22]],[[23366,1659],[-2,-1],[9,-17],[-6,-4],[5,-13]],[[23435,1643],[-5,6],[-3,12]],[[23427,1661],[-7,0],[-2,-6],[-4,1],[-2,7],[-10,-4]],[[23402,1659],[0,18],[-10,0],[0,14]],[[23392,1691],[28,14],[25,0],[48,20]],[[23610,1683],[-40,-79],[-57,-107]],[[23403,1369],[3,-1],[7,7],[3,-7]],[[23416,1368],[-9,-5],[0,-2],[-9,0]],[[23299,1217],[-26,-36],[-1,1]],[[23240,942],[-14,5],[-14,0],[-37,-10],[-20,2]],[[23155,939],[2,5],[-6,15],[0,10],[0,6]],[[23077,1162],[0,4],[-62,30]],[[23015,1196],[-9,55],[-3,11],[-7,11]],[[22996,1273],[4,86],[11,18],[6,25]],[[47164,12216],[22,20],[12,27]],[[47207,12360],[41,48],[30,6],[32,-56],[34,-38],[155,-67],[117,-14]],[[47701,12253],[54,-9],[72,-40]],[[47827,12204],[62,-62],[138,-91],[68,-12]],[[48095,12039],[154,15],[63,41]],[[48346,12146],[18,69],[-11,66]],[[48308,12363],[-26,19],[-16,40],[-7,45],[13,50],[52,112],[33,44],[158,110],[53,12],[44,-8],[36,-25],[64,-167],[49,-64],[172,-109]],[[49309,12154],[72,-103],[6,-38],[-24,-63],[1,-21],[17,-35],[25,-21],[53,-26],[65,10]],[[49636,11916],[208,2],[43,-10],[43,-25],[74,-103]],[[49594,10208],[3,-87],[-12,-41],[3,-22]],[[49533,9970],[-5,-21],[6,-11]],[[49534,9938],[-13,-34],[-18,-18],[5,-20],[-5,-19],[-128,-42]],[[49235,9755],[-23,8],[-31,-43],[-18,-3],[-38,41],[-15,-2],[-8,23],[-22,18],[1,36],[21,75]],[[49018,10148],[1,30],[-38,15]],[[48936,10188],[-58,-49],[-31,-39]],[[48847,10100],[-41,-8],[-28,11],[-19,41],[-8,43]],[[48782,10332],[-10,24],[-32,33]],[[48740,10389],[-62,-12],[-60,4]],[[48229,10471],[-26,19],[-28,2],[-25,16]],[[48150,10508],[-63,-6],[-48,16],[-35,-7]],[[47964,10547],[-35,54],[-16,10],[-7,23],[-15,8]],[[47745,10488],[7,-26],[-2,-74],[-11,-44],[-15,-1]],[[47461,10319],[-22,-11],[-39,-44]],[[46839,10057],[-19,39],[-7,48],[-39,16]],[[46774,10160],[205,1053],[161,829]],[[35131,722],[0,10],[-3,0],[2,56]],[[35130,788],[6,0],[31,39],[21,4],[34,30]],[[35222,861],[11,-14],[14,3],[38,-33]],[[35285,817],[18,6],[5,-5],[22,-1]],[[35359,833],[21,-6],[31,12]],[[35438,816],[30,6],[27,-9],[7,7],[13,0]],[[35515,820],[10,-16],[14,-10]],[[35539,794],[5,0],[2,16],[3,0]],[[35657,776],[7,-37],[5,-4]],[[35669,735],[4,1],[0,9],[7,15],[8,2]],[[35688,762],[12,-3],[7,-28]],[[35753,749],[16,-28],[23,-29],[17,-39],[7,-6],[16,3],[5,-7],[52,23],[3,15],[14,11],[-5,6],[-15,-3]],[[35899,738],[5,-7],[48,68]],[[35952,799],[-7,7],[2,51],[40,64],[-6,8],[8,13],[41,46]],[[36030,988],[-5,1],[6,9],[-4,0],[13,22]],[[36020,1034],[30,85]],[[36140,1138],[11,-40],[-7,-2],[-2,-23]],[[36199,1079],[15,-23],[36,-20]],[[36278,1066],[44,-19],[11,1]],[[36371,743],[13,13],[16,2],[2,8]],[[36486,657],[12,7],[2,-12]],[[36500,652],[26,10],[131,16]],[[36674,531],[-2,-17],[6,-12],[1,-42]],[[36679,460],[58,2],[9,12],[17,5]],[[36763,479],[11,-4],[-4,-8],[12,0],[0,-5]],[[36782,462],[38,0],[19,-5],[0,7],[23,2],[0,-6],[19,0]],[[36881,460],[-1,-47],[5,0],[0,-12],[12,0],[-1,-27],[-14,-25],[-2,-22],[-7,-5],[-18,-7],[-17,7],[-9,-3],[-14,5],[-16,-14],[-25,16],[-8,29],[-16,7]],[[36750,362],[-12,-18],[-6,3],[-36,-24],[0,-5]],[[36696,318],[-15,12],[-13,-12]],[[36668,318],[-4,5],[10,9]],[[36655,351],[-10,-6],[-7,9],[-8,-5],[2,-4],[-3,-2]],[[36629,343],[-7,12],[9,7],[-4,5]],[[36605,352],[18,-31],[11,8],[14,-23]],[[36648,306],[-21,-14],[2,-12],[-76,-47]],[[36553,205],[-31,-69],[-25,-42]],[[36497,94],[47,-51],[15,-37]],[[36559,6],[-736,0],[-340,-6]],[[35550,257],[23,63],[7,45],[9,9],[8,25]],[[35597,399],[-38,22],[-55,10],[-69,44],[-22,6]],[[35360,478],[-19,-11],[-30,-27]],[[35311,440],[-26,22],[4,8],[-9,4],[-46,81]],[[35210,565],[4,8],[13,9]],[[35075,682],[-7,9],[4,6],[5,10],[2,15]],[[39875,10676],[-5,6],[5,20]],[[39875,10702],[42,5],[88,-55],[44,-16]],[[40353,10844],[7,38],[-25,70]],[[40306,10994],[1,20],[14,14],[43,16]],[[40364,11044],[43,-19],[43,-5]],[[40530,11126],[40,10],[60,33],[33,-11],[23,-30],[37,-28],[73,-29],[81,-11]],[[40877,11060],[43,15],[21,31],[6,48],[-22,94],[644,-665],[387,-416]],[[42013,10040],[64,-107],[28,-22],[18,-36]],[[42123,9875],[91,-44],[36,-29]],[[42250,9802],[27,-2],[20,15],[27,-3]],[[42447,9758],[38,-6],[40,-21]],[[42486,9597],[18,-27],[26,-20]],[[42559,9395],[9,-17],[7,6],[5,-5],[64,48]],[[42688,9425],[0,51],[5,10]],[[42865,9544],[7,-14]],[[42859,8963],[13,-21],[-53,-49]],[[42769,8837],[-12,7],[-12,-7]],[[42707,8747],[-110,-61],[-31,-43],[-52,-132]],[[42514,8511],[-28,-37],[-12,-5],[-3,-26]],[[42393,8365],[-50,-73],[-32,-65]],[[42028,7807],[-64,-28],[-47,-35]],[[41917,7744],[-18,-5],[-32,14]],[[41753,7611],[-58,-55],[-45,14]],[[41635,7602],[-38,-9],[-66,-34]],[[41442,7647],[-35,11],[-41,-11],[-33,7],[-40,-31],[-85,-96]],[[41208,7527],[-100,-149],[-40,-29]],[[41068,7349],[-410,119],[-10,22],[0,27]],[[40626,7757],[-20,21],[-69,29],[-41,6],[-27,27],[-49,8],[-52,22]],[[40368,7870],[-66,-21],[-64,-38]],[[40238,7811],[-23,13],[-23,0]],[[40192,7824],[-28,-26],[-21,8]],[[40143,7806],[-29,41],[-11,37]],[[40103,7884],[11,113],[-8,21],[3,29]],[[39951,8262],[6,13],[2,73]],[[39855,8596],[-561,1289],[23,20],[12,23]],[[39329,9928],[8,79],[21,46],[28,20],[77,28]],[[39638,10299],[60,55],[63,45]],[[51941,24396],[-7,9],[-19,56]],[[51991,24517],[26,50],[62,96],[62,128],[10,-5],[57,-12]],[[52208,24774],[21,32],[22,23],[-4,6],[28,32],[2,-1],[35,42]],[[52320,24911],[128,-95]],[[52450,24813],[-11,-22],[0,-8]],[[52439,24783],[25,-18],[7,9],[8,-6]],[[52479,24768],[-3,-4],[10,-8]],[[52473,24738],[41,-31],[36,-22]],[[52550,24685],[-15,-83],[-7,-7]],[[52528,24595],[4,-13],[1,0],[2,-32]],[[52493,24435],[2,-30],[-5,-4]],[[52490,24401],[-39,-29],[-5,9],[-24,-23],[-24,-15],[-47,-24],[-14,-3]],[[52337,24316],[-3,9],[1,0],[-38,16],[-14,3],[-10,6],[-1,6],[-3,7]],[[52269,24363],[-13,-3],[-11,2],[-18,10]],[[52207,24353],[-5,9],[-11,-2]],[[52111,24387],[-5,24],[4,8]],[[51999,24368],[-2,-11],[-6,-5]],[[52033,24247],[15,-18],[5,4],[9,-1],[2,-3]],[[52064,24229],[0,-3],[-4,-6],[0,-7]],[[52060,24213],[20,-20],[5,-6],[4,-10]],[[52089,24177],[1,-19],[-3,-15]],[[52087,24143],[-8,-16],[-5,-15],[-11,-13],[-8,-30]],[[51995,24185],[-18,-8],[-9,0]],[[51968,24177],[-15,5],[-7,4],[-10,13],[-7,4],[-22,1]],[[51907,24204],[0,3],[10,13],[13,34]],[[51930,24254],[-1,5],[-5,6],[-13,5],[-13,2]],[[51902,24308],[-16,29],[1,3],[-3,27]],[[51884,24367],[1,0],[8,4],[-2,20],[11,8]],[[52258,24594],[7,-1],[-3,-16]],[[52262,24577],[6,-2],[1,3],[7,1],[-1,-3],[-1,0],[0,-4],[17,-5]],[[52291,24567],[9,0],[-2,15],[17,3]],[[52315,24585],[-2,8],[-8,-1],[0,4],[-6,-1],[-1,2],[-2,0],[1,-5],[-5,0]],[[52292,24592],[-1,6],[5,1],[-4,13]],[[52292,24612],[-9,-1],[1,6],[-19,11]],[[52265,24628],[-2,0],[-5,-34]],[[53892,24005],[-90,46],[-29,46],[-58,-19],[-34,-49]],[[53615,24015],[-39,9],[-11,29]],[[53365,24245],[-43,44],[-32,-29]],[[52430,25069],[-35,11],[-37,-9],[-42,14],[-13,26]],[[52046,25532],[-10,42],[-18,6],[-104,-51]],[[51816,25555],[-19,36],[18,49],[-10,5]],[[51805,25645],[176,241],[1574,2096]],[[53555,27982],[73,-48],[127,-22],[108,-61],[142,-129],[171,-51],[59,-40],[23,-44],[-3,-51],[-66,-93],[-21,-83],[23,-70],[25,-9],[12,-22],[30,-111],[43,-21],[40,-52],[24,36],[18,5],[53,-84],[97,-30],[36,8],[89,-39],[30,17],[45,-9],[62,15],[98,-28],[46,16],[46,-21],[69,-2],[48,-28],[82,-107],[58,-138],[73,-75]],[[55315,26611],[-443,-457]],[[54732,26188],[-46,-114]],[[54686,26074],[39,-89]],[[54725,25985],[91,16]],[[54816,26001],[44,-8],[137,-60]],[[54997,25933],[-7,11]],[[54990,25944],[23,-21]],[[55013,25923],[49,10]],[[55063,25958],[333,-343]],[[55396,25615],[-3,-14],[-91,-36]],[[55302,25565],[-2,12]],[[55300,25577],[-26,0]],[[55274,25577],[-11,-22]],[[55188,25460],[-58,-54],[-4,-24]],[[55158,25326],[-11,-19]],[[55147,25307],[-12,4]],[[55113,25275],[-5,-43]],[[55118,25176],[7,5]],[[55305,25123],[70,29]],[[55381,25135],[91,16]],[[55677,25121],[112,-50]],[[55789,25071],[188,-116]],[[55977,24955],[-8,-492],[-10,-21],[16,-27],[1,-122],[-16,-82],[-24,-45],[-62,-51],[-151,2],[-24,32],[-42,2],[-13,-22],[6,-24],[-75,-43],[-78,-67],[-47,-13],[-159,-140],[-40,-74],[-43,-50],[-33,-266],[1,-33],[28,-28],[-5,-24],[32,-87],[-309,-107],[-117,-21],[-95,-45],[-103,-11],[-184,-140]],[[53992,23948],[-52,16],[-48,41]],[[53538,25656],[-7,-12]],[[53657,25522],[37,-8]],[[53694,25514],[-1,12]],[[53693,25526],[33,1]],[[53783,25485],[-8,25]],[[53775,25510],[43,-4]],[[53818,25506],[4,26]],[[53822,25532],[80,-13]],[[53902,25519],[7,62]],[[53909,25581],[134,-9]],[[54039,25688],[17,11]],[[54056,25699],[-7,36]],[[54059,25784],[-17,68]],[[53866,25918],[-98,-31]],[[53754,25822],[-27,-1]],[[53727,25821],[-14,25]],[[53713,25846],[-28,15]],[[53685,25861],[-134,-23]],[[53551,25838],[-38,-93],[-12,-58]],[[53655,25630],[84,2]],[[53739,25632],[-19,-39]],[[46220,29449],[6,12],[1,9],[8,24]],[[46235,29494],[22,40],[12,20],[11,24],[10,13],[13,26]],[[46303,29617],[58,-20],[36,-10],[19,-4],[90,-31]],[[46506,29552],[7,16],[25,28]],[[46732,29393],[-18,-19],[-8,-12],[-17,-18],[-54,-54],[-20,-26]],[[46615,29264],[-13,-24],[-14,-39],[-12,-26]],[[46576,29175],[-16,-25],[-38,-42],[-21,-31]],[[46446,28940],[-17,-27],[-84,-116]],[[46345,28797],[-6,4],[-2,5],[2,7],[5,7],[2,7],[0,18],[-1,5],[2,11],[-2,3]],[[46345,28864],[-10,9],[-25,18],[-9,6],[-13,5],[-8,6],[-6,1],[-5,-4],[-12,4],[-8,0],[-9,12],[-16,6],[-3,8]],[[46221,28935],[2,5],[-8,39],[3,8],[0,13]],[[46239,29065],[11,90],[1,26]],[[46251,29181],[7,15],[34,90]],[[46292,29286],[-48,22],[-43,30],[-7,6],[0,2]]],"transform":{"scale":[0.00011851414404501583,0.0000899449603345428],"translate":[-83.675395,36.540822]},"objects":{"virginia":{"type":"GeometryCollection","geometries":[{"arcs":[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]],"type":"Polygon","properties":{"geoid":"05000US51135","name":"Nottoway County"},"id":"VA1"},{"arcs":[[33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91]],"type":"Polygon","properties":{"geoid":"05000US51540","name":"Charlottesville city"},"id":"VA2"},{"arcs":[[92,93,94,95,96,97,98,99,100,101,102,103]],"type":"Polygon","properties":{"geoid":"05000US51105","name":"Lee County"},"id":"VA3"},{"arcs":[[104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139],[140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254]],"type":"Polygon","properties":{"geoid":"05000US51161","name":"Roanoke County"},"id":"VA4"},{"arcs":[[255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350]],"type":"Polygon","properties":{"geoid":"05000US51113","name":"Madison County"},"id":"VA5"},{"arcs":[[351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377]],"type":"Polygon","properties":{"geoid":"05000US51103","name":"Lancaster County"},"id":"VA6"},{"arcs":[[378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443]],"type":"Polygon","properties":{"geoid":"05000US51029","name":"Buckingham County"},"id":"VA7"},{"arcs":[[444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491]],"type":"Polygon","properties":{"geoid":"05000US51099","name":"King George County"},"id":"VA8"},{"arcs":[[492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527]],"type":"Polygon","properties":{"geoid":"05000US51091","name":"Highland County"},"id":"VA9"},{"arcs":[[528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,-264,584,585,586,587,588,589,590,591,592]],"type":"Polygon","properties":{"geoid":"05000US51157","name":"Rappahannock County"},"id":"VA10"},{"arcs":[[593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618],[619,620,621]],"type":"Polygon","properties":{"geoid":"05000US51600","name":"Fairfax city"},"id":"VA11"},{"arcs":[[-8,622,-6,623,-4,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,674,675,676]],"type":"Polygon","properties":{"geoid":"05000US51053","name":"Dinwiddie County"},"id":"VA12"},{"arcs":[[677,678,679,680,681,682,683,684,685,686,687,688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,770,771,772,773,774]],"type":"Polygon","properties":{"geoid":"05000US51175","name":"Southampton County"},"id":"VA13"},{"arcs":[[775,776,777,778,779,780,781,782,783,784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830]],"type":"Polygon","properties":{"geoid":"05000US51171","name":"Shenandoah County"},"id":"VA14"},{"arcs":[[831,832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847,848,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923]],"type":"Polygon","properties":{"geoid":"05000US51009","name":"Amherst County"},"id":"VA15"},{"arcs":[[924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967]],"type":"Polygon","properties":{"geoid":"05000US51077","name":"Grayson County"},"id":"VA16"},{"arcs":[[968,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,995,996,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,-111,1017]],"type":"Polygon","properties":{"geoid":"05000US51023","name":"Botetourt County"},"id":"VA17"},{"arcs":[[1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,-395,1047,1048,1049,-391,1050,1051,1052,1053,1054,1055,1056,1057],[1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,-82,1069,1070,1071,1072,-77,1073,1074,1075,1076,1077,1078,1079,-69,1080,-67,1081,1082,-64,1083,1084,1085,1086,1087,1088,1089,1090,-55,1091,1092,1093,1094,1095,-49,1096,-47,1097,-45,1098,-43,1099,1100,1101,1102,-38,1103,1104,1105]],"type":"Polygon","properties":{"geoid":"05000US51003","name":"Albemarle County"},"id":"VA18"},{"arcs":[[1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119,1120,1121,1122,1123,1124,1125,1126,1127,1128,1129,1130,1131,1132,1133,1134,1135,1136,1137,1138,1139,1140,1141,1142,1143,1144,1145,1146,1147,1148,1149,1150,1151,1152,1153,1154,1155,1156,1157,1158,1159,1160]],"type":"Polygon","properties":{"geoid":"05000US51083","name":"Halifax County"},"id":"VA19"},{"arcs":[[1161,1162,1163,-527,1164,1165,1166,1167,1168,1169,1170,1171,1172,1173,1174,1175,1176,1177,1178,1179,1180,1181,1182,1183,1184,1185,1186]],"type":"Polygon","properties":{"geoid":"05000US51017","name":"Bath County"},"id":"VA20"},{"arcs":[[-1176,1187,1188,1189,-1172,1190,1191,-1169,1192,1193,1194,1195,-525,1196,-523,1197,1198,-520,1199,-518,1200,1201,1202,1203,-513,1204,1205,-510,1206,-508,1207,-506,1208,1209,-503,1210,1211,-500,1212,1213,1214,-496,1215,1216,1217,1218,1219,1220,1221,1222,1223,-1034,1224,1225,-1031,1226,1227,1228,-1027,1229,-1025,1230,1231,-1022,1232,-1020,1233,1234,1235,1236,1237,1238,1239,1240,1241,1242,1243,1244,1245,1246,1247,1248,1249,1250,1251,1252,1253,1254,1255],[1256,1257,1258,1259,1260,1261,1262,1263,1264,1265,1266,1267,1268,1269,1270,1271,1272,1273,1274,1275,1276,1277,1278,1279,1280,1281,1282,1283,1284,1285,1286,1287,1288,1289,1290,1291,1292,1293,1294],[1295,1296,1297,1298,1299,1300,1301,1302,1303,1304,1305,1306,1307,1308,1309,1310,1311,1312,1313,1314,1315,1316,1317,1318]],"type":"Polygon","properties":{"geoid":"05000US51015","name":"Augusta County"},"id":"VA21"},{"arcs":[[1319,1320,1321,1322,1323,1324,1325,1326,1327,1328,1329,1330,1331,1332,1333,1334,1335,1336,1337,1338,1339,1340,1341,1342,1343,1344,1345,1346,1347,1348,1349,1350,1351,1352,1353,1354,1355,1356,1357,1358,1359,1360,1361,1362,1363,1364,1365,1366,1367,1368,1369,1370,1371,1372,1373,1374,1375,1376,1377,1378,1379,1380,1381,1382]],"type":"Polygon","properties":{"geoid":"05000US51027","name":"Buchanan County"},"id":"VA22"},{"arcs":[[1383,1384,1385,1386,1387,1388,1389,1390,1391,1392,1393,1394,1395,1396,1397,1398,1399,1400,1401,1402,1403,1404,1405,1406,1407,1408,1409,1410,1411,1412,1413,1414,1415,1416,1417,1418,1419,1420,1421,1422,1423,1424,1425],[1426]],"type":"Polygon","properties":{"geoid":"05000US51830","name":"Williamsburg city"},"id":"VA23"},{"arcs":[[1427,-113,1428,-1016,1429,-1014,1430,1431,-1011,1432,-1009,1433,-1007,1434,-1005,1435,1436,1437,-1001,1438,1439,-998,1440,-996,1441,-994,1442,-992,1443,1444,1445,1446,1447,1448,1449,1450,1451,1452,1453,1454,-923,1455,-921,1456,1457,-918,1458,-916,1459,-914,1460,-912,1461,-910,1462,-908,1463,-906,1464,1465,-903,1466,1467,1468,1469,1470,1471,1472,1473,1474,1475,1476,1477,1478,1479,1480,1481,1482,1483,1484,1485,1486,1487,1488,1489,1490,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503,1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,1515,1516,-116,1517],[1518,1519,1520,1521,1522,1523,1524,1525,1526,1527,1528,1529,1530,1531,1532,1533,1534,1535]],"type":"Polygon","properties":{"geoid":"05000US51019","name":"Bedford County"},"id":"VA24"},{"arcs":[[1536,1537,1538,1539,1540,1541,1542,1543,1544,1545,1546,1547,1548,1549,1550,1551,1552,1553,1554,1555,1556,1557,1558,1559,1560,1561,1562,1563,1564,1565,1566,1567,1568,1569,1570,1571,1572,1573,1574,1575,1576,1577,1578,1579,1580,1581,1582,1583,1584,1585,1586,1587,1588,1589,1590,1591,1592,1593,1594,1595,1596,1597,1598]],"type":"Polygon","properties":{"geoid":"05000US51043","name":"Clarke County"},"id":"VA25"},{"arcs":[[1599,1600,1601,1602,1603,1604,1605,1606,1607,1608,1609,1610,1611,1612,1613,1614,1615,1616,1617,1618,1619,1620,1621,1622,1623,1624,-454,1625,-452,1626,1627,-449,1628,-447,1629,-445,1630,1631,1632,1633,1634,1635,1636,1637,1638]],"type":"Polygon","properties":{"geoid":"05000US51193","name":"Westmoreland County"},"id":"VA26"},{"arcs":[[-1157,1639,1640,-1154,1641,-1152,1642,-1150,1643,-1148,1644,-1146,1645,-1144,1646,-1142,1647,1648,1649,1650,1651,1652,1653,1654,1655,1656,1657,1658,1659,1660,1661,1662,1663,1664,1665,1666,1667,1668,1669,1670,1671,1672,1673,1674,1675,1676,1677,1678,1679,1680,1681,1682,1683,-1159,1684]],"type":"Polygon","properties":{"geoid":"05000US51117","name":"Mecklenburg County"},"id":"VA27"},{"arcs":[[-1043,1685,1686,1687,1688,1689,-315,1690,-313,1691,-311,1692,-309,1693,-307,1694,-305,1695,-303,1696,1697,1698,1699,1700,1701,1702,1703,-294,1704,-292,1705,1706,1707,1708,1709,1710,1711,1712,1713,1714,1715,1716,1717,1718,1719,1720,1721,1722,1723,1724,1725,1726,1727,1728,1729,1730,1731,1732,1733,1734,1735,1736,1737,1738,1739,1740,1741,1742]],"type":"Polygon","properties":{"geoid":"05000US51137","name":"Orange County"},"id":"VA28"},{"arcs":[[1743,1744,-1484,1745,1746,1747,1748,1749,1750,1751,-1476,1752,1753,-1473,1754,1755,1756,1757,1758,1759,1760,1761,-900,1762,-898,1763,1764,-895,1765,-893,1766,1767,1768,1769,1770,1771,1772,1773,1774,1775,1776,1777,1778,1779,1780,1781,1782,1783,1784,1785,1786,1787,1788,1789,1790,1791,1792,-1492,1793,-1490,1794,-1488,1795]],"type":"Polygon","properties":{"geoid":"05000US51680","name":"Lynchburg city"},"id":"VA29"},{"arcs":[[1796,1797,1798,1799,1800,1801,1802,1803,1804,1805,1806,1807,1808,1809,1810,1811,1812,1813,1814,1815,1816,1817,1818,1819,1820,1821,1822,1823,1824,1825,1826,1827,1828,1829,1830,1831,1832,1833,1834,1835,1836,1837,-128,1838,1839,1840,-124,1841,-122,1842,-120,1843,1844,-1515,1845,-1513,1846,-1511,1847,-1509,1848,-1507,1849,-1505,1850,1851,1852,1853,1854]],"type":"Polygon","properties":{"geoid":"05000US51067","name":"Franklin County"},"id":"VA30"},{"arcs":[[-282,1855,-280,1856,-278,1857,-276,1858,-274,1859,-272,1860,1861,-269,1862,1863,-266,1864,1865,-582,1866,-580,1867,-578,1868,1869,1870,-574,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880,1881,1882,1883,1884,1885,1886,1887,1888,1889,1890,1891,1892,1893,1894,1895,1896,1897,1898,1899,1900,1901,1902,1903,1904,-1723,1905,-1721,1906,-1719,1907,-1717,1908,-1715,1909,1910,-1712,1911,-1710,1912,-1708,1913,1914,1915,-289,1916,-287,1917,-285,1918,1919]],"type":"Polygon","properties":{"geoid":"05000US51047","name":"Culpeper County"},"id":"VA31"},{"arcs":[[-1163,1920,-1187,1921,1922,1923,1924,1925,1926,-984,1927,-982,1928,-980,1929,-978,1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940,1941],[1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967]],"type":"Polygon","properties":{"geoid":"05000US51005","name":"Alleghany County"},"id":"VA32"},{"arcs":[[1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003]],"type":"Polygon","properties":{"geoid":"05000US51700","name":"Newport News city"},"id":"VA33"},{"arcs":[[-1982,2004,-1980,2005,-1978,2006,-1976,2007,2008,2009,2010,2011,2012,2013,-1399,2014,2015,2016,2017,2018,2019,2020,2021,-1390,2022,-1388,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070,2071,2072,2073,2074,2075,2076,2077,-1986,2078,2079,2080]],"type":"Polygon","properties":{"geoid":"05000US51199","name":"York County"},"id":"VA34"},{"arcs":[[2081,2082,2083,2084,2085,2086,2087,2088,2089,2090,2091,2092,2093,2094,2095,2096,2097,2098,2099,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110,2111,2112,2113,2114]],"type":"Polygon","properties":{"geoid":"05000US51595","name":"Emporia city"},"id":"VA35"},{"arcs":[[-988,2115,-986,2116,-1926,2117,2118,-1923,2119,2120,-1184,2121,2122,-1181,2123,2124,-1178,2125,2126,2127,2128,2129,2130,2131,-846,2132,-844,2133,-842,2134,-840,2135,-838,2136,-836,2137,-834,2138,-832,2139,-1454,2140,2141,2142,2143,-1449,2144,2145,2146,-1445,2147,-990,2148],[2149,2150,2151,2152,2153,2154,2155,2156,2157,2158,2159,2160,2161,2162,2163],[2164,2165,2166,2167,2168,2169,2170,2171,2172,2173,2174,2175,2176,2177,2178,2179,2180,2181,2182,2183,2184,2185,2186,2187,2188,2189,2190,2191,2192,2193,2194,2195,2196]],"type":"Polygon","properties":{"geoid":"05000US51163","name":"Rockbridge County"},"id":"VA36"},{"arcs":[[2197,2198,2199,2200,-1327,2201,2202,-1324,2203,-1322,2204,-1320,2205,2206,2207,2208,2209,2210,2211,2212,2213,2214,2215,2216,2217,2218,2219,2220,2221,2222,2223,2224,2225,2226,2227,2228,2229]],"type":"Polygon","properties":{"geoid":"05000US51185","name":"Tazewell County"},"id":"VA37"},{"arcs":[[2230,2231,2232,2233,2234,2235,2236,2237,2238,2239,2240,2241,2242,2243,2244,2245,2246,2247,2248,2249,2250,2251,2252,2253,2254,2255]],"type":"Polygon","properties":{"geoid":"05000US51510","name":"Alexandria city"},"id":"VA38"},{"arcs":[[2256,-1499,2257,2258,2259,2260,2261,2262,2263,2264,2265,2266,2267,2268,2269,2270,2271,2272,2273,2274,2275,2276,2277,2278,2279,2280,2281,2282,2283,2284,2285,2286,2287,2288,2289,2290,2291,2292,2293,2294,2295,2296,2297,2298,2299,2300,2301,2302,2303,2304,2305,2306,2307,2308,2309,2310,2311,2312,2313,2314,2315,2316,2317,2318,2319,2320,2321,2322,2323,2324,2325,2326,2327,2328,2329,2330,2331,2332,2333,2334,2335,2336,2337,2338,2339,2340,2341,2342,2343,2344,2345,2346]],"type":"Polygon","properties":{"geoid":"05000US51143","name":"Pittsylvania County"},"id":"VA39"},{"arcs":[[2347,2348,2349,2350,2351,2352,2353,2354,2355,2356,2357,2358,2359,2360,2361,2362,2363,2364,2365,2366,2367,2368,2369,2370,2371,2372,2373,2374,2375,2376,2377,2378,2379,2380,2381,2382,2383,2384,2385,2386,2387,2388,2389,2390,2391,2392,2393,2394,2395,2396,2397,2398,2399,2400]],"type":"Polygon","properties":{"geoid":"05000US51155","name":"Pulaski County"},"id":"VA40"},{"arcs":[[2401,-1988,2402,-2077,2403,-2075,2404,2405,2406,-2071,2407,-2069,2408,-2067,2409,2410,2411,2412,2413,2414,2415,2416,2417,2418,2419,2420,2421,2422,2423,-1994,2424,-1992,2425,2426]],"type":"Polygon","properties":{"geoid":"05000US51650","name":"Hampton city"},"id":"VA41"},{"arcs":[[2427,2428,2429,2430,2431,-1730,2432,2433,-1727,2434,-1725,2435,-1904,2436,-1902,2437,-1900,2438,2439,2440,2441,2442,2443,2444,2445,2446,2447,2448,2449,2450,2451,2452,2453,2454,2455,2456,2457,2458,2459,2460,2461,2462,2463,2464,2465,2466,2467,2468,2469,2470,2471,2472,2473,2474,2475,2476,2477,2478,2479,2480,2481,2482,2483]],"type":"Polygon","properties":{"geoid":"05000US51177","name":"Spotsylvania County"},"id":"VA42"},{"arcs":[[2484,2485,2486,2487,2488,2489,2490,2491,2492,2493,2494,2495,2496,2497,2498,2499,2500,2501,2502,2503,2504,2505,2506,2507,2508,2509,2510,2511,2512,2513,2514,2515,2516,2517,2518,2519,2520,2521,2522,2523,2524,2525,2526,2527,2528,2529,2530,2531,2532,2533,2534,2535]],"type":"Polygon","properties":{"geoid":"05000US51181","name":"Surry County"},"id":"VA43"},{"arcs":[[2536,2537,2538,2539,2540,2541,2542,2543,2544,2545,2546,2547,2548,2549,2550,2551,2552,2553,2554,2555,2556,2557,2558,2559,2560,2561,2562,2563,2564,2565,2566,2567,2568,2569,2570,2571,2572,2573,2574,2575,2576,2577,2578,2579,2580,2581,2582]],"type":"Polygon","properties":{"geoid":"05000US51670","name":"Hopewell city"},"id":"VA44"},{"arcs":[[2583,2584,2585,2586,2587,2588,2589,2590,2591,2592,2593,2594,2595,-2161,2596]],"type":"Polygon","properties":{"geoid":"05000US51678","name":"Lexington city"},"id":"VA45"},{"arcs":[[2597,2598,2599,2600,2601,2602,-1581,2603,2604,2605,-1577,2606,-1575,2607,2608,-1572,2609,2610,2611,-1568,2612,2613,-1565,2614,2615,2616,2617,-1560,2618,2619,-1557,2620,-1555,2621,-1553,2622,2623,2624,-1549,2625,-1547,2626,-1545,2627,2628,-1542,2629,2630,-1539,2631,2632,2633,2634,2635,-799,2636,-797,2637,-795,2638,-793,2639,-791,2640,2641,-788,2642,-786,2643,-784,2644,-782,2645,-780,2646,-778,2647,-776,2648],[2649,2650,2651,2652,2653,2654,2655,2656,2657,2658,2659,2660,2661,2662,2663,2664,2665,2666]],"type":"Polygon","properties":{"geoid":"05000US51069","name":"Frederick County"},"id":"VA46"},{"arcs":[[2667,2668,2669,2670,2671,2672,2673,2674,2675,2676,2677,2678,2679,2680,2681,2682,2683,-32,2684,2685,2686,2687,2688,2689,2690,2691,2692,2693,2694,2695,2696,2697,2698,2699,2700,2701,2702,2703,2704,2705,2706,2707,2708,2709,2710,2711,2712,2713,2714,-425,2715,2716,-422,2717,-420,2718,-418,2719,-416,2720,-414,2721,-412,2722,2723,2724]],"type":"Polygon","properties":{"geoid":"05000US51147","name":"Prince Edward County"},"id":"VA47"},{"arcs":[[2725,2726,2727,2728,2729,2730,2731,2732,2733,2734,2735,2736,2737,2738,2739,2740,2741,2742,2743,2744,2745,2746,2747,2748,-377,2749,-375,2750,2751,-372,2752,2753,2754,2755,2756,2757,2758,2759,2760,2761,2762,2763,2764,2765,2766,2767,2768,2769,2770,2771,2772,2773,2774,2775,2776,2777,2778,2779,2780,2781]],"type":"Polygon","properties":{"geoid":"05000US51119","name":"Middlesex County"},"id":"VA48"},{"arcs":[[-751,2782,-749,2783,-747,2784,2785,2786,-743,2787,-741,2788,2789,2790,2791,2792,2793,2794,-1997,2795,2796,2797,2798,2799,2800,2801,2802,2803,2804]],"type":"Polygon","properties":{"geoid":"05000US51800","name":"Suffolk city"},"id":"VA49"},{"arcs":[[-803,2805,-801,2806,-2635,2807,-1598,2808,2809,2810,2811,2812,2813,2814,2815,2816,2817,2818,2819,2820,2821,2822,2823,2824,2825,2826,2827,2828,2829,2830,-532,2831,-530,2832,2833,-592,2834,2835,2836,2837,2838,2839,2840,2841,2842,2843,2844,-818,2845,-816,2846,-814,2847,-812,2848,-810,2849,2850,-807,2851,-805,2852]],"type":"Polygon","properties":{"geoid":"05000US51187","name":"Warren County"},"id":"VA50"},{"arcs":[[2853,2854,2855,2856,2857,2858,2859,2860,2861,2862,2863,2864,2865,2866,2867,2868,2869,2870,2871,2872,2873,2874,2875,2876,2877,2878,2879,2880,2881,2882,-490,2883,2884,-487,2885,-485,2886,2887,2888,2889,2890,-2475,2891,2892,2893,2894,2895,2896,2897,2898,2899,2900,2901,2902,2903,2904,2905,2906,2907,2908,2909,2910,2911,2912,2913,2914,2915,-2446,2916,2917,2918,-2442,2919,2920,2921,-1894,2922,2923,-1891,2924,2925,2926,2927,2928,2929,2930,2931,2932,2933]],"type":"Polygon","properties":{"geoid":"05000US51179","name":"Stafford County"},"id":"VA51"},{"arcs":[[2934,2935,2936,2937,2938,2939,2940,2941,2942,2943,2944,2945,2946,2947,2948,2949,2950,2951,2952,2953,2954,2955,-1346,2956,-1344,2957,-1342,2958,-1340,2959,2960,-1337,2961,2962,2963,-1333,2964,-1331,2965,-1329,2966,2967,2968,-2198,2969,2970,2971,2972,2973,2974,2975,2976,2977,2978,2979,2980,2981,2982,2983]],"type":"Polygon","properties":{"geoid":"05000US51167","name":"Russell County"},"id":"VA52"},{"arcs":[[2984,-1941,2985,2986,-1938,2987,2988,2989,-1934,2990,-1932,2991,-976,2992,-974,2993,2994,-971,2995,-969,2996,-109,2997,-107,2998,2999,3000,3001,3002,3003,3004,3005,3006]],"type":"Polygon","properties":{"geoid":"05000US51045","name":"Craig County"},"id":"VA53"},{"arcs":[[3007,3008,3009,3010,3011,3012,3013,3014,3015,3016,3017,3018,3019,3020,3021,3022,3023,3024,3025,3026,3027,3028,3029,3030,3031,3032,3033,3034,3035,3036,3037,3038]],"type":"Polygon","properties":{"geoid":"05000US51660","name":"Harrisonburg city"},"id":"VA54"},{"arcs":[[3039,3040,-2971,3041,-2229,3042,-2227,3043,-2225,3044,-2223,3045,-2221,3046,-2219,3047,3048,-2216,3049,3050,3051,-942,3052,-940,3053,-938,3054,-936,3055,-934,3056,-932,3057,-930,3058,3059,3060,3061]],"type":"Polygon","properties":{"geoid":"05000US51173","name":"Smyth County"},"id":"VA55"},{"arcs":[[-1658,3062,3063,-1655,3064,-1653,3065,-1651,3066,-1649,3067,3068,-2685,-31,3069,3070,-28,3071,-26,3072,-24,3073,3074,-1682,3075,-1680,3076,-1678,3077,3078,-1675,3079,-1673,3080,-1671,3081,-1669,3082,-1667,3083,-1665,3084,3085,-1662,3086,-1660,3087]],"type":"Polygon","properties":{"geoid":"05000US51111","name":"Lunenburg County"},"id":"VA56"},{"arcs":[[3088,3089,3090,3091,-2523,3092,3093,-2520,3094,-2518,3095,-2516,3096,-2514,3097,-2512,3098,3099,3100,-2508,3101,-2506,3102,-2504,3103,-2502,3104,3105,-2499,3106,-2497,3107,-678,3108,3109,3110,3111,3112,3113,3114,3115,3116]],"type":"Polygon","properties":{"geoid":"05000US51183","name":"Sussex County"},"id":"VA57"},{"arcs":[[3117,-20,3118,-18,3119,-16,3120,-14,3121,-12,3122,-674,3123,3124,3125,-670,3126,-668,3127,3128,3129,-1683,3130]],"type":"Polygon","properties":{"geoid":"05000US51025","name":"Brunswick County"},"id":"VA58"},{"arcs":[[3131,3132,3133,3134,3135,3136,3137,3138,3139,3140,3141,3142,3143,3144,3145,3146,3147,3148,3149,3150,3151,3152,3153]],"type":"Polygon","properties":{"geoid":"05000US51685","name":"Manassas Park city"},"id":"VA59"},{"arcs":[[3154,3155,-2397,3156,-2395,3157,-2393,3158,3159,3160,3161,3162,3163,3164,3165,3166,3167,3168,3169,3170,3171,3172,3173,3174,3175,3176,3177,3178,3179,3180,3181,3182,3183,3184,3185,3186,3187,3188,3189,3190,3191,3192,3193,3194,3195,3196,3197,3198,3199,3200,3201,3202]],"type":"Polygon","properties":{"geoid":"05000US51035","name":"Carroll County"},"id":"VA60"},{"arcs":[[-2208,3203,3204,3205,3206,3207,3208,3209,3210,3211,3212,3213,3214,3215,3216,3217,3218,3219,3220,3221,3222,-2212,3223,-2210,3224]],"type":"Polygon","properties":{"geoid":"05000US51021","name":"Bland County"},"id":"VA61"},{"arcs":[[3225,3226,-2794,3227,-2792,3228,-2790,3229,3230,3231,3232,3233,3234,3235,3236,3237,3238,3239,3240,3241,3242,3243,3244,3245,3246,3247,3248,3249,3250,3251,3252,3253,3254,3255,3256,3257,3258,3259,3260,3261,3262,3263,3264,3265,3266,3267,-719,3268,-717,3269,-715,3270,-713,3271,-711,3272,-709,3273,3274,-706,3275,-704,3276,3277,-701,3278,-699,3279,-697,3280,-695,3281,-693,3282,-691,3283,-689,3284,-687,3285,-685,3286,-683,3287,-681,3288,3289,3290,3291,-2493,3292,-2003,3293,3294]],"type":"Polygon","properties":{"geoid":"05000US51093","name":"Isle of Wight County"},"id":"VA62"},{"arcs":[[3295,-1877,3296,-1875,3297,-1873,3298,3299,-571,3300,-569,3301,-567,3302,-565,3303,-563,3304,-561,3305,-559,3306,-557,3307,3308,-554,3309,-552,3310,3311,3312,3313,-547,3314,-545,3315,-543,3316,-541,3317,3318,3319,-537,3320,-535,3321,3322,3323,3324,-2828,3325,-2826,3326,3327,-2823,3328,3329,-2820,3330,-2818,3331,-2816,3332,-2814,3333,-2812,3334,-2810,3335,3336,3337,3338,3339,3340,3341,3342,3343,3344,-2854,3345,-2933,3346,-2931,3347,-2929,3348,-2927,3349,3350,-1889,3351,-1887,3352,-1885,3353,-1883,3354,-1881,3355,-1879]],"type":"Polygon","properties":{"geoid":"05000US51061","name":"Fauquier County"},"id":"VA63"},{"arcs":[[-724,3356,3357,3358,3359,3360,3361,3362,3363,3364,3365,3366,3367,3368,-3258,3369,3370,-3255,3371,3372,3373,3374,3375,3376,3377,3378,3379,3380,3381,3382,3383,3384,3385,3386,3387,3388,3389,3390,3391,3392,3393,3394,-738,3395,3396,3397,3398,3399,-732,3400,3401,3402,-728,3403,-726,3404]],"type":"Polygon","properties":{"geoid":"05000US51620","name":"Franklin city"},"id":"VA64"},{"arcs":[[-103,3405,-101,3406,-99,3407,-97,3408,-95,3409,3410,3411,3412,3413,3414,3415,3416,3417,3418,3419,3420,3421,3422,3423,3424,3425,3426,3427,3428]],"type":"Polygon","properties":{"geoid":"05000US51169","name":"Scott County"},"id":"VA65"},{"arcs":[[3429,3430,3431,3432,3433,3434,3435,3436,3437,3438,3439,3440,3441,3442,3443,3444,3445,3446,3447,3448,3449,3450,3451,3452,3453,3454,3455,3456,3457,3458,3459,3460,3461,3462,3463,-459,3464,-457,3465,3466,3467,-1623,3468,-1621,3469,-1619,3470,3471,3472,3473,3474,3475,3476,3477,3478,3479,-2749,3480,3481,3482,3483,3484,3485,3486,3487,3488,3489,3490]],"type":"Polygon","properties":{"geoid":"05000US51057","name":"Essex County"},"id":"VA66"},{"arcs":[[3491,3492,3493,3494,3495,3496,3497,-408,3498,-406,3499,3500,3501,3502,3503,-400,3504,-398,3505,3506,3507,3508]],"type":"Polygon","properties":{"geoid":"05000US51065","name":"Fluvanna County"},"id":"VA67"},{"arcs":[[3509,3510,3511,3512,3513,3514,3515,3516,3517,3518,3519,3520,3521,3522,3523,3524,3525,3526,3527,3528,3529,3530,3531,3532,3533,3534,3535,3536,3537,3538,3539,3540,3541,3542,3543,3544,3545,-3435,3546,-3433,3547,-3431,3548,-3491,3549,-3489,3550,3551,-3486,3552,3553,-3483,3554,3555,3556,3557,-2745,3558,-2743,3559,-2741,3560,3561,-2738,3562,3563,-2735,3564,3565,-2732,3566,3567,3568,3569,3570,3571,3572,3573,3574,3575,3576,3577,3578,3579,3580,3581,3582,3583,3584,3585,3586,3587,3588,3589]],"type":"Polygon","properties":{"geoid":"05000US51097","name":"King and Queen County"},"id":"VA68"},{"arcs":[[-829,3590,-827,3591,3592,-824,3593,-822,3594,-820,3595,-2844,3596,3597,-2841,3598,-2839,3599,-2837,3600,-589,3601,-587,3602,3603,-262,3604,-260,3605,-258,3606,-256,3607,-350,3608,-348,3609,3610,3611,3612,3613,3614,3615,3616,3617,3618,3619,3620,3621,3622,3623,3624,3625,3626,3627,3628]],"type":"Polygon","properties":{"geoid":"05000US51139","name":"Page County"},"id":"VA69"},{"arcs":[[-356,3629,-354,3630,3631,3632,3633,3634,3635,3636,-1636,3637,-1634,3638,-1632,3639,-369,3640,-367,3641,3642,-364,3643,-362,3644,-360,3645,-358,3646]],"type":"Polygon","properties":{"geoid":"05000US51133","name":"Northumberland County"},"id":"VA70"},{"arcs":[[3647,3648,3649,3650,3651,3652,3653,3654,3655,3656,3657,3658,3659,3660,3661,3662,3663,3664,3665,3666,3667,3668,3669,3670,3671,3672,3673,3674]],"type":"Polygon","properties":{"geoid":"05000US51690","name":"Martinsville city"},"id":"VA71"},{"arcs":[[[3675,3676,3677,3678,3679,3680,3681,3682,3683,3684,3685,3686,3687,3688,3689,3690,3691,3692,3693,3694,3695,3696,3697,3698,3699,3700,3701,3702,3703,3704,3705,3706]],[[3707,3708,3709,3710,3711]]],"type":"MultiPolygon","properties":{"geoid":"05000US51520","name":"Bristol city"},"id":"VA72"},{"arcs":[[3712,3713,-864,3714,-862,3715,3716,-859,3717,-857,3718,3719,-854,3720,-852,3721,-850,3722,-848,3723,-2131,3724,-2129,3725,-1254,3726,-1252,3727,-1250,3728,-1248,3729,-1246,3730,-1244,3731,-1242,3732,-1240,3733,-1238,3734,3735,-1235,3736,3737,-1057,3738,-1055,3739,3740,-1052,3741,-389,3742,3743,3744,3745,3746,-383,3747,-381,3748,-379,3749,-443,3750,3751,3752,3753,-870,3754,-868,3755]],"type":"Polygon","properties":{"geoid":"05000US51125","name":"Nelson County"},"id":"VA73"},{"arcs":[[3756,3757,-2796,-1996,3758,-2423,3759,3760,3761,3762,3763,3764,3765,3766,3767,3768,3769,3770,3771,3772]],"type":"Polygon","properties":{"geoid":"05000US51740","name":"Portsmouth city"},"id":"VA74"},{"arcs":[[3773,3774,3775,3776,3777,3778,3779,3780,3781,3782,3783,3784,3785,3786,3787,3788,3789,3790,3791,3792,3793,3794,3795,3796,3797,3798,3799,3800,3801,3802,3803,3804,3805,3806,3807,3808,3809,3810,3811,3812,3813,3814,3815,3816,3817,3818,3819,3820,3821,3822,3823,3824,3825,3826,3827,3828,3829,3830,3831,3832,3833,3834,3835,3836,3837,3838,3839,3840,3841,3842]],"type":"Polygon","properties":{"geoid":"05000US51760","name":"Richmond city"},"id":"VA75"},{"arcs":[[-93,3843,3844,3845,3846,3847,3848,3849,3850,3851,3852,3853,3854,3855,3856,3857,3858,3859,3860,3861,3862,3863,3864,3865,3866,-2937,3867,-2935,3868,3869,-3424,3870,-3422,3871,-3420,3872,3873,-3417,3874,-3415,3875,-3413,3876,-3411,3877],[3878,3879,3880,3881,3882,3883,3884,3885,3886,3887,3888,3889,3890,3891,3892,3893,3894,3895,3896,3897,3898,3899,3900,3901,3902,3903,3904,3905,3906,3907,3908,3909,3910,3911,3912,3913,3914,3915,3916,3917,3918,3919,3920,3921]],"type":"Polygon","properties":{"geoid":"05000US51195","name":"Wise County"},"id":"VA76"},{"arcs":[[3922,3923,3924,3925,3926,3927,3928,3929,3930,3931,3932,3933,3934,3935,3936,3937,3938,3939,3940,3941,3942,3943,3944,3945,3946,3947,3948,3949,3950,3951,3952,3953,3954,3955,3956,3957,3958,3959,3960,3961,3962,3963,3964,3965,3966,3967,3968,3969,3970,3971,3972,3973,3974,3975,3976,3977,3978,3979,3980,3981,3982,3983,3984,3985,3986,3987,3988,3989,3990,3991,3992,3993,3994,3995,3996]],"type":"Polygon","properties":{"geoid":"05000US51036","name":"Charles City County"},"id":"VA77"},{"arcs":[[3997,3998,3999,4000,4001,4002,4003,4004,4005,4006,4007,4008,4009,4010,4011,4012,4013,4014,4015,4016,4017,4018,4019,4020,-3539,4021,-3537,4022,-3535,4023,-3533,4024,-3531,4025,-3529,4026,-3527,4027,4028,4029,4030,-3522,4031,-3520,4032,-3518,4033,4034,-3515,4035,4036,-3512,4037,-3510,4038,4039,4040,4041,4042,4043,4044,4045,4046,4047,4048,4049,4050,4051,4052,4053,4054,4055,4056,4057,4058,4059,4060,4061,4062,4063,4064,4065,4066,4067,4068,4069,4070,4071,4072,4073,4074,4075,4076,4077,4078,4079,4080,4081]],"type":"Polygon","properties":{"geoid":"05000US51101","name":"King William County"},"id":"VA78"},{"arcs":[[4082,-3918,4083,4084,4085,4086,4087,4088,-3911,4089,4090,4091,4092,4093,4094,-3904,4095,-3902,4096,4097,-3899,4098,-3897,4099,4100,4101,4102,4103,4104,4105,4106,-3888,4107,4108,4109,4110,-3883,4111,-3881,4112,-3879,4113,-3921,4114]],"type":"Polygon","properties":{"geoid":"05000US51720","name":"Norton city"},"id":"VA79"},{"arcs":[[-2430,4115,-2428,4116,-2483,4117,4118,4119,4120,4121,-3493,4122,4123,4124,-1045,4125,-1742,4126,-1740,4127,-1738,4128,-1736,4129,-1734,4130,-1732,4131,-2432,4132]],"type":"Polygon","properties":{"geoid":"05000US51109","name":"Louisa County"},"id":"VA80"},{"arcs":[[4133,4134,4135,4136,4137,4138,4139,4140,4141,4142,4143]],"type":"Polygon","properties":{"geoid":"05000US51610","name":"Falls Church city"},"id":"VA81"},{"arcs":[[4144,-2364,4145,-2362,4146,-2360,4147,-2358,4148,4149,4150,4151,4152,4153,-3004,4154,-3002,4155,-139,4156,4157,-136,4158,4159,4160,4161,4162,4163,4164,4165,4166,4167,4168,4169,4170,4171,4172,4173,-2387,4174,4175,4176,-2383,4177,-2381,4178,4179,4180,4181,4182,4183,4184,4185,4186,4187,4188,4189,4190,4191,4192,4193,4194,4195,4196,4197,4198,4199,4200,4201,4202,4203,4204,4205,4206,4207,4208,4209,4210,4211,4212,4213,4214,4215,4216,4217,4218,4219,4220,-2369,4221,-2367,4222]],"type":"Polygon","properties":{"geoid":"05000US51121","name":"Montgomery County"},"id":"VA82"},{"arcs":[[4223,4224,4225,4226,4227,-2910,4228,4229,4230,4231,-2905,4232,4233,4234,4235,4236,4237,4238,-2897,4239,-2895,4240,4241,4242,4243,4244,-2471,4245,4246,4247,4248,-2466,4249,4250,-2463,4251,4252,4253,4254,4255,4256,-2456,4257,-2454,4258,4259,4260,4261,4262]],"type":"Polygon","properties":{"geoid":"05000US51630","name":"Fredericksburg city"},"id":"VA83"},{"arcs":[[[4263,4264,4265,4266,-1407,4267,-1405,4268,-1403,4269,4270,4271,-2011,4272,-2009,4273,4274,-1973,4275,4276,-1970,4277,4278,-2492,4279,4280,-2489,4281,-2487,4282,4283,-3986,4284,-3984,4285,-3982,4286,-3980,4287,4288,4289,4290,4291,4292,4293,4294,4295,4296,4297,4298,4299,4300,4301,4302,4303,-2039,4304,-2037,4305,-2035,4306,-2033,4307,4308,-2030,4309,4310,4311,-2026,4312,-1385,4313,4314,4315,4316,4317,4318,-1421,4319,-1419,4320,4321,4322,-1415,4323,4324,-1412]],[[-1427]]],"type":"MultiPolygon","properties":{"geoid":"05000US51095","name":"James City County"},"id":"VA84"},{"arcs":[[4325,4326,4327,4328,4329,4330,4331,4332,-3342,4333,-1591,4334,-1589,4335]],"type":"Polygon","properties":{"geoid":"05000US51107","name":"Loudoun County"},"id":"VA85"},{"arcs":[[-3682,4336,4337,4338,4339,4340,4341,4342,-3428,4343,-2982,4344,4345,-2979,4346,-2977,4347,-2975,4348,-2973,4349,4350,4351,4352,4353,-925,4354,-3706,4355,-3704,4356,-3702,4357,-3700,4358,-3698,4359,-3696,4360,4361,-3693,4362,4363,4364,-3689,4365,4366,4367,4368,4369,-3683],[-3712,4370,-3710,4371,-3708]],"type":"Polygon","properties":{"geoid":"05000US51191","name":"Washington County"},"id":"VA86"},{"arcs":[[-2375,4372,4373,4374,4375,4376,4377,4378,4379,-4217,4380,-4215,4381,-4213,4382,-4211,4383,4384,4385,-4207,4386,4387,4388,4389,4390,-4201,4391,-4199,4392,4393,-4196,4394,4395,4396,-4192,4397,4398,-4189,4399,4400,-4186,4401,-4184,4402,4403,-4181,4404,4405,4406,4407],[4408]],"type":"Polygon","properties":{"geoid":"05000US51750","name":"Radford city"},"id":"VA87"},{"arcs":[[-1965,4409,4410,-1962,4411,4412,4413,4414,4415,4416,4417,4418,-1953,4419,4420,4421,4422,4423,-1947,4424,4425,4426,-1943,4427,4428,4429]],"type":"Polygon","properties":{"geoid":"05000US51580","name":"Covington city"},"id":"VA88"},{"arcs":[[4430,4431,-2239,4432,-2237,4433,4434,4435,4436]],"type":"Polygon","properties":{"geoid":"05000US51013","name":"Arlington County"},"id":"VA89"},{"arcs":[[4437,-3991,4438,-2533,4439,-2531,4440,-2529,4441,-2527,4442,-2525,4443,4444,-3090,4445,-659,4446,4447,4448,4449,4450,4451,4452,4453,4454,4455,4456,4457,4458,4459,4460,4461,4462,4463,4464,4465,4466,4467,4468,4469,4470,4471,4472,-2582,4473,-2580,4474,4475,4476,4477,-2575,4478,4479,4480,-2571,4481,4482,-2568,4483,4484,4485,4486,4487,4488,4489,4490,4491,4492,4493,4494,4495,4496,4497,4498,-2551,4499,4500,4501,4502,4503,4504,4505,4506,4507,4508,4509,-3995,4510,-3993]],"type":"Polygon","properties":{"geoid":"05000US51149","name":"Prince George County"},"id":"VA90"},{"arcs":[[-1382,4511,-1380,4512,-1378,4513,4514,-1375,4515,-1373,4516,4517,-1370,4518,-1368,4519,4520,-1365,4521,-1363,4522,-1361,4523,-1359,4524,-1357,4525,-1355,4526,-1353,4527,4528,4529,4530,-1348,4531,4532,-2954,4533,-2952,4534,4535,4536,-2948,4537,-2946,4538,-2944,4539,-2942,4540,4541,-2939,4542,4543,-3865,4544,-3863,4545,-3861,4546,4547,-3858,4548,4549,-3855,4550,-3853,4551,-3851,4552,4553,4554,4555,4556,-3845,4557]],"type":"Polygon","properties":{"geoid":"05000US51051","name":"Dickenson County"},"id":"VA91"},{"arcs":[[-1817,4558,-1815,4559,4560,4561,4562,4563,4564,4565,4566,4567,4568,-2391,4569,-2389,4570,4571,-4172,4572,4573,-4169,4574,-4167,4575,-4165,4576,-4163,4577,4578,-4160,4579,-134,4580,-132,4581,4582,-1836,4583,-1834,4584,-1832,4585,-1830,4586,-1828,4587,4588,-1825,4589,-1823,4590,-1821,4591,-1819,4592]],"type":"Polygon","properties":{"geoid":"05000US51063","name":"Floyd County"},"id":"VA92"},{"arcs":[[-1292,4593,4594,4595,4596,-1287,4597,-1285,4598,-1283,4599,4600,4601,4602,4603,-1277,4604,-1275,4605,4606,4607,4608,-1270,4609,4610,4611,4612,4613,4614,-1263,4615,-1261,4616,-1259,4617,-1257,4618,-1294,4619]],"type":"Polygon","properties":{"geoid":"05000US51820","name":"Waynesboro city"},"id":"VA93"},{"arcs":[[4620,4621,4622,-2269,4623,-2267,4624,-2265,4625,-2263,4626,-2261,4627,-1495,4628,4629,-1790,4630,4631,-1787,4632,4633,-1784,4634,-1782,4635,-1780,4636,4637,-1777,4638,4639,4640,-1773,4641,4642,-1770,4643,-889,4644,-887,4645,-885,4646,4647,4648,4649,4650,4651,4652,4653,4654,4655,4656,4657,4658,4659,4660,-1113,4661,-1111,4662,4663,-1108,4664,4665,4666,-2279,4667,-2277,4668,4669,4670,4671]],"type":"Polygon","properties":{"geoid":"05000US51031","name":"Campbell County"},"id":"VA94"},{"arcs":[[4672,-1805,4673,-1803,4674,-1801,4675,-1799,4676,-1797,4677,4678,4679,4680,4681,4682,-1810,4683,4684,-1807],[4685,-3669,4686,-3667,4687,4688,-3664,4689,4690,4691,4692,4693,4694,4695,-3656,4696,4697,4698,4699,4700,4701,4702,-3648,4703,4704,4705,-3672,4706]],"type":"Polygon","properties":{"geoid":"05000US51089","name":"Henry County"},"id":"VA95"},{"arcs":[[4707,4708,4709,4710,4711,4712,4713,4714,4715,4716,4717,4718,4719,4720,4721,4722,4723,4724,4725,4726,4727,4728,-4119,4729,-2481,4730,4731,4732,4733,4734,4735,4736,4737,4738,4739,4740,4741,4742,4743,4744,4745,4746,4747,4748,4749,4750,4751,4752,-4011,4753,-4009,4754,4755,4756,-4005,4757,-4003,4758,-4001,4759,-3999,4760,4761,-4081,4762,-4079,4763,-4077,4764,-4075,4765,-4073,4766,4767,4768,-4069,4769,4770,4771,4772,4773,4774,4775,4776,4777,4778,4779,4780,4781,4782,4783,4784]],"type":"Polygon","properties":{"geoid":"05000US51085","name":"Hanover County"},"id":"VA96"},{"arcs":[[[4785,4786,4787,4788,4789,4790,4791,4792,4793,4794,4795,-2879,4796,4797,-2876,4798,-2874,4799,-2872,4800,-2870,4801,-2868,4802,-2866,4803,-2864,4804,4805,4806,4807,4808,4809,-2857,4810,-2855,-3345,4811,-3343,4812,4813,-4331,4814,-4329,4815,4816,4817,4818,4819,4820],[4821,4822,4823,4824,4825,4826,4827,4828,4829,4830,4831,4832,4833,4834,4835,4836,4837,4838,4839,4840,4841,4842,4843,4844,4845,4846,4847,4848,4849,4850,4851,4852,4853,4854,4855,4856,4857,4858,4859,-3145,4860,-3143,4861,-3141,4862,4863,-3138,4864,-3136,4865,4866,4867,4868,4869,4870,4871,4872]],[[4873,4874,4875,4876,4877,4878,4879]]],"type":"MultiPolygon","properties":{"geoid":"05000US51153","name":"Prince William County"},"id":"VA97"},{"arcs":[[4880,4881,4882,-663,4883,4884,-3115,4885,4886,-3112,4887,-3110,4888,-774,4889,-772,4890,4891,-769,4892,-767,4893,-765,4894,-763,4895,-761,4896,-759,4897,4898,-756,4899,-754,4900,4901,-3129,4902],[4903,4904,4905,4906,4907,4908,4909,4910,4911,4912,4913,4914,4915,-2097,4916,-2095,4917,4918,4919,-2091,4920,-2089,4921,4922,4923,4924,4925,-2083,4926,4927,4928,4929,-2112,4930]],"type":"Polygon","properties":{"geoid":"05000US51081","name":"Greensville County"},"id":"VA98"},{"arcs":[[4931,4932,4933,4934,4935,4936,4937,4938,4939,4940,4941,-3774,4942,4943,-3841,4944,-3839,4945,-3837,4946,-3835,4947,4948,4949,-3831,4950,4951,4952,4953,4954,-3825,4955,4956,-3822,4957,4958,4959,4960,4961,4962,4963,4964,4965,4966,4967,4968,4969,4970,4971,4972,4973,4974,4975,4976,4977,-3996,4978,4979,4980,4981,4982,4983,4984,4985,4986,-4472,4987,4988,-4469,4989,4990,4991,4992,4993,4994,4995,4996,4997,4998,4999,5000,5001,5002,5003,5004,5005,5006,5007,5008,5009,5010,5011,5012,5013,5014,5015,5016,5017,5018,5019,5020,5021,5022,5023,5024,5025,5026,5027,5028,5029,5030,5031,5032,5033,5034,5035,5036,-645,5037,5038,-642,5039,-640,5040,-638,5041,-636,5042,5043,5044,5045,5046,5047,5048,5049,5050,5051,5052,5053,5054,5055,5056,5057,5058,5059,5060,5061,5062]],"type":"Polygon","properties":{"geoid":"05000US51041","name":"Chesterfield County"},"id":"VA99"},{"arcs":[[5063,-1315,5064,5065,5066,5067,-1310,5068,5069,-1307,5070,5071,-1304,5072,5073,5074,5075,5076,5077,5078,5079,5080,5081,5082]],"type":"Polygon","properties":{"geoid":"05000US51790","name":"Staunton city"},"id":"VA100"},{"arcs":[[5083,5084,-3585,5085,5086,-3582,5087,-3580,5088,-3578,5089,-3576,5090,-3574,5091,-3572,5092,5093,-3569,5094,5095,5096,5097,-2728,5098,-2726,5099,5100,-2780,5101,-2778,5102,-2776,5103,-2774,5104,-2772,5105,-2770,5106,-2768,5107,-2766,5108,5109,5110,5111,5112,5113,5114,5115,5116,5117,5118,5119,5120,5121,-2054,5122,5123,-2051,5124,-2049,5125,-2047,5126,-2045,5127,5128]],"type":"Polygon","properties":{"geoid":"05000US51073","name":"Gloucester County"},"id":"VA101"},{"arcs":[[-2684,5129,5130,5131,5132,5133,5134,5135,5136,5137,5138,5139,5140,5141,5142,5143,5144,5145,5146,5147,5148,5149,5150,5151,5152,5153,5154,5155,5156,-4932,5157,-5062,5158,-5060,5159,5160,-5057,5161,5162,-5054,5163,-5052,5164,5165,-5049,5166,-5047,5167,-5045,5168,-633,5169,-631,5170,-629,5171,-627,5172,5173,5174]],"type":"Polygon","properties":{"geoid":"05000US51007","name":"Amelia County"},"id":"VA102"},{"arcs":[[-3495,5175,-4121,5176,5177,-4727,5178,5179,5180,5181,5182,5183,5184,5185,5186,5187,5188,5189,5190,5191,5192,5193,5194,5195,5196,5197,5198,5199,5200,5201,5202,5203,5204,5205,5206,5207,5208,5209,5210,5211]],"type":"Polygon","properties":{"geoid":"05000US51075","name":"Goochland County"},"id":"VA103"},{"arcs":[[-1534,5212,5213,-1531,5214,5215,-1528,5216,5217,-1525,5218,5219,5220,-1521,5221,5222,5223,5224]],"type":"Polygon","properties":{"geoid":"05000US51515","name":"Bedford city"},"id":"VA104"},{"arcs":[[5225,5226,5227,5228,5229,5230,5231,5232,5233,5234,5235,5236,5237,5238,5239,5240,5241,5242,5243,5244]],"type":"Polygon","properties":{"geoid":"05000US51810","name":"Virginia Beach city"},"id":"VA105"},{"arcs":[[-197,5245,5246,5247,5248,5249,5250,5251,5252,5253,5254,5255,5256,5257,5258,5259,5260,5261,5262,5263,5264,5265,-147,5266,5267,5268,-143,5269,-141,5270,5271,-253,5272,-251,5273,-249,5274,5275,-246,5276,-244,5277,-242,5278,-240,5279,5280,5281,-236,5282,-234,5283,-232,5284,5285,5286,5287,-227,5288,-225,5289,-223,5290,-221,5291,-219,5292,5293,5294,5295,-214,5296,-212,5297,-210,5298,-208,5299,-206,5300,5301,-203,5302,-201,5303,5304,5305]],"type":"Polygon","properties":{"geoid":"05000US51770","name":"Roanoke city"},"id":"VA106"},{"arcs":[[5306,-3214,5307,5308,5309,-2400,5310,5311,-3155,5312,-954,5313,-952,5314,5315,-949,5316,-947,5317,-945,5318,5319,-3051,5320,5321,-3219,5322,-3217,5323]],"type":"Polygon","properties":{"geoid":"05000US51197","name":"Wythe County"},"id":"VA107"},{"arcs":[[5324,-3476,5325,-3474,5326,-3472,5327,-1617,5328,-1615,5329,5330,-1612,5331,-1610,5332,-1608,5333,-1606,5334,-1604,5335,-1602,5336,-1600,5337,-1638,5338,-3636,5339,-3634,5340,5341,5342,-352,5343,-3480,5344,5345]],"type":"Polygon","properties":{"geoid":"05000US51159","name":"Richmond County"},"id":"VA108"},{"arcs":[[5346,5347,-3789,5348,-3787,5349,5350,5351,-3783,5352,5353,5354,-3779,5355,5356,5357,5358,-4941,5359,5360,-5189,5361,-5187,5362,-5185,5363,5364,-5182,5365,-5180,5366,-4725,5367,-4723,5368,-4721,5369,-4719,5370,5371,5372,5373,-4714,5374,-4712,5375,-4710,5376,-4708,5377,-4784,5378,5379,5380,5381,5382,5383,5384,5385,-3937,5386,5387,-3934,5388,-3932,5389,5390,-3929,5391,-3927,5392,5393,5394,-4975,5395,5396,-4972,5397,5398,-4969,5399,-4967,5400,-4965,5401,5402,5403,5404,-4960,5405,5406,-3819,5407,-3817,5408,5409,5410,-3813,5411,-3811,5412,5413,5414,-3807,5415,-3805,5416,-3803,5417,-3801,5418,-3799,5419,-3797,5420,-3795,5421,5422,-3792]],"type":"Polygon","properties":{"geoid":"05000US51087","name":"Henrico County"},"id":"VA109"},{"arcs":[[-2421,5423,-2419,5424,5425,-5240,5426,5427,-5237,5428,-5235,5429,-5233,5430,5431,-5230,5432,5433,-5227,5434,5435,5436,5437,-3761,5438]],"type":"Polygon","properties":{"geoid":"05000US51710","name":"Norfolk city"},"id":"VA110"},{"arcs":[[5439,5440,5441,5442,5443,5444,5445,5446,5447,5448,5449,5450,5451,5452,5453,5454,5455,-5242,5456]],"type":"Polygon","properties":{"geoid":"05000US51131","name":"Northampton County"},"id":"VA111"},{"arcs":[[-2800,5457,5458,-3771,5459,-3769,5460,-3767,5461,5462,-3764,5463,-3762,-5438,5464,-5436,-5245,5465,5466,-2804,5467,5468,5469]],"type":"Polygon","properties":{"geoid":"05000US51550","name":"Chesapeake city"},"id":"VA112"},{"arcs":[[5470,-3167,5471,-3165,5472,-3163,5473,-3161,5474,-4567,5475,5476,-4564,5477,-4562,5478,-4560,-1814,5479,-1812,5480,-4682,5481,-4680,5482,-3178,5483,-3176,5484,-3174,5485,-3172,5486,-3170,5487]],"type":"Polygon","properties":{"geoid":"05000US51141","name":"Patrick County"},"id":"VA113"},{"arcs":[[5488,-2196,5489,-2194,5490,-2192,5491,5492,5493,5494,-2187,5495,-2185,5496,5497,5498,-2181,5499,5500,-2178,5501,5502,5503,5504,-2173,5505,5506,-2170,5507,5508,5509,-2166,5510]],"type":"Polygon","properties":{"geoid":"05000US51530","name":"Buena Vista city"},"id":"VA114"},{"arcs":[[5511,5512,5513,5514,5515,5516,5517,5518,5519,-476,5520,5521,5522,-472,5523,5524,5525,-468,5526,-466,5527,-464,5528,5529,-461,5530,5531,-3462,5532,-3460,5533,-3458,5534,-3456,5535,5536,-3453,5537,5538,-3450,5539,-3448,5540,-3446,5541,-3444,5542,5543,-3441,5544,5545,-3438,5546,5547,-3545,5548,-3543,5549,-3541,5550,-4020,5551,-4018,5552,5553,-4015,5554,-4013,5555,-4752,5556,-4750,5557,5558,-4747,5559,5560,5561,-4743,5562,-4741,5563,-4739,5564,5565,5566,-4735,5567,5568,-4732,5569]],"type":"Polygon","properties":{"geoid":"05000US51033","name":"Caroline County"},"id":"VA115"},{"arcs":[[5570,5571,5572,5573,5574,5575,5576,5577,5578,5579,5580,5581,-2703,5582,-2701,5583,5584,-2698,5585,-2696,5586,5587,-2693,5588,-2691,5589,5590,-2688,5591,5592,-3068,-1648,-1141,5593,5594,-1138,5595,-1136,5596,-1134,5597,-1132,5598,-1130,5599,-1128,5600,5601,-1125,5602,5603,-1122,5604,-1120,5605,-1118,5606,-1116,5607,5608]],"type":"Polygon","properties":{"geoid":"05000US51037","name":"Charlotte County"},"id":"VA116"},{"arcs":[[5609,-3943,5610,-3941,5611,-3939,5612,-5385,5613,5614,5615,-4779,5616,5617,-4776,5618,5619,-4773,5620,-4771,5621,-4067,5622,-4065,5623,-4063,5624,5625,-4060,5626,-4058,5627,-4056,5628,5629,-4053,5630,5631,5632,-4049,5633,5634,-4046,5635,5636,-4043,5637,5638,5639,-3589,5640,-4298,5641,-4296,5642,-4294,5643,-4292,5644,-4290,5645,5646,-3978,5647,-3976,5648,-3974,5649,5650,5651,-3970,5652,5653,-3967,5654,-3965,5655,-3963,5656,-3961,5657,-3959,5658,5659,-3956,5660,-3954,5661,5662,-3951,5663,-3949,5664,-3947,5665,-3945]],"type":"Polygon","properties":{"geoid":"05000US51127","name":"New Kent County"},"id":"VA117"},{"arcs":[[-2058,5666,5667,5668,-2416,5669,-2414,5670,-2412,5671,5672,-2063,5673,-2061,5674,5675]],"type":"Polygon","properties":{"geoid":"05000US51735","name":"Poquoson city"},"id":"VA118"},{"arcs":[[-3207,5676,5677,5678,-3006,5679,-4153,5680,-4151,5681,-2355,5682,-2353,5683,-3209,5684]],"type":"Polygon","properties":{"geoid":"05000US51071","name":"Giles County"},"id":"VA119"},{"arcs":[[5685,-5022,5686,5687,-5019,5688,5689,-5016,5690,5691,5692,5693,5694,5695,5696,5697,5698,5699,5700,-5004,5701,5702,5703,5704,5705,5706,5707,5708,5709,5710,5711,5712,5713,5714,5715,-5032,5716,5717,5718,5719,5720,-5026,5721,5722]],"type":"Polygon","properties":{"geoid":"05000US51570","name":"Colonial Heights city"},"id":"VA120"},{"arcs":[[-5446,5723,-5444,5724,5725,-5441,5726,5727,-5455,5728,-5453,5729,-5451,5730,5731,-5448,5732]],"type":"Polygon","properties":{"geoid":"05000US51001","name":"Accomack County"},"id":"VA121"},{"arcs":[[5733,-3628,5734,-3626,5735,-3624,5736,-3622,5737,-3620,5738,-3618,5739,-3616,5740,5741,5742,5743,5744,5745,5746,5747,5748,5749,5750,5751,5752,5753,5754,5755,5756,5757,5758,5759,5760,5761,5762,5763,5764,5765,-1038,5766,-1036,5767,5768,-1222,5769,-1220,5770],[5771,-3023,5772,5773,5774,5775,5776,5777,5778,-3015,5779,5780,5781,5782,5783,5784,5785,5786,5787,5788,5789,5790,-3034,5791,5792,5793,-3030,5794,5795,-3027,5796,-3025]],"type":"Polygon","properties":{"geoid":"05000US51165","name":"Rockingham County"},"id":"VA122"},{"arcs":[[5797,5798,-5110,5799,5800,-2763,5801,5802,-2760,5803,-2758,5804,-2756,5805,-2754,-5440,5806,5807,-5122,5808,-5120,5809,-5118,5810,-5116,5811,-5114,5812]],"type":"Polygon","properties":{"geoid":"05000US51115","name":"Mathews County"},"id":"VA123"},{"arcs":[[-410,5813,-3497,5814,5815,5816,5817,-5208,5818,-5206,5819,5820,5821,5822,5823,5824,-5137,5825,-5135,5826,-5133,5827,-5131,5828,5829,-2681,5830,-2679,5831,-2677,5832,-2675,5833,-2673,5834,-2671,5835,-2669,5836,5837,-2724,5838]],"type":"Polygon","properties":{"geoid":"05000US51049","name":"Cumberland County"},"id":"VA124"},{"arcs":[[-651,5839,5840,-648,5841,5842,5843,5844,-5715,5845,-5713,5846,5847,5848,5849,5850,5851,5852,-4465,5853,5854,-4462,5855,-4460,5856,-4458,5857,5858,-4455,5859,-4453,5860,-4451,5861,5862,-4448,5863,5864,5865,-655,5866,-653,5867]],"type":"Polygon","properties":{"geoid":"05000US51730","name":"Petersburg city"},"id":"VA125"},{"arcs":[[-1040,5868,-5765,5869,-5763,5870,5871,5872,5873,-5758,5874,-5756,5875,5876,-5753,5877,-5751,5878,-5749,5879,5880,5881,-5745,5882,5883,5884,5885,5886,-3613,5887,-3611,5888,-346,5889,5890,-343,5891,-341,5892,-339,5893,5894,-336,5895,5896,-333,5897,-331,5898,-329,5899,-327,5900,-325,5901,-323,5902,-321,5903,5904,5905,-1687,5906,5907]],"type":"Polygon","properties":{"geoid":"05000US51079","name":"Greene County"},"id":"VA126"},{"arcs":[[5908,-168,5909,5910,5911,5912,5913,-162,5914,-160,5915,5916,-157,5917,5918,5919,5920,5921,-5262,5922,-5260,5923,5924,-5257,5925,-5255,5926,-5253,5927,-5251,5928,-5249,5929,-5247,5930,5931,5932,-193,5933,5934,5935,-189,5936,5937,-186,5938,5939,-183,5940,-181,5941,-179,5942,-177,5943,-175,5944,5945,-172,5946,5947]],"type":"Polygon","properties":{"geoid":"05000US51775","name":"Salem city"},"id":"VA127"},{"arcs":[[5948,-958,5949,-956,5950,5951,5952,5953,5954,5955,-3197,5956,-3195,5957,5958,-3192,5959,-3190,5960,5961,5962,5963,-3185,5964,-3183,5965,5966,-3180,5967,-966,5968,5969,-963,5970,5971,5972]],"type":"Polygon","properties":{"geoid":"05000US51640","name":"Galax city"},"id":"VA128"},{"arcs":[[-5823,5973,-5821,5974,-5204,5975,5976,5977,-5200,5978,-5198,5979,-5196,5980,-5194,5981,-5192,-4939,5982,-4937,5983,5984,-4934,5985,-5156,5986,-5154,5987,5988,-5151,5989,5990,-5148,5991,5992,-5145,5993,-5143,5994,-5141,5995,-5139,5996,5997]],"type":"Polygon","properties":{"geoid":"05000US51145","name":"Powhatan County"},"id":"VA129"},{"arcs":[[-2336,5998,5999,6000,6001,-2331,6002,-2329,6003,6004,6005,-2325,6006,6007,6008,-2321,6009,-2319,6010,6011,6012,-2315,6013,-2313,6014,-2311,6015,-2309,6016,-2307,6017,-2305,6018,6019,-2302,6020,6021,6022,6023,6024,6025,6026,6027,-2293,6028,6029,-2290,6030,6031,-2287,6032,6033,6034,-2346,6035,6036,-2343,6037,6038,-2340,6039,-2338,6040]],"type":"Polygon","properties":{"geoid":"05000US51590","name":"Danville city"},"id":"VA130"},{"arcs":[[-880,6041,6042,-877,6043,-875,6044,6045,-872,6046,6047,-439,6048,6049,6050,-435,6051,-433,6052,-431,6053,-429,6054,-427,6055,-2714,6056,-2712,6057,-2710,6058,6059,-2707,6060,-2705,-5581,6061,6062,-5578,6063,-5576,6064,-5574,6065,6066,6067,-4657,6068,6069,6070,6071,6072,6073,-4650,6074,-4648,6075,6076,-882,6077]],"type":"Polygon","properties":{"geoid":"05000US51011","name":"Appomattox County"},"id":"VA131"},{"arcs":[[-4824,6078,-4822,6079,6080,-3152,6081,-3150,6082,6083,6084,-4853,6085,6086,6087,-4849,6088,6089,6090,6091,-4844,6092,-4842,6093,-4840,6094,-4838,6095,6096,6097,6098,6099,-4832,6100,6101,6102,6103,-4827,6104,6105],[6106,6107,6108,6109,6110,6111,6112]],"type":"Polygon","properties":{"geoid":"05000US51683","name":"Manassas city"},"id":"VA132"},{"arcs":[[[6113,-4790,6114,-4788,6115,-4786,6116,-4820,6117,-4818,6118,6119,6120,6121,-4134,6122,6123,6124,6125,6126,6127,6128,-4137,6129,6130,6131,6132,6133,-2231,6134,-2255,6135,6136,-2252,6137,-2250,6138,-2248,6139,-2246,6140,-2244,6141,6142,6143,-4793,6144],[-618,6145,-616,6146,6147,6148,-612,6149,6150,6151,6152,6153,6154,-605,6155,6156,-602,6157,-600,6158,-598,6159,6160,6161,6162,6163]],[[6164,6165,-620]]],"type":"MultiPolygon","properties":{"geoid":"05000US51059","name":"Fairfax County"},"id":"VA133"},{"arcs":[[-2660,6166,6167,6168,6169,-2655,6170,6171,6172,-2651,6173,6174,6175,6176,-2664,6177,6178,6179]],"type":"Polygon","properties":{"geoid":"05000US51840","name":"Winchester city"},"id":"VA134"}]}}};

  /**************************************
                Utilities
  ***************************************/

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if ( options && options.reset === true ) {
      this.options.data = {};
      svg.selectAll('.datamaps-subunit')
        .attr('data-info', function() {
           return "{}"
        })
        .transition().style('fill', this.options.fills.defaultFill)
    }

    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else if ( typeof subunitData.fillColor === "string" ) {
          color = subunitData.fillColor;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        // If it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
