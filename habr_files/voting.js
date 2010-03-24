/*
<div id="user{{ $id }}" class="vote_holder (login_holder)">
		<div class="voting (positive || negative) (mine || voted) (plus || minus)">
			<span class="vote_title">Карма пользователя</span>
			<span class="vote_points">
				<em>{{ $score }}</em>
				<strong>{{ $count }}  /strong>
			</span>
			<div class="vote_buttons">
				<a onclick="return Voter.vote(event, this, 'user || comment || post', 'plus');" class="vote_plus" href=""></a>
				<a onclick="return Voter.vote(event, this, 'user || comment || post', 'minus');" class="vote_minus" href=""></a>
			</div>
		</div>	
	</div>
</div>
*/


Voter = {
	voteType: {
			post: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: { // default data
						action: 'vote',
						mode: 'posts',
						target_name: 'post',
						dblVote: false // double voting is allowded
					}
			},
			
			post_comment: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: {
						action: 'vote',
						target_name: 'post_comment',
						dblVote: false
					}
			},
			
			user: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: {
						action: 'vote',
						mode: 'users',
						target_name: 'user',
						dblVote: true
					}
			},

			company: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: {
						action: 'vote',
						mode: 'company',
						target_name: 'company',
						dblVote: true
					}
			},
			
			blog: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: {
						action: 'vote',
						mode: 'blog',
						target_name: 'blog',
						dblVote: true
					}
			},
			
			company_comment: {
					url: (window.baseURL || '') + '/ajax/voting/',
					dData: {
						action: 'vote',
						target_name: 'company_comment',
						dblVote: true
					}
			}
	},


	voteMark: {
			plus: {
					string: 'plus',
					number: 1
			},

			minus: {
					string: 'minus',
					number: -1
			},
			
			results: {
					string: 'results',
					number: 0
			}
	},

	htmlNodeNames: {
			score: 'span',
			count: 'em',
			mark: 'strong'
	},

	xmlNodeNames: {
			error: 'error',
			score: 'score',
			count: 'count',
			mark: 'mark',
			charge_string: 'charge_string'
	},

	classNames: {
			voteHolder: 'vote_holder',
			votingBlock: 'voting',
			votePoints: 'mark',
			voteCount: 'total',
			loginHolder: 'login_holder',
				
			inuse: 'inuse', // depricated (not used)
			showChoice: 'show_choice',

			isMine: 'mine',
			isExpired: 'expired',
			noAccess: 'no_auth',
			//noVoting: 'no_voting',

			isPositive: 'positive',
			isNegative: 'negative',

			isVoted: 'voted',
			isVotedPlus: 'voted_plus',
			isVotedMinus: 'voted_minus',

			isLoading: 'isLoading'
	},

	choice: {
			show: function(link){
					var linkGlobalParent = $(link).getParent('.' + Voter.classNames.voteHolder);
					//alert(linkGlobalParent); return;
					var linkLocalParent = link;
					if (!$(linkLocalParent).hasClass(Voter.classNames.isMine) && // if not mine
						!$(linkLocalParent).hasClass(Voter.classNames.isVoted) && // if not voted
						!$(linkLocalParent).hasClass(Voter.classNames.isExpired)) { // время голосования прошло
						$(linkGlobalParent).addClass(Voter.classNames.showChoice);
					}
			},

			hide: function(event, link){
					if(!event) event = window.event;
					var linkChildren = link.getElementsByTagName('*');
					var linkGlobalParent = $(link).getParent('.' + Voter.classNames.voteHolder);

					// если элемент, на который передвигаем мышь, лежит внутри чойс блока, выходим
					if (event.relatedTarget) {
						var where = event.relatedTarget;
						if (where == link) return;
						if (where.nodeType == 3) where = where.parentNode;
						for(var i=0; i<linkChildren.length; i++){
							if (where == linkChildren[i]) {
								return;
							}
						}
					} else if (event.toElement && link.contains(event.toElement)) {
						return;
					}
					
					$(linkGlobalParent).removeClass(Voter.classNames.showChoice);
			}
	},
	
	vote: function(event, link, voteType, voteMark){
			if(!(link && voteType && Voter.voteType[voteType] && voteMark)) return false; // if params are incompleted
			
			
			
			var linkGlobalParent = $(link).getParent('.' + Voter.classNames.voteHolder);
			var linkLocalParent = $(link).getParent('.' + Voter.classNames.votingBlock);
			
			if (!linkGlobalParent || !linkLocalParent || // global or local parent was not found
				$(linkLocalParent).hasClass(Voter.classNames.isVoted) && !Voter.voteType[voteType].dData.dblVote || // was voted already and double vote is not allowded
				$(linkLocalParent).hasClass(Voter.classNames.isVoted) && (Voter.voteType[voteType].dData.dblVote && $(linkLocalParent).hasClass(voteMark)) || // was voted already and double vote is allowded and 
				$(linkLocalParent).hasClass(Voter.classNames.isLoading)) { // is loading 
				return false;
			}
			if ($(linkLocalParent).hasClass(Voter.classNames.isMine)) {
				futu_alert(FAT.votings_header, FAT.votings_error_self, false, 'error');
				return false;
			}
			if ($(linkLocalParent).hasClass(Voter.classNames.isExpired)) {
				futu_alert(FAT.votings_header, FAT.votings_error_is_expired, false, 'error');
				return false;
			}
			
			
			
			if ($(linkLocalParent).hasClass(Voter.classNames.noAccess)) {
				futu_alert(FAT.votings_header, FAT.votings_error_no_access, false, 'error');
				return false;
			}
			if ($(linkLocalParent).hasClass(Voter.classNames.loginHolder) && loginForm && loginForm.show) { // try to vote as guest
				if(!loginForm.html.block){ // if there is no any html of login_form on the page (user is not a guest)
					futu_alert(FAT.votings_header, FAT.votings_error_prohibited, true, 'error');
				} else {
					loginForm.show(event, link);
				}
				
				return false;
			}

			
			
			Voter.server.sendData(linkGlobalParent, linkLocalParent, voteType, voteMark);
			return false;
	},

	server: {
			sendData: function(linkGlobalParent, linkLocalParent, voteType, voteMark){
					var url =  Voter.voteType[voteType].url; 

					var action = Voter.voteType[voteType].dData.action;
					var target_name = Voter.voteType[voteType].dData.target_name;
					var mark = Voter.voteMark[voteMark] ? Voter.voteMark[voteMark].number : '';
					var target_id = linkGlobalParent.getAttribute('id') ? linkGlobalParent.getAttribute('id').match(/\d+/g)[0] : '';

					var data = 'action=' + action + '&target_name=' + target_name + '&target_id=' + target_id + '&mark=' + mark;
					var params = {
						linkGlobalParent: linkGlobalParent,
						linkLocalParent: linkLocalParent,
						mark : mark,
						voteType : voteType
					}
					$(linkLocalParent).addClass(Voter.classNames.isLoading);
					ajaxLoadPost(url, data, Voter.server.sendDataOnload, window, params);	
			},

			sendDataOnload: function(ajaxObj, params){
					/*
						params = {
							linkGlobalParent
							linkLocalParent
							mark
							voteType
						}
					*/
					if(ajaxObj && ajaxObj.responseXML){
						var xml = ajaxObj.responseXML;
						var errors = xml.getElementsByTagName(Voter.xmlNodeNames.error);
						if(errors.length && errors[0] && errors[0].firstChild.nodeType == 3) {
							Voter.showError(errors[0].firstChild.data);
							$(params.linkLocalParent).removeClass(Voter.classNames.isLoading);
							return;
						} else {
							var scores = xml.getElementsByTagName(Voter.xmlNodeNames.score);
							if(scores.length && scores[0] && scores[0].firstChild.nodeType == 3) {
								params.score = scores[0].firstChild.data;
							}

							var count = xml.getElementsByTagName(Voter.xmlNodeNames.count);
							if(count.length && count[0] && count[0].firstChild.nodeType == 3) {
								params.count = count[0].firstChild.data;
							}
							
							var mark = xml.getElementsByTagName(Voter.xmlNodeNames.mark);
							if(mark.length && mark[0] && mark[0].firstChild.nodeType == 3) {
								params.mark = mark[0].firstChild.data;
							}
							
							var charge_string = xml.getElementsByTagName(Voter.xmlNodeNames.charge_string);
							if(charge_string.length && charge_string[0]) {
								params.charge_string = charge_string[0].firstChild.data;
							}				
    						
							$(params.linkLocalParent).removeClass(Voter.classNames.isLoading);
							Voter.setScore(params);	
						}


					}
					
			}
	},

	setScore: function(params){
			/*
				params{
					linkGlobalParent
					linkLocalParent
					mark
					score
					count
				}
			*/
			$(params.linkLocalParent).addClass(Voter.classNames.isVoted);

			$(params.linkLocalParent).removeClass(Voter.classNames.isVotedPlus);
			$(params.linkLocalParent).removeClass(Voter.classNames.isVotedMinus);

			$(params.linkLocalParent).removeClass(Voter.classNames.isPositive);
			$(params.linkLocalParent).removeClass(Voter.classNames.isNegative);

			//removeClass(params.linkGlobalParent, Voter.classNames.inuse);
			
			if(params.score && params.score.charAt(0) == '–') {
				$(params.linkLocalParent).addClass(Voter.classNames.isNegative);
			} else if (params.score && params.score.charAt(0) != '–') {
				$(params.linkLocalParent).addClass(Voter.classNames.isPositive);
			} 

			if(params.mark && params.mark == '+'){
				$(params.linkLocalParent).addClass(Voter.classNames.isVotedPlus);
			} else if(params.mark && params.mark == '–') {
				$(params.linkLocalParent).addClass(Voter.classNames.isVotedMinus);
			}
			
			var usercharge = $('usercharge');
			usercharge && (usercharge.innerHTML = params.charge_string);
			
			try {
				var votePoints = $(params.linkLocalParent).getElement('.' + Voter.classNames.votePoints);

				var scoreBox = votePoints.getElementsByTagName(Voter.htmlNodeNames.score)[0];
				var markBox = votePoints.getElementsByTagName(Voter.htmlNodeNames.mark)[0];	
		
				scoreBox.innerHTML = params.score;
				scoreBox.setAttribute('title', params.count);
				markBox.innerHTML = ' (' + params.mark + ')';
				
/*				voteCount = $(params.linkLocalParent).getElements('.' + Voter.classNames.voteCount)[0];
				var countBox = voteCount.getElementsByTagName(Voter.htmlNodeNames.count)[0]; 
				countBox.innerHTML = params.count;*/
				
			} catch(e){
				//alert(e);
			}
	},

	showError: function(errorMsg){
		if (!errorMsg) {
			errorMsg = FAT.votings_unknown_error;
		}
		futu_alert(FAT.votings_header, errorMsg, false, 'error');
	}
};
tm.init.add(function(){
	var commentsContainer = $("comments");
	if (commentsContainer) {
		var infopanel = $(commentsContainer.parentNode).getElement(".entry-info");
		if (infopanel) {
			var postId = parseInt(infopanel.id.replace("infopanel","")),
			hasVoteMarkNode,scoreNode;



			var vote = function(o){
				if (temp.user) {

			        (new Request({
			            'url': '/ajax/voting/',
			            'data': {
			                'action': 'vote',
			                'mark': o.t,
			                'target_id': o.tid,
							'target_name' : "post_comment",
							'signed_id' : o.postid
			            },
						"onRequest":function(){
							getNodesForMarking(o.voteButton)
						},
						"onComplete": onComplete
			        })).send();

				}
			}
			var getNodesForMarking = function(voteButton) {
				hasVoteMarkNode = $(voteButton).getParent("ul.vote");
				scoreNode = hasVoteMarkNode.getElement(".mark span");
			}
			var onComplete = function(responseHTML, responseXML){
				var errors = responseXML.getElementsByTagName('error');
				if (errors.length) {
					var errortext = "";
					for (var i=0 , l = errors.length; i < l; i++) {
						if (errors[i].tagName == "error"){
							errortext += errors[i].firstChild.data + "</br>";
						}
					};
					futu_alert("Происшествие во время выборов", errortext, false, 'error');
				} else{
					var score = responseXML.getElementsByTagName('score')[0].firstChild.data,
					scoreNum = parseInt(score.replace("–","-")),
					voteType = responseXML.getElementsByTagName('mark')[0].firstChild.data + "";
					scoreNode.set("text",score);
					hasVoteMarkNode.addClass("voted");
					if (voteType == "–") {
						hasVoteMarkNode.addClass("voted_minus");
					} else if (voteType == "+"){
						hasVoteMarkNode.addClass("voted_plus");
					}
					if (scoreNum > 0) {
						hasVoteMarkNode.addClass("positive")
					} else if (scoreNum < 0) {
						hasVoteMarkNode.addClass("negative")
					}

				}

			}
			commentsContainer.addEvent("click",function(e){
				var node = e.target,
				nodeClassName = node.className;
				if (nodeClassName.indexOf("vote-for-comment") != -1) {
					var commentId = e.target.getAttribute("rev").replace("voter-for-comment:",""),
					voteType;
					if (nodeClassName.indexOf("vote_minus") != -1) {
						voteType = -1;
					} else if (nodeClassName.indexOf("vote_plus") != -1)  {
						voteType = 1;
					} else {
						return false;
					}

					vote({
						"tid":commentId,
						"t":voteType,
						"postid":postId,
						"voteButton":e.target
					});
					return false
				} else if (nodeClassName.indexOf('js-single-tree') != -1) {
					var last_comment_li = node.parentNode.parentNode.parentNode.parentNode,
						parent_li;
					last_comment_li.single_thread_nodes = [];
					for (var li = last_comment_li.parentNode.parentNode; li.nodeName == 'LI'; li = li.parentNode.parentNode) {
						$(li).addClass('single-tree-node').removeClass('single-tree-node-last');
						last_comment_li.single_thread_nodes.push(li)
						last_comment_li.first_comment_li = li;
					};
					if (last_comment_li.first_comment_li) {
						last_comment_li.addClass('single-tree-node-last');
						setTimeout(function(){
							last_comment_li.first_comment_li.scrollToMe();
						},300)
						setTimeout(function(){
							last_comment_li.first_comment_li.removeClass('single-tree-node').addClass('single-threading');
						},700)
						
						
						
					} else {
						for (var i=0, l = last_comment_li.single_thread_nodes.length; i < l; i++) {
							last_comment_li.single_thread_nodes[i].removeClass('single-tree-node');
						};
					};
					return false;
				} else if(nodeClassName.indexOf('js-multiplay-tree') != -1) {
					var last_comment_li = node.parentNode.parentNode.parentNode.parentNode;
					if (last_comment_li.first_comment_li) {
						
						last_comment_li.first_comment_li.removeClass('single-threading');
					
						for (var i=0, l = last_comment_li.single_thread_nodes.length; i < l; i++) {
							last_comment_li.single_thread_nodes[i].removeClass('single-tree-node');
						};
						
						$(last_comment_li).scrollToMe();
						setTimeout(function(){
							last_comment_li.removeClass('single-tree-node-last');
						},800)
					}
					
				}
			})
		}
		
	}
})