sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../util/formatter",
	"../util/Database"
], function(Controller, JSONModel, MessageBox, formatter, Database) {
	"use strict";

	return Controller.extend("cmjs.controller.PageTree", {

		formatter: formatter,

		onInit: function () {
			var oModel = new JSONModel({
				tree: [],
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
			var oModel = this.getView().getModel("view");
			oModel.setProperty("/busy", true);

			function _getChildren(docs,parentId) {
				var result = docs.filter(doc => doc.parentId == parentId);
				result.forEach(child => { child.nodes = _getChildren(docs, child._id); });
				return result;
			}
			Database.getTree()
			.then(docs => {
				oModel.setProperty("/tree", _getChildren(docs, "0"));
				oModel.setProperty("/busy", false);
			})
			.catch(error => {
				if(error.status == 401) {
					var oRouter = this.getOwnerComponent().getRouter();
					oRouter.navTo("logon");		
				}
				else {
					MessageBox.show(error, {
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
			var oModel = this.getView().getModel("view");
			oModel.setProperty("/selectedId", _id);
		},

		onSelectionChange: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("view");
			var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("page", {_id: oContext.getProperty("_id") });
		},

		onNewpagePressed: function(oEvent) {
			var oModel = this.getView().getModel("view");
			var selectedId = oModel.getProperty("/selectedId");
			var iSort = 1;
			if (!selectedId) {
				selectedId = "0"
			}
			var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("newpage", {parentId: selectedId, sort: iSort});
		}

	});
});