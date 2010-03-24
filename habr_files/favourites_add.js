tm=tm||{};
tm.Forms=tm.Forms||{};

tm.Forms.favourites_add = function () {
	this._handler.extend({
		'message': function(nodes) {
			if (temp.favourites_add.container) {
				var fav = temp.favourites_add.container.getElement('div.js-to_favs_holder');
				fav && fav.removeClass('to-favs').addClass('fav_added');
				temp.favourites_add.setTags(temp.favourites_add.tags.value);
			};
			temp.favourites_add.hide();
		}
	});
};