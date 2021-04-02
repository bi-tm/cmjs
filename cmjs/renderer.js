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

async function _render(request, response, next) {

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
	response.locals.menu = data[0];
	response.locals.breadcrumbs = data[1];
	
	// mark current entry in menu as active
	response.locals.menu.forEach(menuItem => {
		menuItem.active = (menuItem._id === response.locals._id);
	})
	
	// CMJS  helpers
	response.locals.helpers = helpers;

	// hook functions of page type
	const hookName = path.join(config.projectPath, `/template/${response.locals.pageType}.js`);
	if (fs.existsSync(hookName)) {
		try {
			if (refresh) {
				delete require.cache[hookName];
			}		
			var hooks = require(hookName);
			// call hook beforeRendering, if it is defined
			if (typeof(hooks.beforeRendering) === "function") {
				await hooks.beforeRendering(response.locals, database);
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
			Object.assign(response.locals.helpers, templateHelpers);

		}
		catch(e) {
			console.error(e);
		}
	}	
	
	// set layout
	if (refresh) {
		await layouts.refresh();
	}
	response.locals.layout = layouts.get_by_host(request.headers.host);

	// render 
	response.locals.cache = !refresh;
	response.render(response.locals.pageType, function (error, html) {
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


module.exports = function (request, response, next) {
	try {
		_render(request, response, next);		
	}
	catch(error) {
		// pouchdb error
		console.error(error.message);
		response.status(error.status).end(error.message);
	};
}
