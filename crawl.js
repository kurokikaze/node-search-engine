var spider = require('./spider');
var sys = require('sys');
var habr = require('./habraparsers');
var urlparser = require('url');

var Db = require('./mongodb').Db,
  Connection = require('./mongodb').Connection,
  Server = require('./mongodb').Server,
  // BSON = require('./mongodb').BSONPure;
  BSON = require('./mongodb').BSONNative;

// Ugly, but necessary part  
var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

sys.puts("Connecting to " + host + ":" + port);
var db = new Db('habrausers', new Server(host, port, {}));

var crawler = spider.create('habrahabr.ru', 2);

var round = 2;

// crawler.addpage('shoohurt.habrahabr.ru');
/*for (i=2; i<=1187; i++) {
	crawler.addpage('/people/page' + i + '/');
}*/

db.open(function(err, db) {
	if (!err) {
	  db.collection('shoohurt', function(err, collection) {
		crawler.on('page', function(page) {
			var html = crawler.parse(page);
			sys.puts('Title: ' + crawler.title(html));
			var friends = habr.fetch_friends(html);
			for (friend in friends) {
				//collection.find({'link' : friends[friend]}, function(err, cursor) {
//					if (cursor.count() == 0) {
						collection.insert({'link': friends[friend], 'number': round + 1});
//					} else {
//						sys.puts('Met ' + friends[friend] + ' for second time');
//					}
//				});
			}
			
			sys.puts('Inserted ' + friends.length + ' friends');
/*			var users = fetch_users(html);
			for (user in users) {
				collection.insert({'link': users[user]});
			}*/
		});

		crawler.on('end', function() {
			sys.puts('Task ended');
			process.exit();
		});

		crawler.on('error', function(err) {
			sys.puts('ERROR: ' . err.message);
		});
		
		crawler.on('answer', function(URL, code) {
			sys.puts('Got answer from ' + URL + ' with code ' + code);
		});

		sys.puts('DB opened');
		collection.find({'number' : round}, function(err, cursor) {
			cursor.each(function(err, item) {
              if(item != null) {
                sys.puts('Item: ' + sys.inspect(item));
                sys.puts("created at " + new Date(item._id.generationTime) + "\n");
				var url = urlparser.parse(item.link);
				crawler.addpage(url.hostname)
              }
              // Null signifies end of iterator
              if (item == null) {                
                  crawler.run();
              }			
			});
		});
		// crawler.run();
	  });	
	} else {
		sys.puts('Error opening DB: ' + err.message);	
	}
});


// http://habrahabr.ru/people/page1187/
