favsHandler = {
	button:{},
	url: '/ajax/favorites/',
	xml: {
		responseNodes: {
			error: 'error',
			result: 'message'
		},

		parse: function(xmlObj){
			var xmlNodes = {};
			for (prop in favsHandler.xml.responseNodes){
				xmlNodes[prop] = xmlObj.getElementsByTagName(favsHandler.xml.responseNodes[prop]);
			}
			return xmlNodes;
		}
	},
	favoritesSend : function (button, target_type, target_id) {
		var holder = $(button).getParent('.js-to_favs_holder');
		if(holder.hasClass('to-favs')) {
    		var data = 'action=add&target_type='+ target_type +'&target_id='+ target_id;
		}
		else if (holder.hasClass('fav_added')){
			var data = 'action=remove&target_type='+ target_type +'&target_id='+ target_id;
		}
		ajaxLoadPost(favsHandler.url, data, favsHandler.favoritesSendOnload, window, {button: button, target_type:target_type, target_id:target_id});
	},
	
	favoritesSendOnload : function(ajaxObj, params) {
		if(ajaxObj && ajaxObj.responseXML){

			var xmlObj = ajaxObj.responseXML;
			var xmlNodes = favsHandler.xml.parse(xmlObj);

			if(xmlNodes.error && xmlNodes.error.length){
				var errors_length = xmlNodes.error.length;
				for (var i = 0; i < errors_length; i++) {
					futu_alert(FAT.favourites_header, xmlNodes.error[i].firstChild.data, true, 'error');
				}
			}
			
			var results = xmlObj.getElementsByTagName('result');
			if(xmlNodes.result && xmlNodes.result.length) {
				
				
				var node = null;
				if (results[0]) {
					node = results[0];
				}
				
				
				var previous_off = $(params.button).getParent('.js-to_favs_holder').hasClass('to-favs');
				if(previous_off) {
					
					if (node)
						switch (node.getAttribute("type")) {
							case 'company_comments':
							case 'comments':
								futu_alert(FAT.favourites_header, FAT.favourites_request_comment_add_success, false, 'message');
								break;
							case 'posts':
								futu_alert(FAT.favourites_header, FAT.favourites_request_post_add_success, false, 'message');
								break;
						}
				}
				else {
					
					if (node)
						switch (node.getAttribute("type")) {
							case 'company_comments':
							case 'comments':
								futu_alert(FAT.favourites_header, FAT.favourites_request_comment_remove_success, false, 'message');
								break;
							case 'posts':
								futu_alert(FAT.favourites_header, FAT.favourites_request_post_remove_success, false, 'message');
								break;
						}
						if (!(params.target_type == 'comments')) {
							temp.favourites_add && temp.favourites_add.clearOwnTags($(params.button));
						}
					 
				}
				
				if (params.target_type == 'posts') {
					$(params.button).getParent('.js-to_favs_holder').switchClass('fav_added', 'to-favs');
					
					if (previous_off) {
						params.button.title ='удалить из избранного'
					    var div = params.button.getParent('div.hentry');
    				    var tags = div.getElement('.tags');
    				    (new Element('li', { 'class': 'favourites_edit_tags', 'html': '<a onclick="temp.favourites_add.change_tags(this); return false" href="#">изменить свои метки</a>'})).inject(tags);
					} else {
						params.button.title ='добавить в избранное'
					}
				} else if (params.target_type == 'comments') {
					
					$(params.button).getParent('.js-to_favs_holder').switchClass('fav_added', 'to-favs');
				}
				
			}
		}
	}
};


tm.init.add(function () {
	temp.favourites_add = {
		'init': function () {
			if (this.inited) { return; }
			var self = this;
			this.inited = true;
			this.hidden_container = $('favourites_add_hidden');
			this.form = $('favourites_add_form');
			this.adder = $('favourites_add');
			this.tags = $('favourites_add_tags');
			this.id = $('favourites_add_id');
			this.button = $('favourites_add_submit');
			
			Browser.Engine.trident && this.tags.addEvent('keypress', function (e) {
				if (e.key == 'enter') {
					e.stop();
					self.form.attached.submit();
				}
			});
			
			var cancel = $('favourites_add_cancel');
			
			cancel && cancel.addEvent('click', function (e) {
				e.stop();
				self.hide();
			});
		},
		'show': function (container, id, tags_string) {
			!this.inited && this.init();
			this.id.value = id;
			if (tags_string) {
				this.tags.value = tags_string;
				this.button.value = 'Сохранить';
			}
			this.container = container;
			container && this.adder.inject(container);
			this.tags.focus();
		},
		'hide': function () {
			this.adder.inject(this.hidden_container);
			this.tags.value = '';
			this.id.value = '';
			this.container = null;
			this.button.value = 'Добавить в Избранное';
		},
		'change_tags': function (button) {
			var container = $(button).getParent('div.hentry'),
				id = container.getElement('.entry-info').id.replace('infopanel', ''),
				tags_holder = $(button.parentNode.parentNode),
				tags = tags_holder.getElements('li.fav a'),
				tags_string = '';
			for (var i = 0, l = tags.length; i<l; i++) {
				(i!=0) && (tags_string += ', ');
				tags_string += tags[i].innerHTML;
			}
			this.show(container, id, tags_string);
		},
		'clearOwnTags': function (button) {
			this.container = button.getParent('div.hentry');
			var fav = this.container.getElement('div.js-to_favs_holder');
			fav && fav.removeClass('to-favs').addClass('fav_added');
			this.setTags('', true);
		},
		'setTags': function (tags, unfav) {
			if (!this.container) { return; }
			
			var tags_holder = this.container.getElement('ul.tags');
			
			if (!tags_holder) {
				if (tags) {
					var content = this.container.getElement('div.content');
					tags_holder = (new Element('ul', { 'class': 'tags '})).inject(content, 'after');
				}
			}
			if (tags_holder) {
				var edit_tags = tags_holder.getElement('li.favourites_edit_tags');

				tags_holder.getElements('li.fav').dispose();

				if (unfav) {
					edit_tags.dispose();
				} else {
					if (!edit_tags) {
						edit_tags = (new Element('li', { 'class': 'favourites_edit_tags', 'html': '<a onclick="temp.favourites_add.change_tags(this); return false;" href="#">изменить свои метки</a>' })).inject(tags_holder);
					}
				}

				var empty = !(tags_holder.getElements('li').length + (edit_tags ? -1 : 0 ));

				if (!unfav && tags) {
					var tags = tags.split(',');
					for(var i=0, l=tags.length; i<l; i++) {
						var tag = tags[i].clean();
						(new Element('li', { 'class': 'fav', 'html': ((empty && i==0) ? '' : ', ') + '<a href="http://' + temp.user.login + '.' + temp.base_short + '/favorites/tag/' + tag + '">' + tag + '</a>'})).inject(edit_tags, 'before');
					}
				}

				if (!tags_holder.getElements('li').length) { tags_holder.dispose(); }

				this.container = null;
			}
		}
	};
});



