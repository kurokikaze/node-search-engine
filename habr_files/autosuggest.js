var autosuggestClass = function(field, submitType, isMultiplySuggestionsOn, symbol) {

	field.setAttribute('autocomplete', 'off');
	
	if(isMultiplySuggestionsOn && !symbol) {
		this.isMultiplySuggestionsOn = isMultiplySuggestionsOn;
		this.symbol = [','];
	}
	else if (!isMultiplySuggestionsOn) {	
		this.isMultiplySuggestionsOn = false;
		this.symbol = '';
	}
	else if(isMultiplySuggestionsOn && symbol) {
		this.isMultiplySuggestionsOn = true;
		this.symbol = symbol;
	}
	if(!submitType) {
		var submitType = 'search';
	}
	
	var _this = this;
	this.position = 0;
	this.currValues = [];
	
	this.lastValue = '';
	this.newValue = '';
	
	this.params = {};
	
	this.ajaxUrl = '/ajax/suggest/';
	
	// Используемые в форме classNames
	this.classNames = {
		holder : 'js-autosuggest-holder', 	//родитель поля ввода и поля вывода результатов поиска
		field : 'js-autosuggest-field', 	//поле ввода
		output : 'js-autosuggest-output',	//родитель полей вывода реузльтатов
		isLoading : 'js-autosuggest-loading'	//прелоадер
	};
	
	// Имена xml нодов и соотвествующие им имена функций-обработчиков
	this.xmlResponse = {
		nodata: {
			node: 'nodata',
			handler: null
		},

		error: {
			node: 'error',
			handler: 'xmlResponseHandler_error'
		},

		item: {
			node: 'item',
			handler: 'xmlResponseHandler_output'
		}
	};
	
	
	// Выводимый html 
	this.htmlResponse = {
		item: 'div',
		value: 'em'
	};
	
	if (isOpera || window.webkit) {
		field.onkeypress = function(ev) {
			var targ = null;
			if (ev.target) targ = ev.target;
			else if (ev.srcElement) targ = ev.srcElement;
			if (targ.nodeType == 3) // defeat Safari bug
				targ = targ.parentNode;
			setTimeout(function(){ _this.onChange(targ, submitType); }, 30);
		}
	}
	
	field.onkeydown = function(ev){
		ev = ev || window.event;
		if (_this.isActionKey(ev)) {
			_this.onKeyUp(ev);
		}
	};
	
	field.onkeyup = function(ev){
		ev = ev || window.event;
		if (_this.isActionKey(ev)) return;
		if (!isOpera && !window.webkit) {
			var targ = null;
			if (ev.target) targ = ev.target;
			else if (ev.srcElement) targ = ev.srcElement;
			if (targ.nodeType == 3) // defeat Safari bug
				targ = targ.parentNode;
			setTimeout(function(){ _this.onChange(targ, submitType); }, 30);
		}
	};
	
};

// Переводим xml дерево в объект
autosuggestClass.prototype.parseXML = function(xmlObj){
		var xmlNodes = {};

		for (prop in this.xmlResponse){
			xmlNodes[prop] = xmlObj.getElementsByTagName(this.xmlResponse[prop].node);
		}
		return xmlNodes;
};

autosuggestClass.prototype.onKeyUp = function(ev) {
	ev = ev || window.event;
	return this.action(ev);
};

autosuggestClass.prototype.onChange = function(field, submitType) {
	if (!field.fakeChange) {
		this.processQuotes(field);
		this.requestSuggests(field, submitType);
	}
	
};

autosuggestClass.prototype.isActionKey = function(ev) {
	switch (getCharCode(ev)) {
		case 13: // Enter
		case 27: // Escape
		case 40: // Down
		case 38: // Up
			return true;
		break;
	}
}

autosuggestClass.prototype.action = function(ev) {
	switch (getCharCode(ev)) {
		case 13:	//если нажата клавиша Enter
			if(!$(this.output).hasClass('hidden')) {
				if (this.setValue()) {
					if (!document.all)
						ev.preventDefault();
					else
						ev.returnValue = false;
				}
			}
			return true;
			break;
		case 27: // Escape
			if (!$(this.output).hasClass('hidden')) {
				$(this.output).addClass('hidden');
			}
			return true;
			break;
		case 40:	//если нажата клавиша "Вниз"
			this.makeSteps('down');
			return true;
		break;
		case 38:	//если нажата клавиша "Вверх"
			this.makeSteps('up');
			return true;
		break;
	}
	return false;
}

