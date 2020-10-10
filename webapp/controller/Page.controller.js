sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../util/formatter",
	"../util/Database"
], function(Controller,
	JSONModel,
	formatter,
	Database) {
	"use strict";

	return Controller.extend("cmjs.controller.Page", {

		formatter: formatter,

		onInit: function () {
			var oModel = new JSONModel({
				page: {},
				busy: true
			});
			this.getView().setModel(oModel,"view");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("page").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getView().getModel("view");
			oModel.setProperty("/busy", true);
			Database.getPage(_id)
			.then((data) => {
				oModel.setProperty("/page", data);
				oModel.setProperty("/busy", false);
			})
			.catch(error => {
				sap.m.MesssageBox.show(error, {
						icon: MessageBox.Icon.ERROR,
						title: "getPage",
						actions: [MessageBox.Action.CLOSE]
				});
			});
		}

	});
});