function futu_alert(header, text, close, className) {
	if (!$('futu_alerts_holder')) {
		var futuAlertOuter = document.createElement('div');
		futuAlertOuter.className = 'futu_alert_outer';
		document.body.appendChild(futuAlertOuter);
		var futuAlertFrame = document.createElement('div');
		futuAlertFrame.className = 'frame';
		futuAlertOuter.appendChild(futuAlertFrame);
		
		var futuAlertsHolder = document.createElement('div');
		futuAlertsHolder.id = 'futu_alerts_holder';
		futuAlertsHolder.className = 'futu_alerts_holder';
		futuAlertFrame.appendChild(futuAlertsHolder);
		
	} else {


	}
	var futuAlert = document.createElement('div');
	futuAlert.className = 'futu_alert ' + className;
	$('futu_alerts_holder').appendChild(futuAlert);

	var futuAlertHeader = document.createElement('div');
	futuAlertHeader.className = 'futu_alert_header';
	futuAlert.appendChild(futuAlertHeader);
	
	futuAlertHeader.innerHTML = header;
	if (close) {
		var futuAlertCloseButton = document.createElement('a');
		futuAlertCloseButton.href = '#';
		futuAlertCloseButton.className = 'futu_alert_close_button';
		futuAlertCloseButton.onclick = function(ev) {
			if(!ev) {
				ev=window.event;
			}
			if (!document.all) ev.preventDefault(); else ev.returnValue = false;
			$(futuAlert).dispose()
		}
		futuAlert.appendChild(futuAlertCloseButton);
		
		var futuAlertCloseButtonIcon = document.createElement('img');
		futuAlertCloseButtonIcon.src = '/i/buttons/btn_close.gif';
		futuAlertCloseButton.appendChild(futuAlertCloseButtonIcon);
	}
	
	
	var futuAlertText = document.createElement('div');
	futuAlertText.className = 'futu_alert_text';
	futuAlert.appendChild(futuAlertText);

	
	futuAlertText.innerHTML = text;
	
	futuAlert.style.position = 'relative';
	futuAlert.style.top = '0';
	futuAlert.style.display = 'block';

	
	if (!close) {
		$(futuAlert).addEvent("click",function(){
			$(futuAlert).dispose()
		})
		setTimeout(function () { $(futuAlert).dispose() }, 3000);
		
	}
}

