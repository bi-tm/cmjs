const emu    = require('express-middleware-upload')
    , path   = require('path')
    , fs     = require('fs')
    , sharp  = require("sharp")
    , config = require("./config.json")
    ;

function createThumbnail(file){
    sharp(file)
    .resize(170,170,{fit:"inside"})
    .toFile(file.replace(/^(.*)\/([^\/]+)$/,"$1/thumbnails/$2"), function(err,info){});
}

function listProcessing(req, res, next) {
    // refresh list thumbnails if query parameter ?refresh is set
    if (req.query.refresh !== undefined) {
        var entry = null;
        var uploadPath = path.join(config.projectPath, "/uploads");
        var dir = fs.opendirSync(uploadPath);
        while(entry = dir.readSync()){
            if(entry.isFile()){
                createThumbnail(path.resolve(uploadPath,entry.name));
            }
        }
        dir.closeSync();
    }
    next();
}

function postProcessing (req, res, next) {
    // create thumbnails
    for(var file of req.files) {
        createThumbnail(file.storagePath);
    }
    next();
  }


module.exports = emu({
    path: path.join(config.projectPath, "/uploads"),
    list: listProcessing,
    postProcessing: postProcessing
});