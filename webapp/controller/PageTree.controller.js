sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../util/formatter",
	"../util/Database"
], function(Controller, JSONModel, formatter, Database) {
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
			oRouter.getRoute("page").attachPatternMatched(this._onObjectMatched, this);
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
				oModel.setProperty("/tree", docs);
				oModel.setProperty("/busy", false);
			})
			.catch(error => {
				sap.m.MesssageBox.show(error, {
						icon: MessageBox.Icon.ERROR,
						title: "getTree",
						actions: [MessageBox.Action.CLOSE]
				});
			});
		},

		_onObjectMatched: function(oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var itemId = "item_" + _id;
			var oModel = this.getView().getModel("view");
			var oTree = oModel.setProperty("/selectedId", _id);
		},

		onSelectionChange: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("view");
			var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("page", {_id: oContext.getProperty("_id") });
		}

	});
});