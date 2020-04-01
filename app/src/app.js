export class App {
  configureRouter(config, router) {
    config.title = 'Die unendliche Wahl';
    config.addPipelineStep('postcomplete', PostCompleteStep)
    config.map([
      {route: ['', 'start'], name: 'start', moduleId: 'start', nav: true, title: 'Start' },
      {route: 'authenticate', name: 'authenticate', moduleId: 'authenticate', nav: true, title: 'Authentifizieren'},
      {route: 'vote', name: 'vote', moduleId: 'vote', nav: true, title: 'Abstimmen'},
      {route: 'result', name: 'result', moduleId: 'result', nav: true, title: 'Ergebnis'},
      {route: 'test', name: 'test', moduleId: 'test', nav: false}
    ]);

    this.router = router;
  }
}

// Scroll to top after changing to a new view
// from https://github.com/aurelia/router/issues/170
class PostCompleteStep {
  run(routingContext, next) {
    $("body").scrollTop(0);
    return next();
  }
}