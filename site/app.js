var kiwi = require('kiwi'),
    limestone = require('./limestone'),
    Do = require('./do'),
    sys = require('sys'),
    settings = require('../settings'),
    couch = require('../node-couch').CouchDB;

kiwi.require('express');

var db = couch.db(settings.couchbase, settings.couchhost);

configure(function() {
    set('root', __dirname);
});

get('/', function(){
  this.render('home.html.haml');
});

get('/search', function(){
  var query = this.param('query');

  var self = this;
  limestone.connect(9312, function(err) {
    if (err) {
        // sys.puts('Connection error: ' . err);
        this.render('results.html.haml', {'locals': {'header': 'Search results for "' + query + '"', 'query': query, 'results': 'Connection error'}});
    }
    //sys.puts('Connected, sending query');
    limestone.query({'query': query, maxmatches: 20}, function(err, answer) {
        limestone.disconnect();

        Do.map(answer.matches, function(match, callback) {

            db.openDoc(match.doc.toString(), {
                'success': function(page) {
                    callback(page);
                },
                'error': function(err) {
                    callback();
                }
            });
        })(function(elements){
            var pages = [];
            for (element in elements) {
                pages.push({'title': elements[element].title, 'url': 'http://' + elements[element].url});
            }

            self.render('results.html.haml', {
                'locals': {
                    'header': 'Search results for "' + query + '"',
                    'query': query,
                    'number_of_matches': 'Found ' + answer.match_count + ' matches',
                    'results': pages
                }
            });
        });
    });
  });

});

run(8000, '192.168.175.128');
