const mustache = require('mustache-express')
    , config   = require("../config.json")
	, { database } = require("./database")
	;


module.exports = function(request,response) {
	// read page from database
	if (typeof(request.query.flush) !== "undefined" ) {
	  engine.cache.reset();
	}
	database.pages.get(request.params.id)
	.then(dbResp => {
	  // render mustache
	  response.render(dbResp.pageType, dbResp, function(error,html) {
		if (error) {
		  // mustache error
		  console.error(error.message);
		  response.status(500).end(error.message);
		}
		else {
		  // ready
		  response.send(html);
		}
	  });
	})
	.catch(error => {
	  // pouchdb error
  	  console.error(error.message);
	  response.status(error.status).end(error.message);
	});
  };
  