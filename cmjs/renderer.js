const database     = require("./database")
	, menu         = require("./menu")
	, breadcrumbs  = require("./breadcrumbs")
	, layouts      = require("./layouts")
	, helpers      = require("./helpers")
	, config       = require("./config.json")
	, path         = require("path")
	;

async function _render(request, response) {

	// is there a page id in the URL?
	if (!request.params.id) {
		// redirect to root page
		database.findPages(
			{ parentId: null, showInMenu: true, published: true },
			[ "_id" ],
			{ sort: 1 },
			1
		)
		.then(function(docs) {
			if (docs.length) {
				response.redirect("/" + docs[0]._id);
			}
			else {
				response.status(404).end("no root page");
			}
		})
		.catch(function(err){
			response.status(500).end(err);
		});
		return;
	}

	// reset cache if query parameter ?flush is set
	var refresh = typeof (request.query.flush) !== "undefined";

	// get page, menu, breadcrumbs
	var content = await database.getPage(request.params.id);
	if (!content) {
		content = await database.findPages({legacyUrl: request.params.id})[0];
	}
	if (!content) {
		response.status(500).end(`page ${request.params.id} not found`);
		return;
	}

	// read previous and next page
	const data = await Promise.all([
		menu.get(refresh),
		breadcrumbs.get(content._id)
	])
	.catch(function(err){
		console.error(err);
	});
	content.menu = data[0];
	content.breadcrumbs = data[1];
	content.session = response.locals.session;

	// CMJS  helpers
	content.helpers = helpers;

	// mark current entry in menu as active
	for(var i=0; i<content.menu.length; i++) {				
		content.menu[i].active = (content.menu[i]._id === content._id);
	}

	// hook functions of page type
	try {
		const hookName = require.resolve(path.join(config.projectPath, `/template/${content.pageType}.js`));
		if (refresh) {
			delete require.cache[hookName];
		}
		var hooks = require(hookName);
		Object.assign(content.helpers, hooks);
		// call hook beforeRendering, if it is defined
		if (typeof(hooks.beforeRendering) === "function") {
			await hooks.beforeRendering(content, database);
		}
	}
	catch(e) {
		// it is okay, if there is no Javascript code for a page template
	}

	// template helpers
	try {
		const helpersName = require.resolve(path.join(config.projectPath, "/template/helpers.js"));
		if (refresh) {
			delete require.cache[helpersName];
		}
		const templateHelpers = require(helpersName);
		Object.assign(content.helpers, templateHelpers);
	}	
	catch(e) {
		// it is okay, if there is no Javascript code for helpers in the template
	}
	
	// set layout
	if (refresh) {
		await layouts.refresh();
	}
	content.layout = layouts.get_by_host(request.headers.host);

	// render 
	content.cache = !refresh;
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
};


module.exports = function (request, response) {
	try {
		_render(request, response);
	}
	catch(error) {
		// pouchdb error
		console.error(error.message);
		response.status(error.status).end(error.message);
	};
}
