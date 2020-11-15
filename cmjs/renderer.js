const config   = require("../config.json")
	, { database } = require("./database")
	;


module.exports = function(request,response) {
	// read page from database
	if (request.params.id) {
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
	}
	else {
		database.pages.createIndex({
			index: {
			  fields: ['parentId', 'sort']
			}
		})
		.then(function () {
			return database.pages.find({
				selector: {parentId: null},
				fields: ['_id'],
				sort: ['parentId', 'sort'],
				limit: 1		
			});
		})
		.then(function(result){
			  response.redirect("/" + result.docs[0]._id);
		})
		.catch(function(err){
			response.status(error.status).end(error.message);
		});
	}
};
  