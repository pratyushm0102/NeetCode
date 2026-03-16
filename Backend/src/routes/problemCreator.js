const express=require('express');
const adminMiddleware = require('../middleware/adminMiddleWare');
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemByUser,submittedProblem} = require('../controllers/userProblem');
const userMiddleware = require('../middleware/usermiddleware');


const problemRouter=express.Router();


//create 
problemRouter.post('/create',adminMiddleware,createProblem);

//update
problemRouter.put('/update/:id',adminMiddleware,updateProblem);

//delete
problemRouter.delete('/delete/:id',adminMiddleware,deleteProblem);


//fetch
problemRouter.get("/problemById/:id",userMiddleware,getProblemById);

problemRouter.get("/getAllProblem/",getAllProblem);

//solve 
problemRouter.get('/problemSolvedByUser',userMiddleware,solvedAllProblemByUser);

problemRouter.get('/submittedProblem/:id',userMiddleware,submittedProblem);

module.exports=problemRouter;