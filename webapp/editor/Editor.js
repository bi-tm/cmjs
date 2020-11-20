sap.ui.define([
    "sap/ui/thirdparty/jquery", 
    'sap/ui/core/Control', 
    'sap/ui/core/ResizeHandler', 
    "sap/ui/dom/includeScript", 
    "sap/base/Log", 
    "sap/base/security/sanitizeHTML", 
    "sap/ui/events/KeyCodes", 
    "sap/ui/Device", 
    "sap/ui/core/Core"], 
    function (jquery, Control, ResizeHandler, includeScript, Log, sanitizeHTML, KeyCodes, Device, Core) {
    "use strict";
    var EditorStatus = {
        Initial: "Initial",
        Loading: "Loading",
        Initializing: "Initializing",
        Loaded: "Loaded",
        Ready: "Ready",
        Destroyed: "Destroyed"
    };
    var Editor = Control.extend("cmjs.editor.Editor", {
        metadata: {
            properties: {
                value: {
                    type: "string",
                    group: "Data",
                    defaultValue: ''
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
        },
        renderer: function (oRM, oControl) {
            oRM.openStart('div', oControl);
            oRM.style('width', oControl.getWidth());
            oRM.style('height', oControl.getHeight());
            if (oControl.getTooltip_AsString()) {
              oRM.attr('title', oControl.getTooltip_AsString());
            }
            oRM.accessibilityState(oControl, {
              role: 'region',
              label: 'Rich-Text-Editor',
              labelledby: null
            });
            oRM.openEnd();
            oRM.close('div');
        }
    });
    Editor._lastId = 0;
    Editor._iCountInstances = 0;
    Editor.BUTTON_GROUPS = {
    'font-style': [
        'Bold',
        'Italic',
        'Underline',
        'Strikethrough'
    ],
    'text-align': [
        'TextAlign'
    ],
    'formatselect': [
        'FormatBlock'
    ],
    'font': [
        'FontFamily',
        'FontSize',
        'TextColor',
        'BackgroundColor'
    ],
    'structure': [
        'UnorderedList',
        'OrderedList',
        'Outdent',
        'Indent'
    ],
    'link': [
        'InsertLink',
        'Unlink'
    ],
    'insert': [
        'InsertImage'
    ],
    'undo': [
        'Undo',
        'Redo'
    ],
    'clipboard': [
        'Cut',
        'Copy',
        'Paste'
    ],
    'custom': [
    ]
    };
    Editor.loadTinyMCE = function () {
        var tinymce = sap.ui.resource('cmjs/editor/tinymce', 'tinymce.min.js'),
        querySelector = document.querySelector("#cmjs-editor"),
        src = querySelector ? querySelector.getAttribute("src") : "";
        if (tinymce !== src && Editor._iCountInstances === 1) {
            delete window.tinymce;
            delete window.TinyMCE;
            Editor.pLoadTinyMCE = null;
        }
        if (!Editor.pLoadTinyMCE) {
            Editor.pLoadTinyMCE = new Promise(function (resolve, reject) {
                includeScript(tinymce, "cmjs-editor", resolve, reject);
            });
        }
        return Editor.pLoadTinyMCE;
    };
    Editor.prototype.init = function () {
        Editor._iCountInstances++;
        this._oEditor = null;
        this._TinyMCEStatus = EditorStatus.Initial;
        this._boundResizeEditorTinyMCE = this._resizeEditorTinyMCE.bind(this);
        this._bInitializationPending = false;
        this._lastRestHeight = 0;
        this._bEditorCreated = false;
        this._sTimerId = null;
        this._textAreaId = this.getId() + "-textarea";
        this._iframeId = this._textAreaId + "_ifr";
        this._textAreaDom = document.createElement("textarea");
        this._textAreaDom.id = this._textAreaId;
        this._textAreaDom.style.height = "100%";
        this._textAreaDom.style.width = "100%";
        this._setupToolbar();
    };
    Editor.prototype.onBeforeRendering = function () {
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._TinyMCEStatus = EditorStatus.Loading;
            this._pTinyMCELoaded = Editor.loadTinyMCE().then(function () {
                this._TinyMCEStatus = EditorStatus.Loaded;
            }
                    .bind(this));
        } else {
            this._pTinyMCELoaded = Promise.resolve();
            this._TinyMCEStatus = EditorStatus.Loaded;
        }
    };
    Editor.prototype.onAfterRendering = function () {
        var domRef = this.getDomRef();
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._pTinyMCELoaded.then(this.onAfterRendering.bind(this));
        } else if (domRef) {
            switch (this._TinyMCEStatus) {
            case EditorStatus.Initializing:
                domRef.appendChild(this._textAreaDom);
                break;
            case EditorStatus.Loaded:
            case EditorStatus.Loading:
                this.getDomRef().appendChild(this._textAreaDom);
                this.reinitializeTinyMCE();
                break;
            case EditorStatus.Ready:
                domRef.appendChild(this._textAreaDom);
                this.reinitializeTinyMCE();
                break;
            default:
                Log.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
                break;
            }
        }
    };
    Editor.prototype.reinitialize = function () {
        clearTimeout(this._iReinitTimeout);
        this._iReinitTimeout = window.setTimeout(this.reinitializeTinyMCE.bind(this), 0);
    };
    Editor.prototype.getNativeApi = function () {
        return this.getNativeApiTinyMCE();
    };
    Editor.prototype.exit = function () {
        clearTimeout(this._reinitDelay);
        this.exitTinyMCE();
        Editor._iCountInstances--;
    };
    Editor.prototype.setValue = function (value) {
        value = (value === null || value === undefined) ? "" : value;
        if (this.getSanitizeValue()) {
            Log.trace("sanitizing HTML content for " + this);
            value = sanitizeHTML(value);
        }
        if (value === this.getValue()) {
            return this;
        }
        this.setProperty("value", value, true);
        value = this.getProperty("value");
        this.setValueTinyMCE(value);
        return this;
    };
    Editor.prototype.setEditable = function (value) {
        this.setProperty("editable", value, true);
        this.reinitialize();
        return this;
    };
    Editor.prototype.setWrapping = function (value) {
        this.setProperty("wrapping", value, true);
        this.reinitialize();
        return this;
    };
    Editor.prototype.setRequired = function (value) {
        this.setProperty("required", value, true);
        this.reinitialize();
        return this;
    };
    Editor.prototype._setShowGroup = function (S, m) {
        this.setProperty(m.property, S, true);
        this.setButtonGroupVisibility(m.buttonGroup, S);
        this.reinitialize();
        return this;
    };
    Editor.prototype.setShowGroupFontStyle = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupFontStyle',
            buttonGroup: 'font-style'
        });
    };
    Editor.prototype.setShowGroupTextAlign = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupTextAlign',
            buttonGroup: 'text-align'
        });
    };
    Editor.prototype.setShowGroupStructure = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupStructure',
            buttonGroup: 'structure'
        });
    };
    Editor.prototype.setShowGroupFont = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupFont',
            buttonGroup: 'font'
        });
    };
    Editor.prototype.setShowGroupClipboard = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupClipboard',
            buttonGroup: 'clipboard'
        });
    };
    Editor.prototype.setShowGroupInsert = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupInsert',
            buttonGroup: 'insert'
        });
    };
    Editor.prototype.setShowGroupLink = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupLink',
            buttonGroup: 'link'
        });
    };
    Editor.prototype.setShowGroupUndo = function (value) {
        return this._setShowGroup(value, {
            property: 'showGroupUndo',
            buttonGroup: 'undo'
        });
    };
    Editor.prototype.addPlugin = function (value) {
        if (typeof value === "string") {
            value = {
                name: value
            };
        }
        var plugins = this.getProperty("plugins") || [],
        i = plugins.some(function (p) {
            return p.name === value.name;
        });
        !i && plugins.push(value);
        this.setProperty("plugins", plugins);
        this.reinitialize();
        return this;
    };
    Editor.prototype.removePlugin = function (value) {
        var plugins = this.getProperty("plugins").slice(0);
        for (var i = 0; i < plugins.length; ++i) {
            if (plugins[i].name === value) {
                plugins.splice(i, 1);
                --i;
            }
        }
        this.setProperty("plugins", plugins);
        this.reinitialize();
        return this;
    };
    Editor.prototype.addButtonGroup = function (group) {
        var aGroups = this.getProperty("buttonGroups").slice(),
        f = true;
        for (var i = 0; i < aGroups.length; ++i) {
            if (group === "string" && aGroups[i].name === group || aGroups[i].name === group.name) {
                return this;
            }
        }
        if (typeof group === "string") {
            f = false;
            switch (group) {
            case "formatselect":
                f = true;
                group = {
                    name: "formatselect",
                    buttons: ["formatselect"]
                };
                break;
            case "styleselect":
                f = true;
                group = {
                    name: "styleselect",
                    buttons: ["styleselect"],
                    customToolbarPriority: 40
                };
                break;
            case "table":
                f = true;
                group = {
                    name: "table",
                    buttons: ["table"],
                    customToolbarPriority: 90
                };
                break;
            default:
                group = {
                    name: this._createId("buttonGroup"),
                    buttons: [group]
                };
            }
        }
        if (group.visible === undefined) {
            group.visible = true;
        }
        if (group.priority === undefined) {
            group.priority = 10;
        }
        if (group.row === undefined) {
            group.row = 0;
        }
        var B = this.getButtonGroups();
        B.push(group);
        this.setProperty("buttonGroups", B);
        return this;
    };
    Editor.prototype.removeButtonGroup = function (group) {
        var aGroups = this.getProperty("buttonGroups").slice(0);
        for (var i = 0; i < aGroups.length; ++i) {
            if (aGroups[i].name === group) {
                aGroups.splice(i, 1);
                --i;
            }
        }
        this.setProperty("buttonGroups", aGroups);
        this.reinitialize();
        return this;
    };
    Editor.prototype.setButtonGroups = function (groups) {
        if (!Array.isArray(groups)) {
            Log.error("Button groups cannot be set: " + groups + " is not an array.");
            return this;
        }
        this.setProperty("buttonGroups", groups);
        this.reinitialize();
        return this;
    };
    Editor.prototype.setPlugins = function (plugins) {
        var h = [];
        if (!Array.isArray(plugins)) {
            Log.error("Plugins cannot be set: " + plugins + " is not an array.");
            return this;
        }
        h = plugins.filter(function (P) {
            return P.name === "lists";
        });
        if (this.getShowGroupStructure() && !h.length) {
            plugins.push({
                name: "lists"
            });
        }
        this.setProperty("plugins", plugins);
        return this;
    };
    Editor.prototype.setButtonGroupVisibility = function (group, visible) {
        var B = this.getButtonGroups();
        for (var i = 0, f = B.length; i < f; ++i) {
            if (B[i].name === group) {
                B[i].visible = visible;
            }
        }
        return this;
    };
    Editor.prototype._createId = function (id) {
        if (id === undefined) {
            id = "_rte";
        }
        return id + (Editor._lastId++);
    };
    Editor.prototype._setupToolbar = function () {
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
    Editor.prototype._createButtonRowsTinyMCE = function (B, g) {
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
    Editor.prototype._createPluginsListTinyMCE = function () {
        var p = this.getPlugins(),
        P = [];
        for (var i = 0, f = p.length; i < f; ++i) {
            P.push(p[i].name);
        }
        return P.join(",");
    };
    Editor.prototype.tinyMCEReady = function () {
        var i = (this._iframeId ? window.document.getElementById(this._iframeId) : null);
        return !!i;
    };
    Editor.prototype.setValueTinyMCE = function (v) {
        if (this._bEditorCreated) {
            jquery(document.getElementById(this._textAreaId)).text(v);
            this.setContentTinyMCE();
        } else {
            this.setProperty("value", v, true);
            if (this.getDomRef()) {
                jquery(document.getElementById(this._textAreaId)).val(v);
            }
        }
    };
    Editor.prototype.onTinyMCEChange = function (o) {
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
    Editor.prototype._tinyMCEKeyboardHandler = function (o) {
        var n,
        k = o['keyCode'];
        switch (k) {
        case KeyCodes.TAB:
            if (!this.$focusables.index(jquery(o.target)) === 0) {
                var i = this.$focusables.length - 1;
                this.$focusables.get(i).focus();
            }
            break;
        case KeyCodes.ARROW_LEFT:
        case KeyCodes.ARROW_UP:
            n = this.$focusables.index(jquery(o.target)) - 1;
            if (n === 0) {
                n = this.$focusables.length - 2;
            }
            this.$focusables.get(n).focus();
            break;
        case KeyCodes.ARROW_RIGHT:
        case KeyCodes.ARROW_DOWN:
            n = this.$focusables.index(jquery(o.target)) + 1;
            if (n === this.$focusables.length - 1) {
                n = 1;
            }
            this.$focusables.get(n).focus();
            break;
        default:
            break;
        }
    };
    Editor.prototype._getLanguageTinyMCE = function () {
        var o = new sap.ui.core.Locale(Core.getConfiguration().getLanguage()),
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
    Editor.prototype.exitTinyMCE = function () {
        this._bUnloading = true;
        ResizeHandler.deregister(this._resizeHandlerId);
        this._resizeHandlerId = null;
        this._removeEditorTinyMCE();
    };
    Editor.prototype._removeEditorTinyMCE = function () {
        switch (this._TinyMCEStatus) {
        case EditorStatus.Initial:
        case EditorStatus.Loading:
        case EditorStatus.Loaded:
            break;
        case EditorStatus.Initializing:
            this._pTinyMCEInitialized.then(this._removeEditorTinyMCE.bind(this, this._oEditor));
            break;
        case EditorStatus.Ready:
            this._oEditor.remove();
            this._TinyMCEStatus = EditorStatus.Destroyed;
            this._boundResizeEditorTinyMCE = null;
            this._oEditor = null;
            break;
        case EditorStatus.Destroyed:
            break;
        default:
            Log.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    Editor.prototype.reinitializeTinyMCE = function () {
        if (this._bInitializationPending || this._bUnloading) {
            return;
        }
        var r = function () {
            if (this._oEditor) {
                this._oEditor.remove();
            }
            this._initializeTinyMCE();
        }
        .bind(this);
        switch (this._TinyMCEStatus) {
        case EditorStatus.Initial:
            break;
        case EditorStatus.Loading:
            this._bInitializationPending = true;
            this._pTinyMCELoaded.then(r);
            break;
        case EditorStatus.Initializing:
            this._bInitializationPending = true;
            this._pTinyMCEInitialized.then(r);
            break;
        case EditorStatus.Loaded:
        case EditorStatus.Ready:
            this._bInitializationPending = true;
            setTimeout(function () {
                r();
            }, 0);
            break;
        default:
            Log.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    Editor.prototype.getNativeApiTinyMCE = function () {
        return this._oEditor;
    };
    Editor.prototype.setValueTinyMCE = function (value) {
        switch (this._TinyMCEStatus) {
        case EditorStatus.Initial:
        case EditorStatus.Initializing:
        case EditorStatus.Loading:
            break;
        case EditorStatus.Ready:
            this._oEditor.setContent(value);
            this._oEditor.undoManager.clear();
            this._oEditor.undoManager.add();
            if (!this.getEditable()) {
                jquery.each(this._oEditor.getDoc().getElementsByTagName("a"), function (i, A) {
                    A.target = "_blank";
                });
            }
            break;
        default:
            Log.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    Editor.prototype._initializeTinyMCE = function () {
        this._pTinyMCEInitialized = new Promise(function (resolve, reject) {
            this._bInitializationPending = false;
            this._TinyMCEStatus = EditorStatus.Initializing;
            this._textAreaDom.value = this._patchTinyMCEValue(this.getValue());
            window.tinymce.init(this._createConfigTinyMCE(function () {
                    this._TinyMCEStatus = EditorStatus.Ready;
                    setTimeout(function () {
                        if (!this._bInitializationPending) {
                            this._onAfterReadyTinyMCE();
                        }
                        resolve();
                    }
                        .bind(this), 0);
                }
                    .bind(this)));
        }
                .bind(this));
    };
    Editor.prototype._patchTinyMCEValue = function (value) {
        if (value.indexOf("<!--") === 0) {
            value = "&#8203;" + value;
        }
        return value;
    };
    Editor.prototype._onAfterReadyTinyMCE = function () {
        var frame = document.getElementById(this._iframeId),
        r = jQuery.sap.resources({url:'./i18n.properties'});
        if (frame) {
            frame.setAttribute("aria-labelledby", this.getAriaLabelledBy().join(" "));
        }
        if (this._bUnloading) {
            return;
        }
        this._oEditor.on("change", function () {
            this.onTinyMCEChange(this._oEditor);
        }.bind(this));
        var $ = jquery(this._oEditor.getContainer());
        $.bind('keydown', jquery.proxy(this, this._tinyMCEKeyboardHandler));
        var g = jquery(frame),
        body = jquery(this._oEditor.getBody()),
        h = false;
        body.bind('focus', function () {
            if (!h) {
                h = true;
                if (Device.browser.msie || Device.browser.edge) {
                    g.trigger('activate');
                } else {
                    g.trigger('focus');
                }
                body.focus();
                h = false;
            }
        });
        if (this.getTooltip() && this.getTooltip().length > 0) {
            var i = this.getTooltip_Text();
            this._oEditor.getBody().setAttribute("title", i);
            g.attr("title", i);
        }
        this._registerWithPopupTinyMCE();
        if (!this._resizeHandlerId) {
            this._resizeHandlerId = ResizeHandler.register(this, this._boundResizeEditorTinyMCE);
        }
        this._resizeEditorOnDocumentReady();
        this.fireReadyTinyMCE();
    };
    Editor.prototype._resizeEditorOnDocumentReady = function () {
        var doc = this._oEditor.getDoc();
        if (!doc) {
            return;
        }
        if (doc.readyState == "complete") {
            this._resizeEditorTinyMCE();
        } else {
            doc.addEventListener("readystatechange", function () {
                if (doc.readyState == "complete") {
                    this._resizeEditorTinyMCE();
                }
            }.bind(this));
        }
    };
    Editor.prototype._tinyMCEDesktopDetected = function () {
        return window.tinymce && window.tinymce.Env.desktop;
    };
    Editor.prototype.fireReadyTinyMCE = function () {
        switch (this._TinyMCEStatus) {
        case EditorStatus.Initial:
        case EditorStatus.Loading:
        case EditorStatus.Loaded:
        case EditorStatus.Initializing:
            break;
        case EditorStatus.Ready:
            if (!this._bInitializationPending) {
                if (!this._readyFired) {
                    this._readyFired = true;
                    this.fireReady.apply(this, arguments);
                }
                this.fireReadyRecurring.apply(this, arguments);
            }
            break;
        default:
            Log.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    Editor.prototype._createConfigTinyMCE = function (callback) {
        var B = this._createButtonRowsTinyMCE(" ", "|");
        if (B.length === 0) {
            B = false;
        }
        var pluginList = this._createPluginsListTinyMCE();
        if (!this.getEditable()) {
            pluginList = pluginList.replace(/(,powerpaste|powerpaste,)/gi, "");
        }
        var oConfig = {
            directionality: "ltr",
            selector: "[id='" + this._textAreaId + "']",
            theme: "modern",
            menubar: false,
            language: "de",
            browser_spellcheck: true,
            convert_urls: false,
            plugins: pluginList,
            toolbar_items_size: 'small',
            toolbar: B,
            statusbar: false,
            image_advtab: true,
            readonly: !this.getEditable(),
            nowrap: !this.getWrapping(),
            init_instance_callback: function (h) {
                this._oEditor = h;
                callback();
            }
            .bind(this)
        };
        this.fireBeforeEditorInit({
            configuration: oConfig
        });
        this._bHasNativeMobileSupport = oConfig.mobile;
        return oConfig;
    };
    Editor.prototype._resizeEditorTinyMCE = function () {
        if (this._TinyMCEStatus !== EditorStatus.Ready) {
            return;
        }
        var areaContainer = this._oEditor.getContentAreaContainer(),
        domRefOffsetHeight = this.getDomRef().offsetHeight,
        containerOffsetHeight = this._oEditor.getContainer().offsetHeight,
        restHeight = domRefOffsetHeight - (containerOffsetHeight - areaContainer.offsetHeight),
        restHeightAbs = Math.abs(this._lastRestHeight - restHeight);
        if (restHeightAbs == 0 || restHeightAbs > 5) {
            try {
                this._oEditor.theme.resizeTo(undefined, restHeight - 2);
            } catch (m) {}
        }
        this._lastRestHeight = restHeight;
    };
    Editor.prototype._registerWithPopupTinyMCE = function () {
        var eventBus = Core.getEventBus(),
        popup = this.$().closest("[data-sap-ui-popup]");
        setTimeout(function () {
            if (popup.length === 1) {
                var P = popup.attr("data-sap-ui-popup"),
                o = {
                    id: this._iframeId
                };
                eventBus.publish("sap.ui", "sap.ui.core.Popup.addFocusableContent-" + P, o);
                if (this._oEditor) {
                    this._oEditor.on('OpenWindow', function (f) {
                        var o = {
                            id: f.win._id
                        };
                        eventBus.publish("sap.ui", "sap.ui.core.Popup.addFocusableContent-" + P, o);
                    });
                    this._oEditor.on('CloseWindow', function (f) {
                        var o = {
                            id: f.win._id
                        };
                        eventBus.publish("sap.ui", "sap.ui.core.Popup.removeFocusableContent-" + P, o);
                    });
                }
            }
        }
            .bind(this), 0);
    };
    
    return Editor;
});
