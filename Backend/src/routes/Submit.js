const express = require('express');
const userMiddleware = require('../middleware/usermiddleware');
const {submitCode,runCode} = require('../controllers/userSubmisson');
const submitCodeRateLimiter = require('../middleware/rateLimiter');

const submitRouter = express.Router();

submitRouter.post('/submit/:id',userMiddleware,submitCodeRateLimiter,submitCode);

submitRouter.post('/run/:id',userMiddleware,submitCodeRateLimiter,runCode);

module.exports=submitRouter;
