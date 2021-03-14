sap.ui.define([
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
    "sap/m/Input",
    "sap/ui/layout/Grid"
], function(
	Dialog, Button, Label, Input, Grid
) {
    "use strict";

    var resolveFunc = null;

    function _submit() {
        jQuery.ajax({
            url:"/api/login",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({user: oUser.getValue(), password: oPassword.getValue()}),
            success: function() {
                oDialog.close();
                resolveFunc();
            }
        });
    }

    var oDialog = null;
    var oUser = new Input({submit:_submit});
    var oPassword = new Input({type:"Password", submit:_submit});

	return function() {
        resolveFunc = null;
        return new Promise(function(resolve, reject){
            resolveFunc = resolve;
            if (!oDialog) {
                oDialog = new Dialog({
                    title:"Logon",
                    closeOnNavigation: false,
                    content: [
                        new Grid({
                            defaultSpan:"L6 S12",
                            width:"70%",
                            content: [
                                new Label({text:"User"}), oUser,
                                new Label({text:"Password"}), oPassword                                
                            ]
                        })
                    ],
                    buttons: [
                        new Button({icon:"sap-icon://accept", text:"Logon", type:"Emphasized", press:_submit})
                    ]
                });
            }
            oDialog.open();
        });
    }
});