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

var template = require("./lib/dot").compile(require("./_tooltip.html"));

var bidding = window.biddingData;
var year = 2016;
var mode = "aboveList";

var hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

var scale = [
  { limit: .2, color: hsl(200, 16, 23) },
  { limit: .3, color: hsl(220, 26, 23) },
  { limit: .4, color: hsl(240, 26, 33) },
  { limit: .5, color: hsl(260, 36, 33) },
  { limit: .6, color: hsl(280, 46, 43) },
  { limit: .7, color: hsl(300, 56, 43) },
  { limit: 2, color: hsl(320, 66, 53) }
];

xhr("./assets/king.geojson", function(err, data) {
  
  var paintDelta = function(feature) {
    var from = bidding[mode][2015][feature.properties.ZIP];
    var to = bidding[mode][2016][feature.properties.ZIP];
    var fillColor = "transparent";
    if (from && to) {
      var difference = to.value - from.value;
      console.log(feature.properties.ZIP, difference);
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
    }
  };

  var paint = function(feature) {
    if (year == "delta") return paintDelta(feature);
    var view = bidding[mode][year];
    var zip = view[feature.properties.ZIP];
    var fillColor = "transparent";
    if (zip && zip.value) {
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
    var city = null;
    var county = null;
    for (var y = 2012; y <= 2016; y++) {
      if (bidding.multipleBids[y][zip]) {
        var m = bidding.multipleBids[y][zip];
        multiples.push(m);
        city = m.city;
      }
      if (bidding.aboveList[y][zip]) {
        aboves.push(bidding.aboveList[y][zip]);
      }
    }
    var data = {
      zip,
      city,
      multiples,
      aboves
    };
    console.log(aboves);
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
  };

  $(".switch-year").forEach(el => el.addEventListener("click", switchYear));

  var switchMode = function() {
    document.querySelector(".switch-mode.selected").classList.remove("selected");
    this.classList.add("selected");
    mode = this.getAttribute("data-mode");
    king.setStyle(paint);
  };

  $(".switch-mode").forEach(el => el.addEventListener("click", switchMode));
});