var async = require('async');
var needle = require('needle');
var url = require('url');
var util = require('./util.js');

function kodi_call(method, params, id, callback) {
  var pl = {
    "jsonrpc": "2.0",
    "method": method,
    "id": id
  };

  if (params && Object.keys(params).length > 0) {
    pl.params = params;
  }

  var url = 'http://' + process.env.KODI_USERNAME + ':' + process.env.KODI_PASSWORD + '@' + process.env.KODI_HOSTNAME + ':' + process.env.KODI_PORT + '/jsonrpc?request=' + encodeURIComponent(JSON.stringify(pl));

  var options = {
    headers: {'Content-type': 'application/json'}
  };

  needle.get(url, options, callback);
}

exports.handler = function(event, context) {
  var json = JSON.parse(event.body);

  if (json.result.action == 'movie.play') {
    var movie = json.result.parameters.any;

    var params = {
      "filter": {
        "field": "title", 
        "operator": "contains", 
        "value": movie
      }, 
      "limits": { "start" : 0, "end": 5 }, 
      "properties" : ["art", "rating", "thumbnail", "playcount", "file"], 
      "sort": { "order": "ascending", "method": "label", "ignorearticle": true } 
    };
 
    return kodi_call("VideoLibrary.GetMovies", params, "libMovies", function(err, response) {
      if (err) {
        return util.simple_response("Error connecting to Kodi.", context);
      }

      if (!response || !response.body || !response.body.result || !response.body.result.movies || !response.body.result.movies.length) {
        return util.simple_response("I could not find " + movie, context);
      }


      var params = {
        "item": {
          "movieid": response.body.result.movies[0].movieid
        },
        "options": {
          "resume": true
        }
      };

      return kodi_call("Player.Open", params, 1, function(err, response) {
        if (err) {
          return util.simple_response("Error connecting to Kodi.", context);
        }

        return util.simple_response("Now playing, " + movie + ", enjoy your fucking movie.", context);
      });
    });
    
  } else if (json.result.action == 'resume') { 
    var playerIds = [];

    async.series([
      function(cb) {
        return kodi_call("Player.GetActivePlayers", null, 1, function(err, response) {
          if (!response.body || !response.body.result || !response.body.result.length) {
            return util.simple_response("I don't think Kodi is currently playing anything right now.", context);
          }

          response.body.result.forEach(function(r) {
            playerIds.push(r.playerid);
          });

          return cb();
        });
      },
      function(cb) {
        async.eachSeries(playerIds, function(pid, cab) {
          var params = {
            "playerid": pid,
            "properties": ["speed"]
          };

          return kodi_call("Player.GetProperties", params, 1, function(err, response) {
            if (!response.body || !response.body.result) {
              return util.simple_response("I experienced a weird issue trying to get a player's speed.", context);
            }

            var speed = response.body.result.speed;

            if (speed !== 0) {
              return util.simple_response("Are you stupid? It was already playing.", context);
            }
            else {
              return kodi_call("Player.PlayPause", { "playerid": pid }, 1, function(err, response) {
                return cab();
              });
            }
          });
        }, cb);
      }
    ], function(err) { 
      return util.simple_response("Kodi should now be playing.", context);
    });
  } else if (json.result.action == 'pause') { 
    var playerIds = [];

    async.series([
      function(cb) {
        return kodi_call("Player.GetActivePlayers", null, 1, function(err, response) {
          if (!response.body || !response.body.result || !response.body.result.length) {
            return util.simple_response("I don't think Kodi is currently playing anything right now.", context);
          }

          response.body.result.forEach(function(r) {
            playerIds.push(r.playerid);
          });

          return cb();
        });
      },
      function(cb) {
        async.eachSeries(playerIds, function(pid, cab) {
          var params = {
            "playerid": pid,
            "properties": ["speed"]
          };

          return kodi_call("Player.GetProperties", params, 1, function(err, response) {
            if (!response.body || !response.body.result) {
              return util.simple_response("I experienced a weird issue trying to get a player's speed.", context);
            }

            var speed = response.body.result.speed;

            if (speed === 0) {
              return util.simple_response("Are you stupid? It was already paused.", context);
            }
            else {
              return kodi_call("Player.PlayPause", { "playerid": pid }, 1, function(err, response) {
                return cab();
              });
            }
          });
        }, cb);
      }
    ], function(err) { 
      return util.simple_response("Kodi should now be paused.", context);
    });
  } else if (json.result.action == 'episodes.recent') {
    var params = {
      "properties": ["title", "showtitle", "season", "episode"],
      "limits": {
        "end": 5
      }
    };

    return kodi_call("VideoLibrary.GetRecentlyAddedEpisodes", params, 1, function(err, response) {
      if (err) {
        return util.simple_response("Could not connect to Kodi", context);
      }

      var msg;

      if (!response || !response.body || !response.body.result || !response.body.result.episodes || !response.body.result.episodes.length) {
        msg = "No recently added episodes found";
      }
      else
      {
        msg = "The following episodes have been added to your Kodi library recently, ";
        for (var i=0 ;i < 5 && i < response.body.result.episodes.length; i++) {
          var m = response.body.result.episodes[i].showtitle + " season " + response.body.result.episodes[i].season + " episode " + response.body.result.episodes[i].episode;

          msg += m + ", ";
        }

        return util.simple_response(msg, context);
      }
   });
  } else if (json.result.action == 'movies.recent') {
    var params = {
      "limits": {
        "end": 5
      }
    };

    return kodi_call("VideoLibrary.GetRecentlyAddedMovies", params, 1, function(err, response) {
      if (err) {
        return util.simple_response("Could not connect to Kodi", context);
      }

      var msg;

      if (!response || !response.body || !response.body.result || !response.body.result.movies || !response.body.result.movies.length) {
        msg = "No recently added movies found";
      }
      else
      {
        msg = "The following movies have been added to your Kodi library recently, ";
        for (var i=0 ;i < 5 && i < response.body.result.movies.length; i++) {
          var m = response.body.result.movies[i].label;

          msg += m + ", ";
        }

        return util.simple_response(msg, context);
      }
    });
  }
};
