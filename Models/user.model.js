const  mongoose  = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

userSchema = schema({
    name: {
        type: String,
        minLength: [1, 'Name must contain at least 1 character'],
        maxLength: [30, 'Name must not contain more than 30 character'],
    },
    email: {
        type: String,
        unique: [true, 'Account already exists with that e-mail address'],
        minLength: [5, 'Email must contain at least 5 character'],
        maxLength: [30, 'Email must not contain more than 30 character'],
    },
    mobile: {
        type: Number,
        unique: [true, 'Account already exists with that mobile number'],
    },
    password: {
        type: String,
    },
    investments: [{
        type: schema.Types.ObjectId,
        ref: 'investments'
    }],
    transactions: [{
        type: schema.Types.ObjectId,
        ref: 'transactions'
    }],
    google: {
        type: Object
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

userSchema.plugin(uniqueValidator);

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;