/*
 **USER ROUTER
 */
const { Router } = require('express');
const router = Router();
const UserModel = require('../Models/user.model');
const bcrypt = require('bcrypt');


/*
**CHANGE USER PASSWORD
*/
router.post('/changepassword', async (req, res) => {
    // Request required data
    const { password, newPassword } = req.body;
    const userID = req.user._id;

    // Validate input values
    if (!password) return res.json({message: 'input password'});
    if (!newPassword) return res.json({message: 'input new password'});
    if (password === newPassword) return res.json({message: 'New password must be different from current password'});

    // Get user profile
    const user = await UserModel.findById(userID).exec();

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);

    // Validate password match
    if(!match) return res.json({message: 'Incorrect password'});

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try{
        // Update new password
        UserModel.findByIdAndUpdate(userID, {password: hashedPassword}, {new: true}, function (err, users) {
            // Confirm query response
            if (err || !users) return res.send(err);
            
            // Return response
            res.send({message: 'Password successfully changed'});
        });
    } catch (err) {
        console.log('Error catch');
        res.send(err);
    }
});

/*
**CHANGE USER MOBILE NUMBER
*/
router.post('/changemobile', async (req, res) => {
    const { mobile } = req.body;
    const userID = req.user._id;

    if (!mobile) return res.json({message: 'input password'});

    try{
        UserModel.findByIdAndUpdate(userID, {mobile: mobile}, {new: true}, function (err, user) {
            console.log('here 1');
            if (err) return res.send(err);
            if (!user) return res.json({message: 'No user'});
            
            console.log(user);
            return res.json({message: 'Mobile number changed successfully'});
        });
    } catch (err) {
        console.log('Error catch');
        res.send(err);
    }
});


module.exports = router;