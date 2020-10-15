sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "cmjs/util/Database"
], function(
    JSONModel,
    Database
) {
	"use strict";

    function _buildTree(docs,parentId) {
        var result = docs.filter(doc => doc.parentId == parentId);
        result.forEach(child => { child.nodes = _buildTree(docs, child._id); });
        return result;
    }

    function _findNodeRecursion(_id, aNodes) {
        if  (aNodes && aNodes.find) {
            var result = aNodes.find(p => p._id === _id);
            if (result) {
                return result;
            }
            else {
                for (var oNode of aNodes) {
                    result = _findNodeRecursion(_id, oNode.nodes);
                    if (result) {
                        return result;
                    }
                }
            }
        } 
        return null;
    }

    return JSONModel.extend("cmjs.model.TreeModel", {

        _changedPages: [],
        _newPages: [],

        read: function() {
            var that = this;
            return Database.getPages(["_id", "title", "parentId"])
                .then( docs => {
                    var tree = _buildTree(docs, "0");
                    that.setProperty("/nodes", tree);
                    return tree;
                });
        },

        getParentNodes: function(parentId, aPath) {  
            var result = aPath || [];
            if (typeof(parentId) === "string" && parentId !== "0") {
                var oParent = this.getNode(parentId);
                if (oParent) {
                    result = [oParent].concat(result);
                    if (typeof(oParent.parentId) === "string" && oParent.parentId !== "0") {
                        result =  this.getParentNodes(oParent.parentId, result);
                    }
                }
            }
            return result;
        },

        getNode: function(_id) {			
			var aNodes = this.getProperty("/nodes");
			return _findNodeRecursion(_id, aNodes);
		},

        updatePage(oPage) {
            this._changedPages.push(oPage);
            oNode = this.getNode(oPage._id);
            oNode.title = oPage.title;
            oNode.parentId = oPage.parentId;
        }
    });
});