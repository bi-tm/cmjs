sap.ui.define([
	"./Base.controller"
], function(BaseController) {
	"use strict";

	return BaseController.extend("cmjs.controller.Empty", {

		onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);
		}
	});
});