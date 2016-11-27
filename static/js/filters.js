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

function selectGender(v) {
  index = jQuery.inArray(v, request.gender);
  if (index > -1) {
    request.gender.splice(index, 1);
  } else {
	request.gender.push(v);
  }
  $(event.srcElement).toggleClass("active_img")
}

function selectRace(vis, d, r, v) {
  var index = jQuery.inArray(v, request.race);
  var color = "white";
  if (index > -1) {
    request.race.splice(index, 1);
  } else {
	request.race.push(v);
	color = "#357EC7";
  }
  console.log(request.race);
  // Outer boundary
  drawSelectionArc(vis, r, d.startAngle, d.endAngle, color);
}

function selectAcad() {
  
}

var arc

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
  
  arc = d3.svg.arc().outerRadius(r); 							    // This will create <path> elements for us using arc data
  
  var arcs = vis.selectAll("g.slice")     							// This selects all <g> elements with class slice (there aren't any yet)
                .data(pie)                          				// Associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
                .enter()                            				// This will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                .append("svg:g")                					// Create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                .attr("class", "slice")     						// Allow us to style things in the slices (like text)
                .on("click", function(d, i) {
                  selectRace(vis, d, r, data[i].id);});
  
  arcs.append("svg:path")
      .attr("fill", function(d, i) { return color(i); } ) 			// Set the color for each slice to be chosen from the color function defined above
      .attr("d", arc)                                    			// This creates the actual SVG path using the associated data (pie) with the arc drawing function
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
      .style("font-size", "8px");								    // Get the label from our original data array

};

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
      
      
      
      
      
      
      
      
      
      
      
      
      