/* global _, Backbone, Sortable */

var Card = Backbone.Model.extend({
    initialize: function () {
        this.listenTo(this, 'add', this.updateFlipForCollection);
        this.listenTo(this, 'move-to', this.updateFlipForCollection);
    },

    flip: function () {
        this.set('faceup', !this.get('faceup'));
    },

    updateFlipForCollection: function () {
        if (this.collection && this.collection.faceup !== null) {
            this.set('faceup', this.collection.faceup);
        }
    }
});

var CardList = Backbone.Collection.extend({
    model: Card,

    initialize: function (models, options) {
        this.faceup = options && typeof options.faceup === 'boolean' ? options.faceup : null;
    },

    shuffle: function () {
        this.reset(_.shuffle(this.models));
        return this;
    },

    reorder: function(newIndex, originalIndex) {
        var temp = this.at(originalIndex);
        this.remove(temp, {silent: true});
        this.add(temp, {at: newIndex, silent: true});
    },

    moveItemTo: function (item, collection, options) {
        var idx = this.indexOf(item);
        this.remove(item, {silent: true});
        if (!options || !options.silent) {
            this.trigger('move-from', item, collection, idx);
            item.trigger('move-from', this, collection, idx);
        }
        collection.add(item, {silent: true});
        var newIdx = collection.indexOf(item);
        if (!options || !options.silent) {
            collection.trigger('move-to', item, this, newIdx);
            item.trigger('move-to', this, collection, newIdx);
        }
    },

    popTo: function (collection, options) {
        var idx = this.length - 1;
        var item = this.pop({silent: true});
        if (!options || !options.silent) {
            this.trigger('move-from', item, collection, idx);
            item.trigger('move-from', this, collection, idx);
        }
        collection.push(item, {silent: true});
        var newIdx = collection.indexOf(item);
        if (!options || !options.silent) {
            collection.trigger('move-to', item, this, newIdx);
            item.trigger('move-to', this, collection, newIdx);
        }
    }
});

var suits = ['heart', 'diamond', 'spade', 'club'];
var values = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack','queen','king'];

function createDeck () {
    var deck = [];
    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < values.length; j++) {
            deck.push(new Card({value: values[j], suit: suits[i]}));
        }
    }
    return new CardList(deck, {faceup: false});
}

var Player = Backbone.Model.extend({
    initialize: function (attributes, options) {
        var newattrs = {};
        if (!attributes.name && typeof attributes.index === 'number') {
            newattrs.name = 'Player #' + (attributes.index + 1);
        }
        newattrs.bot = attributes.index !== 0;
        newattrs.hand = new CardList([], {faceup: this.get('index') === 0});
        this.set(newattrs, options);
        this.game = options.game;
    }
});

var PlayerList = Backbone.Collection.extend({
    model: Player
});

var Game = Backbone.Model.extend({
    constructor: function (attributes, options) {
        if (!attributes.cardsPerPlayer) {
            throw new Error("Must provide cardsPerPlayer");
        }
        if (!attributes.numberOfPlayers) {
            throw new Error("Must provide numberOfPlayers");
        }
        Backbone.Model.apply(this, arguments);
    },

    initialize: function () {
        this.set({
            deck: createDeck(),
            discardPile: new CardList([], {faceup: true}),
            players: new PlayerList(_.times(this.get('numberOfPlayers'), function (i) {
                return new Player({name: null, index: i}, {game: this});
            }.bind(this))),
        });
    },

    deal: function () {
        var deck = this.get('deck');
        var players = this.get('players');
        var discardPile = this.get('discardPile');
        _.times(this.get('cardsPerPlayer'), function (i) {
            players.forEach(function (player) {
                deck.popTo(player.get('hand'))
            });
        });
        deck.popTo(discardPile);
        this.nextTurn();
    },

    nextTurn: function () {
        var index = this.get('currentPlayerIndex');
        if (typeof index !== 'number') {
            index = -1;
        }
        index = (index + 1) % this.get('players').length;
        this.set('currentPlayerIndex', index);
        this.set('currentPlayer', this.get('players').at(this.get('currentPlayerIndex')));
        this.set('hasPickedCard', false);

        if (this.get('currentPlayer').get('bot')) {
            this.doBotTurn();
        }
    },

    shouldPickCard: function () {
        return !this.get('hasPickedCard');
    },

    shouldDiscard: function () {
        return this.get('hasPickedCard');
    },

    pickFromStock: function (options) {
        if (!this.shouldPickCard()) {
            return false;
        }

        var currentHand = this.get('currentPlayer').get('hand');
        var deck = this.get('deck');
        deck.popTo(currentHand, options);

        this.set('hasPickedCard', true);

        if (this.get('deck').length === 0) {
            var discardPile = this.get('discardPile');
            while (discardPile.length > 0) {
                discardPile.popTo(deck);
            }
            deck.shuffle();
            deck.popTo(discardPile);
        }

        return true;
    },

    pickFromDiscard: function (options) {
        if (!this.shouldPickCard()) {
            return false;
        }

        var currentHand = this.get('currentPlayer').get('hand');
        var discardPile = this.get('discardPile');
        if (discardPile.length === 0) {
            return false;
        }

        discardPile.popTo(currentHand, options);

        this.set('hasPickedCard', true);

        return true;
    },

    tryingToDiscard: function (cardIndex, options) {
        if (!this.shouldDiscard()) {
            return false;
        }

        var currentHand = this.get('currentPlayer').get('hand');
        var discardPile = this.get('discardPile');

        var card = currentHand.at(cardIndex);
        currentHand.moveItemTo(card, discardPile, options);

        this.nextTurn();

        return true;
    },

    doBotTurn: function () {
        setTimeout(function () {
            if (Math.random() < 0.5) {
                this.pickFromStock();
            } else {
                this.pickFromDiscard();
            }
            setTimeout(function () {
                var randomCardIndex = Math.floor(Math.random() * this.get('currentPlayer').get('hand').length);
                this.tryingToDiscard(randomCardIndex);
            }.bind(this), 500);
        }.bind(this), 500);
    }
});

