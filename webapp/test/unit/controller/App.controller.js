/*global QUnit*/

sap.ui.define([
	"cmjs/controller/App.controller"
], function(Controller) {
	"use strict";

	QUnit.module("App Controller");

	QUnit.test("I should test the app controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
