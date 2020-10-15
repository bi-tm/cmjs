sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../util/formatter",
	"../util/Database"
], function(
	BaseController,
	JSONModel,
	MessageBox,
	MessageToast,
	formatter,
	Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.Page", {

		formatter: formatter,

		onInit: function () {
			var oModel = new JSONModel({
				page: {},
				pageTypes: [],
				path: [],
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
			this._readPage(_id);
		},

		_onNewPageMatched: function(oEvent) {
			var oArguments = oEvent.getParameter("arguments");
			var oView = this.getView();
			var oModel = this.getModel("view");
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

		_readPage: function(_id) {
			var oView = this.getView();
			var oModel = this.getModel("view");
			var oTreeModel = this.getModel("tree");
			oModel.setProperty("/editable", false);
			oModel.setProperty("/newPage", false);
			oModel.setProperty("/busy", true);
			Promise.all([Database.getPage(_id), Database.getPageTypes()])
			.then(result => {
				oModel.setProperty("/page", result[0]);
				oModel.setProperty("/pageTypes", result[1]);
				oModel.setProperty("/path", oTreeModel.getParentNodes(result[0].parentId));
				oView.rerender();
				oModel.setProperty("/busy", false);
			})
			.catch(error => {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
				else {
					MessageBox.show(JSON.stringify(error), {
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
			var _id = oModel.getProperty("/page/_id");
			this._readPage(_id);
			oModel.setProperty("/editable", true);
		},

		onSavePress: function(oEvent) {
			var oModel = this.getModel("view");
			var oPage = oModel.getProperty("/page");
			oModel.setProperty("/busy", true);
			Database.savePage(oPage)
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
			var _id = oModel.getProperty("/page/_id");
			var bNewPage = oModel.getProperty("/newPage");
			if (bNewPage) {
				_id = oModel.getProperty("/page/parentId");
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("page", {_id: _id});
			}
			else {
				this._readPage(_id);
			}
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