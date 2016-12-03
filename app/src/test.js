/*
import Wallet from 'ethereumjs-wallet'
//import Tx from 'ethereumjs-tx'

export class Test {
    constructor() {
        this.wallet = Wallet.generate()
        //debugger
        let addr = this.wallet.getAddress()
        console.log(JSON.stringify(addr))
    }
}
*/

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
    }

    testVoting(nrFakeVotes) {
        if(! this.logic.accountFundedPromise.isResolved()) {
            console.error('account not yet funded')
            return
        }

        var i = 0
        var castNextVote = () => {
            console.log('demo vote ' + i)
            this.appState.token = this.logic.getRandomToken()

            let candidateId = Math.round(Math.random()) // 0 or 1

            this.logic.prepareVote(candidateId).then((cipheredData) => {
                var cipheredValue = this.crypto.arrayBufferToBase64String(cipheredData);
                console.log('data: ' + cipheredData)
                console.log('value: ' + cipheredValue)

                this.logic.castVote(cipheredValue)

                //window.location = "#/process";
            })
            if(i++ < nrFakeVotes)
                setTimeout(castNextVote, Math.round(5000 * Math.random())) // cast a vote every 0-5 seconds
        }

        if(nrFakeVotes > 0)
            castNextVote() // start the loop
    }
}