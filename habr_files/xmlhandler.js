var tm = (typeof(tm) != 'undefined') ? tm : {};
 
/**
 * Обработчик ответов от сервера
 * @author mdevils
 * @constructor
 */
tm.Handler = function(){
	
	this.handlers = {
		
		'redirect_url' : function(nodes, r, json) {
			for (var i=0; i<nodes.length; i++) {
			    if (!$('debug')) {
			        window.location.href = json ? nodes[i] : nodes[i].firstChild.data;
			    } else {
			        tm.log('redirect: ', json ? nodes[i] : nodes[i].firstChild.data);
			    }
				
			}
		},
		
		
		'redirect' : function(nodes, r, json) {
			for (var i=0; i<nodes.length; i++) {
			    if (!$('debug')) {
			        window.location.href = json ? nodes[i] : nodes[i].firstChild.data;
			    } else {
			        tm.log('redirect: ', json ? nodes[i] : nodes[i].firstChild.data);
			    }
			}
		},
		
		'html': function(nodes) {
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].getAttribute('for')) {
					var element = $(nodes[i].getAttribute('for'));
					if (element) {
						element.innerHTML = nodes[i].firstChild.data;
					}
				}
			}			
		},
		
		'remove': function(nodes) {
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].getAttribute('element')) {
					var element = $(nodes[i].getAttribute('element'));
					if (element) {
						element.parentNode.removeChild(element);
					}
				}
			}		
		},

		'show': function(nodes) {
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].getAttribute('element')) {
					var element = $(nodes[i].getAttribute('element'));
					if (element) {
						element.removeClass('hidden');
					}
				}
			}		
		},
				
		'hide': function(nodes) {
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].getAttribute('element')) {
					var element = $(nodes[i].getAttribute('element'));
					if (element) {
						element.addClass('hidden');
					}
				}
			}		
		},
		
		'setvalue': function(nodes) {
			for (var i=0; i<nodes.length; i++) {
				if (nodes[i].getAttribute('element')) {
					var element = $(nodes[i].getAttribute('element'));
					if (element) {
						element.set("value", nodes[i].getAttribute('value'));
					}
				}
			}		
		},

		'alert': function(nodes) {
			for (var i = 0; i < nodes.length; i++) {
				futu_alert(FAT.profile_header, nodes[i].firstChild.data, false, 'message');
			}
		}

	};
};

tm.Handler.prototype = {
		
	/**
	 * Расширение списка обработчиков
	 * @param {Object} object
	 */
	extend: function(object) {
		$extend(this.handlers, object);
	},

	/**
	 * 
	 * @param {Element} xmlObject
	 * @param {Object} thisObject
	 */
	process: function(response, thisObject) {
	    var json = !response.childNodes;

	    if (json) {
    		for (var tag in this.handlers) {
    		    if (response[tag]) {
    		        this.handlers[tag].call(
    		            thisObject,
		                response[tag].forEach ?
		                    response[tag] :
		                    [response[tag]],
		                response,
		                true
    		        );
    		    }
    		}
	    } else {
            for (var tag in this.handlers) {
    			var nodes = response.getElementsByTagName(tag);
    			if (nodes.length > 0) {
    				this.handlers[tag].call(thisObject, nodes, response);
    			}
    		}
	    }
	}
	
};

tm.Ajax = (typeof(tm.Ajax) != 'undefined') ? tm.Ajax : {};
tm.Ajax.Quick = {
	get: function(url, data ,options) {
		var ops = {
			'handler': new tm.Handler(),
			'failture': function(){
				futu_alert(FAT.profile_header, 'Ошибка передачи данных', false, 'message');
			},
			'thisObject': this,
			'after': null,
			'before': null
		};
		options && $extend(ops, options);
		var request = new Request({
			'method': 'get',
			'url': url,
			'onComplete': (function(responseText, responseXml){
				ops.before && ops.before();
				ops.handler.process(responseXml, ops.thisObject);
				ops.after && ops.after();
			}).bind(this),
			'onFailure': function(){
				ops.failture && ops.failture();
			}
		}).send();
	},
	
	post: function(url, data, options) {
		var ops = {
			'handler': new tm.Handler(),
			'failture': function(){
				futu_alert(FAT.profile_header, 'Ошибка передачи данных', false, 'message');
			},
			'thisObject': this,
			'after': null,
			'before': null
		};
		options && $extend(ops, options);
		var request = new Request({
			'method': 'post',
			'url': url,
			'data': data,
			'onComplete': (function(responseText, responseXml){
				ops.before && ops.before();
				ops.handler.process(responseXml, ops.thisObject);
				ops.after && ops.after();
			}).bind(this),
			'onFailure': function(){
				ops.failture && ops.failture();
			}
		}).send();
	}
};