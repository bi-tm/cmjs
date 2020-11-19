/*!
 * SAPUI5

(c) Copyright 2009-2020 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/thirdparty/jquery", 'sap/ui/core/Control', 'sap/ui/core/ResizeHandler', './library', "sap/ui/core/RenderManager", "sap/ui/dom/includeScript", "sap/base/Log", "sap/base/security/sanitizeHTML", "sap/ui/events/KeyCodes", "sap/base/security/encodeXML", "sap/ui/Device", "sap/ui/core/Core", "./RichTextEditorRenderer", "sap/ui/dom/jquery/Selectors", "sap/ui/dom/jquery/control"], function (q, C, R, l, a, b, L, s, K, e, D, c) {
    "use strict";
    var E = {
        Initial: "Initial",
        Loading: "Loading",
        Initializing: "Initializing",
        Loaded: "Loaded",
        Ready: "Ready",
        Destroyed: "Destroyed"
    };
    /**
     * Constructor for a new RichTextEditor.
     *
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     *
     * The RichTextEditor-Control is used to enter formatted text. It uses the third-party component called TinyMCE.
     * In addition to the native toolbar, you can also use a toolbar built with SAPUI5 controls.
     * <h3>Overview</h3>
     *
     * With version 1.48 onward, aside from the native toolbar of the TinyMCE, the <code>RichTextEditor</code> can also use a
     * toolbar built with SAPUI5 controls. Which toolbar is used is taken into consideration only while the
     * control is being initialized and it will not be possible to change it during runtime, because of
     * lifecycle incompatibilities between the SAPUI5 and the third-party library.
     * The custom toolbar acts like a wrapper to the native toolbar and takes care of
     * synchronizing the state of its internal controls with the current state of the selection in the editor
     * (bold, italics, font styles etc.).
     *
     * <h4>Limitations</h4>
     *
     * <b>Note: The <code>RichTextEditor</code> uses a third-party component and therefore
     * some additional limitations apply for its proper usage and support.
     * For more information see the Preamble section in {@link topic:d4f3f1598373452bb73f2120930c133c sap.ui.richtexteditor}.
     * </b>
     *
     * <h3>Guidelines</h3>
     * <ul>
     * <li> The <code>RichTextEditor</code> should be used for desktop apps only. However, if it is essential for your use case, you can enable the mobile version of TinyMCE, whilst having in mind the limitations. For more information see the {@link topic:d4f3f1598373452bb73f2120930c133c sap.ui.richtexteditor documentation}.</li>
     * <li> In order to be usable, the control needs a minimum width 17.5 rem and height of 12.5 rem.</li>
     * <li> Do not instantiate the <code>RichTextEditor</code> from a hidden container.</li>
     * <li> Make sure you destroy the <code>RichTextEditor</code> instance instead of hiding it and create a new one when you show it again.</li>
     * </ul>
     *
     * <h3>Usage</h3>
     *
     * <h4>When to use</h4>
     * <ul>
     * <li>You want to enable users to enter text and other elements (tables, images) with different styles and colors.</li>
     * <li>You need to provide a tool for texts that require additional formatting.</li>
     * </ul>
     *
     * <h4> When not to use</h4>
     * <ul>
     * <li>You want to let users add simple text that doesn’t require formatting. Use {@link sap.m.TextArea text area} instead.</li>
     * <li>Use callbacks to the native third-party API with care, as there may be compatibility issues with later versions.</li>
     * </ul>
     *
     * @extends sap.ui.core.Control
     *
     * @author SAP SE
     *
     * @constructor
     * @public
     * @disclaimer Since version 1.6.0.
     * The RichTextEditor of SAPUI5 contains a third party component TinyMCE provided by Moxiecode Systems AB. The SAP license agreement covers the development of applications with RichTextEditor of SAPUI5 (as of May 2014).
     * @alias sap.ui.richtexteditor.RichTextEditor
     * @see {@link fiori:https://experience.sap.com/fiori-design-web/rich-text-editor/ Rich Text Editor}
     * @see {@link topic:d4f3f1598373452bb73f2120930c133c}
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
    var d = C.extend("sap.ui.richtexteditor.RichTextEditor", {
        metadata: {
            library: "sap.ui.richtexteditor",
            properties: {
                value: {
                    type: "string",
                    group: "Data",
                    defaultValue: ''
                },
                textDirection: {
                    type: "sap.ui.core.TextDirection",
                    group: "Appearance",
                    defaultValue: sap.ui.core.TextDirection.Inherit
                },
                width: {
                    type: "sap.ui.core.CSSSize",
                    group: "Dimension",
                    defaultValue: null
                },
                height: {
                    type: "sap.ui.core.CSSSize",
                    group: "Dimension",
                    defaultValue: null
                },
                editorType: {
                    type: "string",
                    group: "Misc",
                    defaultValue: 'TinyMCE4'
                },
                editorLocation: {
                    type: "string",
                    group: "Misc",
                    defaultValue: 'js/tiny_mce4/tinymce.js',
                    deprecated: true
                },
                editable: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                showGroupFontStyle: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                showGroupTextAlign: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                showGroupStructure: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                showGroupFont: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                },
                showGroupClipboard: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                showGroupInsert: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                },
                showGroupLink: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                },
                showGroupUndo: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                },
                wrapping: {
                    type: "boolean",
                    group: "Appearance",
                    defaultValue: true
                },
                required: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                },
                sanitizeValue: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: true
                },
                plugins: {
                    type: "object[]",
                    group: "Behavior",
                    defaultValue: []
                },
                useLegacyTheme: {
                    type: "boolean",
                    group: "Appearance",
                    defaultValue: true
                },
                buttonGroups: {
                    type: "object[]",
                    group: "Behavior",
                    defaultValue: []
                }
            },
            events: {
                change: {
                    parameters: {
                        newValue: {
                            type: "string"
                        }
                    }
                },
                ready: {},
                readyRecurring: {},
                beforeEditorInit: {}
            },
            aggregations: {
            },
            associations: {
                ariaLabelledBy: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    singularName: "ariaLabelledBy"
                }
            }
        }
    });
    d._lastId = 0;
    d._iCountInstances = 0;
    d.BUTTON_GROUPS = l.ButtonGroups;
    d.EDITORTYPE_TINYMCE4 = l.EditorType.TinyMCE4;
    d.EDITORLOCATION_TINYMCE4 = "js/tiny_mce4/tinymce.min.js";
    if (c.getConfiguration().getDebug()) {
        d.EDITORLOCATION_TINYMCE4 = "js/tiny_mce4/tinymce.js";
    }
    d.MAPPED_LANGUAGES_TINYMCE4 = {
        "sh": "sr",
        "ji": "yi",
        "in": "id",
        "iw": "he",
        "no": "nb"
    };
    d.SUPPORTED_LANGUAGES_TINYMCE4 = {
        "en": true,
        "ar": true,
        "ar_SA": true,
        "hy": true,
        "az": true,
        "eu": true,
        "be": true,
        "bn_BD": true,
        "bs": true,
        "bg_BG": true,
        "ca": true,
        "zh_CN": true,
        "zh_TW": true,
        "hr": true,
        "cs": true,
        "da": true,
        "dv": true,
        "nl": true,
        "en_CA": true,
        "en_GB": true,
        "et": true,
        "fo": true,
        "fi": true,
        "fr_FR": true,
        "gd": true,
        "gl": true,
        "ka_GE": true,
        "de": true,
        "de_AT": true,
        "el": true,
        "he_IL": true,
        "hi_IN": true,
        "hu_HU": true,
        "is_IS": true,
        "id": true,
        "it": true,
        "ja": true,
        "kk": true,
        "km_KH": true,
        "ko_KR": true,
        "ku": true,
        "ku_IQ": true,
        "lv": true,
        "lt": true,
        "lb": true,
        "ml": true,
        "ml_IN": true,
        "mn_MN": true,
        "nb_NO": true,
        "fa": true,
        "fa_IR": true,
        "pl": true,
        "pt_BR": true,
        "pt_PT": true,
        "ro": true,
        "ru": true,
        "ru@petr1708": true,
        "sr": true,
        "si_LK": true,
        "sk": true,
        "sl_SI": true,
        "es": true,
        "es_MX": true,
        "sv_SE": true,
        "tg": true,
        "ta": true,
        "ta_IN": true,
        "tt": true,
        "th_TH": true,
        "tr_TR": true,
        "ug": true,
        "uk": true,
        "uk_UA": true,
        "vi": true,
        "vi_VN": true,
        "cy": true
    };
    d.SUPPORTED_LANGUAGES_DEFAULT_REGIONS = {
        "zh": "CN",
        "fr": "FR",
        "bn": "BD",
        "bg": "BG",
        "ka": "GE",
        "he": "IL",
        "hi": "IN",
        "hu": "HU",
        "is": "IS",
        "km": "KH",
        "ko": "KR",
        "ku": "IQ",
        "ml": "IN",
        "mn": "MN",
        "nb": "NO",
        "pt": "PT",
        "si": "SI",
        "sl": "SI",
        "sv": "SE",
        "th": "TH",
        "tr": "TR",
        "vi": "VN"
    };
    d.pLoadTinyMCE = null;
    d.loadTinyMCE = function (f) {
        if (f) {
            var r = sap.ui.resource('sap.ui.richtexteditor', f),
            S = document.querySelector("#sapui5-tinyMCE"),
            g = S ? S.getAttribute("src") : "";
            if (r !== g && d._iCountInstances === 1) {
                delete window.tinymce;
                delete window.TinyMCE;
                d.pLoadTinyMCE = null;
            }
            if (!d.pLoadTinyMCE) {
                d.pLoadTinyMCE = new Promise(function (h, i) {
                    b(r, "sapui5-tinyMCE", h, i);
                });
            }
        }
        return d.pLoadTinyMCE;
    };
    d.prototype.init = function () {
        this._bEditorCreated = false;
        this._sTimerId = null;
        d._iCountInstances++;
        this._textAreaId = this.getId() + "-textarea";
        this._iframeId = this._textAreaId + "_ifr";
        this._textAreaDom = document.createElement("textarea");
        this._textAreaDom.id = this._textAreaId;
        this._textAreaDom.style.height = "100%";
        this._textAreaDom.style.width = "100%";
        this.setEditorType(l.EditorType.TinyMCE4);
        this._setupToolbar();
    };
    d.prototype.onBeforeRendering = function () {
        if (this.isPropertyInitial("editorType")) {
            L.warning("editorType property is automatically set to TinyMCE 4, because of the removal of TinyMCE 3");
        }
        this.onBeforeRenderingTinyMCE4();
    };
    d.prototype.onAfterRendering = function () {
        this.onAfterRenderingTinyMCE4();
        this.getDomRef() && q(this).toggleClass("sapUiRTELegacyTheme", this.getUseLegacyTheme());
    };
    d.prototype.reinitialize = function () {
        clearTimeout(this._iReinitTimeout);
        this._iReinitTimeout = window.setTimeout(this.reinitializeTinyMCE4.bind(this), 0);
    };
    d.prototype.getNativeApi = function () {
        return this.getNativeApiTinyMCE4();
    };
    d.prototype.exit = function () {
        clearTimeout(this._reinitDelay);
        this.exitTinyMCE4();
        d._iCountInstances--;
    };
    d.prototype.setValue = function (v) {
        v = (v === null || v === undefined) ? "" : v;
        if (this.getSanitizeValue()) {
            L.trace("sanitizing HTML content for " + this);
            v = s(v);
        }
        if (v === this.getValue()) {
            return this;
        }
        this.setProperty("value", v, true);
        v = this.getProperty("value");
        var m = "setValue" + this.getEditorType();
        if (this[m] && typeof this[m] === "function") {
            this[m].call(this, v);
        } else {
            this.reinitialize();
        }
        return this;
    };
    d.prototype.setEditable = function (f) {
        this.setProperty("editable", f, true);
        this.reinitialize();
        return this;
    };
    d.prototype.setWrapping = function (w) {
        this.setProperty("wrapping", w, true);
        this.reinitialize();
        return this;
    };
    d.prototype.setRequired = function (r) {
        this.setProperty("required", r, true);
        this.reinitialize();
        return this;
    };
    d.prototype._setShowGroup = function (S, m) {
        this.setProperty(m.property, S, true);
        this.setButtonGroupVisibility(m.buttonGroup, S);
        this.reinitialize();
        return this;
    };
    d.prototype.setShowGroupFontStyle = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupFontStyle',
            buttonGroup: 'font-style'
        });
    };
    d.prototype.setShowGroupTextAlign = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupTextAlign',
            buttonGroup: 'text-align'
        });
    };
    d.prototype.setShowGroupStructure = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupStructure',
            buttonGroup: 'structure'
        });
    };
    d.prototype.setShowGroupFont = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupFont',
            buttonGroup: 'font'
        });
    };
    d.prototype.setShowGroupClipboard = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupClipboard',
            buttonGroup: 'clipboard'
        });
    };
    d.prototype.setShowGroupInsert = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupInsert',
            buttonGroup: 'insert'
        });
    };
    d.prototype.setShowGroupLink = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupLink',
            buttonGroup: 'link'
        });
    };
    d.prototype.setShowGroupUndo = function (S) {
        return this._setShowGroup(S, {
            property: 'showGroupUndo',
            buttonGroup: 'undo'
        });
    };
    d.prototype.addPlugin = function (p) {
        if (typeof p === "string") {
            p = {
                name: p
            };
        }
        var P = this.getProperty("plugins") || [],
        i = P.some(function (o) {
            return o.name === p.name;
        });
        !i && P.push(p);
        this.setProperty("plugins", P);
        this.reinitialize();
        return this;
    };
    d.prototype.removePlugin = function (p) {
        var P = this.getProperty("plugins").slice(0);
        for (var i = 0; i < P.length; ++i) {
            if (P[i].name === p) {
                P.splice(i, 1);
                --i;
            }
        }
        this.setProperty("plugins", P);
        this.reinitialize();
        return this;
    };
    d.prototype.addButtonGroup = function (g) {
        var G = this.getProperty("buttonGroups").slice(),
        f = true;
        for (var i = 0; i < G.length; ++i) {
            if (g === "string" && G[i].name === g || G[i].name === g.name) {
                return this;
            }
        }
        if (typeof g === "string") {
            f = false;
            switch (g) {
            case "formatselect":
                f = true;
                g = {
                    name: "formatselect",
                    buttons: ["formatselect"]
                };
                break;
            case "styleselect":
                f = true;
                g = {
                    name: "styleselect",
                    buttons: ["styleselect"],
                    customToolbarPriority: 40
                };
                break;
            case "table":
                f = true;
                g = {
                    name: "table",
                    buttons: ["table"],
                    customToolbarPriority: 90
                };
                break;
            default:
                g = {
                    name: this._createId("buttonGroup"),
                    buttons: [g]
                };
            }
        }
        if (g.visible === undefined) {
            g.visible = true;
        }
        if (g.priority === undefined) {
            g.priority = 10;
        }
        if (g.row === undefined) {
            g.row = 0;
        }
        var B = this.getButtonGroups();
        B.push(g);
        this.setProperty("buttonGroups", B);
        return this;
    };
    d.prototype.removeButtonGroup = function (g) {
        var G = this.getProperty("buttonGroups").slice(0);
        for (var i = 0; i < G.length; ++i) {
            if (G[i].name === g) {
                G.splice(i, 1);
                --i;
            }
        }
        this.setProperty("buttonGroups", G);
        this.reinitialize();
        return this;
    };
    d.prototype.setButtonGroups = function (g) {
        if (!Array.isArray(g)) {
            L.error("Button groups cannot be set: " + g + " is not an array.");
            return this;
        }
        this.setProperty("buttonGroups", g);
        this.reinitialize();
        return this;
    };
    d.prototype.setPlugins = function (p) {
        var h = [];
        if (!Array.isArray(p)) {
            L.error("Plugins cannot be set: " + p + " is not an array.");
            return this;
        }
        h = p.filter(function (P) {
            return P.name === "lists";
        });
        if (this.getShowGroupStructure() && !h.length) {
            p.push({
                name: "lists"
            });
        }
        this.setProperty("plugins", p);
        return this;
    };
    d.prototype.setButtonGroupVisibility = function (g, v) {
        var B = this.getButtonGroups();
        for (var i = 0, f = B.length; i < f; ++i) {
            if (B[i].name === g) {
                B[i].visible = v;
            }
        }
        return this;
    };
    d.prototype._createId = function (p) {
        if (p === undefined) {
            p = "_rte";
        }
        return p + (d._lastId++);
    };
    d.prototype._setupToolbar = function () {
        this.setPlugins([{
                    name: "emoticons"
                }, {
                    name: "directionality"
                }, {
                    name: "tabfocus"
                }, {
                    name: "table"
                }, {
                    name: "image"
                }, {
                    name: "link"
                }, {
                    name: "textcolor"
                }, {
                    name: "colorpicker"
                }, {
                    name: "textpattern"
                }, {
                    name: "powerpaste"
                }
            ]);
        this.setButtonGroups([{
                    name: "font-style",
                    visible: true,
                    row: 0,
                    priority: 10,
                    customToolbarPriority: 20,
                    buttons: ["bold", "italic", "underline", "strikethrough"]
                }, {
                    name: "font",
                    visible: false,
                    row: 0,
                    priority: 30,
                    customToolbarPriority: 50,
                    buttons: ["fontselect", "fontsizeselect", "forecolor", "backcolor"]
                }, {
                    name: "clipboard",
                    visible: true,
                    row: 1,
                    priority: 10,
                    customToolbarPriority: 110,
                    buttons: ["cut", "copy", "paste"]
                }, {
                    name: "structure",
                    visible: true,
                    row: 1,
                    priority: 20,
                    customToolbarPriority: 60,
                    buttons: ["bullist", "numlist", "outdent", "indent"]
                }, {
                    name: "e-mail",
                    visible: false,
                    row: 1,
                    priority: 30,
                    customToolbarPriority: 10,
                    buttons: []
                }, {
                    name: "undo",
                    visible: false,
                    row: 1,
                    priority: 40,
                    customToolbarPriority: 100,
                    buttons: ["undo", "redo"]
                }, {
                    name: "insert",
                    visible: false,
                    row: 1,
                    priority: 50,
                    customToolbarPriority: 80,
                    buttons: ["image", "emoticons"]
                }, {
                    name: "link",
                    visible: false,
                    row: 1,
                    priority: 60,
                    customToolbarPriority: 70,
                    buttons: ["link", "unlink"]
                }
            ]);
        this.addButtonGroup({
            name: "text-align",
            visible: true,
            row: 0,
            priority: 20,
            customToolbarPriority: 30,
            buttons: ["alignleft", "aligncenter", "alignright", "alignjustify"]
        });
    };
    d.prototype.setEditorType = function (f) {
        if (!this._bEditorCreated) {
            this.setProperty("editorType", f);
            this.setEditorLocation(d.EDITORLOCATION_TINYMCE4);
            if (f !== l.EditorType.TinyMCE4) {
                L.error('TinyMCE3 is removed now due to security concerns, please do NOT use it anymore. The framework automatically will load TinyMCE4 since v1.60');
            }
            this.initTinyMCE4();
        } else {
            L.error("editorType property cannot be set after the RichtextEditor has been rendered");
        }
        return this;
    };
    d.prototype.setEditorLocation = function (f) {
        if (!this._bEditorCreated) {
            this.setProperty("editorLocation", f);
        } else {
            L.error("editorLocation property cannot be set after the RichtextEditor has been rendered");
        }
        return this;
    };
    d.prototype._createButtonRowsTinyMCE = function (B, g) {
        B = B === undefined ? "," : B;
        g = g === undefined ? "|" : g;
        var f = this.getButtonGroups(),
        G = B + g + B,
        i,
        h,
        m,
        o = {},
        j = [];
        for (i = 0, h = f.length; i < h; ++i) {
            m = f[i];
            if (!o[m.priority]) {
                o[m.priority] = [];
            }
            if (m.priority === undefined) {
                m.priority = Number.MAX_VALUE;
            }
            o[m.priority].push(m);
        }
        for (var k in o) {
            for (i = 0, h = o[k].length; i < h; ++i) {
                m = o[k][i];
                var r = m.row || 0;
                if (!m.visible || !m.buttons || m.buttons.length === 0) {
                    continue;
                }
                if (!j[r]) {
                    j[r] = "";
                }
                j[r] += m.buttons.join(B) + G;
            }
        }
        for (i = 0; i < j.length; ++i) {
            if (j[i] === null) {
                continue;
            } else if (!j[i]) {
                j.splice(i, 1);
                j.push(null);
                continue;
            }
            if (j[i].substr(-3) === G) {
                j[i] = j[i].substr(0, j[i].length - G.length);
            }
            if (j[i].substr(-1) === B) {
                j[i] = j[i].substr(0, j[i].length - B.length);
            }
            if (j[i].length === 0) {
                j.splice(i, 1);
                j.push(null);
            }
        }
        return j;
    };
    d.prototype._createPluginsListTinyMCE = function () {
        var p = this.getPlugins(),
        P = [];
        for (var i = 0, f = p.length; i < f; ++i) {
            P.push(p[i].name);
        }
        return P.join(",");
    };
    d.prototype.tinyMCEReady = function () {
        var i = (this._iframeId ? window.document.getElementById(this._iframeId) : null);
        return !!i;
    };
    d.prototype.setValueTinyMCE = function (v) {
        if (this._bEditorCreated) {
            q(document.getElementById(this._textAreaId)).text(v);
            this.setContentTinyMCE();
        } else {
            this.setProperty("value", v, true);
            if (this.getDomRef()) {
                q(document.getElementById(this._textAreaId)).val(v);
            }
        }
    };
    d.prototype.onTinyMCEChange = function (o) {
        var f = this.getValue(),
        n = o.getContent();
        if ((f !== n) && !this.bExiting) {
            this.setProperty("value", n, true);
            this.fireChange({
                oldValue: f,
                newValue: n
            });
        }
    };
    d.prototype._tinyMCEKeyboardHandler = function (o) {
        var n,
        k = o['keyCode'];
        switch (k) {
        case K.TAB:
            if (!this.$focusables.index(q(o.target)) === 0) {
                var i = this.$focusables.length - 1;
                this.$focusables.get(i).focus();
            }
            break;
        case K.ARROW_LEFT:
        case K.ARROW_UP:
            n = this.$focusables.index(q(o.target)) - 1;
            if (n === 0) {
                n = this.$focusables.length - 2;
            }
            this.$focusables.get(n).focus();
            break;
        case K.ARROW_RIGHT:
        case K.ARROW_DOWN:
            n = this.$focusables.index(q(o.target)) + 1;
            if (n === this.$focusables.length - 1) {
                n = 1;
            }
            this.$focusables.get(n).focus();
            break;
        default:
            break;
        }
    };
    d.prototype._getLanguageTinyMCE = function () {
        var o = new sap.ui.core.Locale(c.getConfiguration().getLanguage()),
        f = o.getLanguage(),
        r = o.getRegion(),
        m = {
            "zh": "zh-" + (r ? r.toLowerCase() : "cn"),
            "sh": "sr",
            "hi": "en"
        };
        f = m[f] ? m[f] : f;
        return f;
    };
    d.prototype.initTinyMCE4 = function () {
        this._oEditor = null;
        this._tinyMCE4Status = E.Initial;
        this._boundResizeEditorTinyMCE4 = this._resizeEditorTinyMCE4.bind(this);
        this._bInitializationPending = false;
        this._lastRestHeight = 0;
    };
    d.prototype.exitTinyMCE4 = function () {
        this._bUnloading = true;
        R.deregister(this._resizeHandlerId);
        this._resizeHandlerId = null;
        this._removeEditorTinyMCE4();
    };
    d.prototype._removeEditorTinyMCE4 = function () {
        switch (this._tinyMCE4Status) {
        case E.Initial:
        case E.Loading:
        case E.Loaded:
            break;
        case E.Initializing:
            this._pTinyMCE4Initialized.then(this._removeEditorTinyMCE4.bind(this, this._oEditor));
            break;
        case E.Ready:
            this._oEditor.remove();
            this._tinyMCE4Status = E.Destroyed;
            this._boundResizeEditorTinyMCE4 = null;
            this._oEditor = null;
            break;
        case E.Destroyed:
            break;
        default:
            L.error("Unknown TinyMCE4 status: " + this._tinyMCE4Status);
            break;
        }
    };
    d.prototype.onBeforeRenderingTinyMCE4 = function () {
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._tinyMCE4Status = E.Loading;
            this._pTinyMCE4Loaded = d.loadTinyMCE(this.getEditorLocation()).then(function () {
                this._tinyMCE4Status = E.Loaded;
            }
                    .bind(this));
        } else {
            this._pTinyMCE4Loaded = Promise.resolve();
            this._tinyMCE4Status = E.Loaded;
        }
    };
    d.prototype.onAfterRenderingTinyMCE4 = function () {
        var o = this.getDomRef();
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._pTinyMCE4Loaded.then(this.onAfterRenderingTinyMCE4.bind(this));
        } else if (o) {
            switch (this._tinyMCE4Status) {
            case E.Initializing:
                o.appendChild(this._textAreaDom);
                break;
            case E.Loaded:
            case E.Loading:
                this.getDomRef().appendChild(this._textAreaDom);
                this.reinitializeTinyMCE4();
                break;
            case E.Ready:
                o.appendChild(this._textAreaDom);
                this.reinitializeTinyMCE4();
                break;
            default:
                L.error("Unknown TinyMCE4 status: " + this._tinyMCE4Status);
                break;
            }
        }
    };
    d.prototype.reinitializeTinyMCE4 = function () {
        if (this._bInitializationPending || this._bUnloading) {
            return;
        }
        var r = function () {
            if (this._oEditor) {
                this._oEditor.remove();
            }
            this._initializeTinyMCE4();
        }
        .bind(this);
        switch (this._tinyMCE4Status) {
        case E.Initial:
            break;
        case E.Loading:
            this._bInitializationPending = true;
            this._pTinyMCE4Loaded.then(r);
            break;
        case E.Initializing:
            this._bInitializationPending = true;
            this._pTinyMCE4Initialized.then(r);
            break;
        case E.Loaded:
        case E.Ready:
            this._bInitializationPending = true;
            setTimeout(function () {
                r();
            }, 0);
            break;
        default:
            L.error("Unknown TinyMCE4 status: " + this._tinyMCE4Status);
            break;
        }
    };
    d.prototype.getNativeApiTinyMCE4 = function () {
        return this._oEditor;
    };
    d.prototype.setValueTinyMCE4 = function (v) {
        switch (this._tinyMCE4Status) {
        case E.Initial:
        case E.Initializing:
        case E.Loading:
            break;
        case E.Ready:
            this._oEditor.setContent(v);
            this._oEditor.undoManager.clear();
            this._oEditor.undoManager.add();
            if (!this.getEditable()) {
                q.each(this._oEditor.getDoc().getElementsByTagName("a"), function (i, A) {
                    A.target = "_blank";
                });
            }
            break;
        default:
            L.error("Unknown TinyMCE4 status: " + this._tinyMCE4Status);
            break;
        }
    };
    d.prototype._initializeTinyMCE4 = function () {
        this._pTinyMCE4Initialized = new Promise(function (r, f) {
            this._bInitializationPending = false;
            this._tinyMCE4Status = E.Initializing;
            this._textAreaDom.value = this._patchTinyMCE4Value(this.getValue());
            window.tinymce.init(this._createConfigTinyMCE4(function () {
                    this._tinyMCE4Status = E.Ready;
                    setTimeout(function () {
                        if (!this._bInitializationPending) {
                            this._onAfterReadyTinyMCE4();
                        }
                        r();
                    }
                        .bind(this), 0);
                }
                    .bind(this)));
        }
                .bind(this));
    };
    d.prototype._patchTinyMCE4Value = function (v) {
        if (v.indexOf("<!--") === 0) {
            v = "&#8203;" + v;
        }
        return v;
    };
    d.prototype._onAfterReadyTinyMCE4 = function () {
        var o = document.getElementById(this._iframeId),
        r = c.getLibraryResourceBundle("sap.ui.richtexteditor");
        if (o) {
            o.setAttribute("aria-labelledby", this.getAriaLabelledBy().join(" "));
        }
        if (this._bUnloading) {
            return;
        }
        this._oEditor.on("change", function (j) {
            this.onTinyMCEChange(this._oEditor);
        }
            .bind(this));
        var $ = q(this._oEditor.getContainer());
        $.bind('keydown', q.proxy(this, this._tinyMCEKeyboardHandler));
        var g = q(o),
        B = q(this._oEditor.getBody()),
        h = false;
        B.bind('focus', function () {
            if (!h) {
                h = true;
                if (D.browser.msie || D.browser.edge) {
                    g.trigger('activate');
                } else {
                    g.trigger('focus');
                }
                B.focus();
                h = false;
            }
        });
        if (this.getTooltip() && this.getTooltip().length > 0) {
            var i = this.getTooltip_Text();
            this._oEditor.getBody().setAttribute("title", i);
            g.attr("title", i);
        }
        this._registerWithPopupTinyMCE4();
        if (!this._resizeHandlerId) {
            this._resizeHandlerId = R.register(this, this._boundResizeEditorTinyMCE4);
        }
        this._resizeEditorOnDocumentReady();
        this.fireReadyTinyMCE4();
    };
    d.prototype._resizeEditorOnDocumentReady = function () {
        var r = this._resizeEditorTinyMCE4.bind(this);
        var o = this._oEditor.getDoc();
        if (!o) {
            return;
        }
        if (o.readyState == "complete") {
            r();
        } else {
            o.addEventListener("readystatechange", function () {
                if (o.readyState == "complete") {
                    r();
                }
            });
        }
    };
    d.prototype._tinyMCEDesktopDetected = function () {
        return window.tinymce && window.tinymce.Env.desktop;
    };
    d.prototype.fireReadyTinyMCE4 = function () {
        switch (this._tinyMCE4Status) {
        case E.Initial:
        case E.Loading:
        case E.Loaded:
        case E.Initializing:
            break;
        case E.Ready:
            if (!this._bInitializationPending) {
                if (!this._readyFired) {
                    this._readyFired = true;
                    this.fireReady.apply(this, arguments);
                }
                this.fireReadyRecurring.apply(this, arguments);
            }
            break;
        default:
            L.error("Unknown TinyMCE4 status: " + this._tinyMCE4Status);
            break;
        }
    };
    d.prototype._getTextDirection = function () {
        if (this.getTextDirection() === this.getMetadata().getProperty("textDirection").getDefaultValue()) {
            return c.getConfiguration().getRTL() ? "rtl" : "ltr";
        } else {
            return this.getTextDirection().toLowerCase();
        }
    };
    d.prototype._createConfigTinyMCE4 = function (o) {
        var B = this._createButtonRowsTinyMCE(" ", "|");
        if (B.length === 0) {
            B = false;
        }
        var p = this._createPluginsListTinyMCE();
        if (!this.getEditable()) {
            p = p.replace(/(,powerpaste|powerpaste,)/gi, "");
        }
        var g = {
            directionality: this._getTextDirection(),
            selector: "[id='" + this._textAreaId + "']",
            theme: "modern",
            menubar: false,
            language: this._getLanguageTinyMCE4(),
            browser_spellcheck: true,
            convert_urls: false,
            plugins: p,
            toolbar_items_size: 'small',
            toolbar: B,
            statusbar: false,
            image_advtab: true,
            readonly: !this.getEditable(),
            nowrap: !this.getWrapping(),
            init_instance_callback: function (h) {
                this._oEditor = h;
                o();
            }
            .bind(this)
        };
        this.fireBeforeEditorInit({
            configuration: g
        });
        this._bHasNativeMobileSupport = g.mobile;
        return g;
    };
    d.prototype._getLanguageTinyMCE4 = function () {
        var o = new sap.ui.core.Locale(c.getConfiguration().getLanguage()),
        f = o.getLanguage(),
        r = o.getRegion(),
        g;
        f = d.MAPPED_LANGUAGES_TINYMCE4[f] || f;
        if (!r) {
            r = d.SUPPORTED_LANGUAGES_DEFAULT_REGIONS[f];
        }
        g = r ? f + "_" + r.toUpperCase() : f;
        if (!d.SUPPORTED_LANGUAGES_TINYMCE4[g]) {
            g = f;
        }
        if (!d.SUPPORTED_LANGUAGES_TINYMCE4[g]) {
            g = "en";
        }
        return g;
    };
    d.prototype._resizeEditorTinyMCE4 = function () {
        if (this._tinyMCE4Status !== E.Ready) {
            return;
        }
        var o = this._oEditor.getContentAreaContainer(),
        f = this.getDomRef().offsetHeight,
        i = this._oEditor.getContainer().offsetHeight,
        g = o.offsetHeight,
        h,
        j,
        r,
        k;
        r = f - (i - g);
        k = Math.abs(this._lastRestHeight - r);
        if (k == 0 || k > 5) {
            try {
                this._oEditor.theme.resizeTo(undefined, r - 2);
            } catch (m) {}
        }
        this._lastRestHeight = r;
    };
    d.prototype._registerWithPopupTinyMCE4 = function () {
        var B = c.getEventBus(),
        p = this.$().closest("[data-sap-ui-popup]");
        setTimeout(function () {
            if (p.length === 1) {
                var P = p.attr("data-sap-ui-popup"),
                o = {
                    id: this._iframeId
                };
                B.publish("sap.ui", "sap.ui.core.Popup.addFocusableContent-" + P, o);
                if (this._oEditor) {
                    this._oEditor.on('OpenWindow', function (f) {
                        var o = {
                            id: f.win._id
                        };
                        B.publish("sap.ui", "sap.ui.core.Popup.addFocusableContent-" + P, o);
                    });
                    this._oEditor.on('CloseWindow', function (f) {
                        var o = {
                            id: f.win._id
                        };
                        B.publish("sap.ui", "sap.ui.core.Popup.removeFocusableContent-" + P, o);
                    });
                }
            }
        }
            .bind(this), 0);
    };
    
    return d;
});

//# sourceURL=http://localhost:8080/admin/resources/sap/ui/richtexteditor/RichTextEditor.js?eval
