const database     = require("./database")
	, menu         = require("./menu")
	, breadcrumbs  = require("./breadcrumbs")
	;

function _next(sort, parentId) {
	return database.findPages(
		{parentId: parentId, published: true, sort: {"$gt": sort}},
		{_id:1, menuTitle:1},
		{sort: 1},
		1);
};

function _previous(sort, parentId) {
	return database.findPages(
		{parentId: parentId, published: true, sort: {"$lt": sort}},
		{_id:1, menuTitle:1},
		{sort: -1},
		1);
}

async function _render(request, response) {

	// is there a page id in the URL?
	if (!request.params.id) {
		// redirect to root page
		database.findPages(
			{ parentId: null, showInMenu: true, published: true },
			{ _id:1 },
			{ sort: 1 },
			1)
		.then(function(docs) {
			if (docs.length) {
				response.redirect("/" + docs[0]._id);
			}
			else {
				response.status(500).end(err);
			}
		});
		return;
	}

	// reset cache if query parameter ?flush is set
	var refresh = typeof (request.query.flush) !== "undefined";

	// get page, menu, breadcrumbs
	const results = await Promise.all([
		database.getPage(request.params.id),
		menu.get(refresh)
	])
	.catch(function(err){
		console.error(err);
	});
	if (!results) {
		response.status(500).end("page not found");
		return;
	}
	var content = results[0];
	content.menu = results[1];

	// read previous and next page
	const prevNext = await Promise.all([
		_previous(content.sort, content.parentId),
		_next(content.sort, content.parentId),
		breadcrumbs.get(request.params.id)
	])
	.catch(function(err){
		console.error(err);
	});
	content.previous = prevNext[0][0];
	content.next = prevNext[1][0];
	content.breadcrumbs = prevNext[2];

	// mark current entry in menu as active
	for(var i=0; i<content.menu.length; i++) {				
		content.menu[i].active = (content.menu[i]._id === request.params.id);
	}

	// hook functions of page type
	try {
		const hookName = require.resolve(`../template/${content.pageType}.js`);
		if (refresh) {
			delete require.cache[hookName];
		}
		var hooks = require(hookName);
		content = Object.assign(content, hooks);
		// call hook beforeRendering, if it is defined
		if (typeof(hooks.beforeRendering) === "function") {
			await hooks.beforeRendering(content);
		}
	}
	catch(e) {
		// it is okay, if there is no Javascript code for a page template
	}

	// general helpers
	const helpersName = require.resolve(`../template/helpers.js`);
	if (refresh) {
		delete require.cache[helpersName];
	}
	const helpers = require(helpersName);
	if (helpers) {
		if (typeof(content.helpers) === "undefined") {
			content.helpers = {};
		}
		Object.assign(content.helpers, helpers);		
	}

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
