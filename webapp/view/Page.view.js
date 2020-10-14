sap.ui.define([
	"sap/ui/layout/form/SimpleForm", 
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/m/Select",
	"sap/ui/core/Item",
	"sap/m/Label", 
	"sap/m/Input"], 
function(SimpleForm, RichTextEditor, Select, Item, Label, Input) {
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
				labelSpanXL:1,
				labelSpanL:1,
				labelSpanM:2,
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
			this.page = new sap.m.Page({
				title: "Seite",
				subHeader: new sap.m.OverflowToolbar({
					content:  [
						new sap.m.HBox({
							items: [
								new sap.m.Breadcrumbs({ 
									links: { 
										model: "view",
										path: "/path",
										template: new sap.m.Link({
											text: "{view>title}", 
											href: "#/page/{view>_id}"
										}),
									},
									
								}),
								new sap.m.Label({text: "{view>/page/title}", design:"Bold"}),
							]
						}),
						new sap.m.ToolbarSpacer(),
						new sap.m.Button({icon:"sap-icon://edit", text:"Bearbeiten", type:"Emphasized", visible:"{= ! ${view>/editable} }", press:[controller.onEditPress, controller]}),
						new sap.m.Button({icon:"sap-icon://accept", text:"Sichern", type:"Accept", visible:"{view>/editable}", press:[controller.onSavePress, controller]}),
						new sap.m.Button({icon:"sap-icon://decline", text:"Abbrechen", type:"Reject", visible:"{view>/editable}", press:[controller.onCancelPress, controller]})
					]
				}),
				content: [
					this.form
				]
			});
			return this.page;
		},
 
		rerender: function() {
			var oPage = this.getModel("view").getProperty("/page");
			var aPageTypes = this.getModel("view").getProperty("/pageTypes");
			var parent = this.form;
			var oController = this.getController();

			parent.destroyContent();

			parent.addContent( new Label({text: "{i18n>pageId}"}));
			parent.addContent( new Input({value: "{view>/page/_id}", required: true, editable:"{view>/newPage}"}));
			parent.addContent( new Label({text: "{i18n>pageType}"}));
			parent.addContent( new Select({
				required: true, 
				editable:"{view>/editable}",
				selectedKey: "{view>/page/pageType}",
				change: [oController.onPageTypeChanged, oController],
				items: aPageTypes.map(item => new Item({text:item._id, key:item._id}))
			}));

			var oPageType = aPageTypes.find(t => t._id === oPage.pageType);
			if (oPageType) {
				var bFirst = true;
				oPageType.fields.forEach(field => {
					parent.addContent( new Label({text: field.label}));
					switch(field.fieldType) {

						case 'Text':
							parent.addContent( new Input({
								value:"{view>/page/" + field.id + "}", 
								editable:"{view>/editable}",
								required: bFirst, 
								valueLiveUpdate:bFirst, 
								liveChange: [oController.onTitleChange, oController]
							}));	
							bFirst = false;
							break;

						case 'RichText':
							var oRichTextEditor = new RichTextEditor( {
								value: "{view>/page/text}",
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