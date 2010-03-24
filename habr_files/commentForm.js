/*
	commentFormClass
	работает по принципу статического класса:
	для работы требует создания одного объекта
	var commentForm
*/

var commentFormClass = function(){
	commentFormClass.superClass.apply(this, arguments);
	
	$extend(this, tm.customEventManager);
	
	this.new_replies_i = -1;
	
	Object.extendObject(
		this.ajaxUrls, {
			save: (window.baseURL || '') + '/ajax/comments/add/',
			preview: (window.baseURL || '') + '/ajax/comments/preview/',
			feedback: (window.baseURL || '') + '/ajax/comments/add_feedback/'
	});
	
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
		unknownErrorMsg: 'js-unknown-error-msg', // само поле неопознанной ошибки
		commentsCount: 'js-comments-count', //количество комментариев
		previewHolder: 'comment-preview', //предпросмотр
		thread: 'hentry', // ветка комментариев
		commentItem: 'comment_holder vote_holder' //комментарий
	};
	
	Object.extendObject(
		this.xmlResponse, {
		timefield: {
			node: 'timefield',
			handler: null
		},
		comment: {
			node: 'comment',
			handler: 'xmlResponseHandler_comment'
		},
		company_comment: {
			node: 'company_comment',
			handler: 'xmlResponseHandler_company_comment'
		},
		preview: {
			node: 'preview',
			handler: 'xmlResponseHandler_preview'
		},
		error: {
			node: 'error',
			handler: 'xmlResponseHandler_error'
		}
	});
};
commentFormClass.inheritsFrom(ajaxFormClass);

