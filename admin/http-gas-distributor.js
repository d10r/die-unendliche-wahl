// Ethereum currently doesn't allow contracts to pay for execution.
// As a workaround clients can call this script with an Ethereum address as parameter in order to get some funding.
// This workaround should become obsolete with the Ethereum Serenity release, see https://blog.ethereum.org/2016/03/05/serenity-poc2/ (Gas checking)

// example url: http://localhost:8599/addr/0x05125d60d2754e4d219cae2f2dcba46f73d415a2

var http = require('http')
var url = require('url')
var Web3 = require('web3')
const config = require('./config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.rpc))
const adminAcc = web3.eth.accounts[0]
var listenIface = config.gasDistributor.interface
var listenPort = config.gasDistributor.port

http.createServer((req, res) => {
    var pathname = url.parse(req.url).pathname
    console.log(`request for ${pathname}`)

    // check if it's a path we care about
    var splitPath = url.parse(req.url).path.split('/')
    if(splitPath[1] == 'addr' && splitPath[2].startsWith('0x')) {
        var userAddr = splitPath[2]
        console.log(`go serve ${userAddr}`)
        res.setHeader('Access-Control-Allow-Origin', '*');
        refuelAccount(userAddr, (err, txHash) => {
            if(err) {
                res.writeHead(500, {'Content-Type': 'text/plain'})
                res.end('Sorry, something went wront here')
            }
            if(txHash) {
                res.writeHead(200, {'Content-Type': 'application/json'})
                res.end(JSON.stringify({
                  'txHash': txHash,
                  'msg': 'Funds are on the way'
                }))
            }
        })

        console.log('back listening')
    } else {
        res.writeHead(401, {'Content-Type': 'text/plain'})
        res.end("I don't understand what you want")
    }
}).listen(listenPort, listenIface)
console.log(`http server listening at interface ${listenIface} port ${listenPort}`)

function refuelAccount(userAcc, callback) {
    printBalances()
    function printBalances() {
        var adminBalance = web3.eth.getBalance(adminAcc)
        var userBalance = web3.eth.getBalance(userAcc)

        console.log(`balance of admin account : ${web3.fromWei(adminBalance, 'ether')} ether`)
        console.log(`balance of account ${userAcc} : ${web3.fromWei(userBalance, 'ether')} ether`)
    }

    console.log('sending 100 finney to user...') // the voting tx is currently about 10 finney = 0,01 Ether
    txHash = web3.eth.sendTransaction({from: adminAcc, to: userAcc, value: web3.toWei(100, 'finney')})
    callback(null, txHash)

    console.log(`waiting for mining of transaction ${txHash}...`)
    waitForTxReceipt()

    var loopCnt = 0
    const maxWaitCnt = 60
    function waitForTxReceipt() {
        setTimeout(() => {
            txReceipt = web3.eth.getTransactionReceipt(txHash)
            if(txReceipt) {
                console.log(`\ntx processed: ${JSON.stringify(txReceipt, null, 4)}`)
                printBalances()
            } else {
                if(loopCnt++ < maxWaitCnt) {
                    process.stdout.write('.')
                    waitForTxReceipt()
                } else {
                    console.log(`\n### no tx receipt received after ${maxWaitCnt} seconds, giving up`)
                }
            }
        }, 1000)
    }
}
