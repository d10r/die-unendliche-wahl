import {inject} from 'aurelia-framework'
import {ApplicationState} from 'applicationstate'
import {Logic} from 'logic'

@inject(ApplicationState, Logic)
export class Processing {

    constructor(appState, logic) {
        this.appState = appState
        this.logic = logic

        if (! this.appState.isTokenSet()) {
            console.log('token not set, need auth')
            window.location = "#/authenticate";
        }

        this.rows = [];
        this.i = 0;
        //this.fill();

        this.listenForUpdates()
    }

    listenForUpdates() {
        console.log('install voteListener')
        this.logic.watchVotes( (event) => {
            // let eventStr = `neue Stimme: Block ${event.blockNumber} - Transaktion ${event.transactionHash}`
            let eventStr = 'neue Stimme | Block ' + event.blockNumber + ' - Transaktion: ' + event.transactionHash + ' - Gesamtstimmen: ' + event.args['']
            this.rows.push( { msg: eventStr } )
        } )
    }

    fill() {
        for (var i = 0; i < 30; i++) {
            this.i += i;
            this.rows.push({
                msg: "Stimme für van der Bellen " + this.i
            });
            this.rows.push({
                msg: "Stimme für van der Wuf " + this.i
            });
            this.rows.push({
                msg: "Stimme vergessen " + this.i
            });
        }
    }

    refresh() {
        // this.fill()
        $('.scrollable').stop().animate({
            scrollTop: $('.scrollable')[0].scrollHeight
        }, 800);
    }
}
