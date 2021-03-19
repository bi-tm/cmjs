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

	var content = response.locals.content;
	content.session = response.locals.session;

	// reset cache if query parameter ?refresh is set
	var refresh = typeof (request.query.refresh) !== "undefined";

	// read menu and breadcrumbs
	const data = await Promise.all([
		menu.get(refresh),
		breadcrumbs.get(response.locals._id)
	])
	.catch(function(err){
		console.error(err);
	});
	content.menu = data[0];
	content.breadcrumbs = data[1];
	
	// mark current entry in menu as active
	content.menu.forEach(menuItem => {
		menuItem.active = (menuItem._id === content._id);
	})
	
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
