var tm = (typeof(tm) != 'undefined') ? tm : {};

/**
 * Класс проверки значений полей во всяких формах
 * @param Форма, которую нужно проверять
 * @author bebopkid, mdevils
 */
tm.Validator = Class({

	initialize: function () {
		/**
		 * Список элементов для валидации
		 */
		this._elements = [];
	},

	/**
	 * Непосредственно функции для валидации значений, им передается три параметра
	 * @param {String} строка для валидации
	 * @param {Object} произвольный параметр
	 * @param {Element} поле, которое мы валидируем
	 */
	handlers: {
		required: function(value) {
			return value && ((value.length > 0) ? true : false);
		},
		minlen: function(value, minLength) {
			return value && ((value.length >= minLength) ? true : false);
		},
		maxlen: function(value, maxLength) {
			return value && ((value.length <= maxLength) ? true : false);
		},
		login: function(value) {
			return value && /^[a-zA-Z0-9\-_]*$/.test(value);
		},
		email: function(value) {
			return value && /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value);
		},
		radioRequired: function (value) {
		    var ok=false;
		    if (typeof(value) == 'object') {
		        for(var i in value) {
		            ok=true;
		            break;
		        }
		    }
		    
		    return ok;
		},
		habracutme: function(value){
			if (arguments.callee.done || (value.length < 1700) || (value.indexOf('\<habracut') != -1)) {
				return true
			} else {
				arguments.callee.done = true;
				return false
			};
		}
	},
	
	/**
	 * Очищает состояние валидатора
	 */
	clear: function() {
		this._elements.forEach(function(item){
			item.element._validator = false; 
		});
		this._elements = [];
	},
	
	/**
	 * Добавляет элементы для будущей валидации
	 * @param {Element} parent
	 */
	addElements: function(parent) {
		tm.getElementsForValidation(parent).forEach(function(field){
			this._addElement(field);
		}, this);
	},
	
	/**
	 * Деактивирует элементы из будущей валидации
	 * @param {Element} parent
	 */
	disableElements: function(parent) {
		tm.getElementsForValidation(parent).forEach(function(field){
			field._validationEnabled = false;
		}, this);
	},

	/**
	 * Деактивирует элементы из будущей валидации
	 * @param {Element} parent
	 */
	enableElements: function(parent) {
		tm.getElementsForValidation(parent).forEach(function(field){
			field._validationEnabled = true;
		}, this);
	},

	/**
	 * Добавляет элементы для будущей валидации
	 * @param {Element} parent
	 */
	removeElements: function(parent) {
		tm.getElementsForValidation(parent).forEach(function(field){
			this._removeElement(field);
		}, this);
	},

	/**
	 * Добавляет элемент для будущей валидации
	 * @param {Element} element
	 */
	_addElement: function(element) {
		if (!element._validator) {
			element._validator = this;
			element._validationEnabled = true;
			this._elements.push(this._getElementObject(element));
		}
	},

	/**
	 * Парсит информацию об элементе и возвращает объект элемента
	 * @param {Element} element
	 */
	_getElementObject: function(element) {
		var validationStringBits = element.get('validate').split(' '); 
		var elementObject = {
			'element': element,
			'validations': []
		};
		for (var i=0; i<validationStringBits.length; i++) {
			var validationExpression = validationStringBits[i];
			var colon = validationExpression.indexOf(':');
			var param = null;
			if (colon != -1) {
				var handler = validationExpression.substr(0, colon);
				param = validationExpression.substr(colon+1);
			} else {
				var handler = validationExpression;
			}
			elementObject.validations.push({
				'handler': handler,
				'param': param
			});
		}
		return elementObject;
	},

	/**
	 * Удаляет элементы из валидации
	 * @param {Element} element
	 */
	_removeElement: function(element) {
		for (var i=0; i<this._elements.length; i++) {
			if (this._elements[i].element == element) {
				element._validator = false;
				this._elements.splice(i, 1);
				return;
			}
		}
	},

	/**
	 * Возвращает значение элемента
	 * @param {Element} element
	 */
	_getValue: function(element) {
		switch ($(element).get('tag')) {
			case 'input':
				switch (element.get("type")) {
					case 'text':
					case 'password':
					case 'file':
						return element.value;
					case 'checkbox':
					case 'radio':
						return element.get("checked") ? element.value : null;
					
				}
				break;
			case 'textarea':
				return element.value;
			case 'select':
				return element.get("value");
			case 'fieldset':
                var fields = element.getElements('input,select,textarea,fieldset');
    		    var ret = {};
    			for (var i = 0, l = fields.length; i<l; i++) {
    			    var field = fields[i];
    			    var name = field.name;
    			    var value = this._getValue(field);
    			    if(typeof(value) !== 'undefined' && value !== null) {
    			        !ret[name] ?
    			            ret[name] = value :
    			            ret[name].forEach ?
    			                ret[name].push(value) :
    			                (ret[name] = [ ret[name], value ]);
    			    }
    			}
    			return ret;
				break;
		}
	},

	/**
	 * Производит валидацию объекта валидации
	 * @param {Object} element
	 */
	_validateElementObject: function(elementObject) {
		var element = elementObject.element;
		var value = this._getValue(element);
		for (var i=0; i<elementObject.validations.length; i++) {
			if (elementObject.element._validationEnabled) {
				var handler = elementObject.validations[i].handler;
				var param = elementObject.validations[i].param;
				if (!this.handlers[handler](value, param)) 
					return handler;
			}
		}
		return false;
	},

	/**
	 * Производит валидацию объекта валидации
	 * @param {Element} element
	 */
	validateElement: function(element) {
		return _validateElementObject(this._getElementObject(element));
	},

	/**
	 * Производит валидацию всех объектов
	 */
	validate: function() {
		var result = [];
		for (var i=0; i<this._elements.length; i++) {
			var error = this._validateElementObject(this._elements[i]);
			if (error) {
				result.push({
					'element': this._elements[i].element,
					'errorType': error
				});
			}
		}
		return result;
	}
});

tm.getElementsForValidation = function(container) {
	var elements = [];
	if (!container) { return []; };
	$(container).getElements('input,select,textarea,fieldset').forEach(
		function (field) {
			if (!tm.badTags.contains(field.tagName) && field.get('validate') != null) {
				elements.push(field);
			};
	}, this);
	return elements;
};