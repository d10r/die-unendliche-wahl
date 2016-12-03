export class ApplicationState {
    constructor() {
        this.token = localStorage.getItem('token')
        console.log('appstate ctor - token: ' + this.token)
    }

    isTokenSet() {
        return this.token != null
    }

    persist() {
        if(this.token)
            localStorage.setItem('token', this.token)
    }

    reset() {
        localStorage.clear()
    }
}