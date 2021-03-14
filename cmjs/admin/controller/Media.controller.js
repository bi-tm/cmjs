sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/LightBox",
	"sap/m/LightBoxItem",	
	"cmjs/util/Database",
	"cmjs/model/ImageModel"
], function(BaseController, JSONModel, FileUploaderParameter, MessageBox, MessageToast, LightBox, LightBoxItem, Database, ImageModel) {
	"use strict";

	return BaseController.extend("cmjs.controller.Media", {

		onInit() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.getView().setModel(new JSONModel(), "view");
			this.getView().setModel(ImageModel, "images");
			this.getRouter().getRoute("media").attachPatternMatched(this._onRouteMatched, this);		
		},

		_onRouteMatched(oEvent) {
			ImageModel.load();
		},

		onRemovePress(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("images");
			var oFile = oContext.getObject();
			MessageBox.show(`${oFile.name} löschen ?`, {
				title: "Datei löschen",
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				styleClass: "sapUiSizeCompact",
				onClose: function(sAction) {
					if (sAction === MessageBox.Action.OK) {
						ImageModel.remove(oFile);
					}
				}.bind(this)
			});	
		},


		onTilePress(oEvent) {
			// var oContext = oEvent.getSource().getBindingContext("view");
			// if (!this.lightbox) {
			// 	this.lightbox = new LightBox({
			// 		imageContent: [
			// 			new LightBoxItem({imageSrc: "/uploads/{view>name}", title:"{view>name}"})
			// 		]
			// 	});			
			// }
			// this.lightbox.bindObject({model:"view", path:oContext.getPath()});
			// this.lightbox.open();
		},

		onUploadComplete(oEvent) {
			var iStatus = oEvent.getParameter("status");
			if (iStatus == 200) {
				MessageToast.show("file uploaded");
				ImageModel.load(true);
			}
			else {				
				MessageToast.show(oEvent.getParameter("responseRaw"));
			}
		},

		onUploadPress() {
			var oFileUploader = this.byId("fileUploader");
			oFileUploader.destroyHeaderParameters();
			//oFileUploader.addHeaderParameter(new FileUploaderParameter({name:"Authorization", value:Database.getAuthorization()}));
			oFileUploader.checkFileReadable().then(function() {
				oFileUploader.upload();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oFileUploader.clear();
			});
		}

	});
});