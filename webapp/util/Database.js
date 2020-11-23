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
        //    return ajax({
        //        type: "POST",
        //        url: url + "_session",
        //        data: { 
        //             name: user,
        //             password: password
        //        }
        //    });
            return Promise.resolve();
        },

        getPages: function(fields) {
            return ajax({
                type: "GET",
                url: url + "pages"
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
            if (oPage._id) {
                return ajax({
                    type: "PUT",
                    url: url + "pages/" + oPage._id,
                    data: oClone,                 
                });
            }
            else {
                return ajax({
                    type: "POST",
                    url: url + "pages",
                    data: oClone,                 
                });
            }
        },

        getPageTypes: function(refresh) {
            if (refresh || !pageTypes) {
                pageTypes = ajax({
                    type: "GET",
                    url: url + "page_types"
                });
            }
            return pageTypes;
        },

        getPageType: function(_id, refresh) {
            return this.getPageTypes(refresh).then(data => {
                return data.find(t => t._id === _id);
            });
        },

        savePageType: function(oPageType) {
            return ajax({
                type: "PUT",
                url: `${url}page_types/${oPageType._id}`,
                data: oPageType,                 
            });
        },

        deletePageType: function(oPageType) {
            return ajax({
                type: "DELETE",
                url: `${url}page_types/${oPageType._id}`
            });
        },
    }
});