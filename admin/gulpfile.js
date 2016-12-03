/*
 * This can be used to automatically trigger compilation and deployment of the contract when modified.
 * Run with "gulp watch". If gulp isn't installed, install it with "npm install -g gulp"
 */

var gulp = require('gulp')
var cp = require('child_process')

var contractFile = '../blockchain/contracts/blockvote.sol'

gulp.task('default', ['watch'])

gulp.task('redeploy', (callback) => {
	cp.exec(`node main.js --compile ${contractFile} --create demo`, (err, stdout, stderr) => {
		console.log('*** ' + stdout)
		console.log('### ' + stderr)
		callback(err)
	})
})

gulp.task('watch', () => {
	gulp.watch(contractFile, ['redeploy'])
	console.log('redeploy task installed')
})
