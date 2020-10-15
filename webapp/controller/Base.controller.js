sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../util/formatter"
], function(Controller, formatter) {
	"use strict";

	return Controller.extend("cmjs.controller.Base", {

		formatter: formatter,

		getModel: function(name) {
			return this.getView().getModel(name) ||
			       this.getOwnerComponent().getModel(name);
		}

	});
});