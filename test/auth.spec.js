const chai = require('chai')
const request = require('supertest')
const app = require('../app')
const expect = chai.expect
const mongoose = require('mongoose')
const { randomUser, changeVerificationStatus, getVerificationCode, randomInvestment } = require('../utils/functions');

const data = randomUser ()
const investment = randomInvestment ()
const email = data.email
const password = data.password
const loginData = { email, password }
const amount = investment.minInvestment
const username = data.username
const mobile = data.mobile
const changePasswordData = { password, newPassword: 'secrets' }
const changeMobileData = { mobile }

let token, id, code, invId

describe('Test Suites', function () {

    before ((done) => {
        const mongoUrl = require('../mongoDbConn.database').DB_URL
        mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
        mongoose.connection.on('connected', (res) => {
            console.log('connected to mongoDB')
            done(res)
        })
    })

    it('Assert landing route works', function (done) {
        
        request(app).get('/').then((res) => {
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Welcome to Investon')
            done()
        }).catch((err) => done(err))
    })

    it('Assert register route works', function (done) {
        request(app).post('/auth/register').send(data).then( async (res) => {
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Confirmation link has been sent to your email address')
            const verify = await changeVerificationStatus (email)

            id = verify._id

            done()
        }).catch((err, res) => done(err || res))
    })

    it('Assert login route works', function (done) {
        request(app).post('/auth/login').send(loginData).then( async (res) => {
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Login successful')
            expect(res.body.data.token).to.not.equal(null)

            token = res.body.data.token

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fund wallet route works', function (done) {
        request(app).post('/transactions').set({ Authorization: `Bearer ${token}`}).send({ amount: 500000 }).then( async (res) => {
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Funds deposit successful')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Check balance route works', function (done) {
        request(app).get('/wallet').set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fetch wallet balance')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Account balance collation successful')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Create investment route works', function (done) {
        request(app).post('/investments').send(investment).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Create investment')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Investment created')
            expect(res.body.data).to.not.equal(null)

            invId = res.body.data._id

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fund investment route works', function (done) {
        request(app).post(`/investments/${invId}`).send({amount}).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fund investment')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal(`You just successfully invested ${amount} into ${invId}`)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fetch all user investment route works', function (done) {
        request(app).get('/investments').set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fetch wallet balance')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('User investment data found')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fetch single investment route works', function (done) {
        request(app).get(`/investments/${invId}`).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fetch wallet balance')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('investment found')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fetch user profile route works', function (done) {
        request(app).get(`/users`).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fetch user profile')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('User profile found')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Fetch a user profile route works', function (done) {
        request(app).get(`/users/${username}`).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Fetch a user profile')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('User profile found')
            expect(res.body.data).to.not.equal(null)

            done()
        }).catch((err) => done(err))
    })

    it('Assert Change password route works', function (done) {
        request(app).post(`/users/changepassword`).send(changePasswordData).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Change user password')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Password successfully changed')

            done()
        }).catch((err) => done(err))
    })

    it('Assert Change mobile number route works', function (done) {
        request(app).post(`/users/changemobile`).send(changeMobileData).set({ Authorization: `Bearer ${token}`}).then( async (res) => {
            // console.log('!!!!!!!!!!!!!!!!!!!!!! Change user password')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.equal('Mobile number changed successfully')

            done()
        }).catch((err) => done(err))
    })
    // it('Assert reset password route works', function (done) {
    //     request(app).post('/auth/resetpassword').send({email}).then( async (res) => {
    //         console.log('!!!!!!!!!!!!!!!!!!!!!! Reset password')
    //         console.log(res.body)
    //         expect(res.statusCode).to.equal(200)
    //         expect(res.body.message).to.equal('Reset link has been sent to your email.')

    //         const verifCode = await getVerificationCode (id)

    //         code = verifCode.code
    //         done()
    //     }).catch((err) => done(err))
    // })

    // it('Assert Complete reset password route works', function (done) {
    //     request(app).post(`/auth/completeresetpassword/${id}/${code}`).send({password}).then( async (res) => {
    //         console.log('!!!!!!!!!!!!!!!!!!!!!! Complete reset password')
    //         console.log(res.body)
    //         expect(res.statusCode).to.equal(200)
    //         expect(res.body.message).to.equal('Password successfully changed. Please login to continue')
    //         done()
    //     }).catch((err) => done(err))
    // })
})
