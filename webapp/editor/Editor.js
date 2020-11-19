sap.ui.define([
    "sap/ui/thirdparty/jquery", 
    'sap/ui/core/Control', 
    'sap/ui/core/ResizeHandler', 
    "sap/ui/dom/includeScript", 
    "sap/base/Log", 
    "sap/base/security/sanitizeHTML", 
    "sap/ui/events/KeyCodes", 
    "sap/ui/Device", 
    "sap/ui/core/Core", 
    "sap/ui/dom/jquery/Selectors", 
    "sap/ui/dom/jquery/control"], 
    function (q, C, R, b, L, s, K, D, c) {
    "use strict";
    var E = {
        Initial: "Initial",
        Loading: "Loading",
        Initializing: "Initializing",
        Loaded: "Loaded",
        Ready: "Ready",
        Destroyed: "Destroyed"
    };
    var d = C.extend("cmjs.editor.Editor", {
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
        renderer: function (r, o) {
            r.openStart('div', o);
            r.style('width', o.getWidth());
            r.style('height', o.getHeight());
            if (o.getTooltip_AsString()) {
              r.attr('title', o.getTooltip_AsString());
            }
            r.accessibilityState(o, {
              role: 'region',
              label: 'Rich-Text-Editor',
              labelledby: null
            });
            r.openEnd();
            r.close('div');
        }
    });
    d._lastId = 0;
    d._iCountInstances = 0;
    d.BUTTON_GROUPS = {
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
    d.loadTinyMCE = function () {
        var r = sap.ui.resource('cmjs/editor/tinymce', 'tinymce.min.js'),
        S = document.querySelector("#cmjs-editor"),
        g = S ? S.getAttribute("src") : "";
        if (r !== g && d._iCountInstances === 1) {
            delete window.tinymce;
            delete window.TinyMCE;
            d.pLoadTinyMCE = null;
        }
        if (!d.pLoadTinyMCE) {
            d.pLoadTinyMCE = new Promise(function (h, i) {
                b(r, "cmjs-editor", h, i);
            });
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
        this._setupToolbar();
    };
    d.prototype.onBeforeRendering = function () {
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._TinyMCEStatus = E.Loading;
            this._pTinyMCELoaded = d.loadTinyMCE().then(function () {
                this._TinyMCEStatus = E.Loaded;
            }
                    .bind(this));
        } else {
            this._pTinyMCELoaded = Promise.resolve();
            this._TinyMCEStatus = E.Loaded;
        }
    };
    d.prototype.onAfterRendering = function () {
        var o = this.getDomRef();
        if (!window.tinymce || window.tinymce.majorVersion != "4") {
            this._pTinyMCELoaded.then(this.onAfterRendering.bind(this));
        } else if (o) {
            switch (this._TinyMCEStatus) {
            case E.Initializing:
                o.appendChild(this._textAreaDom);
                break;
            case E.Loaded:
            case E.Loading:
                this.getDomRef().appendChild(this._textAreaDom);
                this.reinitializeTinyMCE();
                break;
            case E.Ready:
                o.appendChild(this._textAreaDom);
                this.reinitializeTinyMCE();
                break;
            default:
                L.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
                break;
            }
        }
    };
    d.prototype.reinitialize = function () {
        clearTimeout(this._iReinitTimeout);
        this._iReinitTimeout = window.setTimeout(this.reinitializeTinyMCE.bind(this), 0);
    };
    d.prototype.getNativeApi = function () {
        return this.getNativeApiTinyMCE();
    };
    d.prototype.exit = function () {
        clearTimeout(this._reinitDelay);
        this.exitTinyMCE();
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
        this.setValueTinyMCE(v);
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
    d.prototype.initTinyMCE = function () {
        this._oEditor = null;
        this._TinyMCEStatus = E.Initial;
        this._boundResizeEditorTinyMCE = this._resizeEditorTinyMCE.bind(this);
        this._bInitializationPending = false;
        this._lastRestHeight = 0;
    };
    d.prototype.exitTinyMCE = function () {
        this._bUnloading = true;
        R.deregister(this._resizeHandlerId);
        this._resizeHandlerId = null;
        this._removeEditorTinyMCE();
    };
    d.prototype._removeEditorTinyMCE = function () {
        switch (this._TinyMCEStatus) {
        case E.Initial:
        case E.Loading:
        case E.Loaded:
            break;
        case E.Initializing:
            this._pTinyMCEInitialized.then(this._removeEditorTinyMCE.bind(this, this._oEditor));
            break;
        case E.Ready:
            this._oEditor.remove();
            this._TinyMCEStatus = E.Destroyed;
            this._boundResizeEditorTinyMCE = null;
            this._oEditor = null;
            break;
        case E.Destroyed:
            break;
        default:
            L.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    d.prototype.reinitializeTinyMCE = function () {
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
        case E.Initial:
            break;
        case E.Loading:
            this._bInitializationPending = true;
            this._pTinyMCELoaded.then(r);
            break;
        case E.Initializing:
            this._bInitializationPending = true;
            this._pTinyMCEInitialized.then(r);
            break;
        case E.Loaded:
        case E.Ready:
            this._bInitializationPending = true;
            setTimeout(function () {
                r();
            }, 0);
            break;
        default:
            L.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    d.prototype.getNativeApiTinyMCE = function () {
        return this._oEditor;
    };
    d.prototype.setValueTinyMCE = function (v) {
        switch (this._TinyMCEStatus) {
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
            L.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    d.prototype._initializeTinyMCE = function () {
        this._pTinyMCEInitialized = new Promise(function (r, f) {
            this._bInitializationPending = false;
            this._TinyMCEStatus = E.Initializing;
            this._textAreaDom.value = this._patchTinyMCEValue(this.getValue());
            window.tinymce.init(this._createConfigTinyMCE(function () {
                    this._TinyMCEStatus = E.Ready;
                    setTimeout(function () {
                        if (!this._bInitializationPending) {
                            this._onAfterReadyTinyMCE();
                        }
                        r();
                    }
                        .bind(this), 0);
                }
                    .bind(this)));
        }
                .bind(this));
    };
    d.prototype._patchTinyMCEValue = function (v) {
        if (v.indexOf("<!--") === 0) {
            v = "&#8203;" + v;
        }
        return v;
    };
    d.prototype._onAfterReadyTinyMCE = function () {
        var o = document.getElementById(this._iframeId),
        r = jQuery.sap.resources({url:'./i18n.properties'});
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
        this._registerWithPopupTinyMCE();
        if (!this._resizeHandlerId) {
            this._resizeHandlerId = R.register(this, this._boundResizeEditorTinyMCE);
        }
        this._resizeEditorOnDocumentReady();
        this.fireReadyTinyMCE();
    };
    d.prototype._resizeEditorOnDocumentReady = function () {
        var r = this._resizeEditorTinyMCE.bind(this);
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
    d.prototype.fireReadyTinyMCE = function () {
        switch (this._TinyMCEStatus) {
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
            L.error("Unknown TinyMCE status: " + this._TinyMCEStatus);
            break;
        }
    };
    d.prototype._createConfigTinyMCE = function (o) {
        var B = this._createButtonRowsTinyMCE(" ", "|");
        if (B.length === 0) {
            B = false;
        }
        var p = this._createPluginsListTinyMCE();
        if (!this.getEditable()) {
            p = p.replace(/(,powerpaste|powerpaste,)/gi, "");
        }
        var g = {
            directionality: "ltr",
            selector: "[id='" + this._textAreaId + "']",
            theme: "modern",
            menubar: false,
            language: "de",
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
    d.prototype._resizeEditorTinyMCE = function () {
        if (this._TinyMCEStatus !== E.Ready) {
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
    d.prototype._registerWithPopupTinyMCE = function () {
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
