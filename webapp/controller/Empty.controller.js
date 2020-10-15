sap.ui.define([
	"cmjs/controller/Base.controller",
	"../util/formatter"
], function(BaseController, formatter) {
	"use strict";

	return BaseController.extend("cmjs.controller.Empty", {

		formatter: formatter,

		onInit: function () {

		}
	});
});