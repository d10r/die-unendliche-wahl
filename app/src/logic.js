import {inject} from 'aurelia-framework'
import {Configure} from 'aurelia-configuration'

import Web3 from 'web3'
//import Wallet from 'ethereumjs-wallet'
//import Tx from 'ethereumjs-tx'
// workaround for my incompetence when it comes to dealing with JS modules
import 'ethereumjs-wallet-workaround'

// can't figure out how to model this module to get it usable without injection
import {Contracts} from 'contracts'

// "require" is not available here. How can the same be achieved with "import"?
//const ElectionAbi = require('Election.abi')

import {CryptoUtils} from 'cryptoUtils'

// TODO: test browser compatibility (e.g. crypto api)

@inject(Configure, Contracts, CryptoUtils)
export class Logic {
    constructor(config, contracts, cryptoUtils) {
        this.config = config
        this.contracts = contracts
        this.cryptoUtils = cryptoUtils

        // will be set to false if injected web3 (e.g. Metamask) is found during init
        this.standaloneMode = true

        try {
            this.initEth()
            this.instantiateContract()
            this.watchElectionStatus()
        } catch(e) {
            alert('Etwas ist bei der Initialisierung gehörig schief gegangen, sorry.\nDie Applikation wird vermutlich nicht wie vorgesehen funktionieren.')
            console.error(e)
        }

        window.web3 = this.web3 // DEBUG
        window.logic = this
        //window.Wallet = Wallet
        window.tx = Tx
    }

    initEth() {
        if (typeof web3 !== 'undefined') {
            console.log('*** web3 already provided')
            this.web3 = new Web3(web3.currentProvider);
            this.standaloneMode = false
        } else {
            // getAll() is a workaround to get() currently supporting only 2 levels, see https://github.com/Vheissu/aurelia-configuration/issues/68
            let rpcAddr = this.config.getAll().ethereum.rpc

            console.log('creating web3')
            this.web3 = new Web3(new Web3.providers.HttpProvider(rpcAddr))
        }

        this.electionResultPromise = new Promise( (resolve, reject) => {
            this.electionResultReady = resolve // will be triggered from outside
        })
    }

    ensureFundedAccount() {
        if(this.standaloneMode) {
            if(this.wallet === undefined) {
                this.createAndFundAccount()
            }
        } else {
            // TODO: refactor away this workaround
            this.accountFundedPromise = new Promise( (resolve, reject) => { resolve() })
            this.accountFunded = true
            // TODO: check if we really have a funded account connected
        }
    }

    createAndFundAccount() {
        this.wallet = Wallet.generate()
        let addr = this.wallet.getAddressString()
        console.log('new addr: ' + addr)
        this.web3.eth.defaultAccount = addr

        this.accountFunded = false
        this.fundAccount(addr);
        var that = this

        this.accountFundedPromise = new Promise((resolve, reject) => {
            const pollIntervalMs = 2000
            var waitingSinceMs = 0
            function checkAndWait() {
                that.web3.eth.getBalance(that.web3.eth.defaultAccount, (err, ret) => {
                    let funded = false
                    if(! err) {
                        let balance = that.web3.toDecimal(ret)
                        if (balance > 0)
                            funded = true
                    }
                    if(! funded) {
                        console.log('funds pending...')
                        setTimeout(checkAndWait, pollIntervalMs)
                        waitingSinceMs += pollIntervalMs
                    } else {
                        console.log('funds have arrived after ' + waitingSinceMs / 1000 + ' s')
                        that.accountFunded = true
                        resolve()
                    }
                })
            }

            checkAndWait()
        })
    }

    instantiateContract() {
        let Contract = this.web3.eth.contract(this.contracts.Election.info.abiDefinition)

        this.Election = Contract.at(this.contracts.address)
        console.log('instance addr: ' + this.contracts.address)
    }

    watchElectionStatus() {
        this.electionStatusPromise = new Promise( (resolve, reject) => {
            this.electionStatusReady = resolve
        })
        // get current round and status
        this.Election.getCurrentElectionRoundAndStatus.call( (err, ret) => {
            if (! err) {
                console.log(`current election status ${ret[1]}, round: ${ret[0]}`)
                this.electionRound = this.web3.toDecimal(ret[0])
                this.electionStatus = this.web3.toDecimal(ret[1])
                this.electionStatusReady() // resolve promise

                let statusEvent = this.Election.electionStatusEvent()
                statusEvent.watch( (err, ret) => {
                    if (! err) {
                        let prevElectionRound = this.electionRound
                        this.electionRound = this.web3.toDecimal(ret.args._currentRound)
                        this.electionStatus = this.web3.toDecimal(ret.args._status)
                        console.log(`new election status: ${this.electionStatus} - round ${this.electionRound}`)

                        if(prevElectionRound != this.electionRound) {
                            this.watchElectionResult(this.electionRound-1)
                        }
                    }
                })

                this.watchElectionResult(this.electionRound-1)
            }
        })
    }

    currentElectionResultWatcher = null
    watchElectionResult(round) {
        if(this.currentElectionResultWatcher)
            this.currentElectionResultWatcher.stopWatching()

        let resultEvent = this.Election.resultPublishedEvent( { _currentRound: round }, { fromBlock: 0 } )
        resultEvent.watch( (err, ret) => {
            if(! err) {
                console.log(`new election result: ${ret.args._result}`)
                this.setElectionResult(ret.args._result)
            }
        })
        this.currentElectionResultWatcher = resultEvent
    }

