var request = {
  "gender" : [1,2,3],
  "year" : 2007,
  "race" : [1,2,3,4,5,6,7,8,9],
  "acad" : [1,2,3,4,5,6,7,8,9,10]
}
    
function sendRequest() {
  $.ajax({
	url: "http://127.0.0.1:5000/data",
	type: "POST",
	cache: false,
	beforeSend: function (httpRequest) {
	  httpRequest.setRequestHeader('Content-Type', 'application/json');},
    dataType: 'json',
    data :  encodeURI((JSON.stringify(request))),
	processData: false,
	success: function(response) {
	  $("#demo").append(response);},
	error: function (error) {
	  $("#demo").append(error);}
  });
}

function handleGender(v) {
  index = jQuery.inArray(v, request.gender);
  if (index > -1) {
    request.gender.splice(index, 1);
  } else {
	request.gender.push(v);
  }
  $(event.srcElement).toggleClass('active_img')
}

function handleRace() {
  
}

function handleAcad() {
  
}

function displayChart() {

  var w = 200, h = 200, r = 100, color = d3.scale.category20c();     // Built-in range of colors

  data = [{"label":"American Indian or Alaska Native", "value":1},
          {"label":"Asian", "value":2},
          {"label":"Black", "value":3},
          {"label":"Hispanics", "value":4},
          {"label":"Native Hawaiian or Pacific Island", "value":5},
          {"label":"White", "value":6},
          {"label":"Multi Racial", "value":7},
          {"label":"Not Reported", "value":8},
          {"label":"Nonresident Alien", "value":9}];
    
  var vis = d3.select("#chart")
              .append("svg:svg")									// Create the SVG element inside the <body>
              .data([data])                   						// Associate our data with the document
              .attr("width", w)           							// Set the width and height of our visualization (these will be attributes of the <svg> tag)
              .attr("height", h)
              .append("svg:g")                						// Make a group to hold our pie chart
              .attr("transform", "translate(" + r + "," + r + ")")  // Move the center of the pie chart from 0, 0 to radius, radius

  var arc = d3.svg.arc().outerRadius(r); 							// This will create <path> elements for us using arc data

  var pie = d3.layout.pie().value(function(d) { return d.value; }); // This will create arc data for us given a list of values. 
  																	// We must tell it out to access the value of each element in our data array

  var arcs = vis.selectAll("g.slice")     							// This selects all <g> elements with class slice (there aren't any yet)
                .data(pie)                          				// Associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
                .enter()                            				// This will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                .append("svg:g")                					// Create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                .attr("class", "slice");    						// Allow us to style things in the slices (like text)

  arcs.append("svg:path")
      .attr("fill", function(d, i) { return color(i); } ) 			// Set the color for each slice to be chosen from the color function defined above
      .attr("d", arc);                                    			// This creates the actual SVG path using the associated data (pie) with the arc drawing function

  arcs.append("svg:text")                                     		// Add a label to each slice
      .attr("transform", function(d) {                    			// Set the label's origin to the center of the arc we have to make sure to set these before calling arc.centroid
        d.innerRadius = 0;
        d.outerRadius = r;
        return "translate(" + arc.centroid(d) + ")";}) 				// This gives us a pair of coordinates like [50, 50]
      .attr("text-anchor", "middle")                          		// Center the text on it's origin
      .text(function(d, i) { return data[i].label; })
      .style("font-size", "8px");};								    // Get the label from our original data array
