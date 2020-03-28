var process = require('process')
var Web3 = require('web3')
var fs = require('fs')
var keythereum = require("keythereum")
var assert = require('assert')

assert(fs.existsSync('config.json'), 'config.json missing! See config.json.example')
const config = require('./config')

var context = {}
var compileTask = { enabled: false, runner: require('./tasks/compile') }
var createTask = { enabled: false, runner: require('./tasks/create') }
var configTask = { enabled: false, runner: require('./tasks/config') }

parseCmdline()

var web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.rpc))
try {
    web3.eth.defaultAccount = web3.eth.accounts[0]
    console.log('using account ' + web3.eth.defaultAccount)
} catch(e) {
    console.error('### Setting default account failed. Sure the configured Ethereum node is running?')
    throw e
}

context = Object.assign(context, {
    web3: web3,
    contract: { abi: null, instance: null },
    compiledFile: 'generated/compiled_contract.json',
    deployedAddressFile: 'generated/deployed_address',
    config: config
})

if (!fs.existsSync('generated')){
    fs.mkdirSync('generated');
}

// ################ execute tasks #################

if(compileTask.enabled) {
    console.log('WARNING: complication via RPC call may not be implemented anymore and thus fail')
    if(web3.eth.compile.solidity == undefined) {
        console.error('compiler not found. Make sure solc is installed')
        process.exit(2)
    }
    console.log('compiling...')
    compileTask.runner.run(context)
}

if(createTask.enabled) {
    console.log('creating...')
    loadCompiledFile()
    // is there really no better way to synchronize this?
    createTask.runner.run(context).then( () => {
        checkExecConfig()
    })
} else {
    checkExecConfig()
}

function checkExecConfig() {
    if (configTask.enabled) {
        console.log('configuring...')
        if (!context.contract.abi) {
            loadCompiledFile()
        }
        loadContract()
        configTask.runner.run(context)
    }
}

// ################ helpers #################

function usageExit() {
    console.log(`\tusage: ${process.argv[1]} [--compile <solidity contract source file>] [--create <election name>] [--config <command>] `)
    console.log('\t\t <solidity contract source file> is expected to have the suffix ".sol"')
    console.log('\t\t config commands:')
    console.log('\t\t\t startElection')
    console.log('\t\t\t stopElection')
    console.log('\t\t\t processResult')
    console.log('\t\t\t startNewRound')
    process.exit(1)
}

function parseCmdline() {
    if(process.argv.indexOf('--help') != -1) {
        usageExit()
    }

    if(process.argv.indexOf('--compile') != -1) {
        var solFileIndex = process.argv.indexOf('--compile') + 1
        if(! process.argv[solFileIndex] || ! process.argv[solFileIndex].endsWith('.sol')) {
            usageExit()
        } else {
            compileTask.enabled = true
            context.sourceFile =  process.argv[solFileIndex]
        }
    }

    if(process.argv.indexOf('--create') != -1) {
        var electionNameIndex = process.argv.indexOf('--create') + 1
         if(! process.argv[electionNameIndex]) {
            usageExit()
        } else {
            createTask.enabled = true
            context.electionName =  process.argv[electionNameIndex]
        }
    }

    if(process.argv.indexOf('--config') != -1) {
        var configCmdIndex = process.argv.indexOf('--config') + 1
        if(! process.argv[configCmdIndex]) {
            usageExit()
        } else {
            configTask.enabled = true
            var configCmd = process.argv[configCmdIndex]
            if(configCmd == 'startElection') {
                context.startElection = true
            } else if(configCmd == 'stopElection') {
                context.stopElection = true
            } else if(configCmd == 'processResult') {
                context.processResult = true
            } else if(configCmd == 'startNewRound') {
                context.startNewRound = true
            } else if(configCmd == 'reset') {
                context.reset = true
            } else if(configCmd == 'test') {
                context.test = true
            } else {
                usageExit()
            }
        }
    }
}

function loadCompiledFile() {
    var fileContents = fs.readFileSync(context.compiledFile)
    context.compilerOutput = JSON.parse(fileContents.toString())

    // the output of testrpc and geth/solc is not the same. testrpc seems to support only a single contract.
    if(Object.keys(context.compilerOutput)[0] != 'code') {
        contractName = Object.keys(context.compilerOutput)[0]
        context.contract.code = context.compilerOutput[contractName].code
        context.contract.abi = context.compilerOutput[contractName].info.abiDefinition
    } else {
        context.contract.code = context.compilerOutput.code
        context.contract.abi = context.compilerOutput.info.abiDefinition
    }
}

// creates the contract object from the abi
function loadContract() {
    context.contract.object = web3.eth.contract(context.contract.abi)
    var fileContents = fs.readFileSync(context.deployedAddressFile)
    var address = fileContents.toString()
    console.log('addr: |' + address + '|, type: ' + typeof address + ', len: ' + address.length)
    context.contract.instance = context.contract.object.at(address)
    console.log('contract loaded')
}
