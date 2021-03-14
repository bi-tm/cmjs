sap.ui.define([
    "cmjs/util/Logon",
    "sap/m/MessageBox"
], function(Logon, MessageBox) {
    'use strict';

    return function(params) {
        return new Promise((resolve,reject) => {
            params.success = function(data, textStatus, jqXHR) {
                resolve(data);
            };
            params.error =  function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401 || jqXHR.status === 403)  {
                    Logon().then(function(){
                        return jQuery.ajax(params);
                    });
                }
                else {
                    MessageBox.show(JSON.stringify(errorThrown), {
                        icon: MessageBox.Icon.ERROR,
                        title: "Ajax Error",
                        actions: [MessageBox.Action.CLOSE]
                    });
                    reject();
                }
            };
            params.contentType= "application/json";
            params.dataType = "json";
            params.data = params.data && JSON.stringify(params.data);
            jQuery.ajax(params);
        });
    }
});
