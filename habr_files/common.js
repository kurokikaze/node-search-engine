tm.init.add(function(){
	var pageNav = null;
	if (pageNav = $(document).getElement('.page-nav')) {
		var prev = pageNav.getElement('.next-prev .prev');
		var next = pageNav.getElement('.next-prev .next');
		$(window).addEvent('keydown', function(e){
			if (((e.control && e.key == 'right') || (e.alt && e.key == 'right')) && next) {
				top.location.href = next.get("href");
				e.stop();
			} else if (((e.control && e.key == 'left') || (e.alt && e.key == 'left')) && prev) {
				top.location.href = prev.get("href");
				e.stop();
			}
		});
	}
	var search = $("search");
	if (search) {
		var input 		= search,
			label 		= input.getParent(),
			labelspan 	= label.getElement('span');
		if (input && label) {
			
			if (!input.value) {
				label.addClass("input-placeholding");
			}

			input.addEvents({
				'focus': function () {
					if (!label.noplaceholding) {
						label.removeClass("input-placeholding");
						label.noplaceholding = true;
					}
				},
				'blur': function () {
					if (input.value == '') {
						label.addClass("input-placeholding");
						label.noplaceholding = false;
					}
				},
				'change' : function() {
					if (!label.noplaceholding) {
						label.removeClass("input-placeholding");
						label.noplaceholding = true;
					}
				}
			})
			labelspan.addEvent('mousedown',function(){
				input.focus();
				return false
			})
		}
	}
	var help_tips = $$('.help-tip');
	if (help_tips && help_tips.length) {
		var current_tip = null;
		var tip_hidding_timeout;
		
		var ht_nice_node = $('help-tip-text');
			ht_nice_node.text_node = ht_nice_node.getElement('#help-tip-text-content');

		var show_help_tip = function(text,node){
			clearTimeout(tip_hidding_timeout);
			if (current_tip == node) {return true;}
			
			var p = node.getPosition();
			
			var px = p.x + node.getStyle('width').toInt()/2;
			var py = p.y;
			node
			
			ht_nice_node.style.top = py + 'px';
			ht_nice_node.style.left = px + 'px';
			if (px < 179 ) {
				ht_nice_node.addClass('help-tips-too-much-left');
			}
			
			ht_nice_node.text_node.innerHTML = text;
			ht_nice_node.style.display = 'block';
			current_tip = ht_nice_node;
		}
		var hide_help_tip = function(){
			tip_hidding_timeout = setTimeout(function(){
				ht_nice_node.style.display = '';
				ht_nice_node.text_node.textContent = '';
				ht_nice_node.removeClass('help-tips-too-much-left');
			},333)
			
		}
		
		for (var i=0, l = help_tips.length; i < l; i++) {
			var help_tip_node = help_tips[i];
			
			var help_tip_node_childs = help_tip_node.getElements('*');
			if (help_tip_node_childs && help_tip_node_childs.length) {
				
				for (var k=0, g= help_tip_node_childs.length; k < g; k++) {
					help_tip_node_childs[k].htn = help_tip_node;

				};
			}
			tm.log('zzwww');
			
			help_tip_node.htn = help_tip_node;
			
			var title = help_tip_node.title;
			if (title.match('br/')) {
				help_tip_node.help_tip = help_tip_node.getElement('.help-tip-text').innerHTML
			} else {
				help_tip_node.help_tip = title;
			}
			
			help_tip_node.title = '';
			
			help_tip_node.addEvents({
				'mouseover': function(e){ 
					show_help_tip(e.target.htn.help_tip,e.target.htn);
				},
				'mouseout': hide_help_tip
			})
			
			
		};
		ht_nice_node.addEvents({
			'mouseover': function(){ 
				clearTimeout(tip_hidding_timeout);
			},
			'mouseout': hide_help_tip
		})
	}
});
