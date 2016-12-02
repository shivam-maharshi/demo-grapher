var request = {
  "year" : 2007,
  "college" : [1,2,3,5,6,7,8,9,10],
  "gender" : [1,2,3],
  "race" : [1,2,3,4,5,6,7,8,9],
  "acad" : [1,2,3,4,5,6,7,8,9,10]
};

var acadChildren = [[1,2,3,4,5,6,7,8,9,10],[1,5,9,6,10],[2,7],[3,8],[4],[5,9],[6,10],[7],[8],[9],[10]];
var acadParent = [[0],[0],[0],[0],[0],[0,1],[0,1],[0],[0],[0],[0]];
var collegeChildren = [[1,2,3,5,6,7,8,9,10],[1],[2],[3],[],[5],[6],[7],[8],[9],[10]];

function getYearList(onDone) {
    $.ajax({
        url: "/years",
        type: "GET",
        accept: 'application/json',
        success: onDone,
        error: function (jqXHR, status, error) { $("#error").html("Error In fetching year list! : " + error); }
    });
}

function setupYearSlider() {
    getYearList(function (years) {
        years = JSON.parse(years).years;
        request["year"] = years[years.length - 1];
        $('#slider').ionRangeSlider({
            type: 'single',
            grid: true,
            values: years,
            from: years[years.length - 1],
            prettify_enabled: false,
            onFinish: function (data) {
                console.log(data.from_value);
                request["year"] = data.from_value;
            }
        });
    });
}

function createCollegeDropDown(cl) {										
  var cont = $('#cd_dd');
  for (i=0; i<cl.length; i++) {												// Add checkboxes dynamically.
	c = cl[i];
	addCheckbox(cont, parseInt(c.cc), c.cn);
	for (j=0; j<c.dl.length; j++) {
	  addLabel(cont, parseInt(c.dl[j].dc), c.dl[j].dn);
	}
	$('<li />', {"class" : "divider"}).appendTo(cont);
  }
  value = collegeChildren[0];
  for (i=0; i<value.length; i++) {
	$("#cc" + value[i]).prop('checked', true);
  }
}

function setupCollegeDropDown() {
  $.ajax({
	url: "/colleges",
	type: "GET",
	beforeSend: function (httpRequest) {
    httpRequest.setRequestHeader('Accept', 'application/json');},
	dataType: 'json',
	success: createCollegeDropDown,
	error: function (jqXHR, status, error) {
	  $("#error").html("Error In fetching college list! : " + error);}
  });
}

function addCheckbox(cont, id, name) {
  $('<input />', { type: 'checkbox', id: 'cc' + id, value: id, style: "margin-left: 10;", onClick: "selectCollege(this)"}).appendTo(cont);
  $('<label />', { 'for': 'cc' + id, text: name, style: "margin-left: 5;" }).appendTo(cont);
  $('<br>').appendTo(cont);
}

function addLabel(cont, id, name) {
  $('<label />', { id: 'dc' + id, text: name, style: "margin-left: 40; font-weight: normal;" }).appendTo(cont);
  $('<br>').appendTo(cont);
}

function submitRequest(onSuccess) {
    $.ajax({
        url: "/data",
        type: "POST",
        cache: false,
        accept: 'application/json',
        data : encodeURI(JSON.stringify(request)),
        processData: false,
        success: onSuccess,
        error: function (jqXHR, status, error) {
            $("#error").html("Error In submitting request! : " + error);
        }
    });
}

function selectCollege(e) {
  value = collegeChildren[parseInt(e.value)];
  if(e.checked) {
	insertIfAbsent(request.college, value);
	if(request.college.length==9) {
	  $('#cc0').prop('checked', true);
	}
  } else {
	$('#cc0').prop('checked', false);										// Must deselect parent checkbox if child is deselected. 
	removeIfPresent(request.college, value);
  }
  for (i=0; i<value.length; i++) {
	$('#cc'+value[i]).prop('checked', e.checked);
  }
  console.log(request.college);
}

function selectGender(id, v) {
  index = jQuery.inArray(v, request.gender);
  if (index > -1) {
	if (request.gender.length > 1) {
	  request.gender.splice(index, 1);
	  if (id=='f_img') {
	    $("#"+id).attr('src', '/static/img/fi.png');
	  } else if (id=='m_img') {
	    $("#"+id).attr('src', '/static/img/mi.png');
	  } else {
	    $("#"+id).attr('src', '/static/img/ni.png');
	  }
	  $(event.srcElement).toggleClass("active_img");
	}
  } else {
	request.gender.push(v);
	if (id=='f_img') {
	  $("#"+id).attr('src', '/static/img/fa.png');
	} else if (id=='m_img') {
	  $("#"+id).attr('src', '/static/img/ma.png');
	} else {
	  $("#"+id).attr('src', '/static/img/na.png');
	}
	$(event.srcElement).toggleClass("active_img");
  }
  
  console.log(request.gender);
}

