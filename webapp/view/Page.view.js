sap.ui.define([
	"sap/m/Page",
	"sap/ui/layout/form/SimpleForm", 
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/m/Select",
	"sap/ui/core/Item",
	"sap/m/Button", 
	"sap/m/Label", 
	"sap/m/Input",
	"../util/Database"], 
function(Page, SimpleForm, RichTextEditor, Select, Item, Button, Label, Input, Database) {
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
				labelSpanL:3,
				labelSpanM:3,
				labelSpanS:12,
				adjustLabelSpan: false,
				emptySpanXL:4,
				emptySpanL:4,
				emptySpanM:4,
				emptySpanS:0,
				columnsXL:1,
				columnsL:1,
				columnsM:1,
				singleContainerFullSize: false			
			});
			this.page = new Page({
				title:"{view>/page/title}",
				headerContent: [
					new Button({icon:"sap-icon://edit", text:"Bearbeiten", type:"Emphasized", visible:"{= ! ${view>/editable} }", press:[controller.onEditPress, controller]}),
					new Button({icon:"sap-icon://accept", text:"Sichern", type:"Accept", visible:"{view>/editable}", press:[controller.onSavePress, controller]}),
					new Button({icon:"sap-icon://decline", text:"Abbrechen", type:"Reject", visible:"{view>/editable}", press:[controller.onCancelPress, controller]})
				],
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

			parent.destroyContent();

			parent.addContent( new Label({text: "{i18n>pageType}"}));
			parent.addContent( new Select({
				required: true, 
				editable:"{view>/editable}",
				selectedKey: "{view>/page/pageType}",
				change: [this.getController().onPageTypeChanged, this.getController()],
				items: aPageTypes.map(item => new Item({text:item._id, key:item._id}))
			}));

			var oPageType = aPageTypes.find(t => t._id === oPage.pageType);
			if (oPageType) {
				oPageType.fields.forEach(field => {
					parent.addContent( new Label({text: field.label}));
					switch(field.fieldType) {

						case 'Text':
							parent.addContent( new Input({value:"{view>/page/" + field.id + "}", editable:"{view>/editable}"}));		
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