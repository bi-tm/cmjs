sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../util/Database"
], function (BaseController, JSONModel, MessageBox, MessageToast, Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.Sites", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
			this.getView().setModel(new JSONModel({
				busy: false,
				showSite: false,
				new: false,
				editable: false,
				sites: [],
			}), "view");
			var oRouter = this.getRouter();
			oRouter.getRoute("sites").attachPatternMatched(this._onSitesMatched, this);
			oRouter.getRoute("site").attachPatternMatched(this._onSiteMatched, this);
		},

		/**
		 * route "sites"
		 * show sites list only
		 * @param {object} oEvent 
		 */
		_onSitesMatched: function (oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/new", false);
			oViewModel.setProperty("/showSite", false);
			this._loadSites(false);
		},

		/**
		 * route "site"
		 * show sites list only and one selected site
		 * @param {object} oEvent 
		 */
		_onSiteMatched: function (oEvent) {
			var oViewModel = this.getModel("view");
			var selectedId = oEvent.getParameter("arguments")._id;
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/new", false);
			oViewModel.setProperty("/showSite", false);
			this._loadSites(false)
				.then(function (aSites) {
					if (selectedId === "$new") {
						// add new page
						oViewModel.setProperty("/new", true);
						oViewModel.setProperty("/editable", true);
						aSites.push({ _id: "neu", domains: [] });
						var index = aSites.length - 1;
						// set focus
						setTimeout(() => { this.getView().byId("_id").focus(null); }, 400);
					}
					else {
						var index = aSites.findIndex(p => p._id === selectedId);
					}
					var oContext = new sap.ui.model.Context(oViewModel, `/sites/${index}`);
					this.getView().byId("page").setBindingContext(oContext, "view");
					oViewModel.setProperty("/showSite", true);
				}.bind(this));
		},

		/**
		 * load all sites into view model
		 * returns Promise
		 */
		_loadSites: function (refresh) {
			return Database.getSites(refresh)
				.then(function (result) {
					this.getModel("view").setProperty("/sites", result);
					return Promise.resolve(result);
				}.bind(this));
		},

		/**
		 * user selected to site
		 * show it
		 * @param {object} oEvent 
		 */
		onListItemPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("view");
			this.getRouter().navTo("site", { _id: oContext.getProperty("_id") });
		},

		/**
		 * user pressed button for new page type
		 * @param {object} oEvent 
		 */
		onNewpagePressed: function (oEvent) {
			this.getRouter().navTo("site", { _id: "$new" });
		},

		onEditPress: function (oEvent) {
			var oModel = this.getModel("view");
			oModel.setProperty("/editable", true);
		},

		/**
		 * handle delete button press
		 * show confirmation popup and delete page type
		 * @param {object} oEvent 
		 */
		onDeletePress: function (oEvent) {
			// ToDo: checks if page type is still used in any page
			MessageBox.show(
				"Möchten Sie den Seitentyp löschen?",
				{
					icon: MessageBox.Icon.QUESTION,
					title: "Web-Site löschen",
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.CANCEL,
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							var oViewModel = this.getModel("view");
							var aSites = oViewModel.getProperty("/sites");
							var oContext = this.getView().byId("page").getBindingContext("view");
							var oSite = oContext.getObject();
							Database.deleteSite(oSite);
							var index = aSites.findIndex(p => p._id === oSite._id);
							aSites.splice(index, 1);
							oViewModel.setProperty("/sites", aSites);
							this.getRouter().navTo("sites");
						}
					}.bind(this)
				}
			)
		},


		/**
		 * handle site delete button press
		 * @param {object} oEvenet 
		 */
		onDomainDelete: function (oEvent) {
			var oViewModel = this.getModel("view");
			var sPath = this.getView().byId("page").getBindingContext("view").getPath();
			var oSite = oViewModel.getProperty(sPath);
			var oDomain = oEvent.getSource().getBindingContext("view").getObject();
			var index = oSite.domains.findIndex(f => f === oDomain);
			oSite.domains.splice(index, 1);
			oViewModel.setProperty(sPath, oSite);
		},

		/**
		 * handle site add button
		 * @param {object} oEvent 
		 */
		onDomainAdd: function (oEvent) {
			var oViewModel = this.getModel("view");
			var sPath = this.getView().byId("page").getBindingContext("view").getPath();
			var oSite = oViewModel.getProperty(sPath);
			oSite.domains.push("domain");
			oViewModel.setProperty(sPath, oSite);
		},

		/**
		 * handle save button press
		 * @param {object} oEvent 
		 */
		onSavePress: function (oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			var oContext = this.getView().byId("page").getBindingContext("view");
			var sPath = oContext.getPath();
			var oSite = oContext.getObject();
			Database.saveSite(oSite)
				.then(function () {
					MessageToast.show("Domain gespeichert");
				}.bind(this));
		},

		/**
		 * handle cancel button press
		 * reload page types form database to undo changes
		 * @param {*} oEvent 
		 */
		onCancelPress: function (oEvent) {
			this.getModel("view").setProperty("/editable", false);
			this._loadSites(true);
		}

	});
});