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
                    defaultValue: ''
                },
                width: {
                    type: "sap.ui.core.CSSSize",
                    defaultValue: null
                },
                height: {
                    type: "sap.ui.core.CSSSize",
                    defaultValue: null
                },
                editable: {
                    type: "boolean",
                    defaultValue: true
                },
                required: {
                    type: "boolean",
                    defaultValue: false
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
    Editor.loadTinyMCE = function () {
        if (!Editor.pLoadTinyMCE) {
            var tinymce = sap.ui.resource('cmjs/editor/tinymce', 'tinymce.min.js');
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
    };
    Editor.prototype.onBeforeRendering = function () {
        if (!window.tinymce) {
            this._TinyMCEStatus = EditorStatus.Loading;
            this._pTinyMCELoaded = Editor.loadTinyMCE().then(function () {
                this._TinyMCEStatus = EditorStatus.Loaded;
            }.bind(this));
        } else {
            this._pTinyMCELoaded = Promise.resolve();
            this._TinyMCEStatus = EditorStatus.Loaded;
        }
    };
    Editor.prototype.onAfterRendering = function () {
        var domRef = this.getDomRef();
        if (domRef) {
            this._pTinyMCELoaded.then(function(){
                switch (this._TinyMCEStatus) {
                case EditorStatus.Initializing:
                    domRef.appendChild(this._textAreaDom);
                    break;
                case EditorStatus.Loaded:
                case EditorStatus.Loading:
                    domRef.appendChild(this._textAreaDom);
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
            }.bind(this));
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
        value = sanitizeHTML(value);
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
    Editor.prototype.setRequired = function (value) {
        this.setProperty("required", value, true);
        this.reinitialize();
        return this;
    };
    Editor.prototype._createId = function (id) {
        if (id === undefined) {
            id = "_rte";
        }
        return id + (Editor._lastId++);
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
            this._pTinyMCEInitialized.then(this._removeEditorTinyMCE.bind(this));
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
        var removeEditor = function () {
            if (this._oEditor) {
                this._oEditor.remove();
            }
            this._initializeTinyMCE();
        }.bind(this);
        switch (this._TinyMCEStatus) {
        case EditorStatus.Initial:
            break;
        case EditorStatus.Loading:
            this._bInitializationPending = true;
            this._pTinyMCELoaded.then(removeEditor);
            break;
        case EditorStatus.Initializing:
            this._bInitializationPending = true;
            this._pTinyMCEInitialized.then(removeEditor);
            break;
        case EditorStatus.Loaded:
        case EditorStatus.Ready:
            this._bInitializationPending = true;
            setTimeout(removeEditor,0);
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
            var oConfig = this._createConfigTinyMCE();
            oConfig.init_instance_callback = function (editor) {
                this._oEditor = editor;
                this._TinyMCEStatus = EditorStatus.Ready;
                if (!this._bInitializationPending) {
                    this._onAfterReadyTinyMCE();
                }
                resolve();
            }.bind(this)
            window.tinymce.init(oConfig);
        }.bind(this));
    };
    Editor.prototype._patchTinyMCEValue = function (value) {
        if (value.indexOf("<!--") === 0) {
            value = "&#8203;" + value;
        }
        return value;
    };
    Editor.prototype._onAfterReadyTinyMCE = function () {
        var frame = document.getElementById(this._iframeId);
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
        var oConfig = {
            directionality: "ltr",
            selector: "[id='" + this._textAreaId + "']",
            theme: "silver",
            menubar: false,
            language: "de",
            browser_spellcheck: true,
            convert_urls: false,
            plugins: "lists,image,link,table",
            toolbar: ["bold italic underline strikethrough fontsizeselect | alignleft aligncenter alignright alignjustify | cut copy paste | bullist numlist outdent indent | table | undo redo | image | link unlink"],
            statusbar: false,
            image_advtab: true,
            readonly: !this.getEditable(),
            nowrap: false
        };
        this.fireBeforeEditorInit({
            configuration: oConfig
        });
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
