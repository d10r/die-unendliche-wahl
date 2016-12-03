# App

This directory contains a web application which implements the election User Interface.
```install.sh``` will fetch the needed dependencies (a lot of them!).
The application is based on the Aurelia framework, using the jspm package manager.

After installing, run ```build.sh``` in order to get ready for serving.
The application can either be run with ```gulp``` (listening to localhost:9000) or by pointing a web server to the app directory.
```gulp watch``` does also serve on port 9000 and additionally rebuilds the app everytime a source file is changed.
