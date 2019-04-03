'use strict'

const sinon = require('sinon')
const chai = require('chai')
const manager = require('../src/worker-manager')
const Worker = require('../src/worker')
const expect = chai.expect

describe('WorkerManager', () => {
  let client
  beforeEach(() => {
    client = {
      getWorkers: sinon.stub().callsFake((callback) => callback())
    }
  })

  afterEach(() => {
    sinon.restore()
    manager.stopPolling()
    manager.shouldShutdown = false
    for (const worker in manager.workers) {
      manager.unregisterWorker(manager.workers[worker])
    }
  })

  describe('function(registerWorker)', () => {
    it('should create a worker and return it to us', () => {
      const worker = manager.registerWorker({
        id: 'example',
        status: 'online'
      })

      expect(worker).to.be.an.instanceOf(Worker)
      expect(manager.workers.example).to.equal(worker)
    })

    it('should unregister workers with the same id', () => {
      const worker = manager.registerWorker({
        id: 'example',
        status: 'online'
      })

      const otherWorker = manager.registerWorker({
        id: 'example',
        status: 'online'
      })

      expect(worker).to.not.equal(otherWorker)
      expect(manager.workers.example).to.equal(otherWorker)
    })
  })

  describe('function(unregisterWorker)', () => {
    it('should support unregistering workers', () => {
      const worker = manager.registerWorker({
        id: 'example',
        status: 'online'
      })

      sinon.stub(worker, 'emit')
      sinon.stub(worker, 'removeAllListeners')

      manager.unregisterWorker(worker)

      expect(worker.emit.firstCall.args).to.deep.equal(['delete', worker])
      expect(worker.removeAllListeners.callCount).to.equal(1)
    })
  })

  describe('function(updateWorker)', () => {
    it('should support updating a workers data', () => {
      const worker = manager.registerWorker({
        id: 'example',
        status: 'online'
      })

      manager.updateWorker({
        id: worker.id,
        status: 'offline'
      })

      expect(manager.workers.example.status).to.equal('offline')
    })

    it('should ignore if the worker does not exist', () => {
      manager.updateWorker({
        id: 'example',
        status: 'offline'
      })

      expect(manager.workers.example).to.equal(undefined)
    })
  })

  describe('function(startPolling)', () => {
    it('should poll for changes', (done) => {
      manager.startPolling(client, 100)

      sinon.stub(manager, 'startPolling')

      setTimeout(() => {
        expect(manager.startPolling.callCount).to.equal(1)
        done()
      }, 101)
    })

    it('should process new, existing, and deleted workers', () => {
      const chrome = manager.registerWorker({
        id: 'chrome',
        status: 'online'
      })

      const safari = manager.registerWorker({
        id: 'safari',
        status: 'online'
      })

      client.getWorkers = sinon.stub().callsFake((callback) => callback(null, [{
        id: chrome.id,
        status: 'online'
      }, {
        id: 'firefox',
        status: 'online'
      }]))

      expect(manager.isPolling).to.equal(false)
      expect(manager.workers.safari).to.equal(safari)

      manager.startPolling(client, 1000)

      expect(manager.isPolling).to.equal(true)
      expect(manager.workers.safari).to.equal(undefined)
    })

    it('should ignore multiple calls', () => {
      expect(client.getWorkers.callCount).to.equal(0)

      manager.startPolling(client, 1000)

      expect(client.getWorkers.callCount).to.equal(1)

      manager.startPolling(client, 1000)

      expect(client.getWorkers.callCount).to.equal(1)
    })

    it('should support errors', (done) => {
      client.getWorkers = sinon.stub().callsFake((callback) => callback(new Error('What happened!')))

      manager.startPolling(client, 1000, (error) => {
        expect(error.message).to.equal('What happened!')
        expect(manager.isPolling).to.equal(false)
        done()
      })
    })

    it('should support errors without a callback', () => {
      client.getWorkers = sinon.stub().callsFake((callback) => callback(new Error('What happened!')))

      manager.startPolling(client, 1000)

      expect(manager.isPolling).to.equal(false)
    })
  })

  describe('function(stopPolling)', () => {
    it('should disable polling if its enabled', () => {
      manager._pollHandle = 0
      manager.stopPolling()
    })

    it('should ignore if polling is not enabled', () => {
      manager.stopPolling()
    })
  })
})
