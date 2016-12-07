var exec = require('child_process').exec
var fs = require('fs')

var privKeyFile = 'keys/private.pem'
exports.run = (ctx) => {
    //  var retHex = ctx.contract.instance.testFunc.call();
    //  console.log(ctx.web3.toDecimal(retHex))

    // do something useful...
    if(ctx.test) {
        var ret = ctx.contract.instance.testFunc.call()
        console.log('testFunc: ' + ret)

        var ret = ctx.contract.instance.multiply.call(3)
        console.log('multiply: ' + ret)
    }

    if(ctx.startElection) {
        var ret = ctx.contract.instance.startElection()
        console.log('election started' + ' - ' + ret)
    }

    if(ctx.stopElection) {
        var ret = ctx.contract.instance.stopElection()
        console.log('election stopped' + ' - ' + ret)
    }

    // this call seems to be quite expensive and tends to run out of gas, see
    // https://testnet.etherscan.io/tx/0xf25653abc06c86bf49221cb8f7f155e59a6d95c5f7c489bb87ad9adf851f8599
    // TODO: check how this relates to the size of vote array and how to fix
    // TODO: make sure the block gas limit isn't exceeded
    if(ctx.startNewRound) {
        var ret = ctx.contract.instance.startNewRound({gas: 4000000})
        console.log('new round started' + ' - ' + ret)
    }

    if(ctx.reset) {
        var ret = ctx.contract.instance.reset({gas: 4000000})
        console.log('election reset' + ' - ' + ret)
    }

    if(ctx.processResult) {
        console.log('processing result...')

        ctx.electionResult = {}
        var decryptPromises = []

        var nrVotes = ctx.web3.toDecimal(ctx.contract.instance.nrVotes())
        console.log('nr votes: ' + nrVotes)
        for(var i=0; nrVotes; i++) {
            try {
                var v = ctx.contract.instance.votes(i)
                console.log(`fetched vote ${i}`)
                //console.log(i + ': ' + v[2])

                decryptPromises.push(decryptPromise(i, v[2]))
            } catch(e) {
                // TODO: this was a workaround because of unknown length: iterate until it fails. Shouldn't be needed anymore
                // TODO: distinguish between end of array and other errors
                //console.error(e)
                console.log(`end reached after ${i} iterations`)
                if(i == 0)
                    return
                else
                    break
            }
        }

        console.log('waiting for decryption to finish...')
        Promise.all(decryptPromises).then( () => {
            var resultStr = JSON.stringify(ctx.electionResult)
            console.log('all done. Result: ' + resultStr)

            if(resultStr)
            publishResult(resultStr)
        })
    }

    function publishResult(result) {
        console.log('publishing...')
        var privKey = fs.readFileSync(privKeyFile).toString()
        ctx.contract.instance.publishResult(result, privKey, {gas: 2000000}) // quite expensive
        console.log('done')
    }

    function decryptPromise(id, encVote) {
        return new Promise((resolve, reject) => {
            var encFilename = '.encVote' + id
            var buf = Buffer.from(encVote, 'base64')
            fs.writeFileSync(encFilename, buf)

            var decryptCmd =  `openssl rsautl -decrypt -oaep -inkey ${privKeyFile} -in ${encFilename}`
            exec(decryptCmd, (error, stdout, stderr) => {
                fs.unlink(encFilename)
                if(error) {
                    console.error(`exec error: ${error}`)
                    reject()
                    //return
                }

                var candidateName = stdout
                console.log(`decrypted vote ${id}: ${candidateName}`)

                if(! ctx.electionResult[candidateName])
                    ctx.electionResult[candidateName] = 1
                else
                    ctx.electionResult[candidateName]++

                resolve()
            })
        })
    }
}

