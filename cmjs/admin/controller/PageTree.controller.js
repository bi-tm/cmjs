sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"cmjs/util/Database"
], function (BaseController,
	Fragment,
	JSONModel,
	MessageBox,
	Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.PageTree", {

		onInit: async function () {
			BaseController.prototype.onInit.apply(this, arguments);
			var oModel = new JSONModel({
				busy: true,
				selectedId: null,
				selectedSide: null,
				sites: []
			});
			this.getView().setModel(oModel, "view");
			await this._loadSites();
			this._loadTree();
			var oRouter = this.getRouter();
			oRouter.getRoute("home").attachPatternMatched(this._onHomeMatched, this);
			oRouter.getRoute("page").attachPatternMatched(this._onPageMatched, this);
		},

		/**
		 * load all sites into view model
		 * returns Promise
		 */
		_loadSites: function () {
			return Database.getSites(true)
				.then((result) => {
					var oModel = this.getModel("view");
					oModel.setProperty("/sites", result);
					var selectedSide = oModel.getProperty("/selectedSide");
					if (!selectedSide && result.length > 0) {
						selectedSide = result[0]._id;
						oModel.setProperty("/selectedSide", selectedSide);
						this.getModel("tree").setSite(selectedSide);
					}
					return Promise.resolve(result);
				});
		},

		_loadTree: function () {
			var oModel = this.getModel("view");
			oModel.setProperty("/busy", true);
			return this.getModel("tree").read()
				.then(docs => {
					oModel.setProperty("/busy", false);
				});
		},

		_onHomeMatched: function (oEvent) {
			this._loadTree();
		},

		_onPageMatched: function (oEvent) {
			var _id = oEvent.getParameter("arguments")._id;
			var oModel = this.getModel("view");
			this._loadTree()
				.then(function () {
					oModel.setProperty("/selectedId", _id);
					this._expand(_id);
				}.bind(this));
		},


		_laodMenu() {
			if (!this._menuLoader) {
				var that = this;
				that._menuLoader = new Promise(resolve => {
					Fragment.load({
						name: "cmjs.view.MenuNewPage",
						controller: that
					}).then(oMenu => {
						that.getView().addDependent(oMenu);
						resolve(oMenu);
					});
				});
			}
			return this._menuLoader;
		},

		/**
		 * 
		 * @param {*} parentId 
		 * @param {*} iSort 
		 */
		_newPage(sRelation, oRelationPage) {
			var oRouter = this.getOwnerComponent().getRouter();
			if (oRelationPage) {
				oRouter.navTo("newpage", { relation: sRelation, relationId: oRelationPage._id });
			}
			else {
				oRouter.navTo("newroot");
			}
		},

		/**
		 * expand tree to show specified page
		 * @param {string} _id 
		 */
		_expand: function (_id) {
			var oTree = this.getView().byId("PageTree");
			var oTreeModel = this.getModel("tree");
			var aNodes = oTreeModel.getPathNodes(_id);
			for (var oNode of aNodes) {
				var aItems = oTree.getItems();
				var index = aItems.findIndex(item => item.getBindingContext("tree").getProperty("_id") === oNode._id);
				if (index >= 0) {
					oTree.expand(index);
				}
			}
		},

		/**
		 * 
		 * @param {Event} oEvent 
		 */
		onSiteChanged: function (oEvent) {
			var selectedItem = oEvent.getParameter("selectedItem");
			var siteId = selectedItem.getBindingContext("view").getProperty("_id");
			this.getModel("tree").setSite(siteId);
			this._loadTree();
		},

		/**
		 * event handler when user selects a node tree.
		 * navigates to detail view if the selectef page.
		 * @param {object} oEvent 
		 */
		onSelectionChange: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("tree");
			var bSelected = oEvent.getParameter("selected");
			if (bSelected) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("page", { _id: oContext.getProperty("_id") });
			}
		},

		/**
		 * event hanlder for creating new page.
		 * opens menu to select hiararchy level for new page.
		 * @param {object} oEvent 
		 */
		onNewpagePressed: function (oEvent) {
			var oSelectedItem = this.getView().byId("PageTree").getSelectedItem();
			if (oSelectedItem) {
				this._laodMenu()
					.then(oMenu => {
						oMenu.open(false, null, sap.ui.core.Popup.Dock.EndCenter, sap.ui.core.Popup.Dock.EndCenter, oSelectedItem);
					});
			}
			else {
				var oTreeModel = this.getModel("tree");
				oSelectedItem = oTreeModel.getProperty("/nodes/0");
				this._newPage("Before", oSelectedItem);
			}
		},

		/**
		 * event handler of popop menu.
		 * inserts new page before selected tree node.
		 * @param {object} oEvent 
		 */
		onInsertBefore: function (oEvent) {
			var oRelationPage = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree").getObject();
			this._newPage("Before", oRelationPage);
		},

		/**
		 * event handler of popop menu.
		 * inserts new page after selected tree node.
		 * @param {object} oEvent 
		 */
		onInsertAfter: function (oEvent) {
			var oRelationPage = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree").getObject();
			this._newPage("After", oRelationPage);
		},

		/**
		 * event handler of popop menu.
		 * inserts new page as first child of selected tree node.
		 * @param {object} oEvent 
		 */
		onInsertUnder: function (oEvent) {
			var oRelationPage = this.getView().byId("PageTree").getSelectedItem().getBindingContext("tree").getObject();
			this._newPage("On", oRelationPage);
		},

		/**
		 * event handler for drag and drop.
		 * moves page in the tree to another place.
		 * @param {object} oEvent 
		 */
		onDrop: function (oEvent) {
			var draggedControl = oEvent.getParameter("draggedControl");
			var droppedControl = oEvent.getParameter("droppedControl");
			var oTreeModel = this.getModel("tree");
			var oSourceNode = draggedControl.getBindingContext("tree").getObject();
			var oTargetNode = droppedControl.getBindingContext("tree").getObject();

			oTreeModel.removeFromTree(draggedControl.getBindingContext("tree").getPath());
			var aModified = oTreeModel.insertIntoTree(oSourceNode, oEvent.getParameter("dropPosition"), oTargetNode);
			oTreeModel.savePages(aModified);
		}

	});
});