sap.ui.define([
    "./Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../util/Database"
], function(BaseController, JSONModel, MessageBox, MessageToast, Database) {
    "use strict";

    return BaseController.extend("cmjs.controller.PageTypes", {

        onInit: function() {
            BaseController.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel({
                busy: false,
                showPageType: false,
                new: false,
                editable: false,
                pageTypes: [],
                fieldTypes: [
                    { key: "Text", name: "Text" },
                    { key: "Media", name: "Media File" },
                    { key: "Email", name: "Email" },
                    { key: "URL", name: "URL" },
                    { key: "RichText", name: "RichText" },
                    { key: "Number", name: "Number" },
                    { key: "Date", name: "Date" },
                    { key: "Time", name: "Time" },
                    { key: "DateTime", name: "DateTime" },
                    { key: "Boolean", name: "Boolean" }
                ]
            }), "view");
            var oRouter = this.getRouter();
            oRouter.getRoute("pagetypes").attachPatternMatched(this._onPagetypesMatched, this);
            oRouter.getRoute("pagetype").attachPatternMatched(this._onPagetypeMatched, this);
        },

        /**
         * route "pagetypes"
         * show pagetypes list only
         * @param {object} oEvent 
         */
        _onPagetypesMatched: function(oEvent) {
            var oViewModel = this.getModel("view");
            oViewModel.setProperty("/editable", false);
            oViewModel.setProperty("/new", false);
            oViewModel.setProperty("/showPageType", false);
            this._loadPageTypes();
        },

        /**
         * route "pagetype"
         * show pagetypes list only and one selected pagetype
         * @param {object} oEvent 
         */
        _onPagetypeMatched: function(oEvent) {
            var oViewModel = this.getModel("view");
            var selectedId = oEvent.getParameter("arguments")._id;
            oViewModel.setProperty("/editable", false);
            oViewModel.setProperty("/new", false);
            oViewModel.setProperty("/showPageType", false);
            this._loadPageTypes()
                .then(function(aPageTypes) {
                    if (selectedId === "$new") {
                        // add new page
                        oViewModel.setProperty("/new", true);
                        oViewModel.setProperty("/editable", true);
                        aPageTypes.push({ _id: "neu", fields: [] });
                        var index = aPageTypes.length - 1;
                        // set focus
                        setTimeout(function() { this.getView().byId("_id").focus(); }.bind(this), 400);
                    } else {
                        var index = aPageTypes.findIndex(p => p._id === selectedId);
                    }
                    var oContext = new sap.ui.model.Context(oViewModel, `/pageTypes/${index}`);
                    this.getView().byId("page").setBindingContext(oContext, "view");
                    oViewModel.setProperty("/showPageType", true);
                }.bind(this));
        },

        /**
         * load all pagetypes into view model
         * returns Promise
         */
        _loadPageTypes: function(refresh) {
            return Database.getPageTypes(refresh)
                .then(function(result) {
                    this.getModel("view").setProperty("/pageTypes", result);
                    return Promise.resolve(result);
                }.bind(this));
        },

        /**
         * user selected to pagetype
         * show it
         * @param {object} oEvent 
         */
        onListItemPress: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("view");
            this.getRouter().navTo("pagetype", { _id: oContext.getProperty("_id") });
        },

        /**
         * user pressed button for new page type
         * @param {object} oEvent 
         */
        onNewpagePressed: function(oEvent) {
            this.getRouter().navTo("pagetype", { _id: "$new" });
        },

        onEditPress: function(oEvent) {
            var oModel = this.getModel("view");
            oModel.setProperty("/editable", true);
        },

        /**
         * handle delete button press
         * show confirmation popup and delete page type
         * @param {object} oEvent 
         */
        onDeletePress: function(oEvent) {
            // ToDo: checks if page type is still used in any page
            MessageBox.show(
                "Möchten Sie den Seitentyp löschen?", {
                    icon: MessageBox.Icon.QUESTION,
                    title: "Seitentyp löschen",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function(oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            var oViewModel = this.getModel("view");
                            var aPageTypes = oViewModel.getProperty("/pageTypes");
                            var oContext = this.getView().byId("page").getBindingContext("view");
                            var oPageType = oContext.getObject();
                            Database.deletePageType(oPageType);
                            var index = aPageTypes.findIndex(p => p._id === oPageType._id);
                            aPageTypes.splice(index, 1);
                            oViewModel.setProperty("/pageTypes", aPageTypes);
                            this.getRouter().navTo("pagetypes");
                        }
                    }.bind(this)
                }
            )
        },


        /**
         * handle field delete button press
         * @param {object} oEvenet 
         */
        onFieldDelete: function(oEvent) {
            var oViewModel = this.getModel("view");
            var sPath = this.getView().byId("page").getBindingContext("view").getPath();
            var oPageType = oViewModel.getProperty(sPath);
            var oField = oEvent.getSource().getBindingContext("view").getObject();
            var index = oPageType.fields.findIndex(f => f.id === oField.id);
            oPageType.fields.splice(index, 1);
            oViewModel.setProperty(sPath, oPageType);
        },

        /**
         * handle field add button
         * @param {object} oEvent 
         */
        onFieldAdd: function(oEvent) {
            var oViewModel = this.getModel("view");
            var sPath = this.getView().byId("page").getBindingContext("view").getPath();
            var oPageType = oViewModel.getProperty(sPath);
            oPageType.fields.push({
                "id": "field_" + oPageType.fields.length,
                "label": "Neues Feld",
                "fieldType": "Text"
            });
            oViewModel.setProperty(sPath, oPageType);
        },

        /**
         * handle save button press
         * @param {object} oEvent 
         */
        onSavePress: function(oEvent) {
            var oViewModel = this.getModel("view");
            oViewModel.setProperty("/editable", false);
            var oContext = this.getView().byId("page").getBindingContext("view");
            var sPath = oContext.getPath();
            var oPageType = oContext.getObject();
            Database.savePageType(oPageType)
                .then(function() {
                    MessageToast.show("Seitentyp gespeichert");
                }.bind(this));
        },

        /**
         * handle cancel button press
         * reload page types form database to undo changes
         * @param {*} oEvent 
         */
        onCancelPress: function(oEvent) {
            this.getModel("view").setProperty("/editable", false);
            this._loadPageTypes(true);
        }

    });
});