sap.ui.define([
    "sap/m/upload/Uploader"
], function(
	Uploader
) {
	"use strict";



	return Uploader.extend("cmjs.util.Uploader", {
   
        uploadItem(oItem, aHeaderFields) {
            var oXhr = new window.XMLHttpRequest(),
                that = this,
                formData = new FormData(),
                oRequestHandler = {
                    xhr: oXhr,
                    item: oItem
                };

            formData.append("file", oItem.getFileObject());

            oXhr.open("POST", this.getUploadUrl(), true);

            if (aHeaderFields) {
                aHeaderFields.forEach(function (oHeader) {
                    oXhr.setRequestHeader(oHeader.getKey(), oHeader.getText());
                });
            }

            oXhr.upload.addEventListener("progress", function (oEvent) {
                that.fireUploadProgressed({
                    item: oItem,
                    loaded: oEvent.loaded,
                    total: oEvent.total,
                    aborted: false
                });
                oItem.size = oEvent.total; 
            });

            oXhr.onreadystatechange = function () {
                var oHandler = that._mRequestHandlers[oItem.getId()];
                if (this.readyState === window.XMLHttpRequest.DONE && !oHandler.aborted) {
                    that.fireUploadCompleted({item: oItem});
                }
            };

            this._mRequestHandlers[oItem.getId()] = oRequestHandler;
            oXhr.send(formData);
            this.fireUploadStarted({item: oItem});
        }

	});
});