function selectRace(vis, d, r, v) {
  var index = jQuery.inArray(v, request.race);
  if (index > -1) {
	if (request.race.length > 1) {
      request.race.splice(index, 1);
      drawSelectionArc(vis, r, d.startAngle, d.endAngle, "white");			// Outer boundary
	}
  } else {
	request.race.push(v);
	drawSelectionArc(vis, r, d.startAngle, d.endAngle, "#357EC7");			// Outer boundary
  }
  console.log(request.race);
}

function selectAcad(e) {
  value = acadChildren[e.value];
  if(e.checked) {
	insertIfAbsent(request.acad, value);
  } else {
	removeIfPresent(request.acad, value);
  }
  for (i=0; i<value.length; i++) {
	$('#al'+value[i]).prop("checked", e.checked);
  }
  console.log(request.acad);
}

function checkAllAcad() {
  $('#al0').prop("checked", true);
  value = acadChildren[0];
  for (i=0; i<value.length; i++) {
	$('#al'+value[i]).prop("checked", true);
  }
}

function insertIfAbsent(array, value) {
  for (i=0; i<value.length; i++) {
    if(jQuery.inArray(value[i], array) < 0) {
	  array.push(value[i]);
    }
  }
}

function removeIfPresent(array, value) {
  for (i=0; i<value.length; i++) {
    var index = jQuery.inArray(value[i], array);
    if(index > -1) {
      array.splice(index, 1);
    }
  }
}

function displayChart() {

  var w = 230, h = 230, r = 110, color = d3.scale.category20c();     // Built-in range of colors

  data = [{"id":2, "label":"Asian", "value":1},
          {"id":3, "label":"Black", "value":1},
          {"id":1, "label":"India/Alaska", "value":1},
          {"id":4, "label":"Hispanic", "value":1},
          {"id":6, "label":"White", "value":1},
          {"id":7, "label":"MultiRace", "value":1},
          {"id":5, "label":"Hawai/Pacific", "value":1},
          {"id":9, "label":"NR Alien", "value":1},
          {"id":8, "label":"NA", "value":1}];

  var vis = d3.select("#chart")
              .append("svg:svg")									// Create the SVG element inside the <body>
              .data([data])                   						// Associate our data with the document
              .attr("width", w)           							// Set the width and height of our visualization (these will be attributes of the <svg> tag)
              .attr("height", h)
              .append("svg:g")                						// Make a group to hold our pie chart
              .attr("transform", "translate("+ w/2 +","+ h/2 +")"); // Move the center of the pie chart from 0, 0 to radius, radius
  
  var pie = d3.layout.pie().value(function(d) { return d.value; }); // This will create arc data for us given a list of values. 
  																	// We must tell it out to access the value of each element in our data array
  var arc = d3.svg.arc().outerRadius(r); 							// This will create <path> elements for us using arc data
  
  var arcs = vis.selectAll("g.slice")     							// This selects all <g> elements with class slice (there aren't any yet)
                .data(pie)                          				// Associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
                .enter()                            				// This will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                .append("svg:g")                					// Create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                .attr("class", "slice clickable")     				// Allow us to style things in the slices (like text)
                .on("click", function(d, i) {
                  selectRace(vis, d, r, data[i].id);});
  
  arcs.append("svg:path")
      .attr("fill", function(d, i) { return color(i); } ) 			// Set the color for each slice to be chosen from the color function defined above
      .attr("d", arc)                                   			// This creates the actual SVG path using the associated data (pie) with the arc drawing function
      .style("stroke", "white")
      .style("stroke-width", 1);
  
  arcs.append("svg:text")                                     		// Add a label to each slice
      .attr("transform", function(d, i) {                    		// Set the label's origin to the center of the arc we have to make sure to set these before calling arc.centroid
        d.innerRadius = 0;
        d.outerRadius = r;
        return "translate(" + arc.centroid(d) + ")";}) 				// This gives us a pair of coordinates like [50, 50]
      .attr("text-anchor", "middle")                          		// Center the text on it's origin
      .text(function(d, i) { 
    	  drawSelectionArc(vis, r, d.startAngle, d.endAngle, "#357EC7");
    	  return data[i].label; })
      .attr("font-weight","Bold")
      .style("font-size", "10px");								    // Get the label from our original data array
}

function drawSelectionArc(vis, r, sa, ea, color) {
  var arc = d3.svg.arc()
			  .innerRadius(r)
			  .outerRadius(r + 5)
			  .startAngle(sa)
			  .endAngle(ea);

  vis.append("path")
     .attr("d", arc)
     .attr("fill", color)
	 .style("stroke", "white")
	 .style("stroke-width", 1);
}
