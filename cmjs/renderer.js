const config   = require("../config.json")
	, { database } = require("./database")
	;


module.exports = function(request,response) {
	// read page from database
	database.pages.get(request.params.id)
	.then(dbResp => {
	  if (typeof(request.query.flush) !== "undefined" ) {
		dbResp.cache = false;
	  }
			// render 
	  response.render(dbResp.pageType, dbResp, function(error,html) {
		if (error) {
		  // render error
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
  