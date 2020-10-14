sap.ui.define([
    "./Database"
], function(
    Database
) {
	"use strict";

    function _getChildren(docs,parentId) {
        var result = docs.filter(doc => doc.parentId == parentId);
        result.forEach(child => { child.nodes = _getChildren(docs, child._id); });
        return result;
    }

    function _addParentToPath(parentId, aPath) {
        var result = aPath || [];
        if (typeof(parentId) !== "string" || parentId === "0") {
            return Promise.resolve(result);
        }
        else {            
            return Database.getPage(parentId)
            .then(oPage => {
                result = [oPage].concat(result);
                if (oPage.parentId && oPage.parentId !== "0") {
                    return _addParentToPath(oPage.parentId, result);
                }
                else {
                    return result;
                }
            });
        }
    }


    return {

        read: function() {
            return Database.getPages()
                .then( docs => _getChildren(docs, "0") );
        },

        getPath: function(parentId) {  
            return _addParentToPath(parentId);
        }
        

    };
});