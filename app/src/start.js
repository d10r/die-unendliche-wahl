import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Logic} from 'logic'

@inject(Router, Logic)
export class Start {
    constructor(router, logic) {
        this.router = router
        this.logic = logic

        window.start = this // DEBUG

    }

    testCrypto() {
        this.logic.testCrypto()
    }
}
