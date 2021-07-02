/*
 **USER ROUTER
 */
const { Router } = require('express');
const router = Router();
const UserModel = require('../Models/user.model');
const bcrypt = require('bcrypt');


/*
**VIEW MY PROFILE
*/
router.get('/', async (req, res) => {
    // Request required data
    const userID = req.user._id;

    // Get user details
    const user = await UserModel.findById(userID).select('-password');

    // Return response
    return res.status(200).send(user)
});


/*
**VIEW OTHER USERS PROFILE
*/
router.get('/:userName', async (req, res) => {
    // Request required data
    const { userName } = req.params;

    // Find user 
    const user = await UserModel.findOne({name: userName}).select(['-password', '-transactions', '-_id']);

    // Confirm if user exist
    if (!user) return res.status(400).send({message: 'User not found'});

    // Return response
    return res.status(200).send(user)
});


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
        // Return response
        return res.status(400).send(err);
    }
});


/*
**CHANGE USER MOBILE NUMBER
*/
router.post('/changemobile', async (req, res) => {
    // Request required data
    const { mobile } = req.body;
    const userID = req.user._id;

    // Validate input data
    if (!mobile) return res.json({message: 'input password'});

    try{
        // Update user data
        UserModel.findByIdAndUpdate(userID, {mobile: mobile}, {new: true}, function (err, user) {
            // Confirm query response
            if (err) return res.send(err);
            if (!user) return res.json({message: 'No user'});
            
            // Return response
            return res.json({message: 'Mobile number changed successfully'});
        });
    } catch (err) {
        // Return response
        res.send(err);
    }
});


module.exports = router;