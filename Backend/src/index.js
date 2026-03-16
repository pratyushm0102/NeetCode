const express=require('express');
const app=express();
require('dotenv').config();
const main=require("./config/database");
const cookieParser= require('cookie-parser');
const authRouter=require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter=require("./routes/problemCreator");
const submitRouter=require('./routes/Submit');
const  aiRouter=require('./routes/aiChatting');
const videoRouter = require("./routes/videoCreator");
const cors = require('cors');


app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}));

app.use(express.json());

app.use(cookieParser());

app.use("/api/user",authRouter);

app.use("/api/problem",problemRouter)

app.use("/api/submission",submitRouter);

app.use("/api/ai", aiRouter);

app.use("/api/video",videoRouter);

const InitalizeConnection = async ()=>{

    try {
        
        await Promise.all([main(),redisClient.connect()]);

        console.log("DB is Connected successfully...");

        app.listen(process.env.PORT,()=>{

            console.log("Server Listening at Port number: "+ process.env.PORT);

        });


    } catch (error) {
        console.log("Error: "+error)
    }
}

InitalizeConnection();
