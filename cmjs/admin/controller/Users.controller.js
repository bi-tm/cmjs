sap.ui.define([
    "./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
    "../util/Database"
], function(BaseController, JSONModel, MessageBox, MessageToast, Database) {
	"use strict";

	return BaseController.extend("cmjs.controller.Users", {

		onInit: function () {
            BaseController.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel({
				busy: false,
				showUser: false,
				new: false,
				editable: false,
				users: [],
            }),"view");
			var oRouter = this.getRouter();
			oRouter.getRoute("users").attachPatternMatched(this._onUsersMatched, this);
			oRouter.getRoute("user").attachPatternMatched(this._onUserMatched, this);
        },
		
		/**
		 * route "users"
		 * show users list only
		 * @param {object} oEvent 
		 */
        _onUsersMatched: function(oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/new", false);
			oViewModel.setProperty("/showUser", false);
			this._loadUsers();
        },

		/**
		 * route "user"
		 * show users list only and one selected user
		 * @param {object} oEvent 
		 */
        _onUserMatched: function(oEvent) {
			var oViewModel = this.getModel("view");
			var selectedId = oEvent.getParameter("arguments")._id;
			oViewModel.setProperty("/editable", false);
			oViewModel.setProperty("/new", false);
			oViewModel.setProperty("/showUser", false);
			this._loadUsers()
			.then(function(aUsers) {
				if (selectedId === "$new") {
					// add new user
					oViewModel.setProperty("/new", true);
					oViewModel.setProperty("/editable", true);
					aUsers.push({_id:"neu"});
					var index = aUsers.length - 1;
					// set focus
					setTimeout(function(){ this.getView().byId("_id").focus(); }.bind(this), 400);					
				}
				else {
					var index = aUsers.findIndex(p => p._id === selectedId);
				}
				var oContext = new sap.ui.model.Context(oViewModel, `/users/${index}`);
				this.getView().byId("user").setBindingContext(oContext, "view");
				oViewModel.setProperty("/showUser", true);
			}.bind(this));
        },

		/**
		 * load all users into view model
		 * returns Promise
		 */
		_loadUsers: function(refresh) {
			return Database.getUsers(refresh)
					.then(function(result){
						this.getModel("view").setProperty("/users", result);
						return Promise.resolve(result);
					}.bind(this));
		},

		/**
		 * user selected to user
		 * show it
		 * @param {object} oEvent 
		 */
        onListItemPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("view");
			this.getRouter().navTo("user", {_id: oContext.getProperty("_id")});
		},
		
		/**
		 * user pressed button for new user type
		 * @param {object} oEvent 
		 */
		onNewUserPressed: function(oEvent) {
			this.getRouter().navTo("user", {_id: "$new"});
		},

		onEditPress: function(oEvent) {
			var oModel = this.getModel("view");			
			oModel.setProperty("/editable", true);
		},

		/**
		 * handle delete button press
		 * show confirmation popup and delete user type
		 * @param {object} oEvent 
		 */
		onDeletePress: function(oEvent) {
			// ToDo: checks if user type is still used in any user
			MessageBox.show(
				"Möchten Sie den Benutzer löschen?", 
				{
					icon: MessageBox.Icon.QUESTION,
					title: "Benutzer löschen",
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.CANCEL,
					onClose: function (oAction) { 
						if (oAction === MessageBox.Action.OK) {
							var oViewModel = this.getModel("view");
							var aUsers = oViewModel.getProperty("/users");
							var oContext = this.getView().byId("user").getBindingContext("view");
							var oUser = oContext.getObject();
							Database.deleteUser(oUser);
							var index = aUsers.findIndex(p => p._id === oUser._id);
							aUsers.splice(index,1);
							oViewModel.setProperty("/users", aUsers);
							this.getRouter().navTo("users");
						}
					}.bind(this)
				}
			)
		},

		/**
		 * handle save button press
		 * @param {object} oEvent 
		 */
		onSavePress: function(oEvent) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/editable", false);
			var oContext = this.getView().byId("user").getBindingContext("view");
			var sPath = oContext.getPath();
			var oUser = oContext.getObject();
			Database.saveUser(oUser)
			.then(function(){
				MessageToast.show("User gespeichert");
			}.bind(this));
		},

		/**
		 * handle cancel button press
		 * reload user types form database to undo changes
		 * @param {*} oEvent 
		 */
		onCancelPress: function(oEvent) {
			this.getModel("view").setProperty("/editable", false);
			this._loadUsers(true);
		}

	});
});