// Futu Alert Texts
var FAT = {
	preloader : 'Ваш запрос отправлен по секретной линии. Ждите пожалуйста ответа',
	empty: 'Ну для начала скажите, что вы намерены делать',

	// профиль
	profile_header : 'Хабрахабр — Профиль',

	// резюме
	resume_header : 'Хабрахабр — Резюме',
	
	// почта
	mail_header : 'Хабрахабр — Почта',
	mail_letter_send_request : 'Вы отправили запрос на отправку письма.',
	mail_letter_delete : 'Письмо удалено',

	// комментарии
	comments_header : 'Хабрахабр — Комментарии',
	comments_error_blank_message : 'Введите что-нибудь!',
	comments_add_success : 'Вы добавили комментарий.',
	comments_add_request : 'Вы отправили запрос на добавление комментария.',

	// госование
	votings_header : 'Хабрахабр — Голосования',
	votings_unknown_error : 'Неопознанная странная ошибка',
	votings_error_self : 'Голосовать за свои вещи нельзя',
	votings_error_prohibited : 'Вам запрещено здесь голосовать',
	votings_error_is_expired : 'Время голосования прошло',
	votings_error_no_access : 'Это действие доступно только для зарегистрированных пользователей',

	// блоги
	blogs: {
		header: 'Хабрахабр — Блоги',
		disabled: 'Ваша просьба о подписке/вступлении в блог уже была отправлена модератору',
		empty_field: 'Ну введите хоть что-нибудь!',
		blog_join: 'Вы вступили в блог',
		blog_leave: 'Вы покинули блог'
	},


	// регистрация
	registration: {
		header: 'Хабрахабр — Регистрация',
		error: 'Ошибка: проверьте правильность заполнения формы'
	},

	// посты
	posts_header : 'Хабрахабр — Публикации',
	posts_slideshow_add : 'Слайдшоу добавлено',

	// Добавление в друзья
	friendlier_header : 'Хабрахабр — Друзья',
	friendlier_unknown_error : 'Неопознанная странная ошибка',

	// Настройки
	user_settings_header : 'Хабрахабр — Настройки пользователя',
	user_settings_save_success : 'Настройки обновлены',
	user_settings_unknown_error : 'Неизвестная ошибка',
	
	// Карта блогов
	blog_map_header : 'Хабрахабр — Карта блогов',
	blog_error_no_brand : 'Марка не найдена',
	blog_error_no_model : 'Модель не найдена',
	blog_error_no_blog : 'Блог не найден',
	
	// Карта
	gmap_header : 'Хабрахабр — Карты',
	gmap_marker_add_success : 'Объект добавлен',
	gmap_marker_add_no_marker : 'Пожалуйста, кликните на карту для добавления объекта',
	gmap_search_place_no_address_error : 'Пожалуйста, уточните, что, собственно, искать.',
	
	// Избранное
	favourites_header :  'Хабрахабр — Избранное',
	favourites_request_add :  'Хабрахабр — Вы послали запрос на добавление поста в избранное',
	favourites_request_remove :  'Хабрахабр — Вы послали запрос на удаление поста из избранного',

	favourites_request_post_add_success :  'Хабрахабр — Вы добавили пост в избранное',
	favourites_request_post_remove_success :  'Хабрахабр — Вы удалили пост из избранного',
	
	favourites_request_comment_add_success :  'Хабрахабр — Вы добавили комментарий в избранное',
	favourites_request_comment_remove_success :  'Хабрахабр — Вы удалили комментарий из избранного',

	// Гео
	geo_header :  'Хабрахабр — Страны',
	
	// 
	companies_header :  'Хабрахабр — Компании',
	
	poll_header : 'Хабрахабр — Опросы'
};


