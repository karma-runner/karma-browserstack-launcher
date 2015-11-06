var EventEmitter = require('events').EventEmitter
var util = require('util')

function Worker (data) {
  EventEmitter.call(this)

  if (typeof data === 'object' && !Array.isArray(data)) {
    var self = this

    Object.keys(data).forEach(function (k) {
      self[k] = data[k]
    })
  }
}

util.inherits(Worker, EventEmitter)

module.exports = Worker
