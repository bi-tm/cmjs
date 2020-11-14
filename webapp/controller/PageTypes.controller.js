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
				showPageType: false,
				editable: false,
                pageTypes: []
            }),"view");
			var oRouter = this.getRouter();
			oRouter.getRoute("pagetypes").attachPatternMatched(this._onPagetypesMatched, this);
			oRouter.getRoute("pagetype").attachPatternMatched(this._onPagetypeMatched, this);
        },
		
		/**
		 * route "pagetypes"
		 * show pagetypes list only
		 * @param {object} oEvent 
		 */
        _onPagetypesMatched: function(oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/showPageType", false);
			this._loadPageTypes();
        },

		/**
		 * route "pagetype"
		 * show pagetypes list only and one selected pagetype
		 * @param {object} oEvent 
		 */
        _onPagetypeMatched: function(oEvent) {
			var oViewModel = this.getModel("view");
			var selectedId = oEvent.getParameter("arguments")._id;
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/showPageType", false);
			this._loadPageTypes()
			.then(function() {
				var aPageTypes = oViewModel.getProperty("/pageTypes");
				var index = aPageTypes.findIndex(p => p._id === selectedId);
				var oContext = new sap.ui.model.Context(oViewModel, `/pageTypes/${index}`);
				this.getView().byId("page").setBindingContext(oContext, "view");
				oViewModel.setProperty("/showPageType", true);
			}.bind(this));
        },

		/**
		 * load all pagetypes into view model
		 * returns Promise
		 */
		_loadPageTypes: function(refresh) {
			return Database.getPageTypes(refresh)
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

		/**
		 * user selected to pagetype
		 * show it
		 * @param {object} oEvent 
		 */
        onListItemPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("view");
			this.getRouter().navTo("pagetype", {_id: oContext.getProperty("_id")});
		},
		
		onEditPress: function(oEvent) {
			var oModel = this.getModel("view");			
			oModel.setProperty("/editable", true);
		},

		onDeletePress: function(oEvent) {
			// ToDo
		},

		onSavePress: function(oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			var oContext = this.getView().byId("page").getBindingContext("view");
			var sPath = oContext.getPath();
			var oPageType = oContext.getObject();
			Database.savePageType(oPageType)
			.then(function(oResult){
				oViewModel.setProperty(sPath, oResult);
			}.bind(this));
		},

		onCancelPress: function(oEvent) {
			this.getModel("view").setProperty("/editable", false);
			this._loadPageTypes(true);
		}

	});
});