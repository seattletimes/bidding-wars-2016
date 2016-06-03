// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");

var xhr = require("./lib/xhr");
var $ = require("./lib/qsa");

var mapElement = document.querySelector("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;
var keyElement = document.querySelector(".map-key");

var template = require("./lib/dot").compile(require("./_tooltip.html"));

var bidding = window.biddingData;
var year = 2016;
var mode = "aboveList";
var featureLookup = {};

var hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

var scale = [
  { limit: .2, color: hsl(160, 16, 13) },
  { limit: .3, color: hsl(190, 26, 13) },
  { limit: .4, color: hsl(230, 36, 33) },
  { limit: .5, color: hsl(280, 36, 33) },
  { limit: .6, color: hsl(310, 46, 43) },
  { limit: .7, color: hsl(340, 66, 53) },
  { limit: 1, color: hsl(0, 76, 63) }
];

xhr("./assets/king.geojson", function(err, data) {

  var bars = keyElement.querySelector(".bars");
  scale.forEach(function(s) {
    var b = document.createElement("i");
    b.className = "bar";
    b.style.background = s.color;
    bars.appendChild(b);
  })

  var fillKey = function() {
    var h1 = keyElement.querySelector(".title");
    var big = keyElement.querySelector(".big");
    var small = keyElement.querySelector(".small");
    switch (mode) {
      case "aboveList":
        h1.innerHTML = year == "delta" ? "Increase in homes sold above list price" : "Homes sold above list price";
        small.innerHTML = year == "delta" ? "< 10 pp" : "< 20%";
        big.innerHTML = year == "delta" ? "> 35 pp" : "> 70%";
        break;
    
      case "multipleBids":
        h1.innerHTML = year == "delta" ? "Increase in homes with multiple bids" : "Homes with multiple bids";
        small.innerHTML = year == "delta" ? "< 10 pp" : "< 20%";
        big.innerHTML = year == "delta" ? "> 35 pp" : "> 70%";
        break;

      case "sold":
        h1.innerHTML = "Total homes sold";
        small.innerHTML = 0;
        big.innerHTML = getMaxSold().toLocaleString().replace(/\.0+$/, "");
    }
  };

  fillKey();
  
  var paintDelta = function(feature) {
    var from = bidding[mode][2012][feature.properties.ZIP];
    var to = bidding[mode][2016][feature.properties.ZIP];
    var fillColor = "transparent";
    if (from && to) {
      var difference = to.value - from.value;
      for (var i = 0; i < scale.length; i++) {
        var pigment = scale[i];
        if (difference <= pigment.limit * .5) {
          fillColor = pigment.color;
          break;
        }
      }
    }
    return {
      fillColor,
      weight: 1,
      color: "rgba(0, 0, 0, .8)",
      fillOpacity: .7
    };
  };

  var getMaxSold = function() {
    return Math.max.apply(null, Object.keys(bidding.sold[year]).map(z => bidding.sold[year][z].value));
  };

  var paintSold = function(feature) {
    var view = bidding.sold[year];
    var zip = view[feature.properties.ZIP];
    var fillColor = "transparent";
    var max = getMaxSold();
    console.log(max);
    if (zip && typeof zip.value == "number") {
      var scaled = zip.value / max;
      for (var i = 0; i < scale.length; i++) {
        var pigment = scale[i];
        if (scaled <= pigment.limit) {
          fillColor = pigment.color;
          break;
        }
      }
    }
    return {
      fillColor,
      weight: 1,
      color: "rgba(0, 0, 0, .8)",
      fillOpacity: .7
    };
  };

  var paint = function(feature) {
    if (year == "delta") return paintDelta(feature);
    if (mode == "sold") return paintSold(feature);
    var view = bidding[mode][year];
    var zip = view[feature.properties.ZIP];
    var fillColor = "transparent";
    if (zip && typeof zip.value == "number") {
      for (var i = 0; i < scale.length; i++) {
        var pigment = scale[i];
        if (zip.value <= pigment.limit) {
          fillColor = pigment.color;
          break;
        }
      }
    }
    return {
      fillColor,
      weight: 1,
      color: "rgba(0, 0, 0, .8)",
      fillOpacity: .7
    }
  };

  var onClick = function(e) {
    var zip = this.ZIP;
    var multiples = [];
    var aboves = [];
    var sold = [];
    for (var y = 2012; y <= 2016; y++) {
      if (bidding.multipleBids[y][zip]) {
        multiples.push(bidding.multipleBids[y][zip]);
      }
      if (bidding.aboveList[y][zip]) {
        aboves.push(bidding.aboveList[y][zip]);
      }
      if (bidding.sold[y][zip]) {
        sold.push(bidding.sold[y][zip]);
      }
    }
    var data = {
      zip,
      multiples,
      aboves,
      sold,
      post: this.PO_NAME
    };
    map.openPopup(template(data), e.latlng)
  };

  var king = L.geoJson(data, {
    style: paint,
    onEachFeature: function(feature, layer) {
      layer.on("click", onClick.bind(feature.properties));
    }
  });
  king.addTo(map);
  map.fitBounds(king.getBounds());

  var switchYear = function() {
    document.querySelector(".switch-year.selected").classList.remove("selected");
    this.classList.add("selected");
    year = this.getAttribute("data-year");
    king.setStyle(paint);
    fillKey();
  };

  $(".switch-year").forEach(el => el.addEventListener("click", switchYear));

  var switchMode = function() {
    document.querySelector(".switch-mode.selected").classList.remove("selected");
    this.classList.add("selected");
    mode = this.getAttribute("data-mode");
    var delta = document.querySelector("[data-year=delta]");
    if (mode == "sold") {
      delta.style.display = "none";
      if (year == "delta") {
        year = 2016;
        document.querySelector(".switch-year.selected").classList.remove("selected");
        document.querySelector(`[data-year="2016"]`).classList.add("selected");
      }
    } else {
      delta.style.display = "";
    }
    king.setStyle(paint);
    fillKey();
  };

  $(".switch-mode").forEach(el => el.addEventListener("click", switchMode));
});