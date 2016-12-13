function simple_response(msg, context) {
  var ret = {
    speech: msg,
    displayText: msg,
    source: "Black Beard"
  };
    
  return context.succeed({
      statusCode: 200,
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(ret)
  });
}

exports.simple_response = simple_response;
