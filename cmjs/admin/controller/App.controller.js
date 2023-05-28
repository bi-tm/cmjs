sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel",
	"cmjs/util/Database"
], function (BaseController,
	JSONModel,
	Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.App", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
			this.getView().setModel(new JSONModel({
				expanded: false,
				selectedKey: null
			}), "view");
			this.getRouter().getRoute("home").attachMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function (oEvent) {
			Database.getSites();
		},

		onExpandSelect: function (oEvent) {
			var oViewModel = this.getModel("view");
			var bExpanded = oViewModel.getProperty("/expanded");
			oViewModel.setProperty("/expanded", !bExpanded);
		},

		onPagesSelect: function (oEvent) {
			this.getRouter().navTo("pages");
		},

		onPageTypesSelect: function (oEvent) {
			this.getRouter().navTo("pagetypes");
		},

		onMediaSelect: function (oEvent) {
			this.getRouter().navTo("media");
		},

		onWebSitesSelect: function (oEvent) {
			this.getRouter().navTo("sites");
		},

		onUsersSelect: function (oEvent) {
			this.getRouter().navTo("users");
		}

	});
});