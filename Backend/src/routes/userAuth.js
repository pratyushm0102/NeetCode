const express=require('express');
const {register,login,logout,getProfile,adminRegister,deleteProfile}=require('../controllers/userAuthent');
const userMiddleware = require('../middleware/usermiddleware');
const adminMiddleware=require('../middleware/adminMiddleWare')

const authRouter=express.Router();

//Register
authRouter.post('/register',register);

//Login
authRouter.post('/login',login);

//Logout
authRouter.post('/logout',userMiddleware,logout);

//getProfile    
authRouter.get('/getProfile',getProfile);

//Delete user profile and there submission 
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile)

//Admin Role Register
authRouter.post('/admin/register',adminMiddleware,adminRegister);

//checkAuth
authRouter.get('/check',userMiddleware,(req,res)=>{
    
        const reply = {
            firstName:req.result.firstName,
            lastName:req.result.lastName,
            emailId:req.result.emailId,
            _id:req.result._id,
            role:req.result.role,
        }

        res.status(200).json({
            user:reply,
            message:"Valid User"
        })
});

module.exports=authRouter;