geoHandler = {
	url: '/ajax/geo/',
	classNames : {
		allHolder: 'js-geo_block_holder',
		countryHolder: 'js-geo_country_select_holder',
		regionHolder: 'js-geo_region_select_holder',
		cityHolder: 'js-geo_city_select_holder',
		countrySelect: 'js-geo_country_select',
		regionSelect: 'js-geo_region_select',
		citySelect: 'js-geo_city_select'
	},
	xml: {
		responseNodes: {
			error : 'error',
			result : 'message',
			region : 'region',
			city : 'city'
		},

		parse: function(xmlObj){
			var xmlNodes = {};
			for (prop in geoHandler.xml.responseNodes) {
				xmlNodes[prop] = xmlObj.getElementsByTagName(geoHandler.xml.responseNodes[prop]);
			}
			return xmlNodes;
		}
	},
	
	sendData : function (select_obj, send_type, get_type) {
		var allHolder = $(select_obj).getParent('.' + geoHandler.classNames.allHolder);
		if (select_obj.value == '') {
			if (get_type == 'regions') {
				$(allHolder).getElement('.' + geoHandler.classNames.regionHolder).addClass('hidden');
				$(allHolder).getElement('.' + geoHandler.classNames.cityHolder).addClass('hidden');
				$(allHolder).getElement('.' + geoHandler.classNames.regionSelect).selectedIndex = 0;
				$(allHolder).getElement('.' + geoHandler.classNames.citySelect).selectedIndex = 0;
			} else if (get_type == 'cities') {
				$(allHolder).getElement('.' + geoHandler.classNames.cityHolder).addClass('hidden');
				$(allHolder).getElement('.' + geoHandler.classNames.citySelect).selectedIndex = 0;
			}
			
		} else {
			var data = send_type + '=' + select_obj.value;
			var url = '/ajax/geo/' + get_type + '/';
			ajaxLoadPost(url, data, geoHandler.sendDataOnload, window, {select_obj:select_obj, send_type:send_type, get_type:get_type});
		}
	},
	
	sendDataOnload : function(ajaxObj, params) {
		if(ajaxObj && ajaxObj.responseXML){
			var xmlObj = ajaxObj.responseXML;
			var xmlNodes = geoHandler.xml.parse(xmlObj);
			if(xmlNodes.error && xmlNodes.error.length){
				var errors_length = xmlNodes.error.length;
				for (var i = 0; i < errors_length; i++) {
					futu_alert(FAT.geo_header, xmlNodes.error[i].firstChild.data, true, 'error');
				}
			}
			if(xmlNodes.result && xmlNodes.result.length) {
				geoHandler.showResult(xmlNodes, params);
			}
		}
	},
	
	showResult : function (xmlNodes, params) {

		var allHolder = $(params.select_obj).getParent('.' + geoHandler.classNames.allHolder);

		if (params.get_type == 'regions') {
			var selectRegions = $(allHolder).getElement('.' + geoHandler.classNames.regionSelect);
			var selectRegionsHolder = $(allHolder).getElement('.' + geoHandler.classNames.regionHolder);
			
			var curOptions = selectRegions.getElementsByTagName('option');
			var curOptionsLength = curOptions.length;
			
			for (var i = 1; i < curOptionsLength; i++) {
				selectRegions.remove(1);
			}
			if (xmlNodes.region && xmlNodes.region.length) {
				l = xmlNodes.region.length;
				for (var i = 0; i < l; i++) {
					var option = document.createElement('option');
					option.value = xmlNodes.region[i].getAttribute('id');
					option.innerHTML = xmlNodes.region[i].firstChild.data;
					selectRegions.appendChild(option);
					$(selectRegionsHolder).removeClass('hidden');
				}
				$(allHolder).getElement('.' + geoHandler.classNames.cityHolder).addClass('hidden');
				$(allHolder).getElement('.' + geoHandler.classNames.citySelect).selectedIndex = 0;
			}
			
		} else if (params.get_type == 'cities') {
			var selectCities = $(allHolder).getElement('.' + geoHandler.classNames.citySelect);
			var selectCitiesHolder = $(allHolder).getElement('.' + geoHandler.classNames.cityHolder);
			
			var curOptions = selectCities.getElementsByTagName('option');
			var curOptionsLength = curOptions.length;
			
			for (var i = 1; i < curOptionsLength; i++) {
				selectCities.remove(1);
			}
			if (xmlNodes.city && xmlNodes.city.length) {
				l = xmlNodes.city.length;
				for (var i = 0; i < l; i++) {
					var option = document.createElement('option');
					option.value = xmlNodes.city[i].getAttribute('id');
					option.innerHTML = xmlNodes.city[i].firstChild.data;
					selectCities.appendChild(option);
					$(selectCitiesHolder).removeClass('hidden');
				}
			}
		}
	}
};/*
	ajaxFormClass
	Базовый класс, не применяющийся самостоятельно (от него уже наследуют подклассы, обслуживающие конкретные формы)

*/
var ajaxFormClass = function(){

	// возможные url (задаются своим конкретным подклассом)
	// при отправке данных на сервер на форму навешиваются аналогичные классы:
	// save-loading, preview-loading, draft-loading
	this.ajaxUrls = {
		save: '' // сохранение поста
		//preview: '', // предпросмотр
		//draft: '', // в черновики
		//autosave: '' // в автосэйв
	};

	// Имена xml нодов и соотвествующие им имена функций-обработчиков
	this.xmlResponse = {
		message: {
			node: 'message',
			handler: null
		},

		error: {
			node: 'error',
			handler: 'xmlResponseHandler_error'
		},

		redirect: {
			node: 'redirect_url',
			handler: 'xmlResponseHandler_redirect'
		}
	};

	// Используемые в форме classNames
	this.classNames = {
		fieldHolder: 'js-field-holder', // контейнер-родитель поля формы и ошибки
		fieldData: 'js-field-data', // поле формы, которое нужно сериализовать
		fieldErrorMsgBox: 'js-field-error-msg', // контейнер для вывода сообщения об ошибке
		fieldMarkedError: 'js-marked-error', // помечаем контейнер, если в поле - ошибка
		fieldMarkedChecked: 'js-marked-checked', // помечаем контейнер, если поле прошло проверку
		fieldIsRequired: 'js-required', // поле, обязательное для заполнения 
		fieldPass_1: 'js-pass-field-main', // поле с основным паролем
		fieldPass_2: 'js-pass-field-repeat', // поле с повтором пароля
		isLoading: 'loading', // прелоадер
		unknownErrorHolder: 'js-unknown-error-holder', // держатель вывода неопознанной ошибки
		unknownErrorMsg: 'js-unknown-error-msg' // само поле неопознанной ошибки
	};

	// Выводимые клиентом сообщения об ошибках
	this.errorMessages = {
		fieldIsEmpty: 'Необходимо заполнить это поле',
		inputIsIncorrect: 'Вы ввели недопустимый символ',
		inputIsInsufficient: 'Вы ввели недостаточно символов',
		emailIsIncorrect: 'Вы ввели недопустимый email',
		urlIsIncorrect: 'Вы ввели недопустимый url',
		inputCharsNumberIsIncorrect: 'Вы ввели неверное число букв',
		passwordIsShort: 'Пароль слишком короткий',
		passwordsAreNotEqual: 'Пароли не совпадают',
		unknownError: 'Неопознанная ошибка' // Пустое сообщение об ошибке
	};

};


