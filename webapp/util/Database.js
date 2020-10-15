sap.ui.define([
], function() {
    'use strict';

    const url = "./api/";
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
            params.crossDomain = true;
            jQuery.ajax(params);
        });
    }
    
    return {
        
        logon: function(user,password) {
           return ajax({
               type: "POST",
               url: url + "_session",
               contentType: "application/json",
               data: JSON.stringify({ 
                    name: user,
                    password: password
               })
           });
        },

        getPages: function(fields) {
            return ajax({
                type: "POST",
                contentType: "application/json",
                url: url + "pages/_find",
                data: JSON.stringify({
                    "selector": {},
                    "fields": fields,
                    "sort": ["parentId", "sort"],
                    "limit": 10000
                })
            }).then(data=> data.docs);
        },

        getPage: function(_id) {
            return ajax({
                type: "GET",
                url: url + "pages/" + _id,
            });
        },

        savePage: function(oPage) {
            return ajax({
                type: "PUT",
                url: url + "pages/" + oPage._id,
                async: true,
                dataType: "json",
                data: JSON.stringify(oPage),                 
            });
        },

        getPageTypes: function(refresh) {
            if (refresh || !pageTypes) {
                pageTypes = ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: url + "page_types/_find",
                    data: JSON.stringify({
                        "selector": {},
                        "limit": 10000
                    })
                })
                .then(data => data.docs)
                .catch(error => pageType = null)
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