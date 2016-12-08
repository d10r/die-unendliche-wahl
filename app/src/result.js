import {inject} from 'aurelia-framework'
import {ApplicationState} from 'applicationstate'
import {Logic} from 'logic'
import {Configure} from 'aurelia-configuration'
import 'chart.js'

@inject(ApplicationState, Logic, Configure)
export class Processing {

    constructor(appState, logic, config) {
        this.appState = appState
        this.logic = logic
        this.config = config
        this.chainExplorer = this.config.getAll().ethereum.chainExplorer

        if (! this.appState.isTokenSet()) {
            console.log('token not set, need auth')
            window.location = "#/authenticate";
        }

        this.rows = [];
        this.i = 0;

        this.listenForVotes()
        this.waitForResult()

        this.nextRoundCountdown()

        window.result = this
    }

    nextRoundCountdown() {
        var dNow = new Date()
        var dLast = new Date(
            dNow.getFullYear(),
            dNow.getMonth(),
            dNow.getDate(),
            0,0,0)

        var secondsLeft = 60*60*24 - Math.floor((dNow.getTime() - dLast.getTime()) / 1000)

        // add leading zero if single digit
        function pad(value) {
            if(value < 10) {
                return '0' + value;
            } else {
                return value;
            }
        }

        var tick = () => {
            let str = `${Math.floor(secondsLeft / 3600)}h ${pad(Math.floor((secondsLeft / 60)) % 60)}m ${pad(secondsLeft % 60)}s`
            this.nextRoundCountdown = str
            if(secondsLeft-- > 0)
                setTimeout(tick, 1000)
        }
        tick()
    }

    waitForResult() {
        // TODO: this is a massive WTF. canvas context isn't ready when called immediately from ctor.
        // wrapping into $(document).ready() didn't help either
        setTimeout( () => {
            this.logic.electionResultPromise.then(() => {
                this.createResultChart(this.logic.electionResult)
            })
        }, 1000)
    }


    listenForVotes() {
        console.log('install vote listener')
        this.logic.watchVotes(this.renderVoteEvent)
    }

    renderVoteEvent = (voteEvent) => {
        let row = {
            chainExplorer: this.chainExplorer,
            blockNr: voteEvent.blockNumber,
            tx: voteEvent.transactionHash,
            myVote: this.logic.myVoteTxHash == voteEvent.transactionHash,
            nrVotes: voteEvent.args['_nrVotes']
        }

        this.rows.push(row)
        this.scrollTop()
    }

    testPopulateList(nrItems) {
        for(let i = 0; i < nrItems; i++) {
            let row = {
                chainExplorer: this.chainExplorer,
                blockNr: 22,
                tx: '0x538a60fe906c385c8944cdd3ed7398e6f18b418118937395031c5aae3dd2bae2 ',
                nrVotes: 33
            }
            this.rows.push(row)
        }
    }

    scrollTop() {
        let listElem = $('#live-votes')
        listElem.stop().animate({scrollTop: listElem[0].scrollHeight}, 800)
    }

    // this assumes a result object of the form {'hofer': <int>,'vdb': <int>}
    createResultChart(result) {
        console.log('creating chart')
        var ctx = document.getElementById("chart-area").getContext("2d");

        // testing hack
        if(! result)
            result = { "hofer":50,"vdb":50 }

        window.chartColors = {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            blue: 'rgb(0, 0, 255)',
            green: 'rgb(0, 128, 0)',
        }

        console.log('hofer:' + result['hofer'])
        console.log('vdb:' + result['vdb'])

        var config = {
            type: 'pie',
            data: {
                datasets: [{
                    data: [
                        result['hofer'],
                        result['vdb']
                    ],
                    backgroundColor: [
                        window.chartColors.red,
                        window.chartColors.orange
                    ],
                    label: 'Wahlergebnis'
                }],
                labels: [
                    "Norbert Hofer",
                    "Alexander van der Bellen"
                ]
            },
            options: {
                responsive: true,
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        }

        window.myPie = new Chart(ctx, config);
    }
}
