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
    const bcrypt = require('bcrypt');
    const { password, newPassword } = req.body;
    const userID = req.user._id;

    if (!password) return res.json({message: 'input password'});
    if (!newPassword) return res.json({message: 'input new password'});
    if (password === newPassword) return res.json({message: 'New password must be different from current password'});

    const user = await UserModel.findById(userID).exec();
    const match = await bcrypt.compare(password, user.password);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if(!match) return res.json({message: 'Incorrect password'});

    try{
        UserModel.findByIdAndUpdate(userID, {password: hashedPassword}, {new: true}, function (err, users) {
            console.log('here 1');
            if (err) return res.send(err);
            if (!users) return res.json({message: 'No user'});
            
            console.log(users);
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