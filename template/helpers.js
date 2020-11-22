module.exports = {
    dateFormat: function(date) {
        return date.replace(/(\d+)-(\d+)-(\d+)/, "$3.$2.$1");
    }
}