export class App {
  configureRouter(config, router) {
    config.title = 'blockvote';
    config.map([
      {route: ['', 'start'], name: 'start', moduleId: 'start', nav: true, title: 'Start' },
      {route: 'authenticate', name: 'authenticate', moduleId: 'authenticate', nav: true, title: 'Authentifizieren'},
      {route: 'vote', name: 'vote', moduleId: 'vote', nav: true, title: 'Abstimmen'},
      {route: 'result', name: 'result', moduleId: 'result', nav: true, title: 'Ergebnis'},
      {route: 'about', name: 'about', moduleId: 'about', nav: false},
      {route: 'test', name: 'test', moduleId: 'test', nav: false}
    ]);

    this.router = router;
  }
}
