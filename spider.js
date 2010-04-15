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
    sys = require("sys");

var target_site = http.createClient(80, settings.targethost);
var db = couch.db(settings.couchbase, settings.couchhost);


var parsePage = function(string) {
    try {
        var parsed = libxml.parseHtmlString(string);
    } catch(e) {
	sys.puts('Cannot parse: ' + string);
	return [];
    }

    var links = parsed.find('//a');
    var destinations = [];
    for (link in links) {
        var attr = links[link].attr('href');
        if (attr && attr.value) {
            var url_parts = url.parse(attr.value());

	        if (!url_parts.hostname || url_parts.hostname.indexOf(settings.targethost) > -1) {
            	destinations.push(url_parts.pathname);
	        } else {
		        // sys.puts('Found outbound link to ' + url_parts.hostname);
	        }

        }
    }

    return destinations;
};

var getPage = function(URL, callback) {

    var request = target_site.request("GET", URL, {"host": settings.targethost});

    request.addListener('response', function (response) {
      response.setBodyEncoding("utf8");

      var text = '';

      response.addListener("data", function (chunk) {
          text += chunk;
      });

      response.addListener('end', function() {
//          sys.puts('URL: ' + URL + ' > ' + response.statusCode);
//          sys.puts('HEADERS > ' + JSON.stringify(response.headers));
          callback(response.statusCode, text, response.headers);
      });

    });
    request.end();
};

var known_pages = [];

var visited_pages = [];

var get_next_page = function() {
    for (page in known_pages) {
        if (known_pages[page] && !indexInArray(visited_pages, known_pages[page]) && (typeof known_pages[page] != 'undefined')) {
            visited_pages.push(known_pages[page]);
            // sys.puts(known_pages[page] + ' marked as visited');
            sys.puts('Visited pages: ' + visited_pages.length);
            return known_pages[page];
        }
    }

    process.exit(); // End of list
}

var crawl_page = function (URL) {
    sys.puts('Visiting ' + URL);
    getPage(URL, function(code, text, headers) {

        sys.puts('Got ' + code + ' answer, headers is: ' + JSON.stringify(headers));
        var links = [];

        if (code == 200) {
            var content_type = get_content_type(headers);

            if (content_type == 'text/html' || content_type == 'text/plain' || content_type == '') {
                links = parsePage(text);
                save_page(URL, text, code);
            } else {
                sys.puts('Strange content type: ' + content-type);
            }

        } else if (code == 301 || code == 303) {

            // Return redirect location to known pages
            links = [headers.location];

        } else if (code == 404) {
            // Do nothing, maybe add some sort of log entry
        } else {
            sys.puts('Unknown code: ' + code + '\nHeaders is: ' + JSON.stringify(headers));
        }


        known_pages = unique(known_pages.concat(links));
        sys.puts('Known pages: ' + known_pages.length);
        crawl_page(get_next_page());
    });
}

var save_page = function (URL, text) {
    db.saveDoc({'url' : URL, 'text' : text});
}

crawl_page('/wiki/User_talk:Crazyswordsman/archive_8');