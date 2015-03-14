/* global Game, GameView, Sortable */

var game = new Game({
    numberOfPlayers: 4,
    cardsPerPlayer: 7
});

var gameView = new GameView({model: game});
gameView.$el.appendTo('body > .container');
gameView.render();

game.get('deck').shuffle();

game.deal();