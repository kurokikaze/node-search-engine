// Task-independent functions

var unique = function(arr) {
    var a = [];
    var l = arr.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (arr[i] === arr[j])
          j = ++i;
      }
      a.push(arr[i]);
    }
    return a;
};

function indexInArray(arr, val){
    for (var i = 0; i < arr.length; i++) {
	    if(arr[i]==val) return true;
    }
    return false;
}

function get_content_type(headers) {
    return headers['content-type'].split(';')[0];
}

var libxml = require("./libxmljs"),
    http = require("http"),
    url = require("url"),
    settings = require("./settings"),
    couch = require("./node-couch").CouchDB,
    Iconv = require("./iconv").Iconv,
    sys = require("sys");

var Buffer = require('buffer').Buffer;

var parsePage = function(string) {
    try {
        var parsed = libxml.parseHtmlString(string);
    } catch(e) {
	    sys.puts('Cannot parse: ' + string);
	    return {};
    }

    return parsed;
};

try {
    var iconv = new Iconv('cp1251', 'utf-8');
} catch(e) {
    sys.puts('Cannot create encoder: '+  e.message);
}

var getLinks = function(parsed_html, baseURL) {

    var links = parsed_html.find('//a');

    var destinations = [];
    for (link in links) {
        var attr = links[link].attr('href');
        if (attr && attr.value) {
            var url_parts = url.parse(url.resolve(baseURL, attr.value()));

            if (!url_parts.hostname || url_parts.hostname.indexOf(settings.targethost) > -1) {
                var destination = url_parts.pathname;
                if (url_parts.search) {
                    destination = destination + url_parts.search;
                }
                destinations.push(destination);
            } else {
                // sys.puts('Found outbound link to ' + url_parts.hostname);
            }

        }
    }

    return destinations;
}

// Task-dependent functions

function create(targethost, num_of_streams) {
	var spider = new process.EventEmitter;

	// Establish connections
	var target_site = http.createClient(80, targethost);
	var db = couch.db(settings.couchbase, settings.couchhost);

	// Set option defaults
	num_of_streams = num_of_streams || 1;

	// Initialize page pools
	var known_pages = [];
	var visited_pages = [];

	var getPage = function(URL, connection, callback) {

		sys.puts('Getting URL ' + URL)
		var request = connection.request("GET", URL, {"host": settings.targethost, 'User-Agent':'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.472.63 Safari/534.3', 'Accept':'text/html', 'Accept-Charset': 'UTF-8'});

		request.addListener('response', function (response) {
		  response.setEncoding("UTF-8");

		  //var text = new Buffer('');
		  var text = '';

		  response.addListener("data", function (chunk) {
			  text += chunk;
		  });

		  response.addListener('end', function() {
	//          sys.puts('URL: ' + URL + ' > ' + response.statusCode);
	//          sys.puts('HEADERS > ' + JSON.stringify(response.headers));

			  // sys.puts('Type of text: ' + (text instanceof Buffer));
			  // var utf_text = iconv.convert(new Buffer(text, 'binary')).toString('utf-8');
			  var utf_text = text;
			  callback(response.statusCode, utf_text, response.headers);
		  });

		});
		request.end();
	};

	var get_next_page = function() {
		for (page in known_pages) {
			if (known_pages[page] && !indexInArray(visited_pages, known_pages[page]) && (typeof known_pages[page] != 'undefined')) {
				visited_pages.push(known_pages[page]);
				// sys.puts(known_pages[page] + ' marked as visited');
				// sys.puts('Visited pages: ' + visited_pages.length);
				return known_pages[page];
			}
		}
		
		spider.emit('end')
		process.exit(); // End of list
	}

	var crawl_page = function (URL, connection, stream_id) {
		sys.puts('Stream ' + stream_id + ' visiting ' + URL);
		getPage(URL, connection, function(code, text, headers) {

			// sys.puts('Got ' + code + ' answer from '+URL+', headers is: ' + JSON.stringify(headers));
			sys.puts('Got ' + code + ' answer from ' + URL);
			var links = [];

			if (code == 200) {
				var content_type = get_content_type(headers);

				if (content_type == 'text/html' || content_type == 'text/plain' || content_type == '') {

	//                text = text.replace('<noindex>','').replace('</noindex>','');

					spider.emit('page', text, headers);

				} else {
					sys.puts('Strange content type: ' + content-type);
				}

			} else if (code == 301 || code == 303) {

				spider.emit('redirect', code, headers.location);
			
				// Return redirect location to known pages
				//sys.puts('Redirect: ' + URL + ' > ' + headers.location);
				known_pages.push(headers.location);

			} else if (code == 404) {
				spider.emit('notfound', headers);
				// Do nothing, maybe add some sort of log entry
			} else if (code == 400) {
				// sys.puts('Bad request: ' + URL);
				spider.emit('badrequest', headers);
			} else {
				spider.emit('othercode', code, headers);
				//sys.puts('Unknown code: ' + code + '\nHeaders is: ' + JSON.stringify(headers));
			}


	//        known_pages = unique(known_pages.concat(links));
	//        sys.puts('Known pages: ' + known_pages.length);
			setTimeout(function() {
				var url = get_next_page();
				spider.emit('crawl', url);
				crawl_page(url, connection, stream_id);
			}, settings.crawl_timeout);

			// Create new stream if available and have unvisited pages
			if (num_of_streams < settings.max_streams && known_pages.length > visited_pages.length) {
				num_of_streams++;
				var new_connection = http.createClient(80, settings.targethost);
				var url = get_next_page();
				crawl_page(url, new_connection, num_of_streams);
				//sys.puts('Starting another stream: ' + num_of_streams + ' of ' + settings.max_streams);
				spider.emit('newstream', url, num_of_streams);
			}
		});
	}
	
	spider.addpage = function(page) {
		
		if (page instanceof Array && page) {
			// Array of pages
			sys.puts('Adding ' + page.length + ' pages');
			known_pages = unique(known_pages.concat(page));
		} else if (page.length > 0) {
			// Single page
			sys.puts('Adding ' + page + ' page');
			known_pages.push(page);
			known_pages = unique(known_pages);
		}
		
	};
	
	spider.run = function() {
		sys.puts('Starting with list: ' + JSON.stringify(known_pages));
		crawl_page(get_next_page(), target_site, 1);
	};

	// Helper functions
	spider.parse = parsePage;
	
	spider.clean = cleanPage;
	
	spider.title = pageTitle;
	
	return spider;

}

// Second part

var cleanPage = function(parsed_html) {

    var scripts = parsed_html.find('//script');
    for (script in scripts) {
        scripts[script].remove();
    }

    var styles = parsed_html.find('//style');
    for (style in styles) {
        styles[style].remove();
    }

    var body = parsed_html.get('/html/body');

    if (body && body.text) {
        body = body.text();
    } else {
        sys.puts('Body is empty?');
        body = '';
    }

    return body;
}

var pageTitle = function(parsed_html) {

    var title = parsed_html.get('//head/title');

    if (title.text) {
      return title.text();
    } else {
      return '';
    }
}

exports.create = create;