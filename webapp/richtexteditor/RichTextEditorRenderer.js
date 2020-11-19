/*!
 * SAPUI5

(c) Copyright 2009-2020 SAP SE. All rights reserved
 */
sap.ui.define(['sap/ui/core/Renderer',
'sap/ui/core/Core'], function (R, C) {
  'use strict';
  var a = {
    apiVersion: 2
  };
  a.render = function (r, o) {
    var b = C.getLibraryResourceBundle('cmjs.richtexteditor');
    r.openStart('div', o);
    r.class ('sapUiRTE');
    if (o.getRequired()) {
      r.class ('sapUiRTEReq');
    }
    if (o.getUseLegacyTheme()) {
      r.class ('sapUiRTELegacyTheme');
    }
    r.style('width', o.getWidth());
    r.style('height', o.getHeight());
    if (o.getTooltip_AsString()) {
      r.attr('title', o.getTooltip_AsString());
    }
    r.accessibilityState(o, {
      role: 'region',
      label: b.getText('RTE_ARIA_LABEL'),
      labelledby: null
    });
    r.openEnd();
    var s = 'render' + o.getEditorType() + 'Editor';
    if (this[s] && typeof this[s] === 'function') {
      this[s].call(this, r, o);
    }
    r.close('div');
  };
  return a;
}, true);
//# sourceURL=http://localhost:8080/admin/resources/sap/ui/richtexteditor/RichTextEditorRenderer.js?eval
