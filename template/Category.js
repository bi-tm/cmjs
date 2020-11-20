const children = require("../cmjs/children");
module.exports = {

    /**
     * the init function is called before rendering
     * it must return a Promise
     * here you can read additional data asynchronously
     * @param {object} content 
     * @returns {Promise}
     */
    init: function(content) {
        return children.get(content._id)
            .then(function(result){
                content.children = result;
            });
    }

};