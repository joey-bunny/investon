/*
 **TRANSACTION ROUTER
 */
const { Router } = require("express");
const router = Router();
const UserModel = require("../Models/user.model");

/*
 **USER TRANSACTION HISTORY || baseurl/api/transaction/
 */
router.get("/", async (req, res) => {
  try {
    // Request required data
    const userId = req.user._id;

    // Query current user transaction
    transactionSearch = await UserModel.findById(userId).populate([{ path: "transactions" }]);

    // Store user transactions
    const userTransaction = transactionSearch.transactions;

    //return requested data
    return res.status(200).send({ statusCode: 200, message: 'Transaction history found', data: userTransaction });
  } catch (err) {
    // Return error response
    return err;
  }
});

module.exports = router;
