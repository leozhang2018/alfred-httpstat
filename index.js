'use strict';
const util = require('util');
const isUrl = require('is-url');
const alfy = require('alfy');
const http = require('http');
const https = require('https');
const parse = require('url').parse;
const dns = require('dns');

function getDnslookup(host) {
	return new Promise((resolve, reject) => {
		dns.lookup(host, (err, address, family) => {
			resolve(address);
			if (err) {
				reject(err);
			}
		});
	});
}

function httpOutput(url, ip) {
	let begin = Date.now();
	let onLookup = begin; // diff begin - dns resolve
	let onConnect = begin; // diff dns resolve - connect
	let onSecureConnect = begin; // diff connect - secureConnect
	let onTransfer = begin; // diff connect - transfer
	let onTotal = begin; // diff begin - end
	let body = '';
	const req = http.request(url, res => {
		res.once('readable', () => {
			onTransfer = Date.now();
		});
		res.on('data', chunk => {
			body += chunk;
		});
		res.on('end', () => {
			onTotal = Date.now();
			res.body = body;
			alfy.output([
				{
					title: 'DNS Lookup',
					subtitle: onLookup - begin + 'ms' + ` IP: ${ip}`,
					icon: {
						path: 'icons/dns.png'
					}
				},
				{
					title: 'TCP Connection',
					subtitle: onConnect - onLookup + 'ms',
					icon: {
						path: 'icons/tcp.png'
					}
				},
				{
					title: 'Server Processing',
					subtitle: onTransfer - onConnect + 'ms',
					icon: {
						path: 'icons/server.png'
					}
				},
				{
					title: 'Content Transfer',
					subtitle: onTotal - onTransfer + 'ms',
					icon: {
						path: 'icons/content.png'
					}
				},
				{
					title: 'Total',
					subtitle: onTotal - begin + 'ms',
					icon: {
						path: 'icons/total.png'
					}
				},
				{
					title: 'Headers',
					subtitle: `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage} ${res.headers.server} ${res.headers.date}`,
					icon: {
						path: 'icons/header.png'
					}
				}
			]);
		});
	});
	req.on('socket', socket => {
		socket.on('lookup', () => {
			onLookup = Date.now();
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

function httpsOutput(url, ip) {
	let begin = Date.now();
	let onLookup = begin; // diff begin - dns resolve
	let onConnect = begin; // diff dns resolve - connect
	let onSecureConnect = begin; // diff connect - secureConnect
	let onTransfer = begin; // diff connect - transfer
	let onTotal = begin; // diff begin - end
	let body = '';
	const req = https.request(url, res => {
		res.once('readable', () => {
			onTransfer = Date.now();
		});
		res.on('data', chunk => {
			body += chunk;
		});
		res.on('end', () => {
			onTotal = Date.now();
			res.body = body;
			alfy.output([
				{
					title: 'DNS Lookup',
					subtitle: onLookup - begin + 'ms' + ` IP: ${ip}`,
					icon: {
						path: 'icons/dns.png'
					}
				},
				{
					title: 'TCP Connection',
					subtitle: onConnect - onLookup + 'ms',
					icon: {
						path: 'icons/tcp.png'
					}
				},
				{
					title: 'SSL Handshake',
					subtitle: onSecureConnect - onConnect + 'ms',
					icon: {
						path: 'icons/ssl.png'
					}
				},
				{
					title: 'Server Processing',
					subtitle: onTransfer - onSecureConnect + 'ms',
					icon: {
						path: 'icons/server.png'
					}
				},
				{
					title: 'Content Transfer',
					subtitle: onTotal - onTransfer + 'ms',
					icon: {
						path: 'icons/content.png'
					}
				},
				{
					title: 'Total',
					subtitle: onTotal - begin + 'ms',
					icon: {
						path: 'icons/total.png'
					}
				},
				{
					title: 'Headers',
					subtitle: `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage} ${res.headers.server} ${res.headers.date}`,
					icon: {
						path: 'icons/header.png'
					}
				}
			]);
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

if (isUrl(alfy.input)) {
	let url = parse(alfy.input);
	if (url.protocol === 'http:') {
		getDnslookup(url.host)
			.then(ip => {
				httpOutput(url, ip);
			})
			.catch(() => {
				alfy.output([
					{
						title: 'Parse URL Formate Error',
						subtitle: 'Please check the URL formate'
					}
				]);
			});
	} else if (url.protocol === 'https:') {
		getDnslookup(url.host)
			.then(ip => {
				httpsOutput(url, ip);
			})
			.catch(() => {
				alfy.output([
					{
						title: 'Parse URL Formate Error',
						subtitle: 'Please check the URL formate'
					}
				]);
			});
	}
} else {
	alfy.output([
		{
			title: 'Parse URL Formate Error',
			subtitle: 'Please check the URL formate'
		}
	]);
}
