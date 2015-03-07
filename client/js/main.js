/* global _ */

var suits = ['heart', 'diamond', 'spade', 'club'];
var values = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack','queen','king'];

function createDeck() {
    var deck = [];
    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < values.length; j++) {
            deck.push({
                value: values[j],
                suit: suits[i]
            });
        }
    }
    return deck;
}

function renderCard (card) {
    return $('<div/>').html(card.value + ' of ' + card.suit + 's');
}

function renderCardList (cards) {
    var cardListEl = $('<div/>');
    for (var i = 0; i < cards.length; i++) {
        renderCard(cards[i]).appendTo(cardListEl);
    }
    return cardListEl;
}

var deck = createDeck();
var cardListEl = renderCardList(deck);
cardListEl.appendTo('#table');