Object.extendObject(
	ajaxFormClass.prototype, {

	//	Переключение между формами на странице
	switchForm: function(link){
			$('reg-wrapper').className = link.className;
			return false;
	},


	// Переводим xml дерево в объект
	parseXML: function(xmlObj){
			var xmlNodes = {};
			for (prop in this.xmlResponse){
				xmlNodes[prop] = xmlObj.getElementsByTagName(this.xmlResponse[prop].node);
			}
			return xmlNodes;
	},


	// Возвращает блок вывода ошибки для данного поля формы
	getErrorMsgBoxByField: function(field){
			var fieldHolder = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldHolder){
				var errorMsgBoxes = $(fieldHolder).getElements('.' + this.classNames.fieldErrorMsgBox);
				if(errorMsgBoxes && errorMsgBoxes.length){
					return errorMsgBoxes[0];
				} 
			}else {
				return null;
			}
	},


	// 
	completeForm: function(redirectUrl){
			if(redirectUrl){
				window.location.href = redirectUrl;
			} else {
				window.location.href = "/";
			}
	},


	//	Проверка заполненности формы и отсутсвия ошибок (сделать className='required' для полей)
	checkFormComplition: function(form){
			var formIsComplited = true; 
			var datas = $(form).getElements('.' + this.classNames.fieldData);

			for (var i=0, length=datas.length; i<length; i++){
				
				
				var fieldHolder = $(datas[i]).getParent('.' + this.classNames.fieldHolder);
				
				if (
						(datas[i].value == '' && // пустое обязательное поле
							$(datas[i]).hasClass(this.classNames.fieldIsRequired)) ||
						
						(datas[i].getAttribute('type') == 'checkbox' && // обязательный чекбокс
							$(datas[i]).hasClass(this.classNames.fieldIsRequired) &&
							!datas[i].checked)
					){
					formIsComplited = false;
					this.markField_error(datas[i], this.errorMessages.fieldIsEmpty);

				} else if(
						(fieldHolder && // поле с неисправленной ошибкой
							$(fieldHolder).hasClass(this.classNames.fieldMarkedError))
					){
					var errorMsgBox = this.getErrorMsgBoxByField(datas[i]);
					if (errorMsgBox) {
						errorMsgBox.innerHTML = '';
					}
	
					this.markField_clear(datas[i]);
				}
			}
			return formIsComplited;
	},

	// Сериализация полей формы
	serializeForm: function(form){
			var data = '';
			
			var datas = $(form).getElements('.' + this.classNames.fieldData);
			for (var i=0, length=datas.length; i<length; i++){
				var type = datas[i].getAttribute('type');
				var param = datas[i].getAttribute('name');
				var value = datas[i].value;

				if(type == 'radio' && !datas[i].checked){
					continue;
				}

				if(type == 'checkbox'){
					value = datas[i].checked ? true : false;
				} else {
					value = datas[i].value;
				}
				data += (i!=0 ? '&' : '') + param + '=' + encodeURIComponent(value);
			}
			return data;
	},
	
	// Сериализация полей формы
	classicSerializeForm: function(form){
			var data = '';
			
			var datas = $(form).getElements('.' + this.classNames.fieldData);
			for (var i=0, length=datas.length; i<length; i++){
				var type = datas[i].getAttribute('type');
				var param = datas[i].getAttribute('name');
				var value = datas[i].value;

				if(type == 'radio' && !datas[i].checked){
					continue;
				}

				if(type == 'checkbox' && !datas[i].checked){
					continue;
				}
				data += (data!='' ? '&' : '') + param + '=' + encodeURIComponent(value);
			}
			return data;
	},

	// Сериализация полей формы
	realSerializeForm: function(form){
			var data = '';
			
			var datas = form.elements;
			for (var i=0, length=datas.length; i<length; i++){
				var type = datas[i].getAttribute('type');
				var param = datas[i].getAttribute('name');
				var value = datas[i].value;

				if(type == 'radio' && !datas[i].checked){
					continue;
				}

				if(type == 'checkbox' && !datas[i].checked){
					continue;
				}
				data += (data!='' ? '&' : '') + param + '=' + encodeURIComponent(value);
			}
			return data;
	},


	// Отправка всех полей формы на сервер
	// submitType - необязательный параметр
	// fCheckFormComplition - необязательный параметр (своя функция проверки формы на заполненность)
	//		fCheckFormComplition == f(){} (не надо проверять)
	//		fCheckFormComplition == false или fCheckFormComplition == undefined (надо проверять)
	sendData: function (form, submitType, fCheckFormComplition, classicSerialize){
			// Проверка на заполненность всех полей и на их валидность
			if(!fCheckFormComplition && !this.checkFormComplition(form)) {
				return false;
			} else if(fCheckFormComplition && !fCheckFormComplition(form)){
				alert('false');
				return false;
			}

			// Задаем класснейм, определяющий, что именно грузится в данный момент
			var loadingClassName = (submitType || 'save') + '-' + this.classNames.isLoading;

			// Проверка того, что форма не обрабатывает уже того, что мы запросили в данный момент
			if($(form).hasClass(loadingClassName)){
				return false;
			}
			
			// если submitType не передан, то используем this.ajaxUrls.save
			var url = this.ajaxUrls[submitType] || this.ajaxUrls.save;
			
			if (!classicSerialize) {
				var data = this.serializeForm(form);
			} else {
				var data = this.classicSerializeForm(form);
			}

			var params = {
				form: form,
				loadingClassName: loadingClassName
			};

			$(form).addClass(loadingClassName);
			
			ajaxPost(
				url,
				data,
				this.sendDataOnload,
				params,
				this);
			
			this._form = $(form);
			return false;
	},


	// Чтение ответа сервера на пересылку  всех данных формы и обработка выданных ошибок
	sendDataOnload: function (ajaxObj, params){
			if (this._form) this._form.removeClass(params.loadingClassName);
			if(ajaxObj && ajaxObj.responseXML){
				var xmlObj = ajaxObj.responseXML;
				var xmlNodes = this.parseXML(xmlObj);

				for (prop in xmlNodes){
					if(this[this.xmlResponse[prop].handler]) {
						this[this.xmlResponse[prop].handler](xmlNodes, params);
					}
				}
			}
	},

	// Обработчик ответа сервера при получении ошибки
	xmlResponseHandler_error: function(xmlNodes, params){
		if(xmlNodes.error && xmlNodes.error.length) {
			$(params.form).removeClass(params.loadingClassName);

			for (var i=0; i<xmlNodes.error.length; i++){
				var fieldMarkedError = params.form[xmlNodes.error[i].getAttribute('field')];
				var errorMessage = xmlNodes.error[i].firstChild ? xmlNodes.error[i].firstChild.data : this.errorMessages.unknownError;

				if(!fieldMarkedError) {
					fieldMarkedError = $(params.form).getElement('.' + this.classNames.unknownErrorMsg);
				} 
				
				if (fieldMarkedError) {
					this.markField_error(fieldMarkedError, errorMessage);
				}
			}

		}
	},

	// Обработчик ответа сервера при редиректе
	xmlResponseHandler_redirect: function(xmlNodes, params){
		if(xmlNodes.redirect && xmlNodes.redirect.length) {
			this.completeForm(xmlNodes.redirect[0].firstChild.data);
		}
	},


	// Пересылка полей формы (первое поле массива - текущее)
	checkData: function (fields, action, submitType){
			
			// если submitType не передан, то используем this.ajaxUrls.save
			var url = this.ajaxUrls[submitType] || this.ajaxUrls.save;

			var data = "";
			var field;
			
			if (fields.length && fields.length > 1) {
				field = fields[0];
				
				for (var i = 0; i < fields.length; i++) {
					var type = fields[i].getAttribute('type');
					var param = fields[i].getAttribute('name');
					var value;

					if(type == 'checkbox'){
						value = fields[i].checked ? true : false;
					} else {
						value = fields[i].value;
					}

					data += (i!=0 ? '&' : '') + param + '=' + encodeURIComponent(value);
				}
				
			} else {
				field = fields.length ? fields[0] : fields;
				var param = field.getAttribute('name');
				var value = field.value;
				data = param + '=' + encodeURIComponent(value);
			}
			

			data += "&action=" + action;

			var fieldParent = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldParent) $(fieldParent).addClass(this.classNames.isLoading);
			
			ajaxPost(
				url,
				data,
				this.checkDataOnload,
				field,
				this);
	},

	
	// Чтение ответа сервера на пересылку конкретного поля формы и обработка выданных ошибок
	checkDataOnload: function (ajaxObj, field){
			
			var fieldParent = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldParent) $(fieldParent).removeClass(this.classNames.isLoading);

			if(ajaxObj && ajaxObj.responseXML){
				
				var xmlObj = ajaxObj.responseXML;
				var xmlNodes = this.parseXML(xmlObj);
				
				if(xmlNodes.error && xmlNodes.error.length) {
					for (var i=0; i<xmlNodes.error.length; i++){
						var fieldMarkedError = field;
						var errorMessage = xmlNodes.error[i].firstChild.data;
						this.markField_error(fieldMarkedError, errorMessage);
					}

				} else if(xmlNodes.redirect && xmlNodes.redirect.length) {
					this.completeForm(xmlNodes.redirect[0].firstChild.data);

				} else {
					this.markField_checked(field);
				}

			}
	},




	// Очищаем поле от любых отметок
	markField_clear: function(field){
			var fieldHolder = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldHolder){
				$(fieldHolder).removeClass(this.classNames.fieldMarkedError);
				$(fieldHolder).removeClass(this.classNames.fieldMarkedChecked);
			}
	},


	// Отмечаем поле как прошедшее проверку
	markField_checked: function(field){
			var fieldHolder = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldHolder){
				$(fieldHolder).removeClass(this.classNames.fieldMarkedError);
				$(fieldHolder).addClass(this.classNames.fieldMarkedChecked);
			}
	},


	// Отмечаем поле как ошибочное и выводим сообщение об ошибке
	markField_error: function(field, errorMessage) {
			var fieldHolder = $(field).getParent('.' + this.classNames.fieldHolder);
			if(fieldHolder){
				$(fieldHolder).removeClass(this.classNames.fieldMarkedChecked);
				$(fieldHolder).addClass(this.classNames.fieldMarkedError);

				var errorMsgBox = this.getErrorMsgBoxByField(field);
				if(errorMsgBox){
					errorMsgBox.innerHTML = errorMessage;
				}
			}
			
	},


	//	Проверка поля на пустоту
	checkField_empty: function(e, field){

			if(e == null && field.value != '') {
				this.markField_clear(field);
				return;
			}

			if(!e) e = window.event;
			
			switch(e.type){
				case 'blur':
					if(field.value.length != 0){
						this.markField_clear(field);
					}
					break;

				case 'keyup':
					this.markField_clear(field);
					break;

				case 'change':
					if(field.value != ''){
						this.markField_clear(field);
					}
					break;
			}
	}

});var pollFormClass = function(){
	pollFormClass.superClass.apply(this, arguments);

	this.ajaxUrls = {
		save: "/ajax/poll/"
	};
	
	Object.extendObject(
		this.xmlResponse, {
		
		twitter : {
			node: 'twitter',
			handler: 'xmlResponseHandler_twitter'
		},
		
		region : {
			node: 'region',
			handler: 'xmlResponseHandler_region'
		},
		
		city : {
			node: 'city',
			handler: 'xmlResponseHandler_city'
		},
		
		text : {
			node: 'text',
			handler: 'xmlResponseHandler_text'
		},
		
		html : {
			node: 'html',
			handler: 'xmlResponseHandler_html'
		}
	});

};

