var http = require('http');
var https = require('https');
var express = require('express');
var app = express();

function getResponse(options, onResult) {
	var prot = options.port == 443 ? https : http;
	options.headers.Connection = 'keep-alive';
	var queryString = '';
	for (var q in options.query) {
		queryString += (queryString ? '&' : '?') + q+'='+encodeURIComponent(options.query[q]);
	}
	options.path += queryString;
	var req = prot.request(options, function(res) {
		var output = '';
		console.log(options.host + ':' + res.statusCode);
		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			output += chunk;
		});

		res.on('end', function() {
			onResult(res.statusCode, output);
		});
	});

	req.on('error', function(err) {
		//res.send('error: ' + err.message);
	});

	req.end();
}

app.get('/', function(req, res) {
	res.sendFile(__dirname+'/pub/index.html');
});

app.get('/favicon.ico', function(req, res) {
	res.sendFile(__dirname+'/pub/images/favicon.ico');
});
app.get('/browserconfig.xml', function(req,res) {
	res.send('<?xml version="1.0" encoding="utf-8"?><browserconfig><msapplication></msapplication></browserconfig>');
});

app.use("/images",  express.static(__dirname + '/pub/images'));
app.use("/css",  express.static(__dirname + '/pub/css'));
app.use("/scripts",  express.static(__dirname + '/pub/scripts'));

app.get('/*.html', function (req, res) {
	res.sendFile(__dirname+'/pub'+req.path);
});

app.get('/:owner/:scraper/data.:format', function (req, res) {
	var owner = process.env.OWNER ? process.env.OWNER : req.params.owner;
	var scraper = process.env.SCRAPER ? process.env.SCRAPER : req.params.scraper;
	var format = process.env.FORMAT ? process.env.FORMAT : (req.params.format ? req.params.format : 'json');
	var query = process.env.QUERY ? process.env.QUERY : (req.query.query ? req.query.query : 'SELECT "true" as working');
	var key = process.env.KEY ? process.env.KEY : req.query.key;

	var mimeType = 'application/json';
	if (format == 'csv') mimeType = 'text/plain'
	else if (format == 'atom') mimeType = 'application/xml+atom';

	var options = {
		host: 'api.morph.io',
		port: 443,
		path: '/'+owner+'/'+scraper+'/data.'+format,
		method: 'GET',
		headers: {
			'Accept': mimeType
		},
		query: {
			query: query,
			key: key
		}
	};

	console.log(options.path+' '+query);

	getResponse(options,function(stateCode,obj) {
		if (stateCode == 200) {
			res.send(obj);
		}
		else {
			res.status(stateCode); //.end();
			res.send(obj);
		}
	});

});

var myport = process.env.PORT || 5000;
if (process.argv.length>2) myport = process.argv[2];

var server = app.listen(myport, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Morph.io proxy listening at http://%s:%s', host, port);
});