/**
 * Module dependencies.
 */

var parser = require('engine.io-parser')
var Emitter = require('component-emitter')
var debug = require('debug')('engine.io-client:transport:')
/**
 * Module exports.
 */

module.exports = Transport

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport(opts) {
  this.path = opts.path
  this.hostname = opts.hostname
  this.port = opts.port
  this.secure = opts.secure
  this.query = opts.query
  this.timestampParam = opts.timestampParam
  this.timestampRequests = opts.timestampRequests
  this.readyState = ''
  this.agent = opts.agent || false
  this.socket = opts.socket
  this.enablesXDR = opts.enablesXDR

  // SSL options for Node.js client
  this.pfx = opts.pfx
  this.key = opts.key
  this.passphrase = opts.passphrase
  this.cert = opts.cert
  this.ca = opts.ca
  this.ciphers = opts.ciphers
  this.rejectUnauthorized = opts.rejectUnauthorized
  this.forceNode = opts.forceNode

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders
  this.localAddress = opts.localAddress
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype)

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function(msg, desc) {
  var err = new Error(msg)
  err.type = 'TransportError'
  err.description = desc
  this.emit('error', err)
  return this
}

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function() {
  debug('called open func: ', this.readyState)
  if ('closed' === this.readyState || '' === this.readyState) {
    this.readyState = 'opening'
    this.doOpen()
  }

  return this
}

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function() {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.doClose()
    this.onClose()
  }

  return this
}

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets) {
  if ('open' === this.readyState) {
    this.write(packets)
  } else {
    throw new Error('Transport not open')
  }
}

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function() {
  debug('wx socket open called transport onOpen')
  this.readyState = 'open'
  this.writable = true
  this.emit('open')
}

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data) {
  debug('transport onData: ', data)
  var packet = parser.decodePacket(data, this.socket.binaryType)
  debug('decoded packet: ', packet)
  this.onPacket(packet)
}

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function(packet) {
  this.emit('packet', packet)
}

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function() {
  this.readyState = 'closed'
  this.emit('close')
}
