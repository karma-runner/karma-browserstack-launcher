'use strict'

const chai = require('chai')
const Worker = require('../src/worker')
const expect = chai.expect

describe('Worker', () => {
  describe('constructor', () => {
    it('should assign all options to itself', () => {
      var worker = new Worker({
        hello: 'world'
      })

      expect(worker.hello).to.equal('world')
    })

    it('should ignore if an array is passed', () => {
      new Worker([
        'hello world'
      ])
    })
  })
})
