Element.implement({
	flash: function(to,from,reps,prop,dur) {
		if(!reps) { reps = 1; }
		if(!prop) { prop = 'background-color'; }
		if(!dur) { dur = 250; }
		var effect = new Fx.Tween(this, {
				duration: dur,
				link: 'chain'
			})
		for(x = 1; x <= reps; x++)
			effect.start(prop,from,to).start(prop,to,from);
	},
	replaceClass: function(class1, class2) {
		this.removeClass(class1);
		this.addClass(class2);
	},
	switchClass: function(class1, class2) {
		if (this.hasClass(class1))
			this.replaceClass(class1, class2);
		else
			this.replaceClass(class2, class1);
	}
});

//*****************************************************************************
//**************  ВНИМАНИЕ! ДАЛЬШЕ ИДЕТ СТРАШНЫЙ СТАРЫЙ КОД!  *****************
//****************  ОДЕНЬТЕ СКАФАНДР ПРИ ВХОДЕ В ЭТУ ЗОНУ!  *******************
//*****************************************************************************


//****************************** Наследование *********************************
Function.prototype.inheritsFrom = function(BaseClass) { // thanks to Kevin Lindsey for this idea
	var Inheritance = function() {};
	Inheritance.prototype = BaseClass.prototype;
	this.prototype = new Inheritance();
	this.prototype.constructor = this;
	this.superClass = BaseClass;
}

Object.extendObject = function(destination, source) {
	for (var property in source)
		destination[property] = source[property];
	return destination;
};

//*************************** Работа с событиями ******************************
function getCharCode(ev) {
	if (ev.charCode) var charCode = ev.charCode;
	else if (ev.keyCode) var charCode = ev.keyCode;
	else if (ev.which) var charCode = ev.which;
	else var charCode = 0;
	return charCode;
}

//************************* Определение броузеров *****************************
if (window.ActiveXObject) window.ie = window[window.XMLHttpRequest ? 'ie7' : 'ie6'] = true;
else if (document.childNodes && !document.all && !navigator.taintEnabled) window.webkit = window[window.xpath ? 'webkit420' : 'webkit419'] = true;
else if (document.getBoxObjectFor != null) window.gecko = true;
var isIE  = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
var isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;


//********************************** AJAX *************************************
/*
	url - откуда загружаем
	ajaxCallBackFunction - что вызываем по завершении загрузки
	params - параметры в виде объекта или массива
	callObject - методом какого объекта является ajaxCallBackFunction (если это метод, а не глобальная фунция)
*/
function ajaxPost(url, data, ajaxCallBackFunction, params, callObject, ajaxCallBackErrorFunction) {
	var ajaxObject = null;
	if (window.XMLHttpRequest) // branch for native XMLHttpRequest object
		ajaxObject = new XMLHttpRequest();
	else if (window.ActiveXObject) // branch for IE/Windows ActiveX version
		ajaxObject = new ActiveXObject("Microsoft.XMLHTTP");
	if(ajaxObject){
		ajaxObject.onreadystatechange = function(){
			ajaxHandler(ajaxObject, ajaxCallBackFunction, params, callObject, ajaxCallBackErrorFunction);
		}
		ajaxObject.open("POST", url, true);
		ajaxObject.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		ajaxObject.setRequestHeader("Content-length", data.length);
		ajaxObject.setRequestHeader("Connection", "close");
		ajaxObject.send(data);	
	}
}


function ajaxHandler(ajaxObject, ajaxCallBackFunction, params, callObject, ajaxCallBackErrorFunction){ 
	if (ajaxObject.readyState == 4)
		if (ajaxObject.status == 200)
			ajaxCallBackFunction.call(callObject, ajaxObject, params);
		else
			if(ajaxCallBackErrorFunction)
				ajaxCallBackErrorFunction.call(callObject, ajaxObject);	
			else
				futu_alert("",/*("Возникла ошибка в получении XML данных:<br />" + ajaxObject.statusText)*/ 'Упс! Что-то пошло не так. Попробуйте еще раз.', false, 'error');
}

function ajaxLoadPost(url, data, ajaxCallBackFunction, callObject, params, ajaxCallBackErrorFunction) {
	var ajaxObject = null;
	if (window.XMLHttpRequest) // branch for native XMLHttpRequest object
		ajaxObject = new XMLHttpRequest();
	else if (window.ActiveXObject) // branch for IE/Windows ActiveX version
		ajaxObject = new ActiveXObject("Microsoft.XMLHTTP");
	if(ajaxObject){
		ajaxObject.onreadystatechange = function(){
			ajaxLoadHandler(ajaxObject, ajaxCallBackFunction, callObject, params, ajaxCallBackErrorFunction);
		}
		ajaxObject.open("POST", url, true);
		ajaxObject.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		ajaxObject.setRequestHeader("Content-length", data.length);
		ajaxObject.setRequestHeader("Connection", "close");
		ajaxObject.send(data);
	}
}
function ajaxLoadHandler(ajaxObject, ajaxCallBackFunction, callObject, params, ajaxCallBackErrorFunction){
	if (ajaxObject.readyState == 4)
		if (ajaxObject.status == 200)
			ajaxCallBackFunction.call(callObject, ajaxObject, params);
		else
			if(ajaxCallBackErrorFunction)
				ajaxCallBackErrorFunction.call(callObject, ajaxObject);	
			else
				futu_alert("",/*("Возникла ошибка в получении XML данных:<br />" + ajaxObject.statusText)*/ 'Упс! Что-то пошло не так. Попробуйте еще раз.', true, 'error');
}