autosuggestClass.prototype.processQuotes = function(field) {
	this.isQuoteOpened = false;
	this.isQuoteClosedPreviously = false;
	this.noIndexedString ='';
	if(field.value.indexOf('"') != -1) {
		var quotesResults = field.value.match(/"/g);
	}
	if(quotesResults && quotesResults.length%2==0) {
		this.isQuoteOpened = false;
		if(field.value.match(/"$|"\n|"\r\n/)) {
			this.isQuoteClosedPreviously = true;
		}
		else {
			this.isQuoteClosedPreviously = false;
		}
	}
	else if (quotesResults && quotesResults.length%2!=0) { this.isQuoteOpened = true; }
	
	if (this.isMultiplySuggestionsOn == true) { //если включена опция множественных подсказок 
		if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) { //если открыта кавычка
			var words_quotes = field.value.split('"');
			this.isQuoteClosedPreviously == true? this.newValue = words_quotes[words_quotes.length-2] : this.newValue = words_quotes[words_quotes.length-1]
			this.newValue = this.newValue.replace(/(^\s+)|(\n)/g, '');
			var words = field.value.split(this.symbol);
			var words_length=words.length-1;
			for(var k=0; k<words_length; k++) {
				if(k==0) {
					this.noIndexedString += words[k];
				}
				else {
					this.noIndexedString += this.symbol + words[k];
				}
			}
		} else {
			var words = field.value.split(this.symbol);
			this.newValue = words[words.length-1].replace(/(^\s+)|(\n)/g, '');
			var words_length=words.length-1;
			for(var k=0; k<words_length; k++) {
				if(k==0) {
					this.noIndexedString += words[k];
				}
				else {
					this.noIndexedString += this.symbol + words[k];
				}
			}
		}
	}
	else {
		if(this.isQuoteOpened == true) {
			var words_quotes = field.value.split('"');
			this.newValue = words_quotes[words_quotes.length-1].replace(/(^\s+)|(\n)/g, '');
		}
		else {
			this.newValue = field.value;
		}
	}
}

autosuggestClass.prototype.requestSuggests = function(field, submitType) {
			this.holder = this.holder || $(field).getParent('.' + this.classNames.holder);
			this.output = this.output || $(this.holder).getElement('.' + this.classNames.output);
			if (this.newValue == '') {
				$(this.output).addClass('hidden');
				this.output.innerHTML ='';
				this.lastValue = this.newValue;
				return false;
			}
			else {
				$(this.output).removeClass('hidden');
			}
			if ($(this.holder).hasClass(this.classNames.isLoading) || this.lastValue == this.newValue) {
				return false;
			}
			var data = 'letters=' + this.newValue + '&type=' + submitType;
			this.params = {
				holder : this.holder,
				field : field,
				string : this.newValue,
				output : this.output,
				noIndexedString : this.noIndexedString
			};
			ajaxLoadPost(this.ajaxUrl, data, this.sendDataOnload, this, this.params);
			$(this.holder).addClass(this.classNames.isLoading);
			this.lastValue = this.newValue;
}

// Чтение ответа сервера на пересылку  всех данных формы и обработка выданных ошибок
autosuggestClass.prototype.sendDataOnload = function(ajaxObj, params) {
	$(params.holder).removeClass(this.classNames.isLoading);
	if(ajaxObj && ajaxObj.responseXML){
		var xmlObj = ajaxObj.responseXML;
		var xmlNodes = this.parseXML(xmlObj);

		for (prop in xmlNodes){
			if(this[this.xmlResponse[prop].handler]) {
				this[this.xmlResponse[prop].handler](xmlNodes, params);
			}
		}
	}
};

// Вывод данных
autosuggestClass.prototype.xmlResponseHandler_output = function(xmlNodes, params) {
	var _this = this;
	$(params.output).removeClass('hidden');
	this.position = 0;
	this.params.output.innerHTML = '';
	if(xmlNodes.item && xmlNodes.item.length) {
		for(var i=0; i<xmlNodes.item.length; i++) {
			var item = document.createElement(this.htmlResponse.item);
			var html = xmlNodes.item[i].firstChild.data;
			this.currValues[i] = xmlNodes.item[i].firstChild.data;
			var searchString = new RegExp('(' + params.string + ')', 'gi');
			var replaceString = '<' +this.htmlResponse.value + '>' + '$1' + '</' + this.htmlResponse.value + '>';
			var html = html.replace(searchString, replaceString);
			params.output.appendChild(item);
			item.innerHTML = html;
		}

		params.field.onfocus = function() {
			$(params.output).removeClass('hidden');
		}	
		
		params.field.onblur = function(ev) {

			if(!ev) { ev = window.event; }

			var targ;
				if (!ev) var ev = window.event;
				if (ev.target) targ = ev.target;
				else if (ev.srcElement) targ = ev.srcElement;
				if (targ.nodeType == 3) // defeat Safari bug
					targ = targ.parentNode;
			
			if(targ!=params.field && targ.parentNode!=params.output) {
				$(params.output).addClass('hidden');
			}
		}
		
		document.addEvent('click', function (e) {
		    var t = e.target;
		    if (t!=params.field && t!=params.output) {
		        $(params.output).addClass('hidden');
		    }
		});

		this.mouseHandler();
	}
};

// устанавливаем значение
autosuggestClass.prototype.setValue = function() {
	var result = false;
	if(this.params.output && this.params.output.getElementsByTagName(this.htmlResponse.item)[0]) {
		var result_items = this.params.output.getElementsByTagName(this.htmlResponse.item);
		var result_items_length = result_items.length;
		for (var i=0; i<result_items.length; i++) {
			if(result_items[i].className == 'active') {
				if(this.isMultiplySuggestionsOn == true) {
					if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
						var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position-1]);
						if(this.params.noIndexedString!='') {
							this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + '"' + replacedValue;
							if(this.isQuoteClosedPreviously == true) {
								this.params.field.value += '"';
								result = true;
							}
						}
						else {
							this.params.field.value = '"' + replacedValue;
							result = true;
							if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
						}
					}
					else {
						var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position-1]);
						if(this.params.noIndexedString!='') {
							this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + replacedValue;
							result = true;
						}
						else {
							this.params.field.value = replacedValue;
							result = true;
						}
					}
				}
				else {
					if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
						
						this.params.field.value = '"' + this.currValues[this.position-1];
						result = true;
					}
					else {
						this.params.field.value = this.currValues[this.position-1];
						result = true;
					}
				}
				
				$(this.params.output).addClass('hidden');
				
				this.params.output.innerHTML = '';
				
				if(this.params.field.value && this.params.field.value.match(/\r\n$/)) {
					this.params.field.value = this.params.field.value.replace(/\r\n$/, '');
				}
				
				else {
					this.params.field = this.currValues[i];
					$(this.params.output).addClass('hidden');
					this.params.output.innerHTML = '';
				}
			}
		}
	}
	return result;
};

