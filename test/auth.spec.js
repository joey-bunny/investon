const chai = require('chai')
const request = require('supertest')
const expect = chai.expect
const { randomUser } = require('../utils/functions');

const data = randomUser ()
const baseUrl = 'http://localhost:3000'

describe('Test Suites', function () {

    it('Assert landing page works', function (done) {
        
        request(baseUrl).get('/').end(async (err, res) => {
            expect(res.status).to.equal(200)
            expect(res.body.message).to.equal('Welcome to Investon')
        })
        return done()
    })

    it('Assert landing page works', function (done) {
        request(baseUrl).post('/auth/register').send(data).end((err, res) => {
            console.log(res.status)
            expect(res.status).to.equal(200)
            expect(res.body.message).to.equal('Confirmation link has been sent to your email address')
            return done(res)
        })
        return done()
    })

});