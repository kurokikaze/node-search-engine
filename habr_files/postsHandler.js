var postsHandler = function() {
	this.posts_it = -1;
	this.posts = [];
	this.currentPage = '';
	this.isPostBeingRead = false;
}
	
postsHandler.prototype.init = function() {

	var _this = this;
	
	this.posts = $('wrapper').getElements('.hentry');
	this.posts.sort(postsHandler.sortArray);
	
	document.onkeyup = function(ev) {
		
		var targ;
		if(!ev)	ev=window.event;
		if (!document.all) ev.preventDefault(); else ev.returnValue = false;
	
		if (ev.target) targ = ev.target;
		else if (ev.srcElement) targ = ev.srcElement;
		if (targ.nodeType == 3) targ = targ.parentNode;
		
		var key = getCharCode(ev);
		
		if(targ.tagName != 'TEXTAREA' && targ.tagName != 'INPUT') {
			if(key==72) {
				_this.top(ev);
			}
			else if(key==75) {
				_this.prev(ev);
			}
			else if(key==74) {
				_this.next(ev);
			}
		}
	}
};

postsHandler.prototype.sortArray = function(a, b) {
  if (a.offsetTop < b.offsetTop)
    return -1;
  if (a.offsetTop > b.offsetTop)
    return 1;
  return 0;		
};

//���������� ������� ����
postsHandler.prototype.detectCurrentPost = function() {
	this.isPostBeingRead = false;
	var bounds = this.getWindowBounds();
	var post = -1;
	var posts_length = this.posts.length;
	for(var i=0; i<posts_length; i++) {
		if(this.posts[i+1]) {
			if($(this.posts[i]).getPosition().y<=bounds.y && $(this.posts[i]).getPosition().y>=bounds.y) {
				var post = i;
			}
		}
		else if ($(this.posts[i]).getPosition().y<=bounds.y) {
			var post = i;
		}
	}
	if(post>-1 && bounds.y!=$(this.posts[post]).getPosition().y) {
		this.isPostBeingRead = true;
	}
	return post;
};

//�������� ���������� ������� �������
postsHandler.prototype.getWindowBounds = function() {
    var w, h, x, y;

    if (window.gecko) {
        var b = document.body;
        w = b.clientWidth;
        h = b.clientHeight;
        x = window.scrollX;
        y = window.scrollY;
    }
    else if (window.webkit) {
        w = window.innerWidth;
        h = window.innerHeight;
        x = window.scrollX;
        y = window.scrollY;
    }
    else if (window.opera) {
        w = window.innerWidth;
        h = window.innerHeight;
        x = window.pageXOffset;
        y = window.pageYOffset;
    }
    else {
        var d = document.documentElement;
        var b = document.body;
        w = d.clientWidth  ? d.clientWidth  : b.clientWidth  ? b.clientWidth  : 0;
        h = d.clientHeight ? d.clientHeight : b.clientHeight ? b.clientHeight : 0;
        x = d.scrollLeft   ? d.scrollLeft   : b.scrollLeft   ? b.scrollLeft   : 0;
        y = d.scrollTop    ? d.scrollTop    : b.scrollTop    ? b.scrollTop    : 0;
    }

    return {
        'w': w,
        'h': h,
        'x': x,
        'y': y
    };
	
};

postsHandler.prototype.top = function(ev) {
	if(!ev)	ev=window.event;
	if (!document.all) ev.preventDefault(); else ev.returnValue = false;
	
	window.scrollTo(0,0);
};

postsHandler.prototype.prev = function(ev) {
	if(!ev)	ev=window.event;
	if (!document.all) ev.preventDefault(); else ev.returnValue = false;	
	
	this.posts_it = this.detectCurrentPost();

	if(this.posts && this.posts.length) {
		if(this.posts_it<=this.posts.length && this.posts_it>0) {
			if(!this.isPostBeingRead) {
				this.posts_it--;
			}
			window.scrollTo(0,$(this.posts[this.posts_it]).getPosition().y);
		}
		else if (this.posts_it<=0){
			this.prevPage();
		}
		else if(this.posts_it>this.posts.length) {
			this.posts_it = this.posts.length-2;
			window.scrollTo(0,$(this.posts[this.posts_it]).getPosition().y);
		}
	}
};

postsHandler.prototype.next = function(ev) {
	if(!ev) ev=window.event;
	if (!document.all) ev.preventDefault(); else ev.returnValue = false;
	
	this.posts_it = this.detectCurrentPost();

	if(this.posts && this.posts.length) {
		var bounds = this.getWindowBounds();
		var docHeight = $('header-wrapper').offsetHeight+$('wrapper').offsetHeight+$('footer').offsetHeight+50;
		if((bounds.y + bounds.h) == docHeight || (bounds.y + bounds.h) == docHeight+10){
			this.nextPage();
		}
		if(this.posts_it<this.posts.length-1 && this.posts_it>=-1) {
			this.posts_it++;
			window.scrollTo(0,$(this.posts[this.posts_it]).getPosition().y);
		}
	}
};

postsHandler.prototype.nextPage = function() {
	if(window.location.href.match(/\d+/g)) {
		this.currentPage = window.location.href.match(/\d+/g)[0];
		this.currentPage = parseInt(this.currentPage);
		this.nextPage = this.currentPage + 1;
		window.location.href = window.location.href.replace(this.currentPage, this.nextPage);
	}
	else {
		this.nextPage = 2;
		window.location.href = window.location.href + 'page' + this.nextPage;
	}
};

postsHandler.prototype.prevPage = function() {
	if(window.location.href.match(/\d+/g)) {
		this.currentPage = window.location.href.match(/\d+/g)[0];
		if(this.currentPage!='1') {
			this.currentPage = parseInt(this.currentPage);
			this.nextPage = this.currentPage-1;
			window.location.href = window.location.href.replace(this.currentPage, this.nextPage);
		}
		else {
			window.scrollTo(0,0);
		}
	}
	else {
		window.scrollTo(0,0);
	}
	
};

var postsHandler = new postsHandler();

window.addEvent('domready', function() {
	postsHandler.init();
});