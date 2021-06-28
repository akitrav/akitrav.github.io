function game(){
    
    const PLAYER_STATES = {
        WON : "won",
        PLAYING : "playing",
        SKIP : "skip",
        SPIN_AGAIN : "spin_again"
    }
    
    const GAME_STATES = {
        GAME_OVER : "game_over",
        LOADING : "loading",
        CURRENT_TURN : "current_turn",
        CURRENT_TURN_OUTCOME : "current_turn_outcome",
        ROLLING : "rolling",
        AWAITING_INPUTS : "awaiting_inputs"
    }

    var number_of_players = 0;
    var points_to_win = 0;

    var currentPlayerIndex = 0;
    var players = [];

    var gameState = GAME_STATES.AWAITING_INPUTS;

    return {
        
        startGame : function(){

            var totalPlayers = +document.getElementById("input-total-players").value;
            var maxPoints = +document.getElementById("input-winning-points").value;            

            if(totalPlayers < 2 || maxPoints<=0){
                return;
            }

            number_of_players = totalPlayers;
            points_to_win = maxPoints;

            // order of players in random order
            players = _createPlayers(number_of_players);

            _updateGameState(GAME_STATES.CURRENT_TURN);

            _renderRankTable();
            _renderTurnBoard();

        },

        rollDice : function(){
            _updateGameState(GAME_STATES.ROLLING);

            var currentPlayer = players[currentPlayerIndex];

            var roll = Math.floor(Math.random()*6+1);
            var lastRoll = currentPlayer.roll_history.length > 0 ? currentPlayer.roll_history[currentPlayer.roll_history.length - 1] : 0;
            
            // update current player 
            currentPlayer.roll_history.push(roll);
            currentPlayer.score += roll;
            
            _updateRanks(players);

            if(currentPlayer.score >= points_to_win){
                currentPlayer.state = PLAYER_STATES.WON;
            }else if(roll == 6){
                currentPlayer.state = PLAYER_STATES.SPIN_AGAIN;
            }else if(lastRoll == 1 && roll == 1){
                currentPlayer.state = PLAYER_STATES.SKIP
            }
            
            console.log(currentPlayer.name, currentPlayer.roll_history, currentPlayer.state);

            setTimeout(function(){
                
                _updateGameState(GAME_STATES.CURRENT_TURN_OUTCOME);
                _renderRankTable();
                _renderTurnBoard();

            }, 2000);
        },

        init : function(){
            _updateGameState(GAME_STATES.AWAITING_INPUTS);
            document.getElementById("start-game-btn").addEventListener("click",this.startGame);
            document.getElementById("roll-dice").addEventListener("click",this.rollDice);;
        }
    }


    function _updateGameState(state){
        var gameOver = false;
        gameState = state;

        _renderGameState();

        if(state === GAME_STATES.CURRENT_TURN_OUTCOME){
            
            currentPlayerIndex = _getNextTurnIndex(currentPlayerIndex, players);
            console.log("currentPlayerIndex", currentPlayerIndex);
            
            if(currentPlayerIndex === "NO_PLAYER_FOUND"){
                gameOver = true;
            }
            
            setTimeout(function(){
                if(!gameOver){
                    _updateGameState(GAME_STATES.CURRENT_TURN);
                    _renderTurnBoard();
                    
                }else{
                    _updateGameState(GAME_STATES.GAME_OVER);
                }
            }, 2000);
        }
    }

    function _player(number){
        return {
            name : "Player " + number,
            state : PLAYER_STATES.PLAYING,
            score : 0,
            roll_history : [],
            rank : "-",
            id: number
        }
    }

    function _createPlayers(number_of_players){
        var players = []
        for(var i = 0; i<number_of_players; i++){
            var player = _player(i+1);
            players.push(player);
        }

        // shuffle players, index of an element in players array maintains the order in which players will play. 
        players = players.sort(function(){
            return Math.random() - 0.5;
        });

        return players;
    }

    function _getnextPlayerIndex(playerIndex){
        if((players.length - 1) === playerIndex){
            return 0;
        }else{
            return playerIndex + 1;
        }
    }

    function _getNextTurnIndex(currentPlayerIndex, players){

        var currentPlayer = players[currentPlayerIndex];

        if(currentPlayer.state === PLAYER_STATES.SPIN_AGAIN){
            currentPlayer.state = PLAYER_STATES.PLAYING;
            return currentPlayerIndex;
        }

        // set true if all players have won
        var playersExhausted = false;

        // finding the next player
        var nextPlayerIndex = _getnextPlayerIndex(currentPlayerIndex);
        while(players[nextPlayerIndex].state === PLAYER_STATES.WON){
            nextPlayerIndex = _getnextPlayerIndex(nextPlayerIndex);
            if(currentPlayerIndex === nextPlayerIndex){
                playersExhausted = currentPlayer.state === PLAYER_STATES.WON;
                break;
            }
        }

        // if all players have won
        if(playersExhausted){
            return "NO_PLAYER_FOUND";
        }

        currentPlayerIndex = nextPlayerIndex;
        currentPlayer = players[currentPlayerIndex];

        // skipping
        if(currentPlayer.state === PLAYER_STATES.SKIP){
            currentPlayer.state = PLAYER_STATES.PLAYING;
            currentPlayerIndex = _getNextTurnIndex(currentPlayerIndex, players);
        }

        // return playing user
        return currentPlayerIndex;
    }

    function _updateRanks(players){
        // current players in descending order
        var playingPlayers = players.filter(function(player){
            return player.state != PLAYER_STATES.WON;
        }).sort(function(playerA, playerB){
            return playerB.score - playerA.score;
        });

        var rank = players.length - playingPlayers.length;
        playingPlayers.forEach(function(player, idx){
            if(idx > 0 && player.score === playingPlayers[idx-1].score){
                player.rank = playingPlayers[idx-1].rank;
            }else{
                player.rank = ++rank;
            }
        });
    }


    /********************************   RENDERING FUNCTOINS   *********************************/
    function _renderRankTable(){
        var playersSortedByRank = JSON.parse(JSON.stringify(players))
        playersSortedByRank.sort(function(playerA, playerB){
            return playerA.rank - playerB.rank; 
        });

        var rankBoardElm = document.querySelector("#rank-table");
        rankBoardElm.innerHTML = "";

        var ulelm = document.createElement("ul");
        ulelm.classList.add("rank-table");
        
        var headinglielm = document.createElement("li");
        headinglielm.classList.add("heading");
        headinglielm.innerHTML = `
            <span>Name</span>
            <span>Score</span>
            <span>Rank</span>`;
        ulelm.appendChild(headinglielm);
        
        for(var i = 0; i < playersSortedByRank.length; i++ ){
            var elm = document.createElement("li");
            elm.innerHTML = `<span>${playersSortedByRank[i].name}</span>
            <span>${playersSortedByRank[i].score}</span>
            <span>${playersSortedByRank[i].rank}</span>`;

            if(playersSortedByRank[i].state === PLAYER_STATES.WON){
                elm.classList.add("won");
            }

            ulelm.appendChild(elm);
        };

        rankBoardElm.appendChild(ulelm);
    }

    function _renderTurnBoard(){
        var nextPlayerIndex = _getnextPlayerIndex(currentPlayerIndex);

        var turnBoardElm = document.querySelector("#turn-board");
        turnBoardElm.innerHTML = "";

        for(var i = 0; i < players.length; i++ ){
            var elm = document.createElement("span");
            if(i === nextPlayerIndex){
                elm.classList.add("next");
            }
            if(i === currentPlayerIndex){
                elm.classList.add("active");
            }
            elm.innerHTML = `${players[i].name}`;
            turnBoardElm.appendChild(elm);
        };

    }

    function _renderGameState(){
        var playerNameElm = document.querySelector("#game-master .player-name");
        playerNameElm.innerHTML = "";
        var playerHistoryElm = document.querySelector("#game-master .player-history");
        playerHistoryElm.innerHTML = "";
        var rollDiceBtnElm = document.querySelector("#roll-dice");
        rollDiceBtnElm.classList.add("hide");
        var messageElm = document.querySelector("#game-master .message");
        messageElm.innerHTML = "";
        var outcomeElm = document.querySelector("#game-master .outcome");
        outcomeElm.innerHTML = "";

        if(gameState !== GAME_STATES.AWAITING_INPUTS){
            var gameInputElm = document.querySelector("[data-game-state='awaiting-inputs']");
            gameInputElm.classList.add("hide");

            var gameOnElm = document.querySelectorAll("[data-game-state='game-on']");
            gameOnElm.forEach(function(elm){
                elm.classList.remove("hide");
            });
            document.querySelector("#total-players").innerHTML = number_of_players;
            document.querySelector("#winning-points").innerHTML = points_to_win;
        }else{
            var gameInputElm = document.querySelector("[data-game-state='awaiting-inputs']");
            gameInputElm.classList.remove("hide");

            var gameOnElm = document.querySelectorAll("[data-game-state='game-on']");
            gameOnElm.forEach(function(elm){
                elm.classList.add("hide");
            });
        }


        if([GAME_STATES.CURRENT_TURN, GAME_STATES.CURRENT_TURN_OUTCOME, GAME_STATES.ROLLING
        ].includes(gameState)){
            playerNameElm.innerHTML = `${players[currentPlayerIndex].name}`;
            playerHistoryElm.innerHTML = `${players[currentPlayerIndex].roll_history.join(",")}`;
        }

        if(gameState === GAME_STATES.CURRENT_TURN){
            messageElm.innerHTML = `${players[currentPlayerIndex].name} its your turn (press 'r' to roll the dice)`;
            rollDiceBtnElm.classList.remove("hide");
        }

        if(gameState === GAME_STATES.CURRENT_TURN_OUTCOME){
            var playerState = players[currentPlayerIndex].state;
            
            if(playerState == PLAYER_STATES.WON){
                messageElm.innerHTML = `${players[currentPlayerIndex].name} you WON! Your rank is ${players[currentPlayerIndex].rank}`;
            }else if(playerState == PLAYER_STATES.SPIN_AGAIN){
                messageElm.innerHTML = `${players[currentPlayerIndex].name}. You got A 6! You can roll the dice again`;
                outcomeElm.classList.remove("hide");
                outcomeElm.innerHTML = `You rolled <span class="roll">${players[currentPlayerIndex].roll_history[players[currentPlayerIndex].roll_history.length-1]}</span>`;
            }else if(playerState == PLAYER_STATES.SKIP){
                messageElm.innerHTML = `${players[currentPlayerIndex].name} OPPS! Your next turn will be skipped.`;
            }

            if(playerState != PLAYER_STATES.SKIP){
                outcomeElm.classList.remove("hide");
                outcomeElm.innerHTML = `You rolled <span class="roll">${players[currentPlayerIndex].roll_history[players[currentPlayerIndex].roll_history.length-1]}</span>`;
            }
            
        }

        if(gameState === GAME_STATES.ROLLING){
            messageElm.innerHTML = `Rolling the dice.`;
        }

        if(gameState === GAME_STATES.GAME_OVER){
            messageElm.innerHTML = `GAME OVER`;
        }

        if(gameState !== GAME_STATES.CURRENT_TURN_OUTCOME){
            outcomeElm.classList.add("hide");
        }
        
    }

}


function toggle() {
    
    var descptionElm = document.getElementById("description");
    if(descptionElm.classList.contains("hide")){
        descptionElm.classList.remove("hide");
    }else{
        descptionElm.classList.add("hide");
    }
}

function main(){
    var currentGame = game();
    currentGame.init();
}

main();
