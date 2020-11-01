sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("cmjs.controller.App", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
			this.getView().setModel(new JSONModel({
				expanded:false,
				selectedKey: null
			}), "view");
		},

		onExpandSelect: function(oEvent) {
			var oViewModel = this.getModel("view");
			var bExpanded = oViewModel.getProperty("/expanded");
			oViewModel.setProperty("/expanded", ! bExpanded);
		},

		onPagesSelect: function(oEvent) {
			this.getRouter().navTo("pages");
		},

		onPageTypesSelect: function(oEvent) {
			//this.getRouter().navTo("pages");
		},

		onMediaSelect: function(oEvent) {
			//this.getRouter().navTo("pages");
		},

		onWebSitesSelect: function(oEvent) {
			//this.getRouter().navTo("pages");
		}

	});
});