sap.ui.define([
    "cmjs/util/Ajax",
    "sap/m/MessageBox"
], function (Ajax, MessageBox) {
    'use strict';

    const url = "/api/db/";
    var pageTypes = null;
    var sites = null;
    var users = null;

    return {

        /**
         * 
         * @param {string} siteId 
         * @returns {Promise}
         */
        getPages: function (siteId) {
            return Ajax({
                type: "GET",
                url: `${url}pages?$filter=siteId $eq ${siteId}`
            });
        },

        getPage: function (_id) {
            return Ajax({
                type: "GET",
                url: `${url}pages/${_id}`,
            });
        },

        savePage: function (oPage) {
            // page clone without 'nodes' property
            var oClone = Object.assign({}, oPage);
            oClone.nodes = undefined;
            return Ajax({
                type: "PUT",
                url: `${url}pages/${oPage._id}?$upsert`,
                data: oClone,
            });
        },

        getPageTypes: function (refresh) {
            if (refresh || !pageTypes) {
                pageTypes = Ajax({
                    type: "GET",
                    url: `${url}page_types`
                })
                    .catch(function () {
                        pageTypes = null;
                    });
            }
            return pageTypes;
        },

        getPageType: function (_id, refresh) {
            return this.getPageTypes(refresh).then(data => {
                return data.find(t => t._id === _id);
            });
        },

        savePageType: function (oPageType) {
            return Ajax({
                type: "PUT",
                url: `${url}page_types/${oPageType._id}?$upsert`,
                data: oPageType,
            });
        },

        deletePageType: function (oPageType) {
            return Ajax({
                type: "DELETE",
                url: `${url}page_types/${oPageType._id}`
            });
        },

        /**
         * read web sites 
         * @param {boolean} refresh 
         * @returns Promise
         */
        getSites: function (refresh) {
            if (refresh || !sites) {
                sites = Ajax({
                    type: "GET",
                    url: `${url}sites`
                });
            }
            return sites;
        },

        getSite: function (_id, refresh) {
            return this.getSites(refresh).then(data => {
                return data.find(t => t._id === _id);
            });
        },

        saveSite: function (oSite) {
            return Ajax({
                type: "PUT",
                url: `${url}sites/${oSite._id}?$upsert`,
                data: oSite,
            });
        },

        deletePageType: function (oSite) {
            return Ajax({
                type: "DELETE",
                url: `${url}sites/${oSite._id}`
            });
        },

        getUsers: function (refresh) {
            if (refresh || !users) {
                users = Ajax({
                    type: "GET",
                    url: `${url}users`
                });
            }
            return users;
        },

        getUser: function (_id, refresh) {
            return this.getUsers(refresh).then(data => {
                return data.find(t => t._id === _id);
            });
        },

        saveUser: function (oUser) {
            return Ajax({
                type: "PUT",
                url: `${url}users/${oUser._id}?$upsert`,
                data: oUser,
            });
        },

        deleteUser: function (oUser) {
            return Ajax({
                type: "DELETE",
                url: `${url}users/${oUser._id}`
            });
            users = null;
        },
    }
});