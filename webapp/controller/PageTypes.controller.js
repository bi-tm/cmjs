sap.ui.define([
    "./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
    "../util/Database"
], function(BaseController, JSONModel, MessageBox, Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.PageTypes", {

		onInit: function () {
            BaseController.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel({
                busy: false,
                pageTypes: []
            }),"view");
			var oRouter = this.getRouter();
			oRouter.getRoute("pagetypes").attachPatternMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function(oEvent) {
            Database.getPageTypes()
            .then(function(result){
                this.getModel("view").setProperty("/pageTypes", result);
            }.bind(this))
			.catch(function(error) {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
				else {
					MessageBox.show(JSON.stringify(error), {
							icon: MessageBox.Icon.ERROR,
							title: "get page types",
							actions: [MessageBox.Action.CLOSE]
					});
				}
			}.bind(this));
        },

        onListItemPress: function(oEvent) {

        }

	});
});