Object.extendObject(
	commentFormClass.prototype, {
	
	build: {
		comment: function(id, text){
			var entry_reply_item = document.createElement('li');
			entry_reply_item.id = 'comment_' + id;
			entry_reply_item.className = commentForm.classNames.commentItem;
			entry_reply_item.innerHTML = text;
			return entry_reply_item;			
		},
		
		thread: function(){
			var entry_reply_thread = document.createElement('ul');
			entry_reply_thread.className = commentForm.classNames.thread;
			return entry_reply_thread;
		}
	},
	
	_addComments: function(xmlNodes){
		var replies = [];
		var commentsHolder = $('comments');
		for(var i=0; i<xmlNodes.comment.length; i++) {
			var text = xmlNodes.comment[i].firstChild.data;
			var entry_reply_item = this.build.comment(xmlNodes.comment[i].getAttribute('comment_id'), text);
			replies[replies.length] = entry_reply_item;
			if(xmlNodes.comment[i].getAttribute('parent_id')!=0) {
				var entry = $('comment_' + xmlNodes.comment[i].getAttribute('parent_id'));
				var entry_reply_thread = entry.getElement('.' + this.classNames.thread);
				if(!entry_reply_thread) {
					entry_reply_thread = this.build.thread();
					entry_reply_thread.appendChild(entry_reply_item);
					entry.appendChild(entry_reply_thread);
				}
				entry_reply_thread.appendChild(entry_reply_item);
			} else {
				var reply_holder = $('comments').getElement('.' + this.classNames.thread);
				if(!reply_holder) {
					var reply_holder = document.createElement('ul');
					reply_holder.className = this.classNames.thread;
					commentsHolder.insertBefore(reply_holder, commentsHolder.getElement('.add-comment'));
				}
				reply_holder.appendChild(entry_reply_item);
			}
			if(xmlNodes.comment[i].getAttribute('user_comment')==1) { 
				$('comment_' + xmlNodes.comment[i].getAttribute('comment_id')).addClass('js-my-reply');	
			} else {
				$('comment_' + xmlNodes.comment[i].getAttribute('comment_id')).getElement('div.msg-meta').addClass('new-reply');
			} 
		}
		if (replies.length > 0) {
			var commentsHeader = $('comments').getElement('.comments-header');
			if (commentsHeader && commentsHeader.hasClass('hidden')) {
				commentsHeader.removeClass('hidden');
			}
		}

		return replies;
	},
	
	xmlResponseHandler_comment: function(xmlNodes, params){
		if(xmlNodes.message && xmlNodes.message.length && xmlNodes.comment && xmlNodes.comment.length) {
			params.form.elements['timefield'].value = xmlNodes.timefield[0].firstChild.data;
			var commentsHolder = $('comments');
			this._addComments(xmlNodes);
			var jsfldhld;
			jsfldhld = $('js-field-holder-with-help');
			if (!jsfldhld) {
				jsfldhld = $('js-field-holder');
			};
			var previewHolder = jsfldhld.getElement('.' + this.classNames.previewHolder);
			jsfldhld.addClass('hidden');
			$(params.form).removeClass(params.loadingClassName);
			this.addNewCommentsToBar();
			var comments_header = $('comments-header');
			if (comments_header) {
				comments_header.addClass('comments-header-visible');
			}
			params.form.last_text = params.form['comment[message]'].value;
			var inputs_to_blur = $(params.form).getElements('input');
			for (var i=0, l = inputs_to_blur.length; i < l; i++) {
				inputs_to_blur[i].blur();
			};
		}
		if (xmlNodes.comment && xmlNodes.comment.length)
			this.fireEvent('tm:loading-finished');
		this.updateAllCommentsCount();
		
	},

	xmlResponseHandler_company_comment: function(xmlNodes, params){
		if(xmlNodes.message && xmlNodes.message.length && xmlNodes.company_comment && xmlNodes.company_comment.length) {
			params.form.elements['timefield'].value = xmlNodes.timefield[0].firstChild.data;
			var commentsHolder = $('comments');
			var reply_holder = commentsHolder.getElement('.' + this.classNames.thread);
			var entry_replies = commentsHolder.getElements('.' + this.classNames.commentItem);
			for(var i=0, xml_length = xmlNodes.company_comment.length; i<xml_length; i++) {
				entry_replies.sort(this.sortArray);
				reply_holder.insertBefore(entry_reply_item, entry_replies[0]);
				this.build.comment(xmlNodes.company_comment[i].getAttribute('comment_id'), xmlNodes.company_comment[i].firstChild.data);
				 if(xmlNodes.company_comment[i].getAttribute('user_comment')==1) { 
					$('comment_' + xmlNodes.company_comment[i].getAttribute('comment_id')).addClass('my-reply');
				} else {
					$('comment_' + xmlNodes.company_comment[i].getAttribute('comment_id')).addClass('new-reply');
				}
			}
			var jsfldhld = $('js-field-holder');
			var previewHolder = jsfldhld.getElement('.' + this.classNames.previewHolder);
			jsfldhld.addClass('hidden');
			$(params.form).removeClass(params.loadingClassName);
			this.addNewCommentsToBar();
		}
		if (xmlNodes.company_comment && xmlNodes.company_comment.length)
			this.fireEvent('tm:loading-finished');
		this.updateAllCommentsCount();
	},
	
	xmlResponseHandler_preview: function(xmlNodes, params){
		if(xmlNodes.preview && xmlNodes.preview.length) {
			var previewHolder = $('js-field-holder').getElement('.' + this.classNames.previewHolder);
			previewHolder.removeClass('hidden')
			previewHolder.innerHTML = xmlNodes.preview[0].firstChild.data;
			$(params.form).removeClass(params.loadingClassName);
		}
	},
	
	xmlResponseHandler_error: function(xmlNodes, params){
		if(xmlNodes.error && xmlNodes.error.length) {
			$(params.form).removeClass(params.loadingClassName);
			for (var i=0; i<xmlNodes.error.length; i++){
				var errorMessage = xmlNodes.error[i].firstChild ? xmlNodes.error[i].firstChild.data : this.errorMessages.unknownError;
			}
			this.showError(errorMessage);
		}
	},
	
	sendComment: function(form, submitType) {
		$('js-field-holder').removeClass('js-marked-error');
		this.sendData(form, submitType);
		this.fireEvent('tm:loading-started');
	},
	
	sendOnEnter: function(textarea) {
		tm.log('aa');
		textarea.onkeyup = function(ev) {
			if(!ev) {
				ev = window.event;
			}
			var key = getCharCode(ev);
			if(key==13 && ev.ctrlKey) {
				commentForm.sendComment(this.form, 'comment');
			}
		}
	},
	
	moveForm: function(reply_form_id) {
		var formHolder = $(reply_form_id);
		var parent_id = reply_form_id.match(/reply_form_(.*)/)[1];
		parent_id = parseInt(parent_id);
		if (!arguments.callee.addc) {
			arguments.callee.addc = $('wrapper').getElement('.add-comment');
			
		}
		var infolineHolder = arguments.callee.addc;
		if (infolineHolder) {
		
			
			if (!arguments.callee.jsfldhld) {
				if (!(arguments.callee.jsfldhld = $('js-field-holder-with-help'))) {
					arguments.callee.jsfldhld = $('js-field-holder');
				} else{
					arguments.callee.withhelp = true;
				}
				arguments.callee.commholdr = arguments.callee.jsfldhld.getElement('#js-field-comment');
				arguments.callee.prwhld = arguments.callee.jsfldhld.getElement('.' + this.classNames.previewHolder);
				arguments.callee.treeinput =  arguments.callee.jsfldhld.getElementsByTagName('form')[0].elements['comment[parent_id]'];

			}
			if (!arguments.callee.withhelp) {
				var infoline = infolineHolder.getElementsByTagName('dl')[0];
				if (infoline) {
					if(parent_id==0) {
						$(infoline).removeClass('hidden');
					}
					else {
						$(infoline).addClass('hidden');
					}
				}
			}
			
			var jsfldhld = arguments.callee.jsfldhld;
			var commentHolder = arguments.callee.commholdr;
			var previewHolder = arguments.callee.prwhld;
			var treeinput = arguments.callee.treeinput;
			if(jsfldhld) {
				formHolder.appendChild(jsfldhld);
				treeinput.value = parent_id;
				$(previewHolder).addClass('hidden');
				previewHolder.innerHTML = '';
				commentHolder.value = '';
				jsfldhld.removeClass('hidden');
				commentHolder.focus();
			}
		}

		
		return false;
	},
	
	scrollToAnchor: function(anchor){
		window.location.href = window.location.href.split('#')[0] + anchor; 
	},
	
	reloadComments: function() {
		var url = '/ajax/comments/get_new_comments/';
		if(document.forms['comment_form']) {
			var timefield = document.forms['comment_form'].elements['timefield'].value;
			var data = 'target_id='+ this.targetId +'&target_type=' + this.targetType + '&timefield=' + timefield;
			_this = this;
			ajaxPost(
					url,
					data,
					this.reloadCommentsOnload,
					_this
					);
			}
		this.fireEvent('tm:loading-started');
		return false;
	},
	
	reloadCommentsOnload: function(ajaxObj, _this) {
		var commentsHolder = $('comments');
		var xmlObj = ajaxObj.responseXML;
		var xmlNodes = _this.parseXML(xmlObj);
		commentsHolder.getElements('.new-reply').removeClass('new-reply');
		if(xmlNodes.message && xmlNodes.message.length && xmlNodes.comment && xmlNodes.comment.length) {
			document.forms['comment_form'].elements['timefield'].value = xmlNodes.timefield[0].firstChild.data;
			_this._addComments(xmlNodes);
		}
		_this.addNewCommentsToBar();
		commentForm.fireEvent('tm:loading-finished');
		_this.updateAllCommentsCount();
	},
	
	addNewCommentsToBar: function() {
		this.new_replies = $(document).getElements('.new-reply');
		for (var i=this.new_replies.length-1;i>=0;i--) {
			if (this.new_replies[i].hasClass('my-reply')) {
				this.new_replies.splice(i, 1);
			} else if (this.new_replies[i].hasClass('seen')) {
				this.new_replies.splice(i, 1);
			}
		}
		this.updateNewCommentsCount();
	},
	
	nextNewComment: function(){
		if (this.new_replies && this.new_replies.length) {
			var comment = this.new_replies[0];
			comment.addClass('seen');
			this.new_replies.splice(0, 1);
			this.goToComment(comment);
			this.updateNewCommentsCount();
		}
		return false;
	},
	
	updateAllCommentsCount: function() {
		if ($('comments').getElement('.comments-header .js-comments-count'))
			$('comments').getElement('.comments-header .js-comments-count').innerHTML = $('comments').getElements('.msg-meta').length.toString();
	},
	
	updateNewCommentsCount: function() {
		if (this.new_replies) {
			var count = this.new_replies.length;
			this.fireEvent('tm:new-comments-count-changed', this.new_replies.length);
		}
	},
	
	goToComment: function(comment) {
		this.fireEvent("tm:go-to-comment", comment.parentNode);
		this.scroller = (this.scroller || new Fx.Scroll(window));
		this.scroller.toElement(comment);
		return false;
	},
	
	quickGoToComment: function(comment) {
		this.fireEvent("tm:go-to-comment", comment.parentNode);
		window.location.href = "#" + comment.parentNode.id;
		return false;
	},

	goToParentComment: function(link) {
		var id = link.href.substr(link.href.indexOf('#')+1);
		var elm = $(id);
		link = $(link);
		elm.getElement('.down-to-child').removeClass('hidden');
		elm.getElement('.down-to-child a').href = '#' + link.getParent('.comment_holder').id;

		this.scroller = (this.scroller || new Fx.Scroll(window));
		this.scroller.toElement(elm);

		return false;		
	},
	
	goToChildComment: function(link) {
		var id = link.href.substr(link.href.indexOf('#')+1);
		var elm = $(id);
		link = $(link);
		link.getParent('.comment_holder').getElement('.down-to-child').addClass('hidden');

		this.scroller = (this.scroller || new Fx.Scroll(window));
		this.scroller.toElement(elm);

		return false;		
	},
		
	goToId: function(id) {
		this.scroller = (this.scroller || new Fx.Scroll(window));
		this.scroller.toElement($(id));
		return false;
	},
	
	sortArray: function(a, b) {
	  if (a.offsetTop < b.offsetTop)
	    return -1;
	  if (a.offsetTop > b.offsetTop)
	    return 1;
	  return 0;		
	},
	

	showError: function(errorMsg){
		if (!errorMsg) {
			errorMsg = FAT.votings_unknown_error;
		}
		futu_alert(FAT.votings_header, errorMsg, true, 'error');
	}
	
});

var commentForm = new commentFormClass();
tm.init.add(function(){
	var c_form_node = $('comment_form');
	if (c_form_node) {
		
		c_form_node.getElement('input.preview').addEvent('click',function(){
			commentForm.sendComment(c_form_node, 'preview')
		});
		
		var c_form_submit = function(){
			if (c_form_node.last_text == c_form_node['comment[message]'].value){
				
			} else {
				commentForm.sendComment(c_form_node, comment_type); 
				
			}
		}
		
		var comment_type = c_form_node.getElement('#comment_type').title;
		c_form_node.addEvents({
			'submit':function(){
				c_form_submit();
				return false;	
			},
			'keyup':function(e){
				if(e.control && (e.key == 'enter')) {
					c_form_submit();
				}
			}
			
		})
		
		
		
	}
})