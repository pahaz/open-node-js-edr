'use strict'

const dgram = require('dgram')

const DEBUG = true
const SECRET = process.env['EDR_SECRET'] || 'unsecure'
const SERVER = process.env['EDR_SERVER'] || '127.0.0.1'
const PORT = process.env['EDR_PORT'] || 41234
const POLLING_PERIOD = 1000 * 1 // 10s
const DIAL_TIMEOUT = 1000 * 10 // 10s

const TIMEOUT = new Error('TIMEOUT')

function logError (msg, data) {
    const name = data && data.name && data.stack ? data.name : undefined
    const stack = data && data.name && data.stack ? data.stack : undefined
    console.log(JSON.stringify({ type: 'error', msg, data, name, stack }))
}

function logInfo (msg, data) {
    const name = data && data.name && data.stack ? data.name : undefined
    const stack = data && data.name && data.stack ? data.stack : undefined
    console.log(JSON.stringify({ type: 'info', msg, data, name, stack }))
}

function logDebug (msg, data) {
    if (!DEBUG) return
    const name = data && data.name && data.stack ? data.name : undefined
    const stack = data && data.name && data.stack ? data.stack : undefined
    console.log(JSON.stringify({ type: 'debug', msg, data, name, stack }))
}

async function info (args, server) {
    return process.report.getReport()
}

async function stop (args, api) {
    api.stop()
    return 'ok'
}

class EDRTransport {
    constructor (props) {
        this._requestTimeout = props.timeout || DIAL_TIMEOUT
        this._server = props.server || SERVER
        this._port = props.port || PORT
        this._secret = props.secret || SECRET
    }

    async _requestTasks () {
        throw new Error('not implemented')
        return [
            [123, 'name', {}],
        ]
    }

    async _sendTaskResult (id, name, result) {
        throw new Error('not implemented')
    }

    async _sendData (channel, data) {
        throw new Error('not implemented')
    }
}

class EDRClient {
    constructor (protocol, transport, props) {
        if (typeof protocol !== 'object' || !protocol || !Object.keys(protocol).length <= 0) throw new Error('EDRClient: first argument should be an protocol')
        this._protocol = protocol

        if (!transport) throw new Error('EDRClient: no transport argument')
        this._transport = new EDRTransport(props)

        if (!props) props = {}
        this._props = props
        this._pullInterval = props.pullInterval || POLLING_PERIOD

        this._isStarted = false
        this._startedHandler = null
        this._protocolHandlerApi = {
            stop: this.stop.bind(this),
            start: this.start.bind(this),
            send: (channel, data) => this._transport._sendData(channel, data),
            // isStarted: () => this._isStarted,
        }
    }

    start () {
        logInfo('EDRClient: starting', this._props)
        if (this._isStarted) return
        this._isStarted = true
        this._startedHandler = setTimeout(() => this._pull(), this._pullInterval)
    }

    stop () {
        logInfo('EDRClient: stopping', this._props)
        this._isStarted = false
        if (this._startedHandler) clearTimeout(this._startedHandler)
        this._startedHandler = null
    }

    async _pull () {
        if (!this._isStarted) return
        try {
            const tasks = await this._transport._requestTasks()
            for (const task of tasks) {
                try {
                    const [id, name, args] = task
                    const cb = this._protocol[name]
                    if (!cb) throw new Error(`unknown protocol command: "${name}"`)
                    const result = await cb(args, this._protocolHandlerApi)
                    if (typeof result !== 'undefined') {
                        await this._transport._sendTaskResult(id, name, result)
                    }
                } catch (err) {
                    logInfo('EDRClient: execute task error (ignored)', err)
                }
            }
        } catch (err) {
            logInfo('EDRClient: pull tasks error (ignored)', err)
        }

        this._startedHandler = setTimeout(() => this._pull(), this._pullInterval)
    }
}

async function main () {
    const protocol = {
        'i1': info,
        's1': stop,
    }

    const transport = new EDRTransport({
        secret: SECRET,
        server: SERVER,
        port: PORT,
        timeout: DIAL_TIMEOUT,
    })

    const client = new EDRClient(protocol, transport, {
        pullInterval: POLLING_PERIOD,
    })
    
    client.start()
}

process.on('unhandledRejection', (err) => {
    logInfo('unhandled error (ignored)', err)
})

main()
