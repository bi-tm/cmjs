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
        _readPromise: null,

        read: function(refresh) {
            var that = this;
            if (refresh || ! that._readPromise) {
                that.setProperty("/nodes", []);
                that._readPromise = Database.getPages() //["_id", "title", "parentId"])
                .then( docs => {
                    var tree = _buildTree(docs, "0");
                    that.setProperty("/nodes", tree);
                    return tree;
                });
            }
            return that._readPromise;
        },

        getPathNodes: function(_id) {  
            var oNode = this.getNode(_id);
            if (oNode) {
                return this.getPathNodes(oNode.parentId).concat([oNode]);
            }
            else {
                return [];
            }
        },

        getPath: function(_id) {
            var result = "";
            var aNodes = this.getProperty("/nodes");
            for (var oNode of this.getPathNodes(_id)) {
                var index = aNodes.findIndex(n => n._id === oNode._id);
                result += "/nodes/" + index;
                aNodes = aNodes[index].nodes;
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