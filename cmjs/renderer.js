const { database } = require("./database")
	, menu         = require("./menu")
	, breadcrumbs  = require("./breadcrumbs")
	, children     = require("./children")
	;

function _next(sort, parentId) {
	return database.pages.createIndex({ name: 'prevNext', index: { fields: ['parentId', 'published', 'sort'] } })
	.then(function() {
		return database.pages.find({
			selector: { "parentId": parentId, "published": true, "sort": {"$gt": sort} },
			fields: ["_id", "menuTitle"],
			sort: ["parentId", "published", {"sort": "asc"}],
			limit: 1
		});
	})
	.then(function(result){
		return Promise.resolve(result.docs[0]);
	});
};


function _previous(sort, parentId) {
	return database.pages.createIndex({ name: 'prevNext', index: { fields: ['parentId', 'published', 'sort'] }})
	.then(function() {
		return database.pages.find({
			selector: { "parentId": parentId, "published": true, "sort": {"$lt": sort} },
			fields: ["_id", "menuTitle"],
			sort: ["parentId", "published", {"sort": "desc"}],
			limit: 1
		});
	})
	.then(function(result){
		return Promise.resolve(result.docs[0]);
	});
}

async function _render(request, response) {

	// is there a page id in the URL?
	if (!request.params.id) {
		// redirect to root page
		const root = await database.pages.find({
			selector: { parentId: null, showInMenu: true, published: true },
			fields: ['_id'],
			sort: ['parentId', 'showInMenu', 'published', 'sort'],
			limit: 1
		});
		response.redirect("/" + root.docs[0]._id);
		return;
	}

	// reset cache if query parameter ?flush is set
	var refresh = typeof (request.query.flush) !== "undefined";

	// get page, menu, breadcrumbs
	const readResult = await Promise.all([
		database.pages.get(request.params.id), 
		menu.get(refresh),
		breadcrumbs.get(request.params.id)
	]);
	var content = readResult[0];
	content.menu = readResult[1];
	content.breadcrumbs = readResult[2];
	
	// read previous and next page
	const prevNext = await Promise.all([
		_previous(content.sort, content.parentId),
		_next(content.sort, content.parentId)
	]);	
	content.previous = prevNext[0];
	content.next = prevNext[1];

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
