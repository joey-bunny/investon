const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
  const mobileArr = [ 09020790850, 09020790841, 09020790842, 09020790843, 09020790844, 09020790845, 09020790846, 09020790847, 09020790848, 09020790849 ]
  const password = 'secret'
  const hashedPassword = await bcrypt.hash(password, 10)

  for (i = 0; i < 10; i++) {
    const name = fNameArr[i] + lNameArr[i]
    const email = emailArr[i]
    const mobile = mobileArr[i]
    const datas = {
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
    };

    userData.push(datas)
  }

  return userData
}

function randomUser () {
  const i = Math.floor(Math.random() * (9 - 0 + 1)) + 0

  const fNameArr = [ 'ares', 'hermes', 'zeus','dionysius', 'hades', 'poseidon', 'apollo', 'athena', 'hera', 'athemis' ]
  const lNameArr = [ 'mecury', 'mars', 'gaia', 'venus', 'saturn', 'jupiter', 'uranus', 'neptune', 'pluto', 'cronos' ]
  const emailArr = [ 'ares@gmail.com', 'hermes@gmail.com', 'zeus@gmail.com', 'dionysius@gmail.com', 'hades@gmail.com', 'poseidon@gmail.com', 'apollo@gmail.com', 'athena@gmail.com', 'hera@gmail.com', 'athemis@gmail.com']
  const mobileArr = [ 09020790850, 09020790841, 09020790842, 09020790843, 09020790844, 09020790845, 09020790846, 09020790847, 09020790848, 09020790849 ]
  const password = 'secret'

  const payload = {
    name: `${fNameArr[i]} ${lNameArr[i]}`,
    email: emailArr[i],
    mobile: mobileArr[i],
    username: fNameArr[i],
    password: password,
  }

  return payload
}


module.exports = { userDataSeed, randomNumber, generateJWT, randomUser }