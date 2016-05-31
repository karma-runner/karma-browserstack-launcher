var Worker = require('./worker')

/**
 * Tracks worker state across runs.
 */
function WorkerManager () {
  this._pollHandle = null
  this.workers = {}
  this.isPolling = false
  this.shouldShutdown = false
}

WorkerManager.prototype.registerWorker = function registerWorker (workerData) {
  if (this.workers[workerData.id]) {
    this.unregisterWorker(this.workers[workerData.id])
  }

  var worker = new Worker(workerData)
  worker.emit('status', worker.status)

  this.workers[workerData.id] = worker
  return worker
}

WorkerManager.prototype.unregisterWorker = function unregisterWorker (worker) {
  worker.emit('delete', worker)
  worker.removeAllListeners()

  delete this.workers[worker.id]
  return worker
}

WorkerManager.prototype.updateWorker = function updateWorker (workerData) {
  var workers = this.workers

  if (workers[workerData.id]) {
    var worker = workers[workerData.id]
    var prevStatus = worker.status

    Object.keys(workerData).forEach(function (k) {
      worker[k] = workerData[k]
    })

    if (worker.status !== prevStatus) {
      worker.emit('status', worker.status)
    }
  }
}

WorkerManager.prototype.startPolling = function startPolling (client, pollingTimeout, callback) {
  if (this.isPolling || this.shouldShutdown) {
    return
  }

  var self = this
  this.isPolling = true

  client.getWorkers(function (err, updatedWorkers) {
    if (err) {
      self.isPolling = false
      return (callback ? callback(err) : null)
    }

    var activeWorkers = (updatedWorkers || []).reduce(function (o, worker) {
      o[worker.id] = worker
      return o
    }, {})

    Object.keys(self.workers).forEach(function (workerId) {
      if (activeWorkers[workerId]) {
        // process updates
        self.updateWorker(activeWorkers[workerId])
      } else {
        // process deletions
        self.unregisterWorker(self.workers[workerId])
      }
    })

    self._pollHandle = setTimeout(function () {
      self.isPolling = false
      self.startPolling(client, pollingTimeout, callback)
    }, pollingTimeout)
  })
}

WorkerManager.prototype.stopPolling = function stopPolling () {
  if (this._pollHandle) {
    clearTimeout(this._pollHandle)
    this._pollHandle = null
  }

  this.shouldShutdown = true
}

// expose a single, shared instance of WorkerManager
module.exports = new WorkerManager()
