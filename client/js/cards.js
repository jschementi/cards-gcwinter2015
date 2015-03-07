function getValue (card) {
    if (typeof card.value === 'string') {
        return card.value[0].toUpperCase();
    }
    return card.value + '';
}

function getSuit (card) {
    switch (card.suit[0]) {
        case 's': return "♠";
        case 'h': return "♥";
        case 'd': return "♦";
        case 'c': return "♣";
    }
}

var cardTemplate = _.template(
    '<div class="card-container flip" ontouchstart="this.classList.toggle(\'hover\');">' +
    '    <div class="card">' +
    '        <div class="front face suit-<%= card.suit %>">' +
    '            <div class="value"><%= card.value %></div>' +
    '            <div class="suit"><%= card.suit %></div>' +
    '        </div>' +
    '        <div class="back face">' +
    '        </div>' +
    '    </div>' +
    '</div>', {variable: 'card'});

function renderCard (card) {
    return cardTemplate({
        suit: getSuit(card),
        value: getValue(card)
    });
}

function renderCardList(cards) {
    var cardsEl = $('<div class="card-list"></div>');
    cards.forEach(function (card) {
        cardsEl.append(renderCard(card)); 
    });
    return cardsEl;
}

//flipCardsOnHover($('.card-container', cardsEl));

function flipCardsOnHover(cards, delay) {
    cards.hover(function () {
        var card = $(this);
        var timeoutID = card.data('card-flip-timeout-id');
        if (timeoutID) {
            card.removeData('card-flip-timeout-id');
            clearTimeout(timeoutID);
        }
        $(this).addClass('flip');
    }, function () {
        var card = $(this);
        var timeoutID = setTimeout(function () {
            card.removeClass('flip');
        }, delay || 300);
        card.data('card-flip-timeout-id', timeoutID);
    });
}
