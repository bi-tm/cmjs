sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/TreeModel"
], function(UIComponent, TreeModel) {
	"use strict";

	return UIComponent.extend("cmjs.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(new TreeModel(), "tree");

			// create the views based on the url/hash
			this.getRouter().initialize();
		}
	});
});