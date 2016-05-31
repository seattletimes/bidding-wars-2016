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

var bidding = window.biddingData;
var year = 2012;
var mode = "multipleBids";

xhr("./assets/king.geojson", function(err, data) {
  var boundary = .2;
  var paint = function(feature) {
    var view = bidding[mode][year];
    console.log(mode, year, view);
    var value = view[feature.properties.ZIP];
    var fillColor = "gray";
    if (value) {
      fillColor = value > boundary ? "red" : "yellow";
    }
    return {
      fillColor,
      stroke: false
    }
  };

  var king = L.geoJson(data, { style: paint });
  king.addTo(map);
  map.fitBounds(king.getBounds());

  var switchYear = function() {
    year = this.getAttribute("data-year");
    king.setStyle(paint);
  };

  $(".switch-year").forEach(el => el.addEventListener("click", switchYear));

  var switchMode = function() {
    mode = this.getAttribute("data-mode");
    king.setStyle(paint);
  };

  $(".switch-mode").forEach(el => el.addEventListener("click", switchMode));
});