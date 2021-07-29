const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

const investmentSchema = schema({
    name: {
        type: String,
        unique: [true, 'Investment plan with this name already exist'],
        minLength: [1, 'Investment name must contain at least 1 character'],
        maxLength: [30, 'Investment name must not contain more than 30 character'],
    },
    description: {
        type: String,
        minLength: [1, 'Investment description must contain at least 5 character'],
    },
    minInvestment: {
        type: Number,
        // minLength: [1, 'Investment description must contain at least 5 character'],
    },
    expectedReturn: {
        type: Number,
        minLength: [1, 'Input a minimum expected return'],
    },
    returnFrequency: {
        type: String,
        minLength: [1, 'Input a return frequency'],
    },
    investmentCurrency: {
        type: String,
        minLength: [1, 'Input an investment frequency'],
    },
    investmentDuration: {
        type: String,
        minLength: [1, 'Input a duration for the investment'],
    },
    targetAmount: {
        type: Number,
        minLength: [1, 'Input a target investment amount'],
    },
    fundingOpeningDate: {
        type: Date,
        minLength: [1, 'Input a funding opening date']
    },
    fundingClosingDate: {
        type: Date,
        minLength: [1, 'Input a funding closing date']
    },
    admin: {
        type: schema.Types.ObjectId,
        ref: 'users'
    },
    investors: [{
        type: schema.Types.ObjectId,
        ref: 'users'
    }],
    transactions: [{
        type: schema.Types.ObjectId,
        ref: 'transactions'
    }],
    timestamp: {
        type: Date,
        default: Date.now()
    }
});

investmentSchema.plugin(uniqueValidator, { message: '{PATH} has already been used' });

const InvestmentModel = mongoose.model('investments', investmentSchema);

module.exports = InvestmentModel;