var CardView = Backbone.View.extend({
    initialize: function () {
        this.listenTo(this.model, 'change:faceup', this.showSide);
        this.listenTo(this.model, 'remove', this.remove);
    },

    className: 'card-container',

    template: _.template(
        '<div class="card">' +
        '    <div class="front face suit-<%= card.suit %>">' +
        '        <div class="value"><%= card.value %></div>' +
        '        <div class="suit"><%= card.suit %></div>' +
        '    </div>' +
        '    <div class="back face">' +
        '    </div>' +
        '</div>', {variable: 'card'}),

    getValue: function () {
        var value = this.model.get('value');
        if (typeof value === 'string') {
            return value[0].toUpperCase();
        }
        return value + '';
    },

    getSuit: function () {
        switch (this.model.get('suit').toLowerCase()[0]) {
            case 's': return "♠";
            case 'h': return "♥";
            case 'd': return "♦";
            case 'c': return "♣";
        }
    },

    render: function () {
        this.$el.html(this.template({
            suit: this.getSuit(),
            value: this.getValue()
        }));
        this.showSide(this.model, this.model.get('faceup'));
        this.$el.data('view', this);
        return this;
    },

    showSide: function (model, faceup) {
        $('body').queue(function (next) {
            this.$el.toggleClass('flip', !faceup);
            next();
        }.bind(this));
    }
});

var ListView = Backbone.View.extend({
    constructor: function () {
        if (!this.ItemView) {
            throw new Error("ListView requires an ItemView");
        }
        Backbone.View.apply(this, arguments);
    },

    initialize: function () {
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'reset', this.addAll);
    },

    render: function () {
        this.addAll();
        return this;
    },

    addOne: function (model) {
        this.$el.append(new this.ItemView({model: model}).render().el);
    },

    addAll: function () {
        this.$el.empty();
        for (var i = 0; i < this.collection.length; i++) {
            this.addOne(this.collection.models[i]);
        }
    }
});

var CardListView = ListView.extend({
    className: 'card-list',

    ItemView: CardView,

    initialize: function (options) {
        this.reorder = !!(options || {}).reorder;
        ListView.prototype.initialize.apply(this, arguments);
        this.listenTo(this.collection, 'move-from', this.moveFrom);
        this.listenTo(this.collection, 'move-to', this.moveTo);
    },

    render: function () {
        ListView.prototype.render.apply(this, arguments);
        var collection = this.collection;
        if (this.reorder) {
            Sortable.create(this.el, {
                group: {name: 'your-hand', pull: true, put: ['deck', 'discard-pile']},
                sort: true,
                onUpdate: function (evt) {
                    collection.reorder(evt.newIndex, evt.oldIndex);
                }
            });
        }
        return this;
    },

    moveFrom: function (item, destination, prevIdx) {
        var el = this.$('.card-container:nth-child(' + (prevIdx + 1) + ')');
        if (item) {
            item.moveFromEl = el;
        }
    },

    moveTo: function (item, source, idx) {
        var el = item && item.moveFromEl;
        if (!el) {
            return;
        }
        delete item.moveFromEl;    
        move(el, this.el);
    }
});

var PlayerView = Backbone.View.extend({
    className: 'player',

    initialize: function () {
        if (this.model.game) {
            this.listenTo(this.model.game, 'change:currentPlayerIndex', this.showCurrentPlayer);
            this.listenTo(this.model.game, 'change:hasPickedCard', this.showWaitingForDiscard);
        }
    },

    showCurrentPlayer: function (game, currentPlayerIndex, options) {
        this.$el.toggleClass('current-turn', currentPlayerIndex === this.model.get('index'));
    },

    showWaitingForDiscard: function (game, hasPickedCard, options) {
        this.$('.card-list').toggleClass('waitingForInteraction', hasPickedCard && !this.model.get('bot') && game.get('currentPlayerIndex') === this.model.get('index'));
    },

    render: function () {
        var el = $('<div class="handcontainer"/>').appendTo(this.el);
        el.toggleClass('you', !this.model.get('bot'));
        $('<h4/>').html(this.model.get('name')).appendTo(el);
        new CardListView({collection: this.model.get('hand'), className: 'hand card-list well', reorder: !this.model.get('bot')}).render().$el.appendTo(el);
        return this;
    }
});

