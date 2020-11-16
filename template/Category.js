const {database} = require("../cmjs/database");
module.exports = {

    /**
     * the init function is called before rendering
     * it must return a Promise
     * here you can read additional data asynchronously
     * @param {object} content 
     * @returns {Promise}
     */
    init: function(content) {
        return database.pages.find({
            selector: { parentId: content._id, published:true },
            fields: ["_id","title"],
            sort: ['parentId', 'sort']
        })
        .then(function(result){
            content.children = result.docs;
        });
    }

};