const nodemailer = require('nodemailer');
const user = process.env.MAILTRAP_USER;
const pass = process.env.MAILTRAP_PASSWORD;

const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user,
      pass
    }
});

// router.get('/mailer', async (req, res) => {

//     // send mail with defined transport object
//   let info = await transport.sendMail({
//     from: '"Investon" <admin@investon.com>', // sender address
//     to: "joecliqs@gmail.com", // list of receivers
//     subject: "Welcome ✔", // Subject line
//     text: "Welcome to Investon and thankyou for registering. We are happy to have you on board", // plain text body
//     html: "<b>Welcome to Investon and thankyou for registering. We are happy to have you on board</b>", // html body
//   });

//   console.log("Message sent: %s", info.messageId);
//   // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

//   // Preview only available when sending through an Ethereal account
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

//   return res.status(200).send({message: 'Mail sent'});
// });

module.exports = transport;