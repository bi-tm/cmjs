sap.ui.define([
	"cmjs/controller/Base.controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function(BaseController, Fragment, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("cmjs.controller.Pages", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
		}

    });
});