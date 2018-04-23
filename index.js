'use strict';
const isUrl = require('is-url');
const alfy = require('alfy');
const http = require('http');
const https = require('https');
const parse = require('url').parse;
const dns = require('dns');

if (isUrl(alfy.input)) {
	let url = parse(alfy.input);
	let protocol = url.protocol === 'https:' ? https : http;
	let begin = Date.now();
	let onLookup = begin; // diff begin - dns resolve
	let onConnect = begin; // diff dns resolve - connect
	let onSecureConnect = begin; // diff connect - secureConnect
	let onTransfer = begin; // diff connect - transfer
	let onTotal = begin; // diff begin - end
	let body = '';
	let ip = '';
	
	dns.lookup(url.host, (err, address, family) => {
		ip = address;
	});
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
						subtitle: onLookup - begin + 'ms' + ` IP: ${ip}`
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
					},
					{
						title: 'Headers',
						subtitle: `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage} ${res.headers.server} ${res.headers.date}`
					}
				]);
			} else if (url.protocol === 'http:') {
				alfy.output([
					{
						title: 'DNS Lookup',
						subtitle: onLookup - begin + 'ms' + ` IP: ${ip}`
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
					},
					{
						title: 'Headers',
						subtitle: `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage} ${res.headers.server} ${res.headers.date}`
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
}
