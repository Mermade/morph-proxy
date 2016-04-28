var http = require('http');
var https = require('https');
var express = require('express');
var app = express();

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function pushAt(arr,index,value) {
	while (arr.length<index) {
		arr.push(null);
	}
	arr[index] = value;
}

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

app.use("/images",  express.static(__dirname + '/pub/images'));
app.use("/css",  express.static(__dirname + '/pub/css'));
app.use("/scripts",  express.static(__dirname + '/pub/scripts'));

app.get('/', function(req, res) {
	res.redirect('/index.html');
});
app.get('/*.html', function (req, res) {
	res.sendFile(__dirname+'/pub'+req.path);
});

app.get('/favicon.ico', function(req, res) {
	res.sendFile(__dirname+'/pub/images/favicon.ico');
});
app.get('/logo.png', function(req, res) {
	res.sendFile(__dirname+'/pub/images/logo.png');
});
app.get('/browserconfig.xml', function(req,res) {
	res.send('<?xml version="1.0" encoding="utf-8"?><browserconfig><msapplication></msapplication></browserconfig>');
});

app.get('/dynamic/env.js', function(req,res) {
	var env = {};
	for (var i in process.env) {
		if (i!='KEY') {
			env[i] = process.env[i];
		}
	}
	res.send('var proxyEnv = '+JSON.stringify(env)+';');
});

app.get('/:owner/:scraper/data.:format', function (req, res) {
	var owner = process.env.OWNER ? process.env.OWNER : req.params.owner;
	var scraper = process.env.SCRAPER ? process.env.SCRAPER : req.params.scraper;
	var format = process.env.FORMAT ? process.env.FORMAT : (req.params.format ? req.params.format : 'json');
	var key = process.env.KEY ? process.env.KEY : req.query.key;
	var callback = process.env.CALLBACK ? process.env.CALLBACK : req.query.callback;
	var query = process.env.QUERY ? process.env.QUERY : (req.query.query ? req.query.query : 'SELECT "true" AS working');

	if (query.startsWith('QUERY')) {
		query = process.env[query] ? process.env[query] : 'SELECT "false" AS queryfound';
		var rp = [];
		for (var q in req.query) {
			if (q.startsWith('!')) {
				var qid = parseInt(q.replace('!',''),10);
				if (!isNaN(qid)) {
					var value = req.query[q];
					value = value.replaceAll('"','\\"'); // sanitise double quotes
					value = value.replaceAll("'","\\'"); // sanitise single quotes
					if (qid<=99) pushAt(rp,qid,value);
				}
			}
		}
		for (var i=0;i<rp.length;i++) {
			var param = '!'+i;
			query = query.replaceAll(param,rp[i]);
		}
	}
	else {
		if ((query == req.query.query) && (process.env.CANNED_ONLY == "true")) {
			query = 'SELECT "false" as queryallowed';
		}
	}

	var mimeType = 'application/json';
	if (format == 'csv') mimeType = 'text/plain'
	else if (format == 'atom') mimeType = 'application/xml+atom';

	var queryParameters = {
		query: query,
		key: key
	};
	if (typeof callback != 'undefined') {
		queryParameters.callback = callback;
	}

	var options = {
		host: 'api.morph.io',
		port: 443,
		path: '/'+owner+'/'+scraper+'/data.'+format,
		method: 'GET',
		headers: {
			'Accept': mimeType
		},
		query: queryParameters
	};

	console.log(options.path+' '+query);

	getResponse(options,function(stateCode,obj) {
		res.status(stateCode);
		res.send(obj);
	});

});

var myport = process.env.PORT || 5000;
if (process.argv.length>2) myport = process.argv[2];

var server = app.listen(myport, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Morph.io proxy listening at http://%s:%s', host, port);
});