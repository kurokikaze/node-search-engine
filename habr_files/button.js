tm.Controls.button = new Class({
	Extends: tm.Controls.base,
	initialize: function(element) {
		this._element = $(element);
		/*
		 * url
		 * def
		 */
		var o={};
		
		if (element.get("rel")) {
			this._params = eval('o=' + element.get("rel"));
			
		}
		this._element.addEvent('click', this.click.bind(this));
		this._handler = new tm.Handler();
		
		if (this._params.def.quick_vote) {
			this._handler.extend({
				"score": function(nodes){
					var newUserscore, minusMark = "";
					for (var i=0; i < nodes.length; i++) {
						if (nodes[i].tagName == "score"){
							newUserscore = nodes[i].firstChild.data;
							var parsedNewUserscore = newUserscore + "";//converts NodeList to string
							if (parsedNewUserscore.charAt(0) == "–") { minusMark = " class='minus'"};
						}
					};
					element.parentNode.set("html","<span"+minusMark+">"+ newUserscore +"</span>");
				},
				"error": function(nodes){
					var errortext = "";
					for (var i=0; i < nodes.length; i++) {
						if (nodes[i].tagName == "error"){
							errortext += nodes[i].firstChild.data + "</br>";
						}
					};
					futu_alert("Ой-ой-ой с колбасой!", errortext, false, 'error');
				}
			})
		}
	},
	click: function(e) {
		e.stop();
		var url = this._params.url;
		var params = $merge(this._params.def);
		var request = new Request({
			'method': 'post',
			'url': url,
			'data': params,
			'onComplete': (function(responseText, responseXml){
				this._handler.process(responseXml, this);
			}).bind(this)
		}).send();
	}
});