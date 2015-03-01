var suits = ['heart', 'diamond', 'spade', 'club'];
var values = _.flatten(['ace',_.range(2,11),'jack','queen','king']);

var deck = [];

for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < values.length; j++) {
        deck.push({
            value: values[j],
            suit: suits[i]
        });
    }
}

function printCard (card) {
    print(deck[i].value + ' of ' + deck[i].suit + 's');
}

for (var i = 0; i < deck.length; i++) {
    printCard(deck[i]);
}
