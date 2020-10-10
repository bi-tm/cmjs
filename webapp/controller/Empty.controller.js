sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../util/formatter"
], function(Controller, formatter) {
	"use strict";

	return Controller.extend("cmjs.controller.Empty", {

		formatter: formatter,

		onInit: function () {

		}
	});
});