    electionResult = null
    setElectionResult(resultString) {
        try {
            var newResult = JSON.parse(resultString)
        } catch(e) {
            console.error('parsing election result failed with: ' + e)
            return
        }
        if(! newResult['hofer']) {
            newResult['hofer'] = 0
        }
        if(! newResult['vdb']) {
            newResult['vdb'] = 0
        }

        this.electionResult = newResult
        this.electionResultReady() // triggers promise resolution
    }

    electionStageToString(stage) {
        switch(stage) {
            case 0: return 'not yet started'
            case 1: return 'in progress'
            case 2: return 'processing'
            case 3: return 'result ready'
        }
    }

    getRandomToken() {
        var array = new Uint8Array(32)
        window.crypto.getRandomValues(array)
        return this.cryptoUtils.arrayBufferToBase64String(array)
    }

    getCandidateNameById(id) {
        if(id == 0)
            return 'hofer'
        else if(id == 1)
            return 'vdb'
        else if(id == undefined)
            return 'none' // "weiß"
        else
            return 'invalid'
    }

    // returns a promise for an encrypted vote
    prepareVote(candidateId) {
        let candidateName = this.getCandidateNameById(candidateId)
        return this.cryptoUtils.encryptionPromise(candidateName)
    }

    txNonce = 0 // needs to be incremented for consecutive transactions
    castVote(encryptedVote) {
        this.votedPromise = new Promise( (resolve, reject) => {
            this.resolveVotedPromise = resolve
        })

        if(this.standaloneMode) {
            this.castVoteStandalone(encryptedVote)
        } else {
            if(this.web3.eth.defaultAccount != undefined) {
                this.castVoteManaged(this.web3.eth.defaultAccount, encryptedVote)
            } else if(this.web3.eth.accounts.length > 0) {
                let address = this.web3.eth.accounts[0]
                console.log('using first of ' + this.web3.eth.accounts.length + ' accounts provided: ' + address)
                this.castVoteManaged(address, encryptedVote)
            } else {
                alert('no Ethereum account found for executing the voting transaction')
            }
        }
    }

    castVoteManaged(address, encryptedVote) {
        this.Election.vote(this.getRandomToken(), encryptedVote, {from: address}, (err, hash) => {
            if (err) {
                console.log(err)
            } else {
                console.log('castVote done in Tx ' + hash)
                this.myVoteTxHash = hash
                this.resolveVotedPromise()
            }
        })
    }

    castVoteStandalone(encryptedVote) {
        //this.Election.vote(this.getRandomToken(), encryptedVote) // that would be too easy :-)
        // we need to manually handle the transaction creation and signing process
        // TODO: Here I'm cheating. This should use the existing token.
        // However I didn't have time to implement the duplicate vote check (needs to be checked via event since there's no return value)
        // Thus every vote gets a new token -> duplicate vote not possible
        let callData = this.Election.vote.getData(this.getRandomToken(), encryptedVote)
        let pk = this.wallet.getPrivateKey()
        let rawTx = {
            nonce: '0x' + (this.txNonce++).toString(16), // our first transaction
            gasPrice: this.config.getAll().ethereum.gasPrice,
            gasLimit: this.web3.toHex(1000000),
            to: this.contracts.address,
            value: '0x00',
            data: callData
        }
        let tx = new Tx(rawTx)
        tx.sign(pk)
        let serializedTx = tx.serialize()
        this.sentTx = this.web3.eth.sendRawTransaction(`0x${serializedTx.toString('hex')}`, (err, hash) => {
            if (err) {
                console.log(err)
            } else {
                console.log('castVote done in Tx ' + hash)
                this.myVoteTxHash = hash
                this.resolveVotedPromise()
            }
        })
    }

    watchVotes(callback) {
        this.electionStatusPromise.then( () => {
            console.log('watching votes for round ' + this.electionRound)
            // will get all votes for the current round. fromBlock: 0 makes sure those from the past are included
            this.voteEvent = this.Election.voteEvent({_currentRound: this.electionRound}, {fromBlock: 0})
            this.voteEvent.watch((err, result) => {
                if (err) {
                    console.log('### voteEvent: ' + JSON.stringify(err))
                }
                if (result) {
                    let resultStr = JSON.stringify(result)
                    console.log(`*** voteEvent: round ${result.args._currentRound}, tx ${result.transactionHash}`)
                    //console.log(`event detail: ${JSON.stringify(result, null, 2)}`)
                    callback(result)
                }
            })
        })
    }

    // requests some funding for the given address, needed in order to be able to send transactions
    // It may take a few seconds (depending on the connected chain) for the funds to become available. That delay needs to be handled in UI
    // TODO: persist txhash somewhere, e.g. in appstate?
    // TODO: check if we can switch to fetch api
    fundAccount(address) {
        $.ajax(this.config.getAll().refuelBaseUrl + address)
            .done((data, textStatus, jqXHR) => {
                console.log('refuel request done: ' + JSON.stringify(data))
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                console.log('refuel request fail: ' + textStatus + ' - ' + errorThrown)
            })
    }
}
