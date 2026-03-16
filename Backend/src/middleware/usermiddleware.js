const jwt=require('jsonwebtoken');
const User=require('../models/user');
const redisClient = require('../config/redis');

const userMiddleware = async (req,res,next) => {

    try {

        //Validate The Token;

        const {token} = req.cookies;

        if(!token)
            throw new Error("Token is not Present");
        
        const payload = jwt.verify(token,process.env.SECRET_KEY);

        const {_id} = payload;

        if(!_id)
            throw new Error("Invalid Token");

        const result = await User.findById(_id);

        if(!result)
            throw new Error("User Doesn't Exist");


        //Check if Jwt token present in the redis 

        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result=result;

        next();

    } catch (error) {
        res.status(401).send("Error: "+error.message)
    }
}

module.exports=userMiddleware;