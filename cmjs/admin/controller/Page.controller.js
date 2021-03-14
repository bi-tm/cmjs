sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"cmjs/model/ImageModel",
	"cmjs/util/Database"
], function(
	BaseController,
	JSONModel,
	MessageBox,
	MessageToast,
	History,
	ImageModel,
	Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.Page", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
			var oModel = new JSONModel({
				pageTypes: [],
				breadcrumbs: [],
				newPage: false,
				editable: false,
				busy: true,
				visible:false
			});
			this.getView().setModel(oModel,"view");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);
		},

		/**
		 * dom was rendered
		 * init tinymce richtext editor
		 */
		afterRendering: function(oEvent) {
			
		},

		/**
		 * route matched
		 * @param {*} oEvent 
		 */
		_onRouteMatched: function(oEvent) {
			switch(oEvent.getParameter("name")) {
				case "page":
					this.getModel("view").setProperty("/visible", true);
					this._onPageMatched(oEvent);
					break;
				case "newpage":
					this.getModel("view").setProperty("/visible", true);
					this._onNewPageMatched(oEvent);
					break;
				default:
					this.getModel("view").setProperty("/visible", false);
			}
		},

		/**
		 * route "page" matched
		 * @param {*} oEvent 
		 */
		_onPageMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getModel("view");
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
			this._showPage(_id);
		},

		/**
		 * route "newpage" matched
		 * @param {*} oEvent 
		 */
		_onNewPageMatched: function(oEvent) {
			var args = oEvent.getParameter("arguments");
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			oModel.setProperty("/editable", true);
			oModel.setProperty("/newPage", true);
			Promise.all([Database.getPageTypes(), oTreeModel.read()])
			.then(result => {
				var aPageTypes = result[0];
				var oRelationPage = oTreeModel.getNode(args.relationId);
				var oPage = oTreeModel.newPage(aPageTypes[0]._id);
				oTreeModel.insertIntoTree(oPage, args.relation, oRelationPage);
				this._showPage(oPage._id);
			});
		},

		_showPage: function(_id) {
			var oView = this.getView();
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			oModel.setProperty("/busy", true);
			Promise.all([Database.getPageTypes(), oTreeModel.read(), ImageModel.load()])
			.then(result => {
				var aPageTypes = result[0];
				var sPath = oTreeModel.getPath(_id);
				var oPage = oTreeModel.getProperty(sPath);
				oView.bindObject({model:"tree", path: sPath});
				oModel.setProperty("/pageTypes", aPageTypes);
				oModel.setProperty("/breadcrumbs", oTreeModel.getPathNodes(oPage.parentId));
				oView.rerender();
				oModel.setProperty("/busy", false);
			});
			
		},

		onPageTypeChanged: function(oEvent) {
			this.getView().rerender();
		},

		/**
		 * user switched state "publish"
		 * if the page is unpublished, hide page in tree either
		 * @param {*} oEvent 
		 */
		onPublishChange: function(oEvent) {
			var oTreeModel = this.getModel("tree");
			var sPath = this.getView().getBindingContext("tree").getPath();
			var oPage = oTreeModel.getProperty(sPath);
			if (!oPage.published) {
				oPage.showInMenu = false;
				oTreeModel.setProperty(sPath, oPage);
			}
		},

		/**
		 * user press edit button
		 * change into edit mode and enable input fields
		 * @param {*} oEvent 
		 */
		onEditPress: function(oEvent) {
			var oModel = this.getModel("view");			
			var oContext = this.getView().getBindingContext("tree");
			this._showPage(oContext.getProperty("_id"));
			oModel.setProperty("/editable", true);
		},

		/**
		 * event handler for deleting page.
		 * @param {object} oEvent 
		 */
		onDeletePress: function(oEvent) {
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			var oContext = this.getView().getBindingContext("tree");
			var oPage = oContext.getObject();
			var sPath = oContext.getPath();
			var oTreeModel = this.getModel("tree");
			var oArchiv = oTreeModel.getNode("archiv");
			oTreeModel.removeFromTree(sPath);			
			var aModified = oTreeModel.insertIntoTree(oPage, "On", oArchiv);
			oTreeModel.savePages(aModified)
			.then(function() {
				this.getRouter().navTo("pages");
			}.bind(this));
		},

		onSavePress: function(oEvent) {
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			var oPage = this.getView().getBindingContext("tree").getObject();
			oTreeModel.savePage(oPage)
			.then( function() {
				oModel.setProperty("/busy", false);
				oModel.setProperty("/newPage", false);
				oModel.setProperty("/editable", false);
				MessageToast.show("Seite gespeichert", {closeOnBrowserNavigation:false})
				this.navTo("page", {_id: oPage._id});
			}.bind(this));
		},
		
		onCancelPress: function(oEvent) {
			var oModel = this.getModel("view");
			var bNewPage = oModel.getProperty("/newPage");
			var oContext = this.getView().getBindingContext("tree");
			var _id = oContext.getProperty("_id");
			this.getModel("tree").read(true);
			if (bNewPage) {
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();	
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					this.navTo("home");
				}
			}
			else {	
				this.getModel("tree").readPage(_id)
				.then( function() { this._showPage(_id) }.bind(this));
			}
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
		},

		onTitleChange: function(oEvent) {
			var sPath = this.getView().getBindingContext("tree").getPath();
			var legacyUrl = oEvent.getSource().getValue()
						.toLowerCase()
						.replaceAll(/ä/g, "ae")
						.replaceAll(/ö/g, "oe")
						.replaceAll(/ü/g, "ue")
						.replaceAll(/ß/g, "ss")
						.replaceAll(/[^a-z0-9]/g, "-");
			this.getModel("tree").setProperty(sPath+"/legacyUrl", legacyUrl);
		}
		
	});
});