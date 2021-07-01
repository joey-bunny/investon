const  mongoose  = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

const verifCodeSchema = schema({
    userId: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 600
    }
})

verifCodeSchema.plugin(uniqueValidator);

const VerifCodeModel = mongoose.model('verificationCodes', verifCodeSchema);
module.exports = VerifCodeModel;