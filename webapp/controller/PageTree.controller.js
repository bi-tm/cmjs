sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"
], function(Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("cmjs.controller.PageTree", {

		formatter: formatter,

		onInit: function () {
			let oModel = new JSONModel({
				tree: [
					{ text: "Home"} ,
					{ text: "Kinder, Kinder",
					  nodes: [
						{ text: "Mussen und Tierparks" },
						{ text: "Kinder-Theater" }
					  ]
					},
					{ text: "Impressum" },
					{ text: "Datenschutz" }
				]
			});
			this.getView().setModel(oModel);
		},

		onSelectionChange: function(oEvent) {
			console.log("item selected")
		}

	});
});