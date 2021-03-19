const { fstat } = require("fs");
const database     = require("./database")
	, menu         = require("./menu")
	, breadcrumbs  = require("./breadcrumbs")
	, layouts      = require("./layouts")
	, helpers      = require("./helpers")
	, config       = require("./config.json")
	, path         = require("path")
	, fs           = require("fs")
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

	// reset cache if query parameter ?refresh is set
	var refresh = typeof (request.query.refresh) !== "undefined";

	// get page, menu, breadcrumbs
	var content = await database.getPage(request.params.id);
	if (!content) {
		content = await database.findPages({legacyUrl: request.params.id})[0];
	}
	if (!content) {
		response.status(500).end(`page ${request.params.id} not found`);
		return;
	}

	// read menu and breadcrumbs
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

	// mark current entry in menu as active
	for(var i=0; i<content.menu.length; i++) {				
		content.menu[i].active = (content.menu[i]._id === content._id);
	}
	
	// CMJS  helpers
	content.helpers = helpers;

	// hook functions of page type
	const hookName = path.join(config.projectPath, `/template/${content.pageType}.js`);
	if (fs.existsSync(hookName)) {
		try {
			if (refresh) {
				delete require.cache[hookName];
			}		
			var hooks = require(hookName);
			// call hook beforeRendering, if it is defined
			if (typeof(hooks.beforeRendering) === "function") {
				await hooks.beforeRendering(content, database);
			}
		}
		catch(e) {
			console.error(e);
		}
	}

	// template helpers
	const helpersName = path.join(config.projectPath, "/template/helpers.js");
	if (fs.existsSync(helpersName)) {
		try {
			if (refresh) {
				delete require.cache[helpersName];
			}
			const templateHelpers = require(helpersName);
			Object.assign(content.helpers, templateHelpers);

		}
		catch(e) {
			console.error(e);
		}
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
