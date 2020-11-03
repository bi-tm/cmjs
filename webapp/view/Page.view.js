sap.ui.define([
	"sap/ui/layout/form/SimpleForm", 
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/m/Select",
	"sap/ui/core/Item",
	"sap/m/Label", 
	"sap/m/Input",
	"sap/m/CheckBox",
	"sap/m/HBox"], 
function(SimpleForm, RichTextEditor, Select, Item, Label, Input, CheckBox, HBox) {
	"use strict";

    return sap.ui.jsview("cmjs.view.Page", {  
   
		asyncSupport: true,

		getControllerName: function() {
			return "cmjs.controller.Page";  
		},
	
		createContent: function(oController) {
			const controller = this.getController();
			this.form = new SimpleForm({
				editable: true,
				layout:"ResponsiveGridLayout",
				labelSpanXL:2,
				labelSpanL:2,
				labelSpanM:3,
				labelSpanS:12,
				adjustLabelSpan: false,
				emptySpanXL:4,
				emptySpanL:2,
				emptySpanM:0,
				emptySpanS:0,
				columnsXL:1,
				columnsL:1,
				columnsM:1,
				singleContainerFullSize: false			
			});
			this.page = new sap.m.VBox({
				visible: "{view>/visible}",
				items: [ 
					new sap.m.OverflowToolbar({
						content:  [
							new sap.m.HBox({
								items: [
									new sap.m.Breadcrumbs({ 
										links: { 
											model: "view",
											path: "/breadcrumbs",
											template: new sap.m.Link({
												text: "{view>title}", 
												href: "#/page/{view>_id}"
											}),
										},
										
									}),
									new sap.m.Label({text: "{tree>title}", design:"Bold"}),
								]
							}),
							new sap.m.ToolbarSpacer(),
							new sap.m.Button({icon:"sap-icon://edit", text:"Bearbeiten", type:"Emphasized", visible:"{= ! ${view>/editable} }", press:[controller.onEditPress, controller]}),
							new sap.m.Button({icon:"sap-icon://accept", text:"Sichern", type:"Accept", visible:"{view>/editable}", press:[controller.onSavePress, controller]}),
							new sap.m.Button({icon:"sap-icon://decline", text:"Abbrechen", type:"Reject", visible:"{view>/editable}", press:[controller.onCancelPress, controller]})
						]
					}),
					this.form
				]
			});
			return this.page;
		},
 
		rerender: function() {
			var sPageType = this.getBindingContext("tree").getProperty("pageType");
			var aPageTypes = this.getModel("view").getProperty("/pageTypes");
			var parent = this.form;
			var oController = this.getController();

			parent.destroyContent();

			parent.addContent( new Label({text: "{i18n>published}"}));
			parent.addContent( new CheckBox({selected: "{tree>published}", editable:"{view>/editable}"}));
			parent.addContent( new Label({text: "{i18n>legacyUrl}"}));
			parent.addContent( new Input({value: "{tree>legacyUrl}", editable:"{view>/editable}"}));
			parent.addContent( new Label({text: "{i18n>title}"}));
			parent.addContent( new Input({value: "{tree>title}", editable:"{view>/editable}"}));
			parent.addContent( new Label({text: "{i18n>showInMenu}"}));
			parent.addContent( new CheckBox({selected: "{tree>showInMenu}", editable:"{view>/editable}"}));
			parent.addContent( new Input({value: "{tree>menuTitle}", editable:"{= ${view>/editable} && ${tree>showInMenu} }"}));
			// parent.addContent( new HBox({
			// 	width: "100%",
			// 	items: [
			// 		new CheckBox({selected: "{tree>showInMenu}", editable:"{view>/editable}"}),
			// 		// new Label({text: "{i18n>menuTitle}"}),
			// 		new Input({value: "{tree>menuTitle}", editable:"{= ${view>/editable} && ${tree>showInMenu} }", width:"100%"})
			// 	]
			// }));

			parent.addContent( new Label({text: "{i18n>pageType}"}));
			parent.addContent( new Select({
				required: true, 
				editable:"{view>/editable}",
				selectedKey: "{tree>pageType}",
				change: [oController.onPageTypeChanged, oController],
				items: aPageTypes.map(item => new Item({text:item._id, key:item._id}))
			}));

			var oPageType = aPageTypes.find(t => t._id === sPageType);
			if (oPageType) {
				var bFirst = true;
				oPageType.fields.forEach(field => {
					parent.addContent( new Label({text: field.label}));
					switch(field.fieldType) {

						case 'Text':
							parent.addContent( new Input({
								value:"{tree>" + field.id + "}", 
								editable:"{view>/editable}",
								required: bFirst, 
								valueLiveUpdate:bFirst, 
								liveChange: [oController.onTitleChange, oController]
							}));	
							bFirst = false;
							break;

						case 'RichText':
							var oRichTextEditor = new RichTextEditor( {
								value: "{tree>text}",
								editable:"{view>/editable}",
								editorType: sap.ui.richtexteditor.EditorType.TinyMCE4,
								width: "100%",
								height: "600px",
								showGroupLink: true,
								showGroupFont: false,
								showGroupUndo: true,
								showGroupInsert: true
							});
							oRichTextEditor.attachBeforeEditorInit(function(oEvent) {
								var oConfig = oEvent.getParameter('configuration');
								oConfig.plugins = oConfig.plugins.replace(/,?powerpaste/, "");
							});
							parent.addContent( oRichTextEditor );
							break;

						default:
							parent.addContent( new Text({text:"unkown fieldType " + field.fieldType}));									
					}
				});	
			};
		}
	});
});