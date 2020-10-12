sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../util/Database"
], function(
	Controller,
	JSONModel,
	MessageBox,
	Database
) {
	"use strict";

	return Controller.extend("cmjs.controller.Logon", {

		onInit: function() {
			this.getView().setModel(new JSONModel({
				user:"",
				password:""
			}), "view");
		},

		onLogin: function(oEvent) {
			var oModel = this.getView().getModel("view");
			var user = oModel.getProperty("/user");
			var password = oModel.getProperty("/password");
			Database.logon(user,password)
			.then(()=>{
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("home");
			})
			.catch((error)=>{
				MessageBox.show(error.text, {
					icon: MessageBox.Icon.ERROR,
					title: "{i18n>logonTitle}",
					actions: [MessageBox.Action.CLOSE]
				});
			});
		},
		
	});
});