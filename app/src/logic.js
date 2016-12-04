import {inject} from 'aurelia-framework'
import {Configure} from 'aurelia-configuration'

import Web3 from 'web3'
//import Wallet from 'ethereumjs-wallet'
//import Tx from 'ethereumjs-tx'
import 'ethereumjs-wallet-workaround'

// can't figure out how to model this module to get it usable without injection
import {Contracts} from 'contracts'

import {Crypto} from 'crypto'

// TODO: test browser compatibility (e.g. crypto api)

@inject(Configure, Contracts, Crypto)
export class Logic {
    constructor(config, contracts, crypto) {
        this.config = config
        this.contracts = contracts
        this.crypto = crypto

        // eth and account setup are done asap, because the funding request will take some time anyway
        // and may block voting (the voting module waits for a funding promise)
        try {
            this.initEth()
            this.createAndFundAccount()
            this.instantiateContract()

            this.watchElectionStatus()
        } catch(e) {
            alert('Etwas ist bei der Initialisierung gehörig schief gegangen, sorry.\nMöglicherweise ist die Blockchain nicht erreichbar.\nDie Applikation wird vermutlich nicht wie vorgesehen funktionieren.')
            console.error(e)
        }

        window.web3 = this.web3 // DEBUG
        window.logic = this
        //window.Wallet = Wallet
        window.tx = Tx
    }

    testCrypto() {
        this.crypto.encryptionPromise('hallo').then( (cipheredData) => {
            var cipheredValue = this.crypto.arrayBufferToBase64String(cipheredData);
            console.log('data: ' + cipheredData)
            console.log('value: ' + cipheredValue)
        })
    }

