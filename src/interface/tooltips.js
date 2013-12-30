//////////////////////////////////////////////////////////////////////
////////////////////////////// DOM HANDLERS //////////////////////////
//////////////////////////////////////////////////////////////////////

/**
 * Get the tooltip handle for a type/key
 *
 * @param {String}  type
 * @param {Integer} key
 *
 * @return {String}
 */
CookieMonster.identifier = function(type, key) {
	return 'cm_'+type+'_'+key+'_';
};

/**
 * Create a tooltip for a type of object
 *
 * @param {Object} object
 * @param {String} type
 *
 * @return {Void}
 */
CookieMonster.makeTooltip = function(object, type) {
	var identifier = this.identifier(type, object.id);
	var warning    = this.getImage('warning');
	var caution    = this.getImage('caution');

	object.desc += ''+
		'<div id="' +identifier+ 'lucky_" style="position:absolute; top:-25px; left:-12px; height:32px;">'+
			'<div class="cm-tooltip__image" id="' +identifier+ 'lucky_div_warning" style="background:url(' +warning+ ');"></div>'+
			'<div class="cm-tooltip__image" id="' +identifier+ 'lucky_div_caution" style="background:url(' +caution+ ');"></div>'+
		'</div>'+
		'<div class="cm-tooltip" id="' +identifier+ '"></div>'+
		'<div id="' +identifier+ 'note_div" style="position:absolute; left:0px; margin-top:10px; color:white;">'+
			'<div id="' +identifier+ 'note_div_warning" class="cm-tooltip__warning border-red">'+
				'<strong class="text-red">Warning:</strong>' +this.texts.warning+ '<br>'+
				'<span id="' +identifier+ 'warning_amount"></span>'+
				'<div id="' +identifier+ 'lucky_div_warning">'+
					'<img src="' +warning+ '">'+
				'</div>'+
			'</div>'+
			'<div id="' +identifier+ 'note_div_caution" class="cm-tooltip__warning border-yellow">'+
				'<strong class="text-yellow">Caution:</strong>' +this.texts.warning+ ' (Frenzy)<br>'+
				'<span id="' +identifier+ 'caution_amount"></span>'+
				'<div id="' +identifier+ 'lucky_div_warning">'+
					'<img src="' +caution+ '">'+
				'</div>'+
			'</div>'+
		'</div>';
};

/**
 * Update a Building/Upgrade tooltip
 *
 * @param {String}  type
 * @param {Integer} key
 * @param {Array}   colors
 * @param {Array}   deficits
 * @param {Array}   informations
 *
 * @return {Void}
 */
CookieMonster.updateTooltip = function(type, key, colors, deficits, informations) {
	var identifier = '#'+this.identifier(type, key);
	var $object    = $(identifier);

	// Create tooltip if it doesn't exist
	var object = type === 'up' ? Game.UpgradesById[key] : Game.ObjectsById[key];
	if (object.desc.indexOf(this.identifier(type, key)) === -1) {
		this.makeTooltip(object, type);
	}

	// Update informations
	$object.css({
		'border'  : '1px solid #'+this.color(colors[0]),
		'display' : '',
	}).html(
		'<div class="text-blue" style="position:absolute; top:4px; left:4px; font-weight:bold;">Bonus Income</div>'+
		'<div align=right style="position:absolute; top:18px; left:4px; color:white;">' + this.formatNumber(informations[0]) + '</div>'+

		'<div class="text-blue" style="position:absolute; top:34px; left:4px; font-weight:bold;">Base Cost Per Income</div>'+
		'<div align=right class="text-' +colors[0]+ '" style="position:absolute; top:48px; left:4px;">' + this.formatNumber(informations[1]) + '</div>'+

		'<div class="text-blue" style="position:absolute; top:64px; left:4px; font-weight:bold;">Time Left</div>'+
		'<div align=right class="text-' +colors[1]+ '" style="position:absolute; top:78px; left:4px;">' + this.formatTime(informations[2], true) + "</div>"
	);

	$(identifier+'warning_amount').text('Deficit: ' + this.formatNumber(deficits[0]));
	$(identifier+'caution_amount').text('Deficit: ' + this.formatNumber(deficits[1]));

	if (this.getSetting('LuckyAlert') === 1 || this.getSetting('LuckyAlert') === 2) {
		$(identifier+'lucky_div_warning').toggle(deficits[0] > 0);
		$(identifier+'lucky_div_caution').toggle(deficits[1] > 0);
	} else {
		$(identifier+'lucky_div_warning').hide();
		$(identifier+'lucky_div_caution').hide();
	}

	if (this.getSetting('LuckyAlert') === 1 || this.getSetting('LuckyAlert') === 3) {
		$(identifier+'note_div_warning').toggle(deficits[0] > 0);
		$(identifier+'note_div_caution').toggle(deficits[1] > 0);
	} else {
		$(identifier+'note_div_warning').hide();
		$(identifier+'note_div_caution').hide();
	}
};

