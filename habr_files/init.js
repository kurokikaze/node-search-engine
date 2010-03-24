var tm = (typeof(tm) != 'undefined') ? tm : {};

document.id = $; // это чтобы Mootools More 1.2.3.1 работал с Mootools Core 1.2.0

/**
 * Интерфейс инициализации для всего на свете
 * @author bebopkid
*/

tm.init = {
	_initializations: [],
	_windowLoaded: false,
	forms: null,
	controls: null,
	add: function (f) {
		if (this._windowLoaded) {
			f.call(window);
		}
		else {
			this._initializations.push(f);
		};
	},
	_loaded: function () {
		this._windowLoaded = true;
		this._initializations.each( function (f) {
			f.call(window);
		});
	}
};

window.addEvent('domready', tm.init._loaded.bind(tm.init));

/**
 * Функция для логирования, которая не вызывает ошибок, если нет консоли
 * @author bebopkid
*/
tm.log = function () {
	if ((typeof(console) != 'undefined') && (typeof(console.log) == 'function')) {
	    //for (var i=0, l=arguments.length; i<l; i++) {
	        console.log(arguments);
	   // };
	} else if (window.opera && opera.postError) {
		opera.postError(arguments);
	};
};

tm.badTags = [
	'OBJECT',
	'PARAM',
	'EMBED',
	'NOEMBED'
];

tm.helpers = {
    /**
     * Возвращает целое число в удобном для человека виде - с пробелами
     * @author bebopkid
    */
    humanizeNumber: function (number) {
        if (!number) { return ''; }
        var s = number.toString();
        var r = '';
        for ( i = 0, l = s.length; i<l; i++) {
        	r = r + (((((l-i) % 3) == 0) && (i != 0)) ? ' ' : '') + s.charAt(i);
        };
        return r;
    },
	
	/**
	 * Возвращает дату и время в нормальном виде
	 * @author mdevils
	 */
	humanizeDate: function(timestamp, dateOnly){
		var today = new Date();
		var date = new Date(timestamp * 1000);
		var months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];;
		var result = "";
		if(today.getDate() != date.getDate() || today.getMonth() != date.getMonth() || today.getFullYear() != date.getFullYear())
			result = date.getDate() + " " + months[date.getMonth()];
		if(today.getFullYear() != date.getFullYear())
			result += " " + date.getFullYear();
		if(!dateOnly) {
			if (result) result += ", ";
			result += "в " + tm.helpers.addZero(date.getHours(), 2) + ":" + tm.helpers.addZero(date.getMinutes(), 2);
		}
		return result;
	},
	
	/**
	 * Добавляет нули перед числом до тех пор, пока оно не достигнет нужной длины
	 * @author mdevils
	 */
	addZero: function(number, len) {
		var s = number.toString();
		while (s.length < len) s='0'+s;
		return s;
	}
};

Element.implement({
    scrollToMe: function (_o) {
        var o = _o||{};
        
        var x = o.x||0,
            y = this.getPosition().y + (o.y||0);
        
        (temp.windowScroll || (temp.windowScroll = new Fx.Scroll( $(document.body) , { 'duration': 500, 'link': 'cancel' } ) ));
        
        temp.windowScroll[ o.now ? 'set' : 'start' ](0, this.getPosition().y);

        if (o && o.callback) {
            
            o.now ? o.callback() : temp.windowScroll.addEvent('complete', (function (callback) {
                this.removeEvent('complete', callback);
                callback();
            }).bind(temp.windowScroll, o.callback));
        }
        return this;
    }
});

tm.res = {};

tm.res._loadedCSS = [];
tm.res.loadCSS = function(url) {
	if (!tm.res._loadedCSS[url]) {
		var css = new Asset.css(url);
	}
	tm.res._loadedCSS[url] = true;
};

tm.res.loadIMG = function(url) {
	var img = new Asset.image(url);
};

function d() {
	var debugScript = new Asset.javascript('/js/tm/debug.js', {id: 'debugScript'});
	var consoleScript = new Asset.javascript('/js/tm/console.js', {id: 'consoleScript'});
}

tm.customEventManager = {
	addEvent: function(eventName, callback) {
		this._events || (this._events = []);
		this._events[eventName] || (this._events[eventName] = []);
		this._events[eventName].push(callback);
	},
	removeEvent: function(eventName, callback) {
		this._events || (this._events = []);
		this._events[eventName] || (this._events[eventName] = []);
		this._events[eventName].erase(callback);
	},
	fireEvent: function(eventName) {
		var args = [];
		for (var i=1;i<arguments.length;i++)
			args.push(arguments[i]);
		this._events || (this._events = []);
		this._events[eventName] || (this._events[eventName] = []);
		this._events[eventName].forEach(function(item){item.apply(this, args);});
		tm.log(args, eventName + ' (' + this._events[eventName].length + ')');
	}
};