pollFormClass.inheritsFrom(ajaxFormClass);

Object.extendObject(
	pollFormClass.prototype, {
	
	sendData: function (form, submitType, post_id){
		// Задаем класснейм, определяющий, что именно грузится в данный момент
		var loadingClassName = (submitType || 'save') + '-' + this.classNames.isLoading;

		// Проверка того, что форма не обрабатывает уже того, что мы запросили в данный момент
		if($(form).hasClass(loadingClassName)){
			return false;
		}
		if (submitType == 'poll') {
			var data = 'action=vote';
		} else if (submitType == 'cancel') {
			var data = 'action=pass';
		}
		data += '&post_id=' + post_id + '&';
		data += this.classicSerializeForm(form);
		
		
		// если submitType не передан, то используем this.ajaxUrls.save
		var url = this.ajaxUrls[submitType] || this.ajaxUrls.save;
		
		
		var params = {
			form: form,
			loadingClassName: loadingClassName
		};

		$(form).addClass(loadingClassName);
		
		ajaxPost(
			url,
			data,
			this.sendDataOnload,
			params,
			this);
		
		return false;
	},
	xmlResponseHandler_html: function(xmlNodes, params){
		if(xmlNodes.html && xmlNodes.html.length) {
			params.form.parentNode.innerHTML = xmlNodes.html[0].firstChild.data;
		}
	},
	// Обработчик ответа сервера при получении ошибки
	xmlResponseHandler_error: function(xmlNodes, params){
		if(xmlNodes.error && xmlNodes.error.length) {
			$(params.form).removeClass(params.loadingClassName);

			for (var i=0; i<xmlNodes.error.length; i++){
				var fieldMarkedError = params.form[xmlNodes.error[i].getAttribute('field')];
				if (fieldMarkedError) {
					var errorMessage = xmlNodes.error[i].firstChild ? xmlNodes.error[i].firstChild.data : this.errorMessages.unknownError;

					if(!fieldMarkedError)
						fieldMarkedError = $(params.form).getElement('.' + this.classNames.unknownErrorMsg);

					this.markField_error(fieldMarkedError, errorMessage);
				} else {
					var errorMessage = xmlNodes.error[i].firstChild ? xmlNodes.error[i].firstChild.data : this.errorMessages.unknownError;
					futu_alert(FAT.poll_header, errorMessage, false, 'error');
				}
			}

		}
	}
});


