sap.ui.define([
	"sap/ui/layout/form/SimpleForm", 
	"sap/m/Select",
	"sap/ui/core/Item",
	"sap/m/Button", 
	"sap/m/Label", 
	"sap/m/Text", 
	"sap/m/Input",
	"sap/m/CheckBox",
	"sap/m/Switch",
	"sap/m/DatePicker",
	"sap/m/HBox", 
	"cmjs/model/ImageModel",
	"cmjs/editor/Editor"],
function(SimpleForm, Select, Item, Button, Label, Text, Input, CheckBox, Switch, DatePicker, HBox, ImageModel, Editor) {
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
							new Button({icon:"sap-icon://edit", text:"{i18n>edit}", type:"Emphasized", visible:"{= ! ${view>/editable} }", press:[controller.onEditPress, controller]}),
							new Button({icon:"sap-icon://accept", text:"{i18n>save}", type:"Accept", visible:"{view>/editable}", press:[controller.onSavePress, controller]}),
							new Button({icon:"sap-icon://decline", text:"{i18n>cancel}", type:"Reject", visible:"{view>/editable}", press:[controller.onCancelPress, controller]}),
							new Button({icon:"sap-icon://delete", text:"{i18n>delete}", visible:"{view>/editable}", press:[controller.onDeletePress, controller]}),
							new sap.m.ToolbarSpacer(),
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
							})
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
			parent.addContent( new Switch({state: "{tree>published}", type:"AcceptReject", change:[oController.onPublishChange,oController], enabled:"{view>/editable}"}));
			parent.addContent( new Label({text: "{i18n>legacyUrl}"}));
			parent.addContent( new Input({value: "{tree>legacyUrl}", editable:"{view>/editable}"}));
			parent.addContent( new Label({text: "{i18n>title}"}));
			parent.addContent( new Input({value: "{tree>title}", editable:"{view>/editable}", required: true, liveChange: [oController.onTitleChange, oController]}));
			parent.addContent( new Label({text: "{i18n>showInMenu}"}));
			parent.addContent( new Switch({state: "{tree>showInMenu}", type:"AcceptReject", enabled:"{= ${view>/editable} && ${tree>published} }"}));
			parent.addContent( new Label({text: "{i18n>menuTitle}"}));
			parent.addContent( new Input({value: "{tree>menuTitle}", editable:"{= ${view>/editable} && ${tree>showInMenu} }", required:true}));
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
				oPageType.fields.forEach(field => {
					parent.addContent( new Label({text: field.label}));
					switch(field.fieldType) {

						case 'Text':
							parent.addContent( new Input({
								value:"{tree>" + field.id + "}", 
								editable:"{view>/editable}"
							}));	
							break;

						case 'RichText':
							var oEditor = new Editor( {
								id: "editor",
								value: "{tree>text}",
								editable:"{view>/editable}",
								width: "100%",
								height: "600px"
							});
							oEditor.attachBeforeEditorInit(function(oEvent) {
								var oConfig = oEvent.getParameter('configuration');
								oConfig.plugins = oConfig.plugins.replace(/,?powerpaste/, "");
								oConfig.image_list = ImageModel.getData().map(function(img){ 
									return {title: img.name, value:`/uploads/${img.name}`};
								});
							}.bind(this));
							parent.addContent( oEditor );
							break;

						case "Date":
							parent.addContent(new DatePicker({
								value:"{tree>" + field.id + "}", 
								editable:"{view>/editable}",
								valueFormat:"dd.MM.yyyy",
								displayFormat:"medium"
							}));
							break;

						default:
							parent.addContent( new Text({text:"unkown fieldType " + field.fieldType}));									
					}
				});	
			};
		}

	});
});