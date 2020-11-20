const { database } = require("./database")
	, menu         = require("./menu")
	, breadcrumbs  = require("./breadcrumbs")
	;

module.exports = function (request, response) {

	// is there a page id in the URL?
	if (!request.params.id) {
		// redirect to root page
		database.pages.find({
			selector: { parentId: null, showInMenu: true, published: true },
			fields: ['_id'],
			sort: ['parentId', 'showInMenu', 'published', 'sort'],
			limit: 1
		})
		.then(function(root){
			response.redirect("/" + root.docs[0]._id);
		})
		return;
	}

	// reset cache if query parameter ?flush is set
	var refresh = typeof (request.query.flush) !== "undefined";

	// get page and menu
	var content = {};
	Promise.all([
		database.pages.get(request.params.id), 
		menu.get(refresh),
		breadcrumbs.get(request.params.id)
	]) 
	.then(function(data) {
		content = data[0];
		content.menu = data[1];
		content.breadcrumbs = data[2];
		content.cache = !refresh;		

		// mark current entry in menu as active
		for(var i=0; i<content.menu.length; i++) {				
			content.menu[i].active = (content.menu[i]._id === request.params.id);
		}

		// read sepcial functions of page type
		try {
			var hooks = require(`../template/${content.pageType}.js`);
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
