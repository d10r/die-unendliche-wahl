// source: https://github.com/ethereum/go-ethereum/wiki/bitchin-tricks#mining
// use this with geth in order to mine only when transactions are pending.
// useful when running a dedicated blockchain in order to keep CPU usage low

var mining_threads = 1

function checkWork() {
    if (eth.getBlock("pending").transactions.length > 0) {
        if (eth.mining) return;
        console.log("== Pending transactions! Mining...");
        miner.start(mining_threads);
    } else {
        miner.stop();
        console.log("== No transactions! Mining stopped.");
    }
}

eth.filter("latest", function(err, block) { checkWork(); });
eth.filter("pending", function(err, block) { checkWork(); });

checkWork();
