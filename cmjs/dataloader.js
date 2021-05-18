var database = require('./database');
var menu = require("./menu");
var breadcrumbs = require("./breadcrumbs");

module.exports = async function(request, response, next) {

    // reset cache ?
    response.locals.cache = (typeof(request.query.refresh) === "undefined");

    // get page
    var content = await database.getPage(request.params.id);
    if (!content) {
        response.locals = await database.findPages({ legacyUrl: request.params.id })[0];
    }
    if (content) {
        // copy page data to repsonse.locals
        Object.assign(response.locals, content);

        // read menu and breadcrumbs
        const data = await Promise.all([
                menu.get(!response.locals.cache),
                breadcrumbs.get(response.locals._id)
            ])
            .catch(function(err) {
                console.error(err);
            });
        response.locals.menu = data[0];
        response.locals.breadcrumbs = data[1];

        // mark current entry in menu as active
        response.locals.menu.forEach(menuItem => {
                menuItem.active = (menuItem._id === response.locals._id);
            })
            // poceed
        next();
    } else {
        response.status(500).end(`page ${request.params.id} not found`);
    }
}