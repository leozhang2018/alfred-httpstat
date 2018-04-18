'use strict';
const alfy = require('alfy');
const http = require('http');
const https = require('https');
const parse = require('url').parse;

let url = parse(alfy.input);
let protocol = url.protocol === 'https:' ? https : http;
var begin = Date.now();
var onLookup = begin; // diff begin - dns resolve
var onConnect = begin; // diff dns resolve - connect
var onSecureConnect = begin; // diff connect - secureConnect
var onTransfer = begin; // diff connect - transfer
var onTotal = begin; // diff begin - end
var body = '';
const req = protocol.request(url, res => {
	res.once('readable', () => {
		onTransfer = Date.now();
	});
	res.on('data', chunk => {
		body += chunk;
	});
	res.on('end', () => {
		onTotal = Date.now();
		res.body = body;
		if (url.protocol === 'https:') {
			alfy.output([
				{
					title: 'DNS Lookup',
					subtitle: onLookup - begin + 'ms'
				},
				{
					title: 'TCP Connection',
					subtitle: onConnect - onLookup + 'ms'
				},
				{
					title: 'SSL Handshake',
					subtitle: onSecureConnect - onConnect + 'ms'
				},
				{
					title: 'Server Processing',
					subtitle: onTransfer - onSecureConnect + 'ms'
				},
				{
					title: 'Content Transfer',
					subtitle: onTotal - onTransfer + 'ms'
				},
				{
					title: 'Total',
					subtitle: onTotal - begin + 'ms'
				}
			]);
		} else if (url.protocol === 'http:') {
			alfy.output([
				{
					title: 'DNS Lookup',
					subtitle: onLookup - begin + 'ms'
				},
				{
					title: 'TCP Connection',
					subtitle: onConnect - onLookup + 'ms'
				},
				{
					title: 'Server Processing',
					subtitle: onTransfer - onConnect + 'ms'
				},
				{
					title: 'Content Transfer',
					subtitle: onTotal - onTransfer + 'ms'
				},
				{
					title: 'Total',
					subtitle: onTotal - begin + 'ms'
				}
			]);
		}
	});
});
req.on('socket', socket => {
	socket.on('lookup', () => {
		onLookup = Date.now();
	});
	socket.on('secureConnect', () => {
		onSecureConnect = Date.now();
	});
	socket.on('connect', () => {
		onConnect = Date.now();
	});
});

req.on('error', reject => {
	alfy.output([
		{
			title: 'Resolve Error',
			subtitle: 'Please Check the URL'
		}
	]);
});
req.end();
