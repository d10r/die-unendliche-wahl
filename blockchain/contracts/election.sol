pragma solidity ^0.4.4;

/*
ERROR CODES

Error 1 = NO_PERMISSION
Error 2 = ALREADY_VOTED
Error 3 = INVALID_TOKEN
Error 99 = WRONG_STAGE
*/


// TODO: cleanup, better state checks
contract Election {

// ############## EVENTS ##############

    event error(uint);
    event log(string);
    event voteEvent(uint indexed _currentRound, string _token, uint _nrVotes);
    event resultPublishedEvent(uint indexed _currentRound, string _result);
    event electionStatusEvent(uint indexed _currentRound, uint _status);

// ############## STRUCTS ##############

    struct Vote {
        address addr;
        string token;
        string candidate;
    }

    enum Stage {
        PRE_VOTING,
        VOTING,
        PROCESSING,
        RESULT
    }

// ############## FIELDS ##############

    // contract owner becomes admin
    address public admin;
    Stage public currentStage = Stage.PRE_VOTING;

    // name of the election, e.g. "BP 2016"
    string public name;

    uint public currentRound = 1; // incremented for every election round
    Vote[] public votes;
    uint public nrVotes = 0;

    string public lastResult = "";
    string public privateKey = "";

// ############## PUBLIC FUNCTIONS ##############

// TODO: add constant keyword to readonly functions. Remove return from write functions

    // Constructor of the contract
    function Election(string _name) {
        admin = msg.sender;
        name = _name;
    }

    // https://youtu.be/kTlLX9jMjwk
    function reset() requiresAdmin {
        currentStage = Stage.PRE_VOTING;
        votes.length = 0;
        nrVotes = 0;
        lastResult = "";
        privateKey = "";
    }

    function startElection() requiresAdmin preVoting {
        currentStage = Stage.VOTING;
    }
    
    function vote(string _token, string _candidate) returns(uint) {
        if(currentStage != Stage.VOTING) { error(99); return 99; } // WRONG_STAGE
        if(alreadyVoted(_token)) { error(2); return 2; } // ALREADY_VOTED
        if(! isTokenValid(_token)) { error(3); return 3; } // INVALID_TOKEN

        // why? see http://ethereum.stackexchange.com/questions/3373/how-to-clear-large-arrays-without-blowing-the-gas-limit/3377
        if(nrVotes == votes.length) {
            votes.length += 1;
        }
        votes[nrVotes++] = Vote({
            addr: msg.sender,
            token: _token,
            candidate: _candidate
        });

        voteEvent(currentRound, _token, nrVotes);
        return 0;
    }

    function getNrVotes() returns(uint) {
        return nrVotes;
    }

    function getCurrentElectionRoundAndStatus() returns(uint round, uint status) {
        return (currentRound, uint(currentStage));
    }

    function stopElection() requiresAdmin voting {
        currentStage = Stage.PROCESSING;
        electionStatusEvent(currentRound, uint(currentStage));
    }

    function publishResult(string _result, string _privateKey) requiresAdmin {
        lastResult = _result;
        privateKey = _privateKey;

        resultPublishedEvent(currentRound, _result);
        currentStage = Stage.RESULT;
        electionStatusEvent(currentRound, uint(currentStage));
    }

    function startNewRound() requiresAdmin {
        currentStage = Stage.VOTING;
        // votes.length = 0; // disabled because it easily runs out of gas
        nrVotes = 0;
        currentRound++;
        electionStatusEvent(currentRound, uint(currentStage));
    }

// ############## MODIFIERS ##############

modifier requiresAdmin {
    if(msg.sender != admin) throw;
    _;
}

modifier preVoting {
    if(currentStage != Stage.PRE_VOTING) throw;
    _;
}

modifier voting {
    if(currentStage != Stage.VOTING) throw;
    _;
}

/*
modifier postVoting {
    if(currentStage != Stage.POST_VOTING) throw;
    _;
}
*/

// ############## PRIVATE FUNCTIONS ##############

    function alreadyVoted(string _token) returns(bool) {
        for(var i=0; i<nrVotes; i++) {
            if(compareStrings(votes[i].token, _token) == 0) {
                return true;
            }
        }
        return false;
    }

    // checks if the token is valid and signed by the election registrar
    // TODO: implement (see https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d)
    function isTokenValid(string _token) returns (bool) {
        return true;
    }

    // from https://raw.githubusercontent.com/ethereum/dapp-bin/master/library/stringUtils.sol
    function compareStrings(string _a, string _b) returns (int) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        //@todo unroll the loop into increments of 32 and do full 32 byte comparisons
        for (uint i = 0; i < minLength; i ++)
            if (a[i] < b[i])
                return -1;
            else if (a[i] > b[i])
                return 1;
        if (a.length < b.length)
            return -1;
        else if (a.length > b.length)
            return 1;
        else
            return 0;
    }
}