var PlayersView = ListView.extend({
    ItemView: PlayerView,
    className: 'players'
});

var GameView = Backbone.View.extend({
    events: {
        'click #stock': 'pickFromStock',
        'click #discard': 'pickFromDiscard',
        'click .handcontainer.you .card-container': 'tryingToDiscard'
    },

    initialize: function (options) {
        this.listenTo(this.model, 'change:currentPlayer, change:hasPickedCard', this.showWaitingForInteractionStatus);
    },

    render: function () {
        var deck = this.model.get('deck');
        var discardPile = this.model.get('discardPile');
        var players = this.model.get('players');

        var gameView = this;
        var deckView = new CardListView({collection: deck, className: 'stack', id: 'stock'});
        var discardPileView = new CardListView({collection: discardPile, className: 'stack', id: 'discard'});
        var playersView = new PlayersView({collection: players});

        deckView.render();
        discardPileView.render();
        playersView.render();

        $('<div id="deck"/>')
            .appendTo(this.el)
            .append(deckView.el)
            .append(discardPileView.el);

        playersView.$el.appendTo(this.el);

        // this.sortableDeck = Sortable.create(deckView.el, {
        //     group: {name: 'deck', pull: true, put: false},
        //     sort: false,
        //     onRemove: function (evt) {
        //         if (gameView.pickFromStock({silent: true})) {
        //             var model = getModel(evt.item);
        //             model.updateFlipForCollection();
        //         } else {

        //         }
        //     },
        // });

        // this.sortableDiscardPile = Sortable.create(discardPileView.el, {
        //     group: {name: 'discard-pile', pull: true, put: ['your-hand', 'deck']},
        //     sort: false,
        //     onAdd: function (evt) {
        //         var index = evt.oldIndex;
        //         if (gameView.tryingToDiscardIndex(index, {silent: true})) {
        //             var model = getModel(evt.item);
        //             model.updateFlipForCollection();
        //         } else {

        //         }
        //     },
        //     onRemove: function (evt) {
        //         if (gameView.pickFromDiscard({silent: true})) {
        //             var model = getModel(evt.item);
        //             model.updateFlipForCollection();
        //         } else {

        //         }
        //     }
        // });

        return this;
    },

    showWaitingForInteractionStatus: function (game, currentPlayer, options) {
        var els = $('#stock, #discard');
        if (this.shouldAllowUI() && this.model.shouldPickCard()) {
            els.wrap('<div class="waitingForInteraction"></div>');
        } else if (els.parent('.waitingForInteraction').length === 2) {
            els.unwrap();
        }

        if (this.shouldAllowUI()) {
            this.sortableDeck && this.sortableDeck.option('disabled', !this.model.shouldPickCard());
            this.sortableDiscardPile && this.sortableDiscardPile.option('disabled', !this.model.shouldPickCard());
        }
    },

    shouldAllowUI: function () {
        return !this.model.get('currentPlayer').get('bot');
    },

    pickFromStock: function (options) {
        if (!this.shouldAllowUI()) {
            return false;
        }

        return this.model.pickFromStock(options);
    },

    pickFromDiscard: function (options) {
        if (!this.shouldAllowUI()) {
            return false;
        }

        return this.model.pickFromDiscard(options);
    },

    tryingToDiscard: function (e) {
        var index = $(e.currentTarget).index();

        return this.tryingToDiscardIndex(index);
    },

    tryingToDiscardIndex: function (index, options) {
        if (!this.shouldAllowUI()) {
            return false;
        }

        return this.model.tryingToDiscard(index, options);
    }
});

function getModel (el) {
    var view = $(el).data('view');
    if (!view) {
        return;
    }
    return view.model;
}

function flipCardsOnHover(cards, delay) {
    cards.hover(function () {
        var card = $(this);
        var timeoutID = card.data('card-flip-timeout-id');
        if (timeoutID) {
            card.removeData('card-flip-timeout-id');
            clearTimeout(timeoutID);
        }
        $(this).removeClass('flip');
    }, function () {
        var card = $(this);
        var timeoutID = setTimeout(function () {
            card.addClass('flip');
        }, delay || 300);
        card.data('card-flip-timeout-id', timeoutID);
    });
}

function move (el, destination) {
    var delay = 150;
    $('body').queue(function (next) {
        var startpos = el.offset();
        var placeholderEl = $('<div class="cardPlaceholder card-container"/>').appendTo(destination);
        var endpos = placeholderEl.offset();
        var translate = {
            x: endpos.left - startpos.left,
            y: endpos.top - startpos.top
        };
        var css = {
            transition: (delay/1000)+'s ease-in-out',
            transform: 'translate3d(' + translate.x + 'px, ' + translate.y + 'px, 0) rotate(360deg)'
        };
        el.css(css);
        setTimeout(function () {
            el.removeAttr('style');
            placeholderEl.replaceWith(el);
            next();
        }, delay);
    });
}
