/*
 **TRANSACTION ROUTER
 */
 const { Router } = require('express');
 const router = Router();
 const UserModel = require('../Models/user.model');

/*
 **USER TRANSACTION HISTORY
 */
 router.get('/transactionhistory', async (req, res) => {
    // Request required data
    const userId = req.user._id;

    // Query current user transaction
    transactionSearch = await UserModel.findById(userId).populate([{ path: 'transactions' }]);

    // Store user transactions
    const userTransaction = transactionSearch.transactions;
    
    //return requested data
    res.status(200).send({transactions: userTransaction});
});


module.exports = router;