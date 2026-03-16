const redisClient = require("../config/redis");
const User=require("../models/user");
const Submission=require('../models/submission');
const validate=require("../utils/validator");
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const register = async (req,res)=>{
    try{

        //validate the data;
        validate(req.body);

        const {firstName,lastName,emailId,password}=req.body;
        
        req.body.password = await bcrypt.hash(password,10);

        req.body.role='user';

        req.body.problemSolved = [];

        const user = await User.create(req.body);         

        const reply = {
            firstName:user.firstName,
            lastName:user.lastName,
            emailId:user.emailId,
            _id:user._id,
            role:user.role
        }

        //asign jwt for one houres
        const token = jwt.sign({_id:user._id,emailId:emailId,role:user.role},process.env.SECRET_KEY,{expiresIn: 60*60});

        res.cookie('token',token,{maxAge:60*60*1000});     // time in ms 60*60*1000 =>3600

        res.status(201).json({
            user:reply,
            message:"User Registered Successfully"
        });

    }
    catch(error){
        res.status(400).send("Error: "+error);
    }
};

const login = async (req,res)=>{
    try {

        const {emailId,password}=req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");

        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});

        const match = await bcrypt.compare(password, user.password); 

        if(!match)
            throw new Error("Invalid Credentials");
        
        const reply = {
            firstName:user.firstName,
            lastName:user.lastName,
            emailId:user.emailId,
            _id:user._id,
            role:user.role
        }

        const token = jwt.sign({_id:user._id,emailId:emailId,role:user.role},process.env.SECRET_KEY,{expiresIn: 60*60});

        res.cookie('token',token,{maxAge: 60 * 60 * 1000}); 

        res.status(201).json({
            user:reply,
            message:"Loggin Successfully"
        });

    } catch (error) {
        res.status(401).send('Error: '+error);
    }
};

const logout = async (req,res) => {

    try {
        
        const {token} = req.cookies;
        
        const payload = jwt.decode(token);

        //Add the token in the Redis blocklist for expire time;

        await redisClient.set(`token:${token}`,'Blocked');

        await redisClient.expireAt(`token:${token}`,payload.exp);


        //Cookies ko clear kar deana...

        res.cookie('token',null,{expires:new Date(Date.now())});

        res.send("Logged out Successfully")

    } catch (error) {
        
        res.status(503).send("Error: "+error)

    }
    
};


const adminRegister = async (req,res) =>{
    try{
        
        //validate the data;
        validate(req.body);
        
        const {firstName,lastName,emailId,password}=req.body;
        
        req.body.password = await bcrypt.hash(password,10);
        
        const user = await User.create(req.body);         
        
        //asign jwt for one houres //no need because the add by user is first login 
        // const token = jwt.sign({_id:user._id,emailId:emailId,role:user.role},process.env.SECRET_KEY,{expiresIn: 60*60});
        
        // res.cookie('token',token,{maxAge:60*60*1000});     // time in ms 60*60*1000 =>3600
        
        res.status(201).send("User Registered Successfully");
        
    }
    catch(error){
        res.status(400).send("Error: "+error);
    }
};

const getProfile = async (req,res) => {
    

};

const deleteProfile =async (req,res) => {
    
    try {
        
        const userId = req.result._id;

        //userschema delete;
        await User.findByIdAndDelete(userId);

        //submission Schema dalete;// Replace by Userschema post middelware;
        // Submission.deleteMany({userId});

        res.status(200).send("Youre Account Is Deleted Successfully");
        
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }

}

module.exports={register,login,logout,getProfile,adminRegister,deleteProfile};