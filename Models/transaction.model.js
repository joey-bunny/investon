const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

transactionSchema = schema({
    userId: {
        type: schema.Types.ObjectId,
        ref: 'users'
    },
    investmentId: {
        type: schema.Types.ObjectId,
        ref: 'investments'
    },
    amount: {
        type: Number,
        minLength: [1, 'Input investment amount']
    },
    timestamp: {
        type: Date,
        default: Date.now()
    }
});

transactionSchema.plugin(uniqueValidator);

const TransactionModel = mongoose.model('transactions', transactionSchema);

module.exports = TransactionModel;