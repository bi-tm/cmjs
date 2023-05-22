sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "cmjs/util/Database"
], function (
    JSONModel,
    Database
) {
    "use strict";

    function _buildTree(docs, parentId) {
        var result = docs.filter(doc => doc.parentId == parentId).sort((a, b) => a.sort - b.sort);
        result.forEach(child => { child.nodes = _buildTree(docs, child._id); });
        return result;
    }

    function _findNodeRecursion(_id, aNodes) {
        if (aNodes && aNodes.find) {
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
        _siteId: "",

        /**
         * set site 
         * @param {string} siteId 
         */
        setSite: function (siteId) {
            if (this._siteId !== siteId) {
                this._siteId = siteId;
                this._readPromise = null;
            }
        },

        /**
         * read tree. the is tree is cached, 
         * @param {boolean} refresh clear cache and reload
         * @returns {Promise}
         */
        read: function (refresh) {
            if (refresh || !this._readPromise) {
                this.setProperty("/nodes", []);
                this._readPromise = Database.getPages(this._siteId)
                    .then(docs => {
                        var tree = _buildTree(docs);
                        this.setProperty("/nodes", tree);
                        return tree;
                    })
                    .catch(err => {
                        this._readPromise = null;
                        throw (err);
                    });
            }
            return this._readPromise;
        },

        /**
         * read a single page from database and refresh it in the tree
         * @param {string} _id 
         * @returns {Promise}
         */
        readPage: function (_id) {
            return this.read()
                .then(() => Database.getPage(_id))
                .then(oPage => {
                    var sPath = this.getPath(_id);
                    var oOldPage = this.getProperty(sPath);
                    oPage.nodes = oOldPage.nodes;
                    this.setProperty(sPath, oPage);
                    return oPage;
                });
        },

        /**
         * instantiate a new page, without saving
         * @param {string} sPageType _id of pageType
         */
        newPage: function (sPageType) {
            return {
                _id: Date.now().toString(),
                siteId: this._siteId,
                legacyUrl: "neue-seite",
                title: "neue Seite",
                pageType: sPageType,
                showInMenu: true,
                menuTitle: null,
                published: false,
                parentId: null
            };
        },

        /**
         * save page
         * @param {object} oPage
         * @returns {Promise}
         */
        savePage: function (oPage) {
            // save
            return Database.savePage(oPage);
        },

        /**
         * save multiple pages as bulk
         * @param {array} aPages 
         */
        savePages: function (aPages) {
            if (!aPages || aPages.length === 0) {
                return Promise.resolve([]);
            }
            var promises = aPages.map((oPage) => {
                return this.savePage(oPage)
            });
            return Promise.all(promises);
        },

        /**
         * removes node from tree
         * @param {string} sPath 
         * @returns {object} removed node
         */
        removeFromTree: function (sPath) {
            var oNode = this.getProperty(sPath);
            var index = parseInt(sPath.replace(/^.*\/(\d+)$/, "$1"));
            var sNodesPath = sPath.replace(/\/\d+$/, "");
            var aNodes = this.getProperty(sNodesPath);
            aNodes.splice(index, 1);
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
        insertIntoTree: function (oPage, sRelation, oRelationPage) {
            var aModified = [], sNodesPath, aNodes, index;
            switch (sRelation) {
                case "Root":
                    oPage.parentId = null;
                    sNodesPath = "/nodes";
                    aNodes = [oPage];
                    index = 0;
                    break;
                case "Before":
                    oPage.parentId = oRelationPage.parentId;
                    sNodesPath = this.getPath(oRelationPage.parentId) + "/nodes";
                    aNodes = this.getProperty(sNodesPath);
                    index = aNodes.findIndex(node => node._id == oRelationPage._id);
                    aNodes.splice(index, 0, oPage);
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
                    aNodes.splice(index + 1, 0, oPage);
                    break;
            }
            // renumber sub pages
            aModified = this.renumberChildren(aNodes);
            // add insert page to array od modidief pages, if necessary
            if (aModified.findIndex(p => p._id === oPage._id) < 0) {
                aModified.push(oPage);
            }

            this.setProperty(sNodesPath, aNodes);
            return aModified;
        },

        /**
         * set sort numbers of children.
         * @param {array} aNodes 
         * @returns {array} list of modified pages
         */
        renumberChildren: function (aNodes) {
            var aModified = [];
            var iPrevSort = 0;
            for (var oChild of aNodes) {
                var iNewSort = typeof (oChild.sort) === "string" ? parseInt(oChild.sort) : oChild.sort;
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
         * @param {string} _id 
         */
        getPathNodes: function (_id) {
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
         * @param {string} _id 
         * @returns {string} path
         */
        getPath: function (_id) {
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
         * @param {string} _id 
         */
        getNode: function (_id) {
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