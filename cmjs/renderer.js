const { fstat } = require("fs");
const database = require("./database"),
    layouts = require("./layouts"),
    helpers = require("./helpers"),
    config = require("./config.json"),
    path = require("path"),
    fs = require("fs");

async function _render(request, response, next) {

    // CMJS  helpers
    response.locals.helpers = helpers;

    // hook functions of page type
    const hookName = path.join(config.projectPath, `/template/${response.locals.pageType}.js`);
    if (fs.existsSync(hookName)) {
        try {
            if (!response.locals.cache) {
                delete require.cache[hookName];
            }
            var hooks = require(hookName);
            // call hook beforeRendering, if it is defined
            if (typeof(hooks.beforeRendering) === "function") {
                await hooks.beforeRendering(response.locals, database);
            }
            // call hook getLayout
            if (typeof(hooks.getLayout) === "function") {
                response.locals.layout = await hooks.getLayout(response.locals, database);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // template helpers
    const helpersName = path.join(config.projectPath, "/template/helpers.js");
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

    // set layout, if not set by hook function
    if (!response.locals.layout) {
        if (!response.locals.cache) {
            await layouts.refresh();
        }
        response.locals.layout = layouts.get_by_host(request.headers.host);
    }

    // render 
    response.render(response.locals.pageType, function(error, html) {
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


module.exports = function(request, response, next) {
    try {
        _render(request, response, next);
    } catch (error) {
        // pouchdb error
        console.error(error.message);
        response.status(error.status).end(error.message);
    };
}