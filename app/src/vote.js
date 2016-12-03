import {inject} from 'aurelia-framework'
import {ApplicationState} from 'applicationstate'
import {Logic} from 'logic'
import {Crypto} from 'crypto'

@inject(ApplicationState, Logic, Crypto)
export class Vote {

    constructor(appState, logic, crypto) {
        this.appState = appState
        this.logic = logic
        this.web3 = logic.web3
        this.crypto = crypto

        if (this.appState.token === null) {
            console.log('token not set, need auth')
            window.location = "#/authenticate";
        } else {
            console.log('token: ' + this.appState.token)
        }

        //this.installFundsWaitingPromise()
        window.vote = this
    }

    setVote(candidate) {
        this.vote = candidate
        this.candidateId = parseInt(candidate)
    }

    castVote() {
        // if no candidate is selected, let voter confirm if that's intentional
        if(this.candidateId == undefined) {
            $('#whiteVoteModal').modal()
        } else {
            this.castVoteConfirmed()
        }

    }

    castVoteConfirmed() {
        // TODO: visualize state if waiting for promise
        this.logic.accountFundedPromise.then( () => {
            this.logic.prepareVote(this.candidateId).then( (cipheredData) => {
                var cipheredValue = this.crypto.arrayBufferToBase64String(cipheredData);
                console.log('data: ' + cipheredData)
                console.log('value: ' + cipheredValue)

                this.logic.castVote(cipheredValue)

                window.location = "#/result";
            })
        })
    }
}
