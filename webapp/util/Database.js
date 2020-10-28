sap.ui.define([
], function() {
    'use strict';

    const url = "/db/";
    var pageTypes = null;

    function ajax(params) {
        return new Promise((resolve,reject) => {
            params.success = function(data, textStatus, jqXHR) {
                resolve(data);
            };
            params.error =  function(jqXHR, textStatus, errorThrown) {
                reject({status:jqXHR.status, text:errorThrown});
            };
            params.xhrFields = {
                withCredentials: true
            };
            params.contentType= "application/json";
            params.crossDomain = true;
            params.dataType = "json";
            params.data = params.data && JSON.stringify(params.data);
            jQuery.ajax(params);
        });
    }
    
    return {
        
        logon: function(user,password) {
           return ajax({
               type: "POST",
               url: url + "_session",
               data: { 
                    name: user,
                    password: password
               }
           });
        },

        getPages: function(fields) {
            return ajax({
                type: "POST",
                url: url + "pages/_find",
                data: {
                    "selector": {
                        "_id": {
                            "$gte": null
                        }
                    },
                    "limit": 10000
                }
            }).then(function(data) {
                return data.docs
            });
        },

        getPage: function(_id) {
            return ajax({
                type: "GET",
                url: url + "pages/" + _id,
            });
        },

        savePage: function(oPage) {
            // page clone without 'nodes' property
            var oClone = Object.assign({}, oPage);
            oClone.nodes = undefined;
            return ajax({
                type: "PUT",
                url: url + "pages/" + oPage._id,
                data: oClone,                 
            });
        },

        savePages: function(aPages) {
            if (!aPages || aPages.length === 0) return Promise.resolve([]);
            var aDocs = aPages.map(oPage => {
                var oClone = Object.assign({}, oPage);
                oClone.nodes = undefined;
                return oClone;
            });
            return ajax({
                type: "POST",
                url: url + "pages/_bulk_docs",
                data: {docs:aDocs},                 
            });

        },

        getPageTypes: function(refresh) {
            if (refresh || !pageTypes) {
                pageTypes = ajax({
                    type: "POST",
                    url: url + "page_types/_find",
                    data: {
                        "selector": {
                            "_id": {
                                "$gte": null
                            }
                        },
                        "limit": 10000
                    }
                    }).then(function(data) {
                    return data.docs
                })
                .catch(error => {
                    pageTypes = null;
                    throw(error);
                });
            }
            return pageTypes;
        },

        getPageType: function(_id, refresh) {
            return this.getPageTypes(refresh).then(data => {
                return data.find(t => t._id === _id);
            });
        }

    }
});