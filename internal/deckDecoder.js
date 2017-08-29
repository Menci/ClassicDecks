// Copyright (c) 2017, Roel Spilker. Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

var deckDecoder = function() {
	var reader = function(encoded) {
		var index = 0;
		var bytes = atob(encoded);

		var _reader = {};
		_reader['nextByte'] = function() {
			return bytes.charCodeAt(index++);
		};

		_reader['nextVarInt'] = function() {
			var read = [];
			var next = 128;
			var result = 0;
			var multiplier = 1;
			while (next >= 128) {
				next = _reader.nextByte();
				read.push(next & 127);
			}
			for (var i = 0; i < read.length; i++) {
				result += read[i] * multiplier;
				multiplier *= 128;
			}
			return result;
		};
		return _reader;
	};


	var lookup = fetch('https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json')
			.then(function(response) { return response.json(); })
			.then(function(data){
				var result = {};
				for (var i = 0; i < data.length; i++) {
					result[data[i]['dbfId']] = data[i];
				}
				return result;
			});

	var cardClasses = {
		'WARRIOR': 'Warrior',
		'HUNTER': 'Hunter',
		'DRUID': 'Druid',
		'MAGE': 'Mage',
		'PALADIN': 'Paladin',
		'PRIEST': 'Priest',
		'WARLOCK': 'Warlock',
		'ROGUE': 'Rogue',
		'SHAMAN': 'Shaman',
		'NEUTRAL': 'All Classes'
	};

	var resolve = function(deck, lookup) {
		var cards = [];
		for (var i = 0; i < deck.cards.length; i++) {
			cards.push({count: deck.cards[i].count, card: lookup[deck.cards[i].dbfId]})
		}
		cards.sort(function(a, b) {
			var result = a.card.cost - b.card.cost;
			if (result !== 0) {
				return result;
			}
			return (a.card.name > b.card.name) - (a.card.name < b.card.name);
		});
		return {heroClass: cardClasses[lookup[deck.hero].cardClass], type: (deck.type === 1 ? "Wild" : "Standard"), hero: lookup[deck.hero], cards: cards};
	};

	var deck = function(encoded) {
		var hero = null;
		var entries = [];
		var r = reader(encoded);
		r.nextByte();
		r.nextVarInt();
		var type = r.nextVarInt();
		var heroes = r.nextVarInt();
		for (var i = 0; i < heroes; i++) {
			hero = r.nextVarInt();
		}
		var singles = r.nextVarInt();
		for (var i = 0; i < singles; i++) {
			entries.push({ count: 1, dbfId: r.nextVarInt()});
		}
		var doubles = r.nextVarInt();
		for (var i = 0; i < doubles; i++) {
			entries.push({ count: 2, dbfId: r.nextVarInt()});
		}
		var multiples = r.nextVarInt();
		for (var i = 0; i < multiples; i++) {
			entries.push({ count: r.nextVarInt(), dbfId: r.nextVarInt()});
		}
		return { type: type, hero: hero, cards: entries};
	};

	return {decode: (encoded) => lookup.then((mapping) => resolve(deck(encoded), mapping))};
};
