var async = require('async');
var needle = require('needle');
var url = require('url');

var util = require('./util.js');
var kodi = require('./kodi.js');
var cp   = require('./couchpotato.js');

var sickrage = require('./sickrage.js');

exports.handler = function(event, context) {
  var json = JSON.parse(event.body);

  if (["resume", "pause", "episodes.recent", "movies.recent", "movie.play"].indexOf(json.result.action) !== -1) {
    return kodi.handler(event, context);
  }
  else if (["shows.schedule"].indexOf(json.result.action) !== -1) {
    return sickrage.handler(event, context);
  }
  else {
    return cp.handler(event, context);
  }
};
