sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../util/formatter",
	"../util/SiteTree"
], function(Controller, JSONModel, MessageBox, formatter, SiteTree) {
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

			SiteTree.read()
			.then(docs => {
				oModel.setProperty("/tree", docs);
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
		},

		onDrop: function(oEvent) {
			console.log("drop position       " + oEvent.getParameter("dropPosition"));
			var draggedControl = oEvent.getParameter("draggedControl");
			console.log("drop draggedControl " + draggedControl.getBindingContext("view").getProperty("_id") + " " + draggedControl.getBindingContext("view").getProperty("title"));
			var droppedControl = oEvent.getParameter("droppedControl");
			console.log("drop droppedControl " + droppedControl.getBindingContext("view").getProperty("_id") + " " + droppedControl.getBindingContext("view").getProperty("title"));
		}

	});
});