// навигация по результатам запроса с помощью клавиатуры
autosuggestClass.prototype.makeSteps = function(direction) {
	_this = this
	if(this.params.output.getElementsByTagName(this.htmlResponse.item)[0]) {
		this.params.field.fakeChange = true;
		
		var result_items = this.params.output.getElementsByTagName(this.htmlResponse.item);
		var result_items_length = result_items.length;
		for (var i=0; i<result_items.length; i++) {
			result_items[i].className = '';
		}
		this.spacer = '';
		this.symbol == ',' ? this.spacer = ' ' : this.spacer = '';
		if(direction == 'down' && this.position<=result_items_length-1) {
			result_items[this.position].className = 'active';
			if(this.isMultiplySuggestionsOn == true) {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
					else {
						this.params.field.value = '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
				}
				else {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + replacedValue;
					}
					else {
						this.params.field.value = replacedValue;
					}
				}
			}
			else {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					this.params.field.value = '"' + this.currValues[this.position];
					if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
				}
				else {
					this.params.field.value = this.currValues[this.position];
				}
			}
			this.position++;
		}
		else if(direction == 'up' && this.position>1) {
			result_items[this.position-2].className = 'active';
			if(this.isMultiplySuggestionsOn == true) {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position-2]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
					else {
						this.params.field.value = '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
				}
				else {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position-2]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + replacedValue;
					}
					else {
						this.params.field.value = replacedValue;
					}
				}
			}
			else {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					this.params.field.value = '"' + this.currValues[this.position-2];
					if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
				}
				else {
					this.params.field.value = this.currValues[this.position-2];
				}
			}
			this.position--;
		}
		else if (this.position>result_items_length-1) {
			this.position=0;
			result_items[this.position].className = 'active';
			if(this.isMultiplySuggestionsOn == true) {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
					else {
						this.params.field.value = '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
				}
				else {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + replacedValue;
					}
					else {
						this.params.field.value = replacedValue;
					}
				}
			}
			else {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					this.params.field.value = '"' + this.currValues[this.position];
					if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
				}
				else {
					this.params.field.value = this.currValues[this.position];
				}
			}
			this.position++;
		}
		else if(direction == 'up' && this.position<=1) {
			this.position=result_items_length-1;
			result_items[this.position].className = 'active';
			if(this.isMultiplySuggestionsOn == true) {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
					else {
						this.params.field.value = '"' + replacedValue;
						if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
					}
				}
				else {
					var replacedValue = this.params.string.replace(this.params.string, this.currValues[this.position]);
					if(this.params.noIndexedString!='') {
						this.params.field.value = this.params.noIndexedString + this.symbol + this.spacer + replacedValue;
					}
					else {
						this.params.field.value = replacedValue;
					}
				}
			}
			else {
				if(this.isQuoteOpened == true || this.isQuoteClosedPreviously == true) {
					this.params.field.value = '"' + this.currValues[this.position];
					if(this.isQuoteClosedPreviously == true) { this.params.field.value += '"'; }
				}
				else {
					this.params.field.value = this.currValues[this.position];
				}
			}
			this.position++;
		}
		setTimeout(function(){
			_this.params.field.fakeChange = false;
		},50)
		
		
	}
};

