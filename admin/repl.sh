# starts an interactive node repl with web3 initialized, the contract loaded and instantiated

node -i -e "
fs = require('fs')
Web3 = require('web3')
config = require('./config')

function update() {
        web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.rpc))

        file = fs.readFileSync('generated/compiled_contract.json')
        compiled = JSON.parse(file)
        try {
                abi = compiled.Election.info.abiDefinition
        } catch(e) {
                abi = compiled.info.abiDefinition
        }
        object = web3.eth.contract(abi)
        address = fs.readFileSync('generated/deployed_address').toString()

        web3.eth.defaultAccount = web3.eth.accounts[0]

        instance = object.at(address)

        events = instance.allEvents()
        events.watch( (err, event) => {
                if(err) console.log('###' + err)
                if(event) console.log('*** ' + JSON.stringify(event, null, '  '))
        } )
}

update()
"
