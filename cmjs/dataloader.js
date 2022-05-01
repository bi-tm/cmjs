var database = require("./database");
var menu = require("./menu");
var breadcrumbs = require("./breadcrumbs");

module.exports = async function (request, response, next) {
  // get page
  var content = await database.getPage(request.params.id);
  if (!content) {
    content = await database.findPages({
      legacyUrl: request.params.id,
    })[0];
  }
  if (!content) {
    response.redirect("/");
  } else {
    // copy page data to repsonse.locals
    Object.assign(response.locals, content);

    // read menu and breadcrumbs parallel
    var dbRequests = [
      menu.get(!response.locals.cache),
      breadcrumbs.get(response.locals._id),
    ];
    if (response.locals.parentId) {
      // allso read parent pager
      dbRequests.push(database.getPage(response.locals.parentId));
    }
    const data = await Promise.all(dbRequests).catch(function (err) {
      console.error(err);
    });
    response.locals.menu = data[0];
    response.locals.breadcrumbs = data[1];
    response.locals.parent = data[2];

    // read grandparent
    if (response.locals.parent && response.locals.parent.parentId) {
      response.locals.grandparent = await database.getPage(
        response.locals.parent.parentId
      );
    }

    // mark current entry in menu as active
    response.locals.menu.forEach((menuItem) => {
      menuItem.active = menuItem._id === response.locals._id;
    });
    // poceed
    next();
  }
};