//////////////////////////////////////////////////////////////////////
//////////////////////// GLOBAL SETUP AND UPDATE /////////////////////
//////////////////////////////////////////////////////////////////////

/**
 * Create the DOM for all tooltips
 *
 * @return {void}
 */
CookieMonster.setupTooltips = function() {
	this.updateTooltips();

	// Rebuild game elements
	Game.RebuildUpgrades();
	Game.RebuildStore();
};

/**
 * Update one or more types of tooltips
 *
 * @param {string} which [upgrades,objects,all]
 *
 * @return {void}
 */
CookieMonster.updateTooltips = function(which) {
	if (typeof which === 'undefined') {
		which = 'all';
	}

	// Upgrades
	if (which === 'all' || which === 'upgrades') {
		this.upgradeCounts = [0, 0, 0, 0, 0, 0];
		Game.UpgradesById.forEach(function (upgrade) {
			CookieMonster.manageUpgradeTooltips(upgrade);
		});
		this.updateStoreCounters();
	}

	// Buildings
	if (which === 'all' || which === 'objects') {
		Game.ObjectsById.forEach(function (building) {
			CookieMonster.manageBuildingTooltip(building);
		});
	}
};

//////////////////////////////////////////////////////////////////////
//////////////////////////////// MANAGERS ////////////////////////////
//////////////////////////////////////////////////////////////////////

/**
 * Get the lucky alerts for a price
 *
 * @param {Integer} price
 *
 * @return {Array}
 */
CookieMonster.getLuckyAlerts = function(price) {
	var rewards  = [this.luckyReward('regular'), this.luckyReward('frenzy')];
	var deficits = [0, 0];

	// Check Lucky alert
	if (Game.cookies - price < rewards[0]) {
		deficits[0] = rewards[0] - (Game.cookies - price);
	}

	// Check Lucky Frenzy alert
	if (Game.cookies - price < rewards[1]) {
		deficits[1] = rewards[1] - (Game.cookies - price);
	}

	return deficits;
};

/**
 * Handles the creation/update of an upgrade's tooltip
 *
 * @param {Object} upgrade
 *
 * @return {void}
 */
CookieMonster.manageUpgradeTooltips = function(upgrade) {
	// Cancel if the upgrade isn't in the store
	if (!this.isInStore(upgrade)) {
		return;
	}

	var colors       = ['yellow', 'yellow'];
	var income       = this.getUpgradeWorth(upgrade);

	// Gather comparative informations
	var informations = [this.roundDecimal(upgrade.basePrice / income), Math.round(this.secondsLeft(upgrade.id, 'upgrade'))];
	var maxValues    = this.getBestValue('max');
	var minValues    = this.getBestValue('min');

	// Compute upgrade color
	for (var i = 0; i < colors.length; i++) {
		if (informations[i] < minValues[i]) {
			colors[i] = 'blue';
		} else if (informations[i] === minValues[i]) {
			colors[i] = 'green';
		} else if (informations[i] === maxValues[i]) {
			colors[i] = 'red';
		} else if (informations[i] > maxValues[i]) {
			colors[i] = 'purple';
		} else if (maxValues[i] - informations[i] < informations[i] - minValues[i]) {
			colors[i] = 'orange';
		}
	}

	// Update store counters
	var colorKey = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'].indexOf(colors[0]);
	this.upgradeCounts[colorKey]++;

	// Add color icon
	if (this.getSetting('UpgradeIcons')) {
		$('#upgrade' + Game.UpgradesInStore.indexOf(upgrade)).html('<div class="cookie-monster__upgrade background-' +colors[0]+ '"></div>');
	}

	return this.updateTooltip('up', upgrade.id, colors, this.getLuckyAlerts(upgrade.basePrice), [
		this.roundDecimal(income),
		informations[0],
		informations[1],
	]);
};

/**
 * Handles the creation/update of a building's tooltip
 *
 * @param {Object} building
 *
 * @return {void}
 */
CookieMonster.manageBuildingTooltip = function(building) {
	var colors       = ['yellow', 'yellow'];
	var informations = [this.bottomBar.cpi[building.id], this.bottomBar.timeLeft[building.id]];
	var maxValues    = this.getBestValue('max');
	var minValues    = this.getBestValue('min');

	// Compute building color
	for (var i = 0; i < colors.length; i++) {
		if (informations[i] === minValues[i]) {
			colors[i] = 'green';
		} else if (informations[i] === maxValues[i]) {
			colors[i] = 'red';
		} else if (maxValues[i] - informations[i] < informations[i] - minValues[i]) {
			colors[i] = 'orange';
		}
	}

	// Colorize building price
	$('.price', '#product'+building.id).addClass(this.getBooleanSetting('ColoredPrices') ? 'text-'+colors[0] : '');

	return this.updateTooltip('ob', building.id, colors, this.getLuckyAlerts(building.price), [
		this.bottomBar.bonus[building.id],
		informations[0],
		informations[1],
	]);
};