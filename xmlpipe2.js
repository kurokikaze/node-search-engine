var couch = require('./node-couch').CouchDB,
    libxml = require('./libxmljs'),
    settings = require('./settings'),
    sys = require('sys');

function Combo(callback) {
  this.callback = callback;
  this.items = 0;
  this.results = [];
}

Combo.prototype = {
  add: function () {
    // sys.puts('Add ' + this.items);
    var self = this;
    this.items++;
    return function () {
      self.check(self.items - 1, arguments);
    };
  },
  check: function (id, arguments_in) {
    // sys.puts('Check ' + id);
    this.results[id] = arguments_in;
    this.items--;
    if (this.items == 0) {
      this.callback.call(this, this.results);
    }
  }
};


var db = couch.db(settings.couchbase, settings.couchhost);

db.allDocs({
    'success': function(docs) {
        //sys.puts('Got all docs: ' + JSON.stringify(docs));

        print_xml = new Combo(function(data) {
            var xmldoc = new libxml.Document(function(n) {
              n.node('sphinx:docset', function(n) {
                n.node('sphinx:schema', function(n) {
                  n.node('sphinx:field', {'name':'subject'});
                  n.node('sphinx:field', {'name':'content'});
                  n.node('sphinx:field', {'name':'published', 'type':'timestamp'});
                });
                for (doc in data) {

                    // sys.puts(JSON.stringify(data[doc]));

                    var doc_fields = data[doc]['0'];
                    n.node('sphinx:document', {'id':doc_fields._id}, function(n){
                        n.node('subject', '<![CDATA[[' + doc_fields.title + ']]>');
                        n.node('content', '<![CDATA[[' + doc_fields.text + ']]>');
                        n.node('published', (new Date()).getTime().toString());
                    });
                }
              });
            });

            sys.write(xmldoc);
        });

        for (doc in docs.rows) {
            if (docs.rows[doc]) {
                //sys.puts('Fetch ' + docs.rows[i].id);
                db.openDoc(docs.rows[doc].id,{
                    'success': print_xml.add(),
                    'error':function (e) {
                        sys.puts('Error getting doc: ' + sys.inspect(e));
                    }
                });
            }
        }
    },
    'error': function(errorResponse) {
        sys.puts('Error getting all docs: ' + JSON.stringify(errorResponse.reason));
    }
});