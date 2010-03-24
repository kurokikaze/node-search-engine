var tm = (typeof(tm) != 'undefined') ? tm : {};
tm.Controls = (typeof(tm.Controls) != 'undefined') ? tm.Controls : {};

tm.Controls.attachElements = function(parent) {
	$(parent).getElements('*').forEach(
		function (field) {
		    if (field && !tm.badTags.contains(field.tagName) && ( ((field.className.indexOf("tm-control") != -1) && field.getAttribute('rev')) || field.getAttribute('control') )) {
				var cname = field.getAttribute('rev');
				if (!cname) {
					cname = field.getAttribute('control');
				}
				if (tm.Controls[cname]) {
					var cl = tm.Controls[cname];
					var control = new cl(field);
				} else {
					tm.Controls.load(cname, function(){
						if (arguments.callee.done) return;
						var cl = tm.Controls[cname];
						var control = new cl(field);
						arguments.callee.done = true;
					});
				}
			};
	}, this);
}

tm.Controls._waitingForLoad = {};

tm.Controls.load = function(name, complete) {
	var sitebase = ""
	if (temp.base_short) {sitebase = "http://" + temp.base_short}
	if (tm.Controls[name]) {
		complete();
	} else {
		if (tm.Controls._waitingForLoad[name]) {
			tm.Controls._waitingForLoad[name].push(complete);
			
		} else {
			tm.Controls._waitingForLoad[name] = [complete];
			var url = sitebase + '/js/tm/controls/' + name + '.js';
			var myScript = new Asset.javascript(url, {
				onload: (function(){
					for (var i=0;i<tm.Controls._waitingForLoad[name].length;i++) {
						tm.Controls._waitingForLoad[name][i]();
					}
				})
			});
		}
	}
};

tm.Controls.base = Class({
	
	initialize: function(element, options) {
		$extend(this, options);
		this._element = $(element);
	},
	
	getForm: function() {
		var formTag = this._element.getParent('form');
		return formTag && formTag.attached;
	}
	
});


tm.init.add(function(){

	tm.Controls.attachElements(document);

});