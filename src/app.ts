require("dotenv").config();
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as express from 'express';
import * as shrinkRay from 'shrink-ray-current'
import * as cors from 'cors'
import * as mimetypes from 'mime-types'

import {setlog} from './helper';

/* import * as connect from 'connect-redis' */
/* const redis = require('redis') */
const session = require('express-session')
const redisStore = require('connect-redis')(session);
const Redis = require("ioredis");
const redis = new Redis();

/* const redisStore = connect(session); */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const isDevelop = process.env.NODE_ENV==='development';
const dsJson = require('../.domains.' + (isDevelop ? 'dev' : 'prod') + '.json')

const port = Number(process.env.HTTP_PORT || 80)
const portHttps = Number(process.env.HTTPS_PORT || 443)
const appStarted = process.env.APP_STARTED==="1"

process.on("uncaughtException", (err:Error) => setlog('exception',err));
process.on("unhandledRejection", (err:Error) => setlog('rejection',err));

Date.now = () => Math.round((new Date().getTime()) / 1000);

const run = async () => {
	try {
		const app = express()
		const server = http.createServer(app)
		let httpsServer = null as any;
		const fileKey = __dirname+'/../certs/icicb.com.key'
		const filePem = __dirname+'/../certs/icicb.com.pem'
		const fileCa = __dirname+'/../certs/icicb.com.ca'
		if (fs.existsSync(fileKey) && fs.existsSync(filePem) && fs.existsSync(fileCa)) {
			const key = fs.readFileSync(fileKey, 'utf8')
			const cert = fs.readFileSync(filePem, 'utf8')
			const caBundle = fs.readFileSync(fileCa, 'utf8')
			const ca = caBundle.split('-----END CERTIFICATE-----\r\n') .map((cert) => cert +'-----END CERTIFICATE-----\r\n')
			const options = {cert,key,ca}
			httpsServer = https.createServer(options,app)
		}
		/* const client  = redis.createClient();
		await client.connect(); */
		app.use(session({
			secret: 'spsphzopy2kfptblyfybd5oxhymmm2s2e6',
			store: new redisStore({ host: '127.0.0.1', port: 6379, client:redis , ttl: 3600}),
			resave: false,
			saveUninitialized: false,
			/* cookie: { secure: false } */
		}))
		app.use(shrinkRay())
		app.use(cors({
			origin: function(origin, callback){
				return callback(null, true)
			}
		}))
		app.use(express.json())
		app.use(express.urlencoded({extended: true}))
		const domains = {}  as {
			[domain:string]:{
				ui:string,
				api:string,
				files:{[uri:string]:WebFileType}
				errors:{[uri:string]:boolean}
			}
		}
		for(let i in dsJson) {
			if (dsJson[i].ui) {
				const _filepath = path.normalize(__dirname + '/../../' + dsJson[i].ui + '/index.html')
				if (fs.existsSync(_filepath)) {
					domains[i] = {
						...dsJson[i],
						files:{
							'/': {
								mime: 'text/html',
								data: fs.readFileSync(_filepath)
							}
						},
						errors:{}
					}
				} else {
					console.log('domain', i, _filepath, 'not found')
				}
			}
		}
		app.use(express.static(path.normalize(__dirname + '/../public')))
		const comingSoon = fs.readFileSync(__dirname + '/../static/coming-soon.html').toString('utf8')

		app.get('/spsphzopy2kfptblyfybd5oxhymmm2s2e6', (req:express.Request, res:express.Response) => {

			const session = (req as any).session;
			session.allowed = true;
			res.redirect('/')
		})

		app.get('*', (req:express.Request, res:express.Response) => {
			try {
				const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
				const session = (req as any).session;
				if (!appStarted && !session.allowed) {
					res.send(comingSoon)
					return;
				}
				
				const domain = req.hostname
				if (domains[domain]) {
					const uri = req.path
					let webfile = null as WebFileType|null
					if (domains[domain].files[uri]) {
						webfile = domains[domain].files[uri]
					} else if (domains[domain].errors[uri]) {
						webfile = domains[domain].files['/']
					} else {
						const _filename = uri==='/' ? '/index.html' : uri
						const _filepath = path.normalize(__dirname + '/../../' + domains[domain].ui + _filename)
						if (fs.existsSync(_filepath)) {
							webfile = {
								mime: mimetypes.lookup(_filename) || 'application/octet-stream',
								data: fs.readFileSync(_filepath)
							}
							domains[domain].files[uri] = webfile
						} else {
							console.log('no found: ', _filepath)
							webfile = domains[domain].files['/']
							domains[domain].errors[uri] = true;
						}
					}
					res.setHeader('x-forwarded-for', ip)
					res.setHeader('Cache-Control', 'public, max-age=86400')
					res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString())
					res.setHeader('content-type', webfile.mime)
					res.send(webfile.data)
					return
				} else {
					setlog("unknown domain " + domain)
				}
			} catch (err:any) {
				setlog(err)
			}
			res.status(404).send('-')
		})

		const acceptableHeaders = ['x-token', 'x-admin-token'];
		
		app.post('*', (req:express.Request, res:express.Response) => {
			try {
				const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
				const domain = req.hostname
				if (domains[domain]) {
					const uri = req.path
					console.log('domain ', req.ip, domain, 'rpc', domains[domain].api + uri, 'body', req.body)
					const headers = {} as {[key:string]:string}
					for(let i in req.headers) {
						if (acceptableHeaders.indexOf(i)!==-1) headers[i] = String(req.headers[i])
					}
					headers['x-forwarded-for'] = ip
					request(domains[domain].api + uri, {method:"post", headers, json:req.body},(err, res1, body) => {
						if (err) {
							setlog(err)
							res.status(500).send('')
							return 
						}
						res.json(body);
					})
					return;
				}
			} catch (err:any) {
				setlog(err)
			}
			res.status(404).send('')
		})

		let time = +new Date()
		await new Promise(resolve=>server.listen({port, host:'0.0.0.0'}, ()=>{
			resolve(true)
		}))
		server.on('error', (e:any) => {
			if (e.code === 'EADDRINUSE') {
			  console.log('Address in use, retrying...');
			  setTimeout(() => {
				server.close();
				server.listen(port, '0.0.0.0');
			  }, 1000);
			}
		});
		  
		setlog(`Started HTTP service on port ${port}. ${+new Date()-time}ms`)
		if (httpsServer) {
			time = +new Date()
			await new Promise(resolve=>httpsServer.listen({port:portHttps, host:'0.0.0.0'}, ()=>resolve(true)))
			setlog(`Started HTTPS service on port ${portHttps}. ${+new Date()-time}ms`)
		}
	} catch (err:any) {
		setlog("init", err)
		process.exit(1)
	}
}
run()