var pollForm = new pollFormClass();


blogsHandler = {

	url_leave_join: '/ajax/blogs/membership/',
	url_get_info: '/ajax/blogs/getinfo/',
	
	xml: {
		responseNodes: {
			error : 'error',
			result : 'message',
			param : 'param',
			divcontent : 'divcontent'
		},

		parse: function(xmlObj){
			var xmlNodes = {};
			for (prop in blogsHandler.xml.responseNodes) {
				xmlNodes[prop] = xmlObj.getElementsByTagName(blogsHandler.xml.responseNodes[prop]);
			}
			return xmlNodes;
		}
	},
	
	joinLeaveBlog : function(action, target_id) {
		var data = 'action='+ action +'&blog_id=' + target_id;
		ajaxLoadPost(blogsHandler.url_leave_join + action + '/', data, blogsHandler.joinLeaveBlogOnload);
	},
	
	
	joinLeaveBlogOnload : function(ajaxObj) {
		if(ajaxObj && ajaxObj.responseXML){
			var xmlObj = ajaxObj.responseXML;
			var xmlNodes = blogsHandler.xml.parse(xmlObj);
			if(xmlNodes.error && xmlNodes.error.length){
				var errors_length = xmlNodes.error.length;
				for (var i = 0; i < errors_length; i++) {
					futu_alert(FAT.blogs.header, xmlNodes.error[i].firstChild.data, true, 'error');
				}
			}
			if(xmlNodes.result && xmlNodes.result.length) {
				if(xmlNodes.param && xmlNodes.param.length) {
					if (xmlNodes.param[0].firstChild.data == 'leave') {
						$('js-addBlogMember').removeClass('hidden');
						$('js-removeBlogMember').addClass('hidden');
						futu_alert(FAT.blogs.header, FAT.blogs.blog_leave, false, 'message');
					} else if (xmlNodes.param[0].firstChild.data == 'join') {
						$('js-addBlogMember').addClass('hidden');
						$('js-removeBlogMember').removeClass('hidden');
						futu_alert(FAT.blogs.header, FAT.blogs.blog_join, false, 'message');
					}
				}
			}
		}
	},
	
	getBlogPeople : function(action, target_id) {
		if (action == 'administration') {
			if ($('js-admins_moderators_holder').hasClass('js-is_loaded')) {
				$('js-admins_moderators_holder').removeClass('hidden');
				
//				addClass($('js-admins_moderators_holder_show'), 'hidden');
//				removeClass($('js-admins_moderators_holder_hide'), 'hidden');
			} else if (!$('js-admins_moderators_holder').hasClass('js-is_loading')) {
				var data = 'kind='+ action +'&blog_id=' + target_id;
				ajaxLoadPost(blogsHandler.url_get_info, data, blogsHandler.getBlogPeopleOnload, window, {action:action});
				$('js-admins_moderators_holder').addClass('js-is_loading');
				
//				addClass($('js-admins_moderators_holder_show'), 'hidden');
//				removeClass($('js-admins_moderators_holder_hide'), 'hidden');
			}
				
		} else if (action == 'members') {
			if ($('js-admins_readers_holder').hasClass('js-is_loaded')) {
				$('js-admins_readers_holder').removeClass('hidden');
				
				$('js-admins_readers_holder_show').addClass('hidden');
				$('js-admins_readers_holder_hide').removeClass('hidden');
			} else if (!$('js-admins_readers_holder').hasClass('js-is_loading')) {
				var data = 'kind='+ action +'&blog_id=' + target_id;
				ajaxLoadPost(blogsHandler.url_get_info, data, blogsHandler.getBlogPeopleOnload, window, {action:action});
				$('js-admins_readers_holder').addClass('js-is_loading');
				
				$('js-admins_readers_holder_show').addClass('hidden');
				$('js-admins_readers_holder_hide').removeClass('hidden');
			}
		}
		
	},
	
	hideBlogPeople : function(action) {
		if (action == 'administration') {
			$('js-admins_moderators_holder').addClass('hidden');
			$('js-admins_moderators_holder_show').removeClass('hidden');
			$('js-admins_moderators_holder_hide').addClass('hidden');
		} else if (action == 'members') {
			$('js-admins_readers_holder').addClass('hidden');
			$('js-admins_readers_holder_show').removeClass('hidden');
			$('js-admins_readers_holder_hide').addClass('hidden');
		}
	},
	
	getBlogPeopleOnload : function(ajaxObj, params) {
		if(ajaxObj && ajaxObj.responseXML){
			var xmlObj = ajaxObj.responseXML;
			var xmlNodes = blogsHandler.xml.parse(xmlObj);
			if(xmlNodes.error && xmlNodes.error.length){
				var errors_length = xmlNodes.error.length;
				for (var i = 0; i < errors_length; i++) {
					futu_alert(FAT.blogs.header, xmlNodes.error[i].firstChild.data, true, 'error');
				}
			}
			if(xmlNodes.result && xmlNodes.result.length) {
				if(xmlNodes.divcontent && xmlNodes.divcontent.length) {
					if (params.action == 'administration') {
						$('js-admins_moderators_holder').innerHTML = xmlNodes.divcontent[0].firstChild.data;
						$('js-admins_moderators_holder').removeClass('hidden');
						$('js-admins_moderators_holder').removeClass('js-is_loading');
						$('js-admins_moderators_holder').addClass('js-is_loaded');
						
//						addClass($('js-admins_moderators_holder_show'), 'hidden');
//						removeClass($('js-admins_moderators_holder_hide'), 'hidden');
					} else if (params.action == 'members') {
						$('js-admins_readers_holder').innerHTML = xmlNodes.divcontent[0].firstChild.data;
						$('js-admins_readers_holder').removeClass('hidden');
						$('js-admins_readers_holder').removeClass('js-is_loading');
						$('js-admins_readers_holder').addClass('js-is_loaded');
						
//						addClass($('js-admins_readers_holder_show'), 'hidden');
//						removeClass($('js-admins_readers_holder_hide'), 'hidden');
					}
				}
			}
		}
	},
	
	toggleBlogInfo : function (target_id,element) {
		var _box = $('js-blog_info');
		if (_box.hasClass('hidden')) {
			_box.removeClass('hidden');
			blogsHandler.getBlogPeople('administration', target_id); 
			
			
			var p = element.getPosition();
			_box.style.top = (p.y - 14) + 'px';
			if (p.x > ($(document).getSize().x/2)) {
				_box.addClass("tipBox-too-mach-right")
			} else {
				_box.removeClass("tipBox-too-mach-right")
			}
			_box.style.left = p.x + 'px';
			_box.style.display = 'block';
			
			
			
		} else {
			_box.addClass('hidden');
		}
		
	},
	
	filter : function (obj) {
		var fields = $(obj.form).getElements('.js-field-data');
		for (var i=0, j=fields.length; i<j; i++) {
			if(fields[i].checked == true) {
				window.location.href = '/blog' + fields[i].value;
			}
		}
	}
};




