sap.ui.define([
], function() {
    'use strict';

    function _getChildren(docs,parentId) {
        var result = docs.filter(doc => doc.parentId == parentId);
        result.forEach(child => { child.nodes = _getChildren(docs, child._id); });
        return result;
    }

    const url = "https://couchdb.feste-feiern-in-bielefeld.de/";
    const authorization = { "Authorization": "Basic YWRtaW46UnY4ZVJEQnAjSnAy" };

    return {

        getTree: function() {
            return new Promise((resolve,reject) => {
                jQuery.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: url + "pages/_find",
                    async: true,
                    headers: authorization,
                    data: JSON.stringify({
                        "selector": {},
                        "fields": ["_id", "title", "parentId"],
                        "sort": ["parentId", "sort"],
                        "limit": 10000
                    }),
                    success: function(data, textStatus, jqXHR) {
                        resolve(_getChildren(data.docs, "0"));
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error("error getTree: " + textStatus);
                        reject(textStatus);
                    }
                });
            });
        },


        getPage: function(_id) {
            return new Promise((resolve,reject) => {
                jQuery.ajax({
                    type: "GET",
                    url: url + "pages/" + _id,
                    async: true,
                    headers: authorization,                    
                    success: function(data, textStatus, jqXHR) {
                        resolve(data);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error("error getPage: " + textStatus);
                        reject(textStatus);
                    }
                });
            });
        }
    }
});