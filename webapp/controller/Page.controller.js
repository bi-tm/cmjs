sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../util/formatter",
	"../util/Database"
], function(Controller,
	JSONModel,
	MessageBox,
	MessageToast,
	formatter,
	Database) {
	"use strict";

	return Controller.extend("cmjs.controller.Page", {

		formatter: formatter,

		onInit: function () {
			var oModel = new JSONModel({
				page: {},
				pageTypes: [],
				editable: false,
				busy: true
			});
			this.getView().setModel(oModel,"view");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("page").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			this._readPage(_id);
		},

		_readPage: function(_id) {
			var oView = this.getView();
			var oModel = oView.getModel("view");
			oModel.setProperty("/busy", true);
			Promise.all([Database.getPage(_id), Database.getPageTypes()])
			.then(result => {
				oModel.setProperty("/page", result[0]);
				oModel.setProperty("/pageTypes", result[1]);
				oModel.setProperty("/busy", false);
				oView.rerender();
			})
			.catch(error => {
				MessageBox.show(error, {
						icon: MessageBox.Icon.ERROR,
						title: "getPage",
						actions: [MessageBox.Action.CLOSE]
				});
			});
			
		},

		onPageTypeChanged: function(oEvent) {
			this.getView().rerender();
		},

		onEditPress: function(oEvent) {
			var oModel = this.getView().getModel("view");
			var _id = oModel.getProperty("/page/_id");
			this._readPage(_id);
			oModel.setProperty("/editable", true);
		},

		onSavePress: function(oEvent) {
			var oModel = this.getView().getModel("view");
			var oPage = oModel.getProperty("/page");
			oModel.setProperty("/busy", true);
			Database.savePage(oPage)
			.then( () => {
				oModel.setProperty("/busy", false);
				oModel.setProperty("/editable", false);
				MessageToast.show("Seite gespeichert", {closeOnBrowserNavigation:false})
			})
			.catch(error => {
				MessageBox.show(error, {
						icon: MessageBox.Icon.ERROR,
						title: "savePage",
						actions: [MessageBox.Action.CLOSE]
				});
			});
		},
		
		onCancelPress: function(oEvent) {
			var oModel = this.getView().getModel("view");
			var _id = oModel.getProperty("/page/_id");
			this._readPage(_id);
			oModel.setProperty("/editable", false);
		}
		
	});
});