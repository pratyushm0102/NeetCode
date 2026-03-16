const redisClient =require('../config/redis');

const submitCodeRateLimiter = async (req,res,next) => {

    const userId = req.result._id;

    const rediskey=`submit_cooldowen:${userId}`;

    try {
        
        const exist = await redisClient.exists(rediskey);

        if(exist){
            return res.status(429).json({
                error:'Please Wait 10 seconds before submitting again'
            });
        }

        await redisClient.set(rediskey,'cooldown_active',{
            EX:10,//Expire after 10 Second;
            NX:true//Only set if not exists
        });

        next();

    } catch (error) {
        
        res.status(500).json({
            error:'Internal Server Error'
        });

    }
    
}

module.exports=submitCodeRateLimiter;