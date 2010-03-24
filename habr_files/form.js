var tm = (typeof(tm) != 'undefined') ? tm : {};

tm.Forms = (typeof(tm.Forms) != 'undefined') ? tm.Forms : {};

tm.Forms._waitingForLoad = {};

tm.Forms.load = function(name, complete) {
	if (tm.Forms[name]) {
		complete();
	} else {
		if (tm.Forms._waitingForLoad[name]) {
			tm.Forms._waitingForLoad[name].push(complete);
		} else {
			tm.Forms._waitingForLoad[name] = [complete];
			var url = '/js/tm/forms/' + name + '.js';
			var myScript = new Asset.javascript(url, {
				onload: (function(){
					for (var i=0;i<tm.Forms._waitingForLoad[name].length;i++)
						tm.Forms._waitingForLoad[name][i]();
				})
			});
		}
	}
};

/**
 * Класс автоматизации Ajax для форм
 * @author mdevils
 */
tm.Form = Class({
	
	addEvent: function(name, callback) {
		this._form.addEvent(name, callback);
	},
	
	fireEvent: function(name) {
		this._form.fireEvent(name);
	},
	
	submitCanceled: false,
	
	initialize: function(form) {
		var self = this;
		
		this._form = $(form);
		this._form.attached = this;
		this._validator = new tm.Validator();
		
		this.resetValidation();

		this.ajax = false;
		if (this._form.hasClass('ajax')) {
			this.enableAjax();
		}
		
		if (this._form.hasClass('iframe-ajax')) {
		    this.iframeAjax = true;
		}
		
		var onSubmitFunction = function(event){
    		if ($(event.target).hasClass('loading')) {
    			event.stop();
    			return false;
    		}
    		var o = null;
    		if (self.submit(event.target.name, event.target.get("rel") && (eval('o=' + event.target.get("rel")))))
    			event.stop();
    	}
		
		for (var i=0; i<form.elements.length; i++) {
			if (this._form.elements[i].type == 'submit') {
				$(this._form.elements[i]).addEvent('click', onSubmitFunction);
			}
		}
		
		form.addEvent('submit', onSubmitFunction);
		
		
		var extender = this._form.getElement("a.form-extender"), 
		exts;
		
		if (extender) {
			exts = $(extender).getAttribute("rev");
		};
		 
		if (!exts) { exts = this._form.getAttribute("extend");}
		if (exts) {
			var extendings = exts.split(',');
			for (var i=0;i<extendings.length;i++) {
				var exname = extendings[i];
				if (tm.Forms[exname]) {
					tm.Forms[exname].call(this);
				} else {
					(function(nm){
						tm.Forms.load(nm, (function(){
							if (tm.Forms[nm])
								tm.Forms[nm].call(this);
						}).bind(this));
					}).bind(this)(exname);
				}
			}
		}
	},

	resetValidation: function() {
		this._validator.clear();
		this._validator.addElements(this._form);
		this._form.getElements('.no-validate').forEach((function(item){
			this._validator.removeElements(item);
		}).bind(this));
	},

	errorDescriptions: {
		'required': 'Следует заполнить поле',
		'minlen': 'Текст слишком короткий',
		'maxlen': 'Текст слишком длинный',
		'login': 'Неверно указан логин',
		'email': 'Неверно указан адрес электронной почты',
		'radioRequired': 'Следует заполнить поле'
	},
	
	/**
	 * Валидация всей формы и вывод ошибок рядом с полями
	 */
	validate: function() {
		
		var invalidFields = this._form.getElements('.invalid').forEach(function(dl){
			dl.removeClass('invalid');
		});
		this.showUnknownError('');
		
		var errors = this._validator.validate();
		if (errors.length > 0) {
			for (var i=0; i<errors.length; i++) {
				var fieldHolder = $(errors[i].element).getParent('dl');
				var errorFieldHolder = fieldHolder.getElement('.error');
				var errorField = errorFieldHolder.getElement('span');
				var errorList = errorFieldHolder.getElement('ul');
				
				var errorText = this.errorDescriptions[errors[i].errorType];
				
				if (errorList) {
					var errorLi = errorList.getElement('.' + errors[i].errorType);
					if (errorLi) {
						errorText = errorLi.get('html');
					}
				}
				
				this.showError(errors[i].element, errorText);

			}
			return false;
		} else {
			return true;
		}
		
	},
	
	/**
	 * Показ сообщения об ошибке
	 * @param {Element} element
	 * @param {String} text
	 */
	showError: function(element, text) {

		var fieldHolder = $(element).getParent('dl');
		if (!fieldHolder) { this.showUnknownError(text); return; }
		var errorFieldHolder = fieldHolder.getElement('.error');
		if (!errorFieldHolder) { this.showUnknownError(text); return; }
		var errorField = errorFieldHolder.getElement('span');
		if (!errorField) { this.showUnknownError(text); return; }
		errorField.set('html', text);
		fieldHolder.addClass('invalid');

	},
	
	/**
	 * Показ неизвестной ошибки
	 * @param {Object} text
	 */
	showUnknownError: function(text) {
		
		var element = this._form.getElement('.unknown-error');
		if (element) {
			element.innerHTML = text;
		}
		
	},

	/**
	 * Инициация валидации и отправки формы
	 * @param {String} action
	 */
	submit: function(action, params) {
		params && params.resetValidation && this.resetValidation();
		
		if(action) {
		    var input = this._form.getElement('input[name=action]');
		    if (input) {
		        input.value = action;
		    }
		}
		
		if (this.validate())
			if (this.ajax) {
				this.submitCanceled = false;
				this.fireEvent("tm:before-send");
				if (!this.submitCanceled) {
					this.sendAjax(action, params);
					this.fireEvent("tm:after-send");
				} else
					return false;
			}
			else 
				return false;
		return true;
	},
	
	setLoading: function(l) {
		if (l) {
			this.fireEvent('form:disabled');
			for (var i=0;i<this._form.elements.length;i++) {
				if (this._form.elements[i].type == 'submit') {
					$(this._form.elements[i]).addClass('loading');
					$(this._form.elements[i]).disabled = true;
				}
			}
		} else {
			this.fireEvent('form:enabled');
			for (var i=0;i<this._form.elements.length;i++) {
				if (this._form.elements[i].type == 'submit') {
					$(this._form.elements[i]).removeClass('loading');
					$(this._form.elements[i]).disabled = false;
				}
			}
		}
	},
	
	/**
	 * Отправки формы через Ajax
	 * @param {String} action
	 */
	sendAjax: function(action, params) {	
		this.setLoading(true);

		var self = this,
		    onSuccess = function (responseText, responseXML) {
		    self._handler.process(responseXML||responseText, self);
		},
		    onComplete = function () {
		    self.setLoading(false);
		}
		
		if (this.iframeAjax) {
		    tm.sendFormViaIframe({
		        'form': this._form,
		        'onSuccess': onSuccess,
		        'onComplete': onComplete
		    });
		} else {
		    var extendData = {};
    		extendData[action] = 'true';
    		var data = this.toObject(extendData);

    		if (this._form.getAttributeNode) {
    			var xurl = this._form.getAttributeNode('action').value;
    		} else {
    			var xurl = this._form.get('action'); 
    		}

    		params && params.url && (xurl = params.url);

    		var request = new Request({
    			'method': 'post',
    			'url': xurl,
    			'data': data,
    			'onSuccess': onSuccess,
    			'onComplete': onComplete
    		}).send();
		}
	},
	
	/**
	 * Запись данных формы в объект
	 * @param {Object} extend
	 */
	toObject: function(extend) {
		var result = {};

		var elements = this._form.elements;
		for (var i=0, length=elements.length; i<length; i++) {
			
			var element = $(elements[i]);
			
			if (element.getParent('.no-send')) continue;

			var type  = element.getAttribute('type');
			var param = element.getAttribute('name');
			var value = element.value;
			
			if (param) {
			
				if (type == 'radio' && !element.checked) {
					continue;
				}
				
				if (type == 'checkbox') {
					if (!element.checked) 
						continue;
					else {
						result[param] = value=='on' || !value ? 'true' : value;
						continue;
					}
				}
				
				if (type == 'submit' || type == 'reset') {
					continue;
				}
				
				result[param] = value;
			}
		}

		if (extend)
			$extend(result, extend);

		return result;

	},
	
	/**
	 * Включает поддержку Ajax для формы
	 */
	enableAjax: function() {
		
		if (!this._handler) {
			this._handler = new tm.Handler();
			this._handler.extend({
				'error': function(nodes, json) {
					
					for (var i=0; i<nodes.length; i++) {
						var node = nodes[i];
						if (node.getAttribute("field")) {
							for (var e=0; e<this._form.elements.length; e++) {
								var item = this._form.elements[e];
								if ($(item).get("name") == node.getAttribute("field")) {
									this.showError(item, node.firstChild.data);									
								}
							}
						} else {
							if (this._form.getElement('.unknown-error')) {
								this.showUnknownError(node.firstChild.data);
							} else {
								futu_alert(FAT.votings_header, node.firstChild.data, true, 'error');
							}
						}
					}
				}
			});
		}
		
		this.ajax = true;
		
	},

	/**
	 * Выключает поддержку Ajax для формы
	 */
	disableAjax: function() {

		this.ajax = false;

	}

});

/**
 * Присоединение нашей формы ко всем нужным формам
 * в документе.
 */
tm.Form.attach = function() {
	
	for (var i=0; i<document.forms.length; i++) {
		var form = $(document.forms[i]);
		if (!form.attached) {
			if (form.hasClass("tm-form")) {
				var tmForm = new tm.Form(document.forms[i]);
				// ...
			}
		}
	}

};

tm.init.add(function(){
	
	tm.Form.attach();
	
});