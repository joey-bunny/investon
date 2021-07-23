const chai = require('chai');  
const request = require('supertest')
const expect = chai.expect
const app = require('../app');
const { randomUser } = require('../utils/functions');

const data = randomUser ()

describe('Test Suites', function () {

    it('Assert landing page works', function (done) {
        request(app).get('/').end((err, res) => {
            expect(res.status).to.equal(200)
            console.log(res)
            expect(res.body.message).to.equal('Welcome to Investon')
        })
        return done()
    })

    // it('Assert landing page works', function (done) {
    //     request(app).get('/').end((err, res) => {
    //         expect(res.status).to.equal(200)
    //         expect(res.body.message).to.equal('Welcome to Investon')
    //     })
    //     return done()
    // })

});