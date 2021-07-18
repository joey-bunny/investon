const nodemailer = require("nodemailer")
const user = process.env.MAILTRAP_USER;
const pass = process.env.MAILTRAP_PASSWORD;

const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user,
    pass,
  },
})

const mailgunTransport = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: "postmaster@sandbox4783006fc7d14077ab4bce77f4ef4d1d.mailgun.org",
    pass: "3b9aa9c225160e4152a3d2cda2656874-602cc1bf-dba72c58",
  },
})

function sendRegistrationMail(name, email, completeRegistrationUrl) {
  transport.sendMail({
    from: '"Investon" <admin@investon.com>', // sender address
    to: email, // list of receivers
    subject: "Confirm email ✔", // Subject line
    text: `Hello ${name}, follow the link below to complete your registration`, // plain text
    html: `<p>
            <b>Hello ${name}, follow the link below to complete your registration</b><br>
            <a href = '${completeRegistrationUrl}'>Confirm email</a>
        </p>`, // html body
  })
}

function sendVerificationMail (name, email, completeRegistrationUrl) {
  // Send verification mail if user is unverified
transport.sendMail({
    from: '`Investon` <admin@investon.com>', // sender address
    to: email, // list of receivers
    subject: 'Confirm email ✔', // Subject line
    text: `Hello ${name}, follow the link below to complete your registration`, // plain text body
    html: `<p>
              <b>Hello ${name}, follow the link below to complete your registration</b><br>
              <a href = '${completeRegistrationUrl}'>Confirm email</a>
            </p>`, // html body
  })
}

function sendPasswordResetEmail (email, url) {
  transport.sendMail({
    from: '`Investon` <admin@investon.com>', // sender address
    to: email, // list of receivers
    subject: 'Password reset ✔', // Subject line
    text: 'Hello user, follow the link below to reset your password', // plain text body
    html: `<p>
                    <b>Hello user, follow the link below to reset your password</b><br>
                    <a href = '${url}'> Reset Password </a>
                </p>`, // html body
  })
}


module.exports = {
  sendRegistrationMail,
  sendVerificationMail,
  sendPasswordResetEmail
};
