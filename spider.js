var libxml = require("./libxmljs"),
    sys = require("sys");

var xml = '<date><year>2010</year><month>March</month><day>24</day></date>';

var parser = new libxml.SaxParser(function(cb) {
  cb.onStartDocument(function() {});
  cb.onEndDocument(function() {});
  cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
    sys.puts('Element: ' + elem);
  });
  cb.onEndElementNS(function(elem, prefix, uri) {});
  cb.onCharacters(function(chars) {
  //  sys.puts('Characters: ' + chars);

  });
  cb.onCdata(function(cdata) {});
  cb.onComment(function(msg) {});
  cb.onWarning(function(msg) {});
  cb.onError(function(msg) {});
});

//parser.parseString(xml);
parser.parseFile('google.htm');