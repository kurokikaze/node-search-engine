var libxml = require("./libxmljs"),
    sys = require("sys");

var parsed = libxml.parseHtmlFile('habr.htm');

sys.puts(parsed.encoding());
var links = parsed.find('//a');
for (link in links) {
    sys.puts('Destination: ' + links[link].attr('href').value());
}