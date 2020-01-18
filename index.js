'use strict'

const Hapi = require('hapi')
const blankie = require('blankie')
const scooter = require('@hapi/scooter')
const handlerbars = require('./lib/helpers')
const inert = require('inert')
const methods = require('./lib/methods')
const path = require('path')
const vision = require('vision')
const routes = require('./routes')
const site = require('./controllers/site')
const good = require('good')
const crumb = require('crumb')

const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
        files: {
            relativeTo: path.join(__dirname, 'public')
        }
    }
})

async function init() {

    try {
        await server.register(inert)
        await server.register(vision)
        await server.register({
            plugin: good,
            options: {
                reporters: {
                    console: [
                        {
                            module: 'good-console'
                        },
                        'stdout'
                    ]
                }
            }
        })

        await server.register({
            plugin: crumb,
            options: {
                cookieOptions: {
                    isSecure: process.env.NODE_ENV === 'prod'
                }
            }
        })

        await server.register([scooter, {
            plugin: blankie,
            options: {
                defaultSrc: `'self' 'unsave-inline'`,
                styleSrc: `'self' 'unsafe-inline' https://maxcdn.bootstrapcdn.com`,
                fontSrc: `'self' 'unsafe-inline' data:`,
                scriptSrc: `'self' 'unsafe-inline' https://cndjs.cloudflare.com https://maxcdn.bootstrapchdn.com/ https://code.jquery.com/`,
                generateNonces: false
            }
        }])

        await server.register({
            plugin: require('./lib/api'),
            options: {
                prefix: 'api'
            }
        })

        server.method('setAnswerRight', methods.setAnswerRight)
        server.method('getLast', methods.getLast, {
            cache: {
                expiresIn: 1000 * 60,
                generateTimeout: 2000
            }
        })

        server.state('user', {
            ttl: 1000 * 60 * 60 * 24 * 7,
            isSecure: process.env.NODE_ENV === 'prod',
            encoding: 'base64json'
        })

        server.views({
            engines: {
                hbs: handlerbars
            },
            relativeTo: __dirname,
            path: 'views',
            layout: true,
            layoutPath: 'views'
        })

        server.ext('onPreResponse', site.fileNotFound)
        server.route(routes)
        await server.start()
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    server.log('info', `Servidor lanzado en: ${server.info.uri}`)
}

process.on('unhandledRejection', error => {
    server.log('UnhandledRejection', error.message, error)
})

process.on('unhandledRejection', error => {
    server.log('unhandledException', error)
})

init()