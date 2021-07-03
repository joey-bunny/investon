const express = require('express');
const app = require('../app.js');
const chai = require('chai');  
const chaiHTTP = require('chai-http');
var assert = chai.assert;    // Using Assert style
const expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

chai.use(chaiHTTP);

// const requests = require('supertest' );
// const request = requests(app)

describe('Homes', () => {
    
    after(function (done) {
        app.close();
        done();
    });

    it('Ok for us', async (done) => {
        const tests = await chai.request(app).get('/api');

        expect(res.status).to.equal(200);
        done();
    });
});