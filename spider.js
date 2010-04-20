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

    return parsed;
};

var getLinks = function(parsed_html, baseURL) {

    var links = parsed_html.find('//a');
    var destinations = [];
    for (link in links) {
        var attr = links[link].attr('href');
        if (attr && attr.value) {
            var url_parts = url.parse(url.resolve(baseURL, attr.value()));

            if (!url_parts.hostname || url_parts.hostname.indexOf(settings.targethost) > -1) {
                destinations.push(url_parts.pathname + url_parts.search);
            } else {
                // sys.puts('Found outbound link to ' + url_parts.hostname);
            }

        }
    }

    return destinations;
}

var getPage = function(URL, connection, callback) {

    var request = connection.request("GET", URL, {"host": settings.targethost});

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

    return title.text();
}

var known_pages = [];

var visited_pages = [];

var num_of_streams = 0;

var get_next_page = function() {
    for (page in known_pages) {
        if (known_pages[page] && !indexInArray(visited_pages, known_pages[page]) && (typeof known_pages[page] != 'undefined')) {
            visited_pages.push(known_pages[page]);
            // sys.puts(known_pages[page] + ' marked as visited');
            // sys.puts('Visited pages: ' + visited_pages.length);
            return known_pages[page];
        }
    }

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
                parsed_page = parsePage(text);

                if (parsed_page.find) {

                    links = getLinks(parsed_page, URL);

                    save_page(URL, pageTitle(parsed_page), cleanPage(parsed_page));
                } else {
                    sys.puts('Bad parsed page: ' + URL);
                }
            } else {
                sys.puts('Strange content type: ' + content-type);
            }

        } else if (code == 301 || code == 303) {

            // Return redirect location to known pages
            links = [headers.location];

        } else if (code == 404) {
            // Do nothing, maybe add some sort of log entry
        } else if (code == 400) {
            sys.puts('Bad request: ' + URL);
        } else {
            sys.puts('Unknown code: ' + code + '\nHeaders is: ' + JSON.stringify(headers));
        }


        known_pages = unique(known_pages.concat(links));
        sys.puts('Known pages: ' + known_pages.length);
        setTimeout(function() {
            crawl_page(get_next_page(), connection, stream_id);
        }, settings.crawl_timeout);

        // Create new stream if available and have unvisited pages
        if (num_of_streams < settings.max_streams && known_pages.length > visited_pages.length) {
            num_of_streams++;
            var new_connection = http.createClient(80, settings.targethost);
            crawl_page(get_next_page(), new_connection, num_of_streams);
            sys.puts('Starting another stream: ' + num_of_streams + ' of ' + settings.max_streams);
        }
    });
}

var doc_id = 0;
var save_page = function (URL, title, text) {

    db.saveDoc({'url' : URL, 'title' : title, 'text' : text, 'doc_id': doc_id});

    doc_id++;
}

crawl_page('/', target_site, 1);

num_of_streams = 1;