var couch = require('./node-couch').CouchDB,
    libxml = require('./libxmljs'),
    settings = require('./settings'),
    sys = require('sys');

var db = couch.db(settings.couchbase, settings.couchhost);

var process_document = function (docs) {
    if (docs.length > 0) {
        var document = docs.pop();

        db.openDoc(document.id,{
            'success': function(page) {
                sys.puts('<sphinx:document id="' + page._id + '">');

                sys.puts('<subject><![CDATA[');

                if (page.title) {
                    sys.puts(page.title.replace(']]>', ''));
                } else {
                    sys.puts('No title');
                }

                sys.puts(']]></subject>');

                sys.puts('<content><![CDATA[');

                if (page.text) {
                    sys.puts(page.text.replace(']]>', ''));
                }

                sys.puts(']]></content>');

                if (page.url) {
                    sys.puts('<url>' + page.url + '</url>');
                } else {
                    sys.puts('<url />');
                }
                sys.puts('<published>' + (new Date()).getTime().toString() + '</published>');

                sys.puts('</sphinx:document>');

                process_document(docs);
            },
            'error':function (e) {
                sys.puts('Error getting doc: ' + sys.inspect(e));
            }
        });

    } else {
        sys.puts('</sphinx:docset>');
    }
};

db.allDocs({
    'success': function(docs) {

        sys.puts('<' + '?xml version="1.0" encoding="utf-8"?>');
        sys.puts('<sphinx:docset>');
        sys.puts('<sphinx:schema>');

        sys.puts(' <sphinx:field name="subject" />');
        sys.puts(' <sphinx:field name="content" />');
        sys.puts(' <sphinx:field name="url" />');
        sys.puts(' <sphinx:field name="published" type="timestamp" />');

        sys.puts('</sphinx:schema>');

        process_document(docs.rows);

    },
    'error': function(errorResponse) {
        sys.puts('Error getting all docs: ' + JSON.stringify(errorResponse.reason));
    }
});