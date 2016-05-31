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
var year = 2012;
var mode = "multipleBids";

var hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

var scale = [
  { limit: .2, color: hsl(100, 66, 23) },
  { limit: .3, color: hsl(120, 66, 23) },
  { limit: .4, color: hsl(140, 66, 23) },
  { limit: .5, color: hsl(160, 66, 23) },
  { limit: .6, color: hsl(180, 66, 23) },
  { limit: .7, color: hsl(200, 66, 23) },
  { limit: 1, color: hsl(220, 66, 23) }
];

xhr("./assets/king.geojson", function(err, data) {
  var boundary = .2;
  var paint = function(feature) {
    var view = bidding[mode][year];
    var value = view[feature.properties.ZIP];
    var fillColor = "gray";
    if (value) {
      if (mode == "multipleBids") value = value.multiple_offers;
      for (var i = 0; i < scale.length; i++) {
        var pigment = scale[i];
        if (value <= pigment.limit) {
          fillColor = pigment.color;
          break;
        }
      }
      if (fillColor == "gray") console.log(feature);
    }
    return {
      fillColor,
      stroke: false,
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
        aboves.push({ year: y, value: bidding.aboveList[y][zip] });
      }
    }
    var data = {
      zip,
      city,
      multiples,
      aboves
    }
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