var adminBlogPeopleFormClass = function(){
	adminBlogPeopleFormClass.superClass.apply(this, arguments);

	this.ajaxUrls = {
		save: "/ajax/blogs/membership/set_group/"
	};
	
	Object.extendObject(
		this.xmlResponse, {
		
		message: {
			node: 'message',
			handler: 'xmlResponseHandler_message'
		}
		
	});

};

adminBlogPeopleFormClass.inheritsFrom(ajaxFormClass);

Object.extendObject(
	adminBlogPeopleFormClass.prototype, {
	
	serializeForm: function(form){
			var data = '';
			
			var datas = $(form).getElements('.' + this.classNames.fieldData);
			for (var i=0, length=datas.length; i<length; i++){
				var type = datas[i].getAttribute('type');
				var param = datas[i].getAttribute('name');
				var value = datas[i].value;

				if(type == 'radio' && !datas[i].checked){
					continue;
				}

				if(type == 'checkbox' && !datas[i].checked){
					continue;
				}
				data += (data!='' ? '&' : '') + param + '=' + encodeURIComponent(value);
			}
			return data;
	},
	sendDataOnload: function (ajaxObj, params){
			if(ajaxObj && ajaxObj.responseXML){
				var xmlObj = ajaxObj.responseXML;
				var xmlNodes = this.parseXML(xmlObj);

				for (prop in xmlNodes){
					if(this[this.xmlResponse[prop].handler]) {
						this[this.xmlResponse[prop].handler](xmlNodes, params);
					}
				}
			}
			$(params.form).removeClass('save-loading');
	},
	xmlResponseHandler_message: function (xmlNodes, params) {
		if (xmlNodes.message && xmlNodes.message.length && xmlNodes.message[0].firstChild.data == 'ok') {
			futu_alert(FAT.blogs.header, 'Права сохранены', false, 'message');
		}
	}
});


var adminBlogPeopleForm = new adminBlogPeopleFormClass();
tm.init.add(function(){
	
	var blogInfoBlock = $(document).getElement(".blog-about-text");
	if (blogInfoBlock) {
		var bloginfoBlockCloseButton = blogInfoBlock.getElement("a.close-blog-info");
		if (bloginfoBlockCloseButton) {
			bloginfoBlockCloseButton.addEvent("click",function(){
				blogInfoBlock.addClass("hidden");
				return false
			})
		}
		var blogInfoBlockChilds = blogInfoBlock.getElements("*");
		for (var i=0,l=blogInfoBlockChilds.length; i < l ; i++) {
			blogInfoBlockChilds[i].clicker = "blogInfoBlockChilds";
		};
		var whois =$(document).getElement(".blog-whois");
		if(whois) {
			whois.clicker = "blogInfoBlockChilds";
		}
		$(document).addEvent("click",function(e){
			if (!e.target.clicker || !e.target.clicker == "blogInfoBlockChilds") {
				blogInfoBlock.addClass("hidden");
			}
		})
	}
});