    initEth() {
        // getAll() is a workaround to get() currently supporting only 2 levels, see https://github.com/Vheissu/aurelia-configuration/issues/68
        let rpcAddr = this.config.getAll().ethereum.rpc

        console.log('creating web3')
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcAddr))

        this.gasPrice = 20000000000 // init to a reasonable value
        this.web3.eth.getGasPrice( (err, ret) => {
            if(! err) {
                this.gasPrice = this.web3.toDecimal(ret)
                console.log('gasPrice: ' + this.gasPrice)
            }
        })

        this.wallet = Wallet.generate()
        this.electionResultPromise = this.getElectionResultPromise()
    }

    createAndFundAccount() {
        //debugger
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

    /*
    accountIsFunded() {
        let balance = this.web3.toDecimal(this.web3.eth.getBalance(this.web3.eth.defaultAccount))
        if(balance > 0)
            return true
        else
            return false
    }
    */

    electionStatusObservers = new Set()
    watchElectionStatus() {
        // TODO: this should use an Ethereum event instead of polling
        let update = () => {
            this.Election.currentStage((err, ret) => {
                if (!err) {
                    let newStatus = this.web3.toDecimal(ret)
                    if(this.electionStatus != newStatus) {
                        console.log(`new election status: ${newStatus} (${this.electionStageToString(newStatus)})`)
                        this.electionStatus = newStatus

                        if(this.electionStatus == 3) {
                           this.setElectionResult()
                        }

                        /*
                        for(let observer of this.electionStatusObservers) {
                            observer()
                        }
                        */
                    }
                }
                setTimeout(update, 10000)
            })
        }

        update()
    }

    setElectionResult() {
        this.Election.result((err, ret) => {
            if (!err) {
                console.log('got election result: ' + ret)

                try {
                    this.electionResult = JSON.parse(ret)
                } catch(e) {
                    console.error('parsing election result failed with: ' + e)
                    return
                }
                if(! this.electionResult['hofer']) {
                    this.electionResult['hofer'] = 0
                }
                if(! this.electionResult['vdb']) {
                    this.electionResult['vdb'] = 0
                }

                this.electionResultReady() // triggers promise resolution
            }
        })
    }

    // expects a function without params as parameter
    addElectionStatusObserver(observer) {
        this.electionStatusObservers.add(observer)
    }

    removeElectionStatusObserver(observer) {
        this.electionStatusObservers.delete(observer)
    }

    electionStageToString(stage) {
        switch(stage) {
            case 0: return 'not yet started'
            case 1: return 'in progress'
            case 2: return 'processing'
            case 3: return 'result ready'
        }
    }

    watchErrors() {
        this.errEvent = this.Election.error()
        this.errEvent.watch( (err, result) => {
            console.log('#err# err: ' + JSON.stringify(err) + ' - result: ' + JSON.stringify(result))
        })
    }

    watchLog() {
        this.logEvent = this.Election.error()
        this.logEvent.watch( (err, result) => {
            console.log('#log# err: ' + err + ' - result: ' + result)
        })
    }

    getRandomToken() {
        var array = new Uint32Array(8)
        window.crypto.getRandomValues(array)
        var token = array.join('')
        return token
        // TODO: convert to an alphanumeric string
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
        return this.crypto.encryptionPromise(candidateName)
    }

    txNonce = 0 // needs to be incremented for consecutive transactions
    castVote(encryptedVote) {
        this.watchErrors()
        this.watchLog()

        //this.Election.vote(this.getRandomToken(), encryptedVote) // that would be too easy :-)
        // we need to manually handle the transaction creation and signing process
        // TODO: Here I'm cheating. This should use the existing token.
        // However I didn't have time to implement the duplicate vote check (needs to be checked via event since there's no return value)
        // Thus every vote gets a new token -> duplicate vote not possible
        let callData = this.Election.vote.getData(this.getRandomToken(), encryptedVote)
        let pk = this.wallet.getPrivateKey()
        let rawTx = {
            nonce: '0x' + (this.txNonce++).toString(16), // our first transaction
            gasPrice: this.web3.toHex(this.gasPrice),
            gasLimit: this.web3.toHex(1000000),
            to: this.contracts.address,
            value: '0x00',
            data: callData
        }
        let tx = new Tx(rawTx)
        tx.sign(pk)
        let serializedTx = tx.serialize()
        this.sentTx = this.web3.eth.sendRawTransaction(serializedTx.toString('hex'), (err, hash) => {
            if(err) {
                console.log(err)
            } else {
                console.log('castVote done in Tx ' + hash)
                this.myVoteTxHash = hash
            }
        })
    }

    votes = []
    watchVotes(callback) {
        this.voteEvent = this.Election.voteEvent()
        this.voteEvent.watch( (err, result) => {
            if(err) {
                console.log('### voteEvent: ' + JSON.stringify(err))
            }
            if(result) {
                let resultStr = JSON.stringify(result)
                console.log('*** voteEvent: ' + JSON.stringify(resultStr))
                this.votes.push(result)
                callback(result)
            }
        })
    }

    getStructuredVote(v) {
        let chainExplorer = this.config.getAll().ethereum.chainExplorer
        let row = {
            chainExplorer: chainExplorer,
            blockNr: event.blockNumber,
            tx: event.transactionHash,
            nrVotes: event.args['']
        }

        // let eventStr = `neue Stimme: Block ${event.blockNumber} - Transaktion ${event.transactionHash}`
        //let eventStr = `neue Stimme | Block <a href="${chainExplorer}/block/${event.blockNumber}">${event.blockNumber}</a> - Transaktion: ${event.transactionHash} - Gesamtstimmen: ${event.args['']}`
        //this.rows.push( { msg: eventStr } )
        this.rows.push(row)
        this.scrollTop()
    }

    getElectionResultPromise() {
        return new Promise( (resolve, reject) => {
            this.electionResultReady = resolve // will be triggered from outside
        })
    }

    // requests some funding for the given address, needed in order to be able to send transactions
    // It may take a while (~20 seconds) for the funds to become available. That delay needs to be handled in UI
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
