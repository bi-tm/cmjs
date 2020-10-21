sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../util/Database"
], function(
	BaseController,
	JSONModel,
	MessageBox,
	MessageToast,
	Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.Page", {

		onInit: function () {
			var oModel = new JSONModel({
				pageTypes: [],
				breadcrumbs: [],
				newPage: false,
				editable: false,
				busy: true
			});
			this.getView().setModel(oModel,"view");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("page").attachPatternMatched(this._onPageMatched, this);
			oRouter.getRoute("newpage").attachPatternMatched(this._onNewPageMatched, this);
		},

		_onPageMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getModel("view");
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
			this._showPage(_id);
		},

		_onNewPageMatched: function(oEvent) {
			var oArguments = oEvent.getParameter("arguments");
			var oView = this.getView();
			var oModel = this.getModel("view");
			var oTreeMode = this.getModel("tree");
			oModel.setProperty("/busy", true);
			oModel.setProperty("/editable", true);
			oModel.setProperty("/newPage", true);
			Database.getPageTypes()
			.then(pageTypes => {
				oModel.setProperty("/pageTypes", pageTypes);
				oModel.setProperty("/busy", false);
				oModel.setProperty("/page", {
					_id: 'neue-seite',
					parentId: oArguments.parentId,
					pageType: pageTypes[0]._id,
					title: "neue Seite",
					sort: oArguments.sort				
				});
				oView.rerender();
			});
		},

		_showPage: function(_id) {
			var oView = this.getView();
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			oModel.setProperty("/busy", true);
			Promise.all([Database.getPageTypes(), oTreeModel.readPage(_id)])
			.then(result => {
				var pageTypes = result[0];
				var oPage = result[1];
				oModel.setProperty("/pageTypes", pageTypes);
				oModel.setProperty("/breadcrumbs", oTreeModel.getPathNodes(oPage.parentId));
				oView.bindObject({model:"tree", path: oTreeModel.getPath(_id)});
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
			var sPath = this.getView().getBindingContext("tree").getPath();
			oTreeModel.savePage(sPath)
			.then( () => {
				oModel.setProperty("/busy", false);
				oModel.setProperty("/newPage", false);
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
			var oModel = this.getModel("view");
			var bNewPage = oModel.getProperty("/newPage");
			var oContext = this.getView().getBindingContext("tree");
			var _id = oContext.getProperty("_id");
			if (bNewPage) {
				var parentId = this.getModel("tree").getProperty("/page/parentId");
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("page", {_id: parentId});
			}
			else {	
				this._showPage(_id);
			}
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
		},

		onTitleChange: function(oEvent) {
			var oModel = this.getModel("view");
			var bNewPage = oModel.getProperty("/newPage");
			if (bNewPage) {
				var id = oEvent.getSource().getValue()
				            .toLowerCase()
							.replaceAll(/ä/g, "ae")
							.replaceAll(/ö/g, "oe")
							.replaceAll(/ü/g, "ue")
							.replaceAll(/ß/g, "ss")
							.replaceAll(/[^a-z0-9]/g, "-");
				oModel.setProperty("/page/_id", id);
			}
		}
		
	});
});