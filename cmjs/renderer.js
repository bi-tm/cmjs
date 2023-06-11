const { fstat } = require("fs");
const database = require("./database"),
    helpers = require("./helpers"),
    config = require("./config.json"),
    path = require("path"),
    fs = require("fs");

async function _render(request, response, next) {

    // CMJS  helpers
    response.locals.helpers = helpers;

    // hook functions of page type    const 
    var hookName = path.join(config.projectPath, "template", "layouts", response.locals.site.layout, "views", response.locals.pageType + ".js");
    if (!fs.existsSync(hookName)) {
        hookName = path.join(config.projectPath, "template", "views", response.locals.pageType + ".js");
    }
    if (fs.existsSync(hookName)) {
        try {
            if (!response.locals.cache) {
                delete require.cache[hookName];
            }
            var hooks = require(hookName);
            // call hook redirect, if it is defined
            if (typeof (hooks.redirect) === "function") {
                var target = await hooks.redirect(response.locals, database);
                if (target) {
                    response.redirect(target);
                    return;
                }
            }
            // call hook beforeRendering, if it is defined
            if (typeof (hooks.beforeRendering) === "function") {
                await hooks.beforeRendering(response.locals, database);
            }
            // call hook getLayout
            if (typeof (hooks.getLayout) === "function") {
                response.locals.layout = await hooks.getLayout(response.locals, database);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // template helpers
    var helpersName = path.join(config.projectPath, "template", "layouts", response.locals.site.layout, "views", "helpers.js");
    if (!fs.existsSync(helpersName)) {
        helpersName = path.join(config.projectPath, "template", "views", "helpers.js");
    }
    if (fs.existsSync(helpersName)) {
        try {
            if (!response.locals.cache) {
                delete require.cache[helpersName];
            }
            const templateHelpers = require(helpersName);
            Object.assign(response.locals.helpers, templateHelpers);

        } catch (e) {
            console.error(e);
        }
    }

    // render 
    var view = path.resolve(config.projectPath, "template", "layouts", response.locals.site.layout, "views", response.locals.pageType);
    if (!fs.existsSync(view + '.hbs')) {
        view = path.resolve(config.projectPath, "template", "views", response.locals.pageType);
    }

    const options = {
        layout: path.resolve(config.projectPath, "template", "layouts", response.locals.site.layout, "layout.hbs"),
    };
    response.render(view, options, function (error, html) {
        if (error) {
            // render error
            console.error(error.message);
            response.status(500).end(error.message);
        } else {
            // ready
            response.send(html);
        }
    });
};


module.exports = function (request, response, next) {
    try {
        _render(request, response, next);
    } catch (error) {
        // pouchdb error
        console.error(error.message);
        response.status(error.status).end(error.message);
    };
}