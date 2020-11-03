sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"../util/Uploader"
], function(BaseController, JSONModel, MessageBox, Uploader) {
	"use strict";

	const mimeTypes = {
		"jpg":  "image/jpeg",
		"jpeg": "image/jpeg",
		"gif":  "image/gif",
		"png":  "image/png",
		"pdf":  "application/pdf",
		"svg":  "image/svg+xml",
		"ico":  "image/vnd.microsoft.icon",
		"doc":  "application/msword",
		"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"ppt":  "application/vnd.ms-powerpoint",
		"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	}

	return BaseController.extend("cmjs.controller.Media", {

		onInit() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.getView().setModel(new JSONModel(), "view");
			this.getRouter().getRoute("media").attachPatternMatched(this._onRouteMatched, this);		
		},

		onAfterRendering(oEvent) {
			var oUploader = new Uploader(),
			    oUploadSet = this.getView().byId("uploadSet");
			oUploader.setUploadUrl(oUploadSet.getUploadUrl())
			oUploadSet.setUploader(oUploader);
			oUploadSet.registerUploaderEvents(oUploader);
		},

		onRemovePressed(oEvent) {
			var oUploadSet = this.getView().byId("uploadSet"),
				oItem = oEvent.getSource(),
				sUrl = oUploadSet.getUploadUrl() + "/" + oItem.getFileName();
			MessageBox.show(`${oItem.getFileName()} löschen ?`, {
				title: "Datei löschen",
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				styleClass: "sapUiSizeCompact",
				onClose: function(sAction) {
					if (sAction === MessageBox.Action.OK) {
						jQuery.ajax({
							type: "DELETE",
							url: sUrl
						});
						oUploadSet.removeItem(oItem);
					}
				}.bind(this),
			});
			oEvent.bPreventDefault = true;					
		},

		onUploadCompleted(oEvent) {
			oEvent.getParameter("item").attachRemovePressed(this.onRemovePressed, this);
		},

		_onRouteMatched(oEvent) {
			var oModel = this.getView().getModel("view");
			oModel.loadData("/uploads")
			.then(function() {
				oModel.setData(oModel.getData().map(oFile => {
					oFile.mimeType = mimeTypes[oFile.ext]; 
					return oFile;
				}));
			}.bind(this));
		}

	});
});