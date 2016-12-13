exports.handler = function(event, context) {
  var CouchPotatoAPI = require('couchpotato-api');

  var couchpotato = new CouchPotatoAPI({
    hostname: process.env.CP_HOSTNAME,
    apiKey: process.env.CP_API_KEY,
    port: parseInt(process.env.CP_PORT)
  });


  var json = JSON.parse(event.body);

  if (json.result.action == "no") {
    var fcontext = json.result.contexts.filter(function(d) { return d.name == 'movie'; })[0];

    couchpotato.get("search", {q: fcontext.parameters.original }).then(function (result) {
      if (!result.movies[fcontext.parameters.index]) {
        var ret = {
          speech: "I don't know what the hell you were looking for then",
          displayText: "I don't know what the hell you were looking for then",

          source: "MyButt"
        };
          
        return context.succeed({
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ret)
        });

      }

      var movie = result.movies[fcontext.parameters.index];

      var ret = {
          speech: "Ok that's fine, Did you want to download " + movie.titles[0] + " made in " + movie.year + "?",
          displayText: "Ok that's fine, Did you want to download " + movie.titles[0] + " made in " + movie.year + "?",
          contextOut: [
            {
              name: "movie",
              parameters: {
                imdb: fcontext.parameters.imdb,
                original: fcontext.parameters.original,
                index: ((1*fcontext.parameters.index)+1)
              }
            }
          ],
          source: "MyButt"
      };
      
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });
    });
  } else if (json.result.action == "yes") {
    var fcontext = json.result.contexts.filter(function(d) { return d.name == 'movie'; })[0];

    couchpotato.get('movie.add', { identifier: fcontext.parameters.imdb }).then(function(result) {
      var ret = {
        speech: "Downloading that shit like a boss",
        displayText: "Downloading that shit like a boss",

        source: "MyButt"
      };
        
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });
    }).catch(function (err) {
      var ret = {
        speech: "I failed at my one duty",
        displayText: "I failed at my one duty",

        source: "MyButt"
      };
        
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });
    });
  } else if (json.result.action == "download.movie") {
    couchpotato.get("search", {q: json.result.parameters.any}).then(function (result) {
      var movie = result.movies[0];

      var ret = {
          speech: "You want to download " + movie.titles[0] + " made in " + movie.year + "?",
          displayText: "You want to download " + movie.titles[0] + " made in " + movie.year + "?",
          contextOut: [
            {
              name: "movie",
              parameters: {
                imdb: movie.imdb,
                original: json.result.parameters.any,
                index: 1
              }
            }
          ],
          source: "MyButt"
      };
      
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });
    });
  } else if (json.result.action == "connection.status") {
    // get CouchPotato version
    couchpotato.get("app.version").then(function (result) {
      var ret = {
          speech: "Connection to CouchPotato is working perfectly.",
          displayText: "Connection to CouchPotato is working perfectly",
          source: "MyButt"
      };
      
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });

        // result will be json a response
    }).catch(function (err) {
      var ret = {
          speech: "Could not connect to CouchPotato",
          displayText: "I could not connect to CouchPotato. Check your configuration and try again.",
          source: "MyButt"
      };
      
      return context.succeed({
          statusCode: 200,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(ret)
      });
    });
  }
};


