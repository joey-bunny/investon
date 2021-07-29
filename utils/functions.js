const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const VerifCodeModel = require('../models/verification.code.model');

/*
** GENERATE A JWT
*/
function generateJWT (user) {
  // Create token
  const token = jwt.sign({ user }, process.env.PASSPORT_SIGNATURE, { expiresIn: '1d'})

  return token
}

/*
** GENERATE A RANDOM CODE
*/
function randomNumber() {
  const min = 1000000;
  const max = 100000000;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;

  return code;
}

/*
** GENERATE USER SEED DATA FOR 10 USERS
*/
async function userDataSeed () {
  let userData = []

  // User input data
  const fNameArr = [ 'ares', 'hermes', 'zeus','dionysius', 'hades', 'poseidon', 'apollo', 'athena', 'hera', 'athemis' ]
  const lNameArr = [ 'mecury', 'mars', 'gaia', 'venus', 'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'cronos' ]
  const emailArr = [ 'ares@gmail.com', 'hermes@gmail.com', 'zeus@gmail.com', 'dionysius@gmail.com', 'hades@gmail.com', 'poseidon@gmail.com', 'apollo@gmail.com', 'athena@gmail.com', 'hera@gmail.com', 'athemis@gmail.com']
  const mobileArr = [ 9020790850, 9020790841, 9020790842, 9020790843, 9020790844, 9020790845, 9020790846, 9020790847, 9020790848, 9020790849 ]
  const password = 'secret'
  const hashedPassword = await bcrypt.hash(password, 10)

  for (i = 0; i < 10; i++) {
    const name = fNameArr[i] + lNameArr[i]
    const email = emailArr[i]
    const mobile = mobileArr[i]
    const username = `${fNameArr[i]}${lNameArr[i]}`
    const datas = {
      name,
      email,
      mobile,
      username,
      password: hashedPassword,
      verified: true
    }

    userData.push(datas)
  }

  return userData
}

function randomUser () {
  const i = Math.floor(Math.random() * (9 - 0 + 1)) + 0

  const fNameArr = [ 'ares', 'hermes', 'zeus','dionysius', 'hades', 'poseidon', 'apollo', 'athena', 'hera', 'athemis', 'seth', 'horus' ]
  const lNameArr = [ 'mecury', 'mars', 'gaia', 'venus', 'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'cronos', 'thorn', 'osiris' ]
  const mobileArr = [ 9020790850, 9020790841, 9020790842, 9020790843, 9020790844, 9020790845, 9020790846, 9020790847, 9020790848, 9020790849 ]

  const name = `${fNameArr[i]} ${lNameArr[i]}`
  const email = `${fNameArr[i]}@${lNameArr[i]}.com`
  const password = 'secret'
  const username = `${fNameArr[i]}${lNameArr[i]}`
  const mobile = mobileArr[i]

  const payload = { name, email, mobile, username, password }

  return payload
}

async function changeVerificationStatus ( email ) {
  const user = await UserModel.findOneAndUpdate( {email: email}, {verified: true}, { new: true })

  return user
}

async function getVerificationCode (id) {
  const verificationCode = await VerifCodeModel.findOne({userId: id})
  return verificationCode
}

function randomInvestment () {
  const i = Math.floor(Math.random() * (9 - 0 + 1)) + 0
  const j = Math.floor(Math.random() * (1 - 0 + 1)) + 0
  const invName = [ 'ares', 'hermes', 'zeus','dionysius', 'hades', 'poseidon', 'apollo', 'athena', 'hera', 'athemis', 'seth', 'horus', 'mecury', 'mars', 'gaia', 'venus', 'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'cronos', 'thorn', 'osiris' ]
  const invType = [ 'Investment', 'Bonds' ]
  const name = `${invName[i]} ${invType[j]}`
  const description = `${name} is an investment package that uses your funds to trade bonds`
  const minInvestment = 100000
  const expectedReturn = 37
  const returnFrequency = '30 days'
  const investmentCurrency = 'NGN'
  const investmentDuration = '3 months'
  const targetAmount = 10000000
  const fundingOpeningDate = '2021-06-23'
  const fundingClosingDate = '2021-06-30'

  const payload = { name, description, minInvestment, expectedReturn, returnFrequency, investmentCurrency, investmentDuration, targetAmount, fundingOpeningDate, fundingClosingDate }

  return payload
}

module.exports = { userDataSeed, randomNumber, generateJWT, randomUser, changeVerificationStatus, getVerificationCode, randomInvestment }