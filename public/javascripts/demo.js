(function(window, document) {
  var n = 10, // number of layers
    m = 60, // number of samples per layer
    stack = window.d3.layout.stack(),
    layers = stack(window.d3.range(n).map(function() { return bumpLayer(m, .1); })),
    yGroupMax = window.d3.max(layers, function(layer) { return window.d3.max(layer, function(d) { return d.y; }); }),
    yStackMax = window.d3.max(layers, function(layer) { return window.d3.max(layer, function(d) { return d.y0 + d.y; }); }),
      // layers is an array or arrays, first level is the four layers of bars, sublevel is that row of bars
    margin = {top: 10, right: -8, bottom: 0, left: -8},
    width = document.getElementById("hero-img").offsetWidth - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom,
    x = window.d3.scale.ordinal()
      .domain(window.d3.range(m))
      .rangeRoundBands([0, width], .05),
    y = window.d3.scale.linear()
      .domain([0, yStackMax])
      .range([height, 0]),
    color = window.d3.scale.linear()
      .domain([0, n - 1])
      .range(["#24B1E0", "#F80F40"]),
    xAxis = window.d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickPadding(6)
      .orient("bottom"),
    svg = window.d3.select("#hero-img").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
    layer = svg.selectAll(".layer")
      .data(layers)
      .enter().append("g")
      .attr("class", "layer")
      .style("fill", function(d, i) { return color(i); }),
    rect = layer.selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", height)
      .attr("width", x.rangeBand())
      .attr("height", 0);

  rect.transition()
      .delay(function(d, i) { return i * 30; })
      .attr("y", function(d) { return y(d.y0 + d.y); })
      .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

  // This returns a layer of x,y where y is the data value (2 tweets or w/e)
  function bumpLayer(n, o) {

    function bump(a) {
      var x = 1 / (.1 + Math.random()),
          y = 2 * Math.random() - .5,
          z = 10 / (.1 + Math.random());
      for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
      }
    }

    var a = [], i;
    for (i = 0; i < n; ++i) a[i] = o + o * Math.random();
    for (i = 0; i < 5; ++i) bump(a);
    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
  }
  function  makeLayer(ar){
    return ar.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////

  // var data_json = <%= @tweets_json.html_safe %>,
  //     parseDate = window.d3.time.format("%m/%d/%Y").parse,
  //     stack = window.d3.layout.stack(),
  //     n = data_json.length, // number of layers
  //     m = data_json[0].length, // number of samples per layer
  //     layers = stack(data_json.map(function(dd) {return dd.map(function(d, i) {return {date: d.date, type: d.type, x: i, y: Math.max(0, d.value)};} ); })),
  //     yStackMax = window.d3.max(layers, function(layer) { return window.d3.max(layer, function(d) { return d.y0 + d.y; }); }),
  //     margin = {top: 10, right: 5, bottom: 20, left: 5},
  //     width = document.getElementById("tweets-breakdown").offsetWidth - margin.left - margin.right,
  //     height = 400 - margin.top - margin.bottom;

  // // data_json.forEach(function(dd) {
  // //   dd.forEach(function(d){
  // //     d.date = parseDate(d.date); // Convert times to d3 style
  // //   })
  // // });

  // var x = window.d3.scale.ordinal()
  //     .domain(window.d3.range(m))
  //     .rangeRoundBands([0, width], .08);

  // var y = window.d3.scale.linear()
  //     .domain([0, yStackMax])
  //     .range([height, 0]);

  // var color = window.d3.scale.linear()
  //     .domain([0, n - 1])
  //     .range(["#c0e7f7", "#29b1e4"]);

  // var xAxis = window.d3.svg.axis()
  //     .scale(x)
  //     .tickValues(data_json[0].map(function(d) { return d.date.substr(0,5)}))
  //     .tickSize(0)
  //     .tickPadding(6)
  //     .orient("bottom");

  // var svg = window.d3.select("#tweets-breakdown").append("svg")
  //     .attr("width", width + margin.left + margin.right)
  //     .attr("height", height + margin.top + margin.bottom)
  //     .append("g")
  //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // var layer = svg.selectAll(".layer")
  //     .data(layers)
  //     .enter().append("g")
  //     .attr("class", "layer")
  //     .style("fill", function(d, i) { return color(i); });

  // var rect = layer.selectAll("rect")
  //     .data(function(d) { return d; })
  //   .enter().append("rect")
  //     .attr("x", function(d) { return x(d.x); })
  //     .attr("y", height)
  //     .attr("width", x.rangeBand())
  //     .attr("height", 0);

  // rect.transition()
  //     .delay(function(d, i) { return i * 10; })
  //     .attr("y", function(d) { return y(d.y0 + d.y); })
  //     .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

  // svg.append("g")
  //     .attr("class", "x-axis")
  //     .attr("transform", "translate(0," + height + ")")
  //     .call(xAxis);
})(this, this.document);