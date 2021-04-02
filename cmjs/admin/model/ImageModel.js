sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "cmjs/util/Ajax"
], function(
    JSONModel, Ajax
) {
	"use strict";

	const mimeTypes = {
		"jpg":  "image/jpeg",
		"jpeg": "image/jpeg",
		"gif":  "image/gif",
		"png":  "image/png",
		"pdf":  "application/pdf",
		"svg":  "image/svg+xml",
		"ico":  "image/vnd.microsoft.icon",
		"doc":  "application/msword",
		"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"ppt":  "application/vnd.ms-powerpoint",
		"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	}

    var loadPromise = null;

    var ImageModel = JSONModel.extend("cmjs.model.ImageModel", {
        
        /**
         * loads images from /api/uploads
         * @param {boolean} refresh
         * @returns Promise
         */
        load: function(refresh) {
            if (!loadPromise || refresh) {
                var url = "/api/uploads";
                if (refresh) {
                    url = url + "?refresh";
                }
                loadPromise =  Ajax({url:url})
                .then(function(aImages) {
                    this.setData(
                        aImages
                        .map(oFile => {
                            oFile.mimeType = mimeTypes[oFile.ext]; 
                            return oFile;
                        })
                        .filter(oFile => 
                            oFile.mimeType !== undefined
                        )
                    );
                }.bind(this));
            }
            return loadPromise;
        },

        /**
         * delete image
         * @param {Object} oFile 
         * @returns {Promise}
         */
        remove: function(oFile) {
            return new Promise(function(resolve, reject ){
                jQuery.ajax({
                    type: "DELETE",
                    url: `/api/uploads/${oFile.name}`,
                    success: function() {
                        resolve();
                        var aFiles = this.getData();
                        var index = aFiles.findIndex(img => img.name === oFile.name);
                        if (index >= 0){
                            aFiles.splice(index,1);
                            this.setData(aFiles);
                        }
                    }.bind(this),
                    error: function(jqXHR, textStatus, errorThrown) {
                        reject({status: jqXHR.status, text: errorThrown});
                    }.bind(this)
                });
            }.bind(this))
        }

    });

    return new ImageModel();
    
});