//навигация по результатам запроса с помощью мышки
autosuggestClass.prototype.mouseHandler = function() {
	var _this = this;
	var items = this.params.output.getElementsByTagName(this.htmlResponse.item);
	var items_length = items.length;
	



	for (var i=0; i<items_length; i++) {
		items[i].onmouseover = function(i_) {
			return function () {
				for (var k=0; k<items_length; k++) {
					items[k].className = '';
				}
				this.className = 'active';
				_this.position = i_+1;
			}
		}(i);
		items[i].onmouseout = function() {
			this.className = '';
			/* _this.position = 0; */
		}
		items[i].onclick = function(i_) {
			return function() {
				var holder = $(this).getParent('.' + _this.classNames.holder);
				var field = $(holder).getElement('.' + _this.classNames.field);
				if(_this.isMultiplySuggestionsOn == true) {
					if(_this.isQuoteOpened == true) {
						var replacedValue = _this.params.string.replace(_this.params.string, _this.currValues[i_]);
						_this.spacer ='';
						_this.symbol == ',' ? _this.spacer = ' ' : _this.spacer = '';
						if(_this.params.noIndexedString!='') {
							_this.params.field.value = _this.params.noIndexedString + _this.symbol + _this.spacer + '"' + replacedValue;
						}
						else {
							_this.params.field.value = '"' + replacedValue;
						}
					}
					else {
						var replacedValue = _this.params.string.replace(_this.params.string, _this.currValues[i_]);
						_this.spacer ='';
						_this.symbol == ',' ? _this.spacer = ' ' : _this.spacer = '';
						if(_this.params.noIndexedString!='') {
							_this.params.field.value = _this.params.noIndexedString + _this.symbol + _this.spacer + replacedValue;
						}
						else {
							_this.params.field.value = replacedValue;
						}
					}
					$(_this.params.output).addClass('hidden');
				}
				else {
					if(_this.isQuoteOpened == true) {
						field.value = '"' + _this.currValues[i_];
					}
					else {
						field.value = _this.currValues[i_];
					}
				}
					
				$(_this.params.output).addClass('hidden');
				
				_this.params.output.innerHTML = '';
				
				field.focus();
			}
		}(i);
	}
};



window.addEvent('load', function() {
	if ($('topic-tags')) {
		var Autosuggest01 = new autosuggestClass($('topic-tags'), 'tags', true, ',');
	}
	if ($('search')) {
		var Autosuggest02 = new autosuggestClass($('search'), 'search', false, '');
	}
/*	if ($('to')) {
		var Autosuggest03 = new autosuggestClass($('to'), 'user', true, ',');
	}*/
	if ($('tag-search-field')) {
		var Autosuggest04 = new autosuggestClass($('tag-search-field'), 'tags', false, '');
	}
	if ($('main-search-field')) {
		var Autosuggest05 = new autosuggestClass($('main-search-field'), 'search', false, '');
	}
	if ($('favourites_add_tags')) {
	    var Autosuggest06 = new autosuggestClass($('favourites_add_tags'), 'tags', true, ',');
	}
});
