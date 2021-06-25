// const { Router } = require('express');
// const router = Router();
// const UserModel = require('../Models/user.model');

// router.post('/changepassword', async (req, res) => {
//     const { password, newPassword } = req.body;
//     const userID = req.user._id;

//     const match = await bcrypt.compare(password, user.password);
    
//     if(!match) res.send({'message': 'Incorrect password'});

//     try {
//         UserModel.findByIdAndUpdate(userId, {password: newPassword}, async (err, updatePass) => {
//             if (err || !updatePass) res.send()
//         })
//     } catch (error) {
        
//     }
// })