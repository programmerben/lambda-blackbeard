var async = require('async');
var needle = require('needle');
var url = require('url');
var moment = require('moment');

var util = require('./util.js');

var shows = {};

exports.handler = function(event, context) {
  var baseUrl = 'http://' + process.env.SR_HOSTNAME + ':' + process.env.SR_PORT + '/api/' + process.env.SR_API_KEY + '/';

  var json = JSON.parse(event.body);

  if (json.result.action == "shows.schedule") {
    var url = baseUrl + "?cmd=future&sort=date&type=soon";

    needle.get(url, function(err, response) {
      if (err) {
        return util.simple_response("Error connecting to Sick Rage.", context);
      }

      var soon = response.body.data.soon;
      var msg = "The upcoming television shows for the next week are, ";

      var byDay = new Array(7);

      var dupeDetect = {};

      for (var i=0; i < soon.length; i++) {
        // This prevents neftlix/amazon show releases from reporting off 20x episodes at a single time
        if (dupeDetect[soon[i].show_name + '-' + soon[i].airs]) continue;
        dupeDetect[soon[i].show_name + '-' + soon[i].airs] = true;

        var m = soon[i].show_name + " season " + soon[i].season + " episode " + soon[i].episode + " on " + soon[i].airs.split(' ')[0] + " at " + soon[i].airs.split(' ')[1];

        msg += m + ", ";
      }

      return util.simple_response(msg, context);
    });
  }
};
