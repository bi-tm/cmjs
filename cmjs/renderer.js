const config = require("../config.json")
	, { database } = require("./database")
	, menu = require("./menu")
	;
	
module.exports = function (request, response) {
	var content = {};
	// reset cache if query parameter ?flush is set
	if (typeof (request.query.flush) !== "undefined") {
		content.cache = false;
	}
	// get menu
	menu.get(!content.cache)
	.then(function(menuData) {
		content.menu = menuData;
		
		// is there a page id in the URL?
		if (!request.params.id) {
			// redirect to root page
			response.redirect("/" + content.menu[0]._id);
		}
		else {
			// mark current entry in menu as active
			for(var i=0; i<content.menu.length; i++) {				
				content.menu[i].active = (content.menu[i]._id === request.params.id);
			}
			// read page from database
			return database.pages.get(request.params.id);
		}
	})
	.then(function(page) {
		content = Object.assign(content, page);
		// read sepcial functions of page type
		try {
			var hooks = require(`../template/${page.pageType}.js`);
			content = Object.assign(content, hooks);
			// call init hook, if it is defined
			if (typeof(hooks.init) === "function") {
				return hooks.init(content);
			}
		}
		catch(e) {
			// it is okay, if there is no Javascript code for a page template
		}
	})
	.then(function(){
		// render 
		response.render(content.pageType, content, function (error, html) {
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
