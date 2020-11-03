const { database, sync } = require("./database");

sync.then(function() {
    database.pages.allDocs({include_docs: true}).then(function(result) {
        for (var row of result.rows) {
            if (row.doc.parentId === "0") {
                row.doc.parentId = null;
                database.pages.put(row.doc);
                console.log(`document updated ${row.doc._id} ${row.doc.title}`);
            }
            row.doc.showInMenu = true;
            row.doc.menuTitle  = null;
            row.doc.published  = true;
            if(typeof(row.doc.sort)==="string") {
                row.doc.sort = parseInt(row.doc.sort);
            }
            database.pages.put(row.doc);
            console.log(`document updated ${row.doc._id} ${row.doc.title}`);
        }   
    });
});
