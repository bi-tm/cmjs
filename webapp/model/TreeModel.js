sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "cmjs/util/Database"
], function(
    JSONModel,
    Database
) {
	"use strict";

    function _buildTree(docs,parentId) {
        var result = docs.filter(doc => doc.parentId == parentId).sort( (a,b) => a.sort - b.sort );
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

        /**
         * read tree. the is tree is cached, 
         * @param {*} refresh clear cache and reload
         * @returns {Promise}
         */
        read: function(refresh) {
            var that = this;
            if (refresh || ! that._readPromise) {
                that.setProperty("/nodes", []);
                that._readPromise = Database.getPages() //["_id", "title", "parentId"])
                .then( docs => {
                    var tree = _buildTree(docs, "0");
                    that.setProperty("/nodes", tree);
                    return tree;
                })
                .catch(err => {
                    that._readPromise = null;
                    throw(err);
                });
            }
            return that._readPromise;
        },

        /**
         * read a single page from database and refresh it in the tree
         * @param {string} _id 
         * @returns {Promise}
         */
        readPage: function(_id) {
            var that = this;
            return this.read()
            .then( () => Database.getPage(_id) )            
            .then(oPage => {
                var sPath = that.getPath(_id);
                var oOldPage = that.getProperty(sPath);
                oPage.nodes = oOldPage.nodes;                
                that.setProperty(sPath, oPage);
                return oPage;
            });
        },

        /**
         * save page, which is in the tree at specified path.
         * @param {string} sPath 
         * @returns {Promise}
         */
        savePage: function(oPage) {
            // clone page without 'node' property
            var oPageWithoutSubnodes = {};
            Object.assign(oPageWithoutSubnodes, oPage);
            oPageWithoutSubnodes.node = undefined;
            // save
            return Database.savePage(oPageWithoutSubnodes);
        },

        /**
         * removes node from tree
         * @param {string} sPath 
         * @returns {object} removed node
         */
        removeFromTree: function(sPath) {
            var oNode = this.getProperty(sPath);
            var index = parseInt(sPath.replace(/^.*\/(\d+)$/, "$1"));
            var sNodesPath = sPath.replace(/\/\d+$/, "");
            var aNodes = this.getProperty(sNodesPath);
            aNodes.splice(index,1);
            this.setProperty(sNodesPath, aNodes);
            return oNode;
        },

        /**
         * inserts page into tree at specified position.
         * @param {object} oPage 
         * @param {sap.ui.core.dnd.DropPositio} sRelation  Before, On, After 
         * @param {object} oRelationPage 
         * @returns {array} list of modified nodes
         */
        insertIntoTree: function(oPage, sRelation, oRelationPage) {
            var aModified = [oPage], sNodesPath, aNodes, index;
            switch (sRelation) {
                case "Before":
                    oPage.parentId = oRelationPage.parentId;
                    sNodesPath = this.getPath(oRelationPage.parentId) + "/nodes";                    
                    aNodes = this.getProperty(sNodesPath);
                    index = aNodes.findIndex(node => node._id == oRelationPage._id);
                    aNodes.splice(index,0,oPage);
                    break;
                case "On": // insert as sub node
                    oPage.parentId = oRelationPage._id;
                    sNodesPath = this.getPath(oRelationPage._id) + "/nodes";                    
                    aNodes = this.getProperty(sNodesPath);
                    aNodes.push(oPage);                                        
                    break;
                case "After":
                    oPage.parentId = oRelationPage.parentId;
                    sNodesPath = this.getPath(oRelationPage.parentId) + "/nodes";                    
                    aNodes = this.getProperty(sNodesPath);
                    index = aNodes.findIndex(node => node._id == oRelationPage._id);
                    aNodes.splice(index+1,0,oPage);
                    break;
            }
            aModified = aModified.concat(this.renumberChildren(aNodes));
            this.setProperty(sNodesPath, aNodes);
            return aModified;
        },

        /**
         * set sort numbers of children.
         * @param {array} aNodes 
         * @returns {array} list of modified pages
         */
        renumberChildren: function(aNodes) {
            var aModified = [];
            var iPrevSort = 0;
            for(var oChild of aNodes) {
                var iNewSort = typeof(oChild.sort) === "string" ? parseInt(oChild.sort) : oChild.sort;
                if (iNewSort <= iPrevSort) {
                    iNewSort = iPrevSort + 1;
                }
                if (iNewSort !== oChild.sort) {
                    oChild.sort = iNewSort;
                    aModified.push(oChild);
                }
                iPrevSort = iNewSort;
            }
            return aModified;
        },

        /**
         * get all pages of the hierarchy path, including selected page
         * @param {*} _id 
         */
        getPathNodes: function(_id) {  
            var oNode = this.getNode(_id);
            if (oNode) {
                return this.getPathNodes(oNode.parentId).concat([oNode]);
            }
            else {
                return [];
            }
        },

        /**
         * get path as string
         * @param {*} _id 
         */
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

        /**
         * get node of tree, which is the page and all sub-nodes
         * @param {*} _id 
         */
        getNode: function(_id) {			
			var aNodes = this.getProperty("/nodes");
			return _findNodeRecursion(_id, aNodes);
        },
        
        /**
         * get all children of a parent page
         * @param {*} parentId 
         */
        getChildren(parentId) {
            return getNode(parentId).nodes;
        }

    });
});