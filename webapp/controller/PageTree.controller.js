sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
    "../util/Database"
], function(BaseController, Fragment, JSONModel, MessageBox, Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.PageTree", {

		onInit: function () {
			var oModel = new JSONModel({
				busy: true,
				selectedId: null
			});
			this.getView().setModel(oModel,"view");
			this._loadTree();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("home").attachPatternMatched(this._onHomeMatched, this);
			oRouter.getRoute("page").attachPatternMatched(this._onPageMatched, this);
		},

		_loadTree: function(oEvent) {
			var oModel = this.getModel("view");
			oModel.setProperty("/busy", true);

			this.getModel("tree").read()
			.then(docs => {
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
							title: "getTree",
							actions: [MessageBox.Action.CLOSE]
					});
				}
			});
		},

		_onHomeMatched: function(oEvent) {
			this._loadTree();
		},

		_onPageMatched: function(oEvent) {
			this._loadTree();
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getModel("view");
			oModel.setProperty("/selectedId", _id);
		},


		_laodMenu() {
			if (!this._menuLoader) {
				var that = this;
				that._menuLoader = new Promise(resolve => {
					Fragment.load({
						name: "cmjs.view.MenuNewPage",
						controller: that
					}).then( oMenu => {
						that.getView().addDependent(oMenu);
						resolve(oMenu);
					});
				});
			}
			return this._menuLoader;
		},

		_insertPage(parentId, iSort) {
			var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("newpage", {parentId: parentId, sort: iSort});
		},

		onSelectionChange: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("tree");
			var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("page", {_id: oContext.getProperty("_id") });
		},

		onNewpagePressed: function(oEvent) {
			var oSelectedItem = this.getView().byId("PageTree").getSelectedItem();
			if (oSelectedItem) {
				this._laodMenu()
				.then(oMenu => {
					oMenu.open(false, null, sap.ui.core.Popup.Dock.EndCenter, sap.ui.core.Popup.Dock.EndCenter, oSelectedItem);
				});
			}
			else {
				_insertPage("0",1);
			}
		},

		onInsertBefore: function(oEvent) {
			var oContext = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree");
			this._insertPage(oContext.getProperty("parentId"), parseInt(oContext.getProperty("sort"))-1)
		},

		onInsertAfter: function(oEvent) {
			var oContext = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree");
			this._insertPage(oContext.getProperty("parentId"), parseInt(oContext.getProperty("sort"))+1)
		},

		onInsertUnder: function(oEvent) {
			var oContext = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree");
			this._insertPage(oContext.getProperty("_id"), 1)
		},

		onDrop: function(oEvent) {
			var draggedControl = oEvent.getParameter("draggedControl");
			var droppedControl = oEvent.getParameter("droppedControl");
			var oTreeModel = this.getModel("tree");
			var oSourceNode = draggedControl.getBindingContext("tree").getObject();
			var oTargetNode = droppedControl.getBindingContext("tree").getObject();

			oTreeModel.removeFromTree(draggedControl.getBindingContext("tree").getPath());
			var aModified = oTreeModel.insertIntoTree(
				oSourceNode, 
				oEvent.getParameter("dropPosition"), 
				oTargetNode
			);
			Database.savePages(aModified)
			.catch(error => {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
			});
		}

	});
});