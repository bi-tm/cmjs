sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"../util/Database"
], function(
	BaseController,
	JSONModel,
	MessageBox,
	MessageToast,
	History,
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

		_onPageMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getModel("view");
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
			this._showPage(_id);
		},

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
				var oPage = {
					_id: Date.now().toString(),
					pageType: aPageTypes[0]._id,
					title: "neue Seite",
					legacyUrl: "neue-sSeite"
				};
				oTreeModel.insertIntoTree(oPage, args.relation, oRelationPage);
				this._showPage(oPage._id);
			})
			.catch(error => {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
				else {
					MessageBox.show(error.message, {
							icon: MessageBox.Icon.ERROR,
							title: "newPage",
							actions: [MessageBox.Action.CLOSE]
					});
				}
			});
		},

		_showPage: function(_id) {
			var oView = this.getView();
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			oModel.setProperty("/busy", true);
			Promise.all([Database.getPageTypes(), oTreeModel.read()])
			.then(result => {
				var aPageTypes = result[0];
				var sPath = oTreeModel.getPath(_id);
				var oPage = oTreeModel.getProperty(sPath);
				oView.bindObject({model:"tree", path: sPath});
				oModel.setProperty("/pageTypes", aPageTypes);
				oModel.setProperty("/breadcrumbs", oTreeModel.getPathNodes(oPage.parentId));
				oView.rerender();
				oModel.setProperty("/busy", false);
			})
			.catch(error => {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
				else {
					MessageBox.show(error.message, {
							icon: MessageBox.Icon.ERROR,
							title: "readPage",
							actions: [MessageBox.Action.CLOSE]
					});
				}
			});
			
		},

		onPageTypeChanged: function(oEvent) {
			this.getView().rerender();
		},

		onEditPress: function(oEvent) {
			var oModel = this.getModel("view");			
			var oContext = this.getView().getBindingContext("tree");
			this._showPage(oContext.getProperty("_id"));
			oModel.setProperty("/editable", true);
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
			}.bind(this))
			.catch(error => {
				MessageBox.show(JSON.stringify(error), {
						icon: MessageBox.Icon.ERROR,
						title: "savePage",
						actions: [MessageBox.Action.CLOSE]
				});
			});
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