var spider = require('./spider');
var sys = require('sys');

var crawler = spider.create('habrahabr.ru', 2);

crawler.addpage('/people/')
for (i=2; i<=12; i++) {
	crawler.addpage('/people/page' + i + '/');
}

crawler.on('page', function(page) {
	var html = crawler.parse(page);
	sys.puts('Title: ' + crawler.title(html));
	var users = fetch_users(html);
});

crawler.on('end', function() {
	sys.puts('Task ended');
});

crawler.on('error', function(err) {
	sys.puts('ERROR: ' . err.message);
});

crawler.run();
// http://habrahabr.ru/people/page1187/

fetch_users = function(html) {
	var user_urls = [];

    sys.puts('Getting users table');
    var usertable = html.find("//div[@id='rate-table-wrap']/table");
    sys.puts('Got users table');
    if (usertable[0].find) {
		sys.puts('Getting user rows');
		var users = usertable[0].find('tr');
		sys.puts('Got user rows');

		for (user in users) {
			if (users[user].find && (users[user].find('td').length > 0)) {

				var profile_dl = users[user].find('td')[2].find('dl')[0];
				var karma = users[user].find('td')[3].text();
				var rating = users[user].find('td')[4].text();
				if (profile_dl.find) {
					var profile_link = profile_dl.find('dt')[0].find('a')[0].attr('href');
					var profile_name = profile_dl.find('dt')[0].find('a')[0].text()

					// save_user(profile_link, profile_name, karma, rating);
					user_urls.push(profile_link);
				} else {
					profile_link = 'none';
				}

				sys.puts('User URL: ' + profile_link);
			} else {
				sys.puts('Broken user');
			}
		} 

    }
	return user_urls;
}