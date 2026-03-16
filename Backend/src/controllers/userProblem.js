const {getLanguageBYId,submitBatch,submitToken} = require('../utils/ProblemUtility');
const Problem=require('../models/problem');
const User = require('../models/user');
const Submission = require('../models/submission');
const SolutionVideo = require('../models/solutionVideo');

const createProblem = async (req,res) => {
    
    const {title,description,difficulty,
            tags,visibleTestCases,hiddenTestCases,
            startCode,referenceSolution,problemCreator} = req.body;

    try {

        //check the output;

        for(const {language,completeCode} of referenceSolution){

            
            //Determining the language ID;
            const languageId=getLanguageBYId(language);

            const submissions = visibleTestCases.map((testcases) => ({
                //formet for Create a batched submission;
                source_code: completeCode, //source_code;
                language_id: languageId, //language_Id;
                stdin: testcases.input,  //std_in;
                expected_output: testcases.output //expected_output;

            }));
            
            const submitResult = await submitBatch(submissions);

            //Create token array;
            const resultToken = submitResult.map((value)=>value.token);

            const testResult = await submitToken(resultToken);

            for(const test of testResult){
                if (test.status_id==4){
                    return res.status(400).send("Wrong Answer");
                }
                if (test.status_id>=4) {
                    return res.status(400).send("Error Occured");                     
                }
            }

        }

        //Store it in our Db;
        // console.log(...req.body)
        const userProblem =  await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        });


        res.status(201).send("Problem Saved Successfully")

    } catch (error) {
        res.status(400).send("Error"+error);
    }
};

const updateProblem = async (req, res) => {

    const { id } = req.params;

    const { title, description, difficulty,
         tags, visibleTestCases, hiddenTestCases, 
         startCode, referenceSolution } = req.body;

    try {
        if (!id) return res.status(400).send("Missing Id Field");

        // A. Fetch existing problem to get the OLD hidden test cases
        const existingProblem = await Problem.findById(id);

        if (!existingProblem) return res.status(404).send("Problem not found");

        // B. Merge Logic: Keep old hidden cases, append new ones if they exist
        let finalHiddenTestCases = existingProblem.hiddenTestCases || [];

        if (hiddenTestCases && hiddenTestCases.length > 0) {
            finalHiddenTestCases = [...finalHiddenTestCases, ...hiddenTestCases];
        }

        // C. Validate Reference Solution (using Visible cases only)
        for (const { language, completeCode } of referenceSolution) {

            const languageId = getLanguageBYId(language);

            const submissions = visibleTestCases.map((testcases) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcases.input,
                expected_output: testcases.output
            }));

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map((value) => value.token);

            const testResult = await submitToken(resultToken);

            for (const test of testResult) {

                if (test.status_id === 4) return res.status(400).send(`Wrong Answer in ${language} Reference Solution`);

                if (test.status_id >= 4) return res.status(400).send(`Error in ${language} Reference Solution`);

            }
        }

        // D. Update in DB
        const updateData = {
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            startCode,
            referenceSolution,
            hiddenTestCases: finalHiddenTestCases // Saved the merged list
        };

        const newProblem = await Problem.findByIdAndUpdate(id, updateData, { runValidators: true, new: true });

        res.status(200).send(newProblem);

    } catch (error) {

        res.status(500).send("Error: " + error.message);
        
    }
};

const deleteProblem = async (req,res) => {

    const {id} = req.params;
    try {
        
        if(!id){
            return res.status(400).send("Id is Missings");
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if(!deletedProblem){
            return res.status(404).send("Problem is not Present in server");
        }

        res.status(200).send("Problem is Successfully Deleted");

    } catch (error) {
        
        res.status(500).send("Error: "+error);

    }
}; 

const getProblemById = async (req,res) => {

    const {id} = req.params;

    try {
        
        if(!id){
            return res.status(400).send("Id is Missings");
        }

        const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');

        if(!getProblem){
            return res.status(404).send("Problem is not Present in server");
        }

        const videos = await SolutionVideo.findOne({problemId:id});

        if(videos){   
            
        const responseData = {
            ...getProblem.toObject(),
            secureUrl:videos.secureUrl,
            thumbnailUrl : videos.thumbnailUrl,
            duration : videos.duration,
        } 
        
        return res.status(200).send(responseData);
        }
            
        res.status(200).send(getProblem);
        
    } catch (error) {
        
        res.status(500).send("Error: "+error);
    }
    
};

const getAllProblem = async (req,res) => {
    
    try {
        
        const getAllProblem = await Problem.find({}).select('-problemCreator -hiddenTestcases -__v -description -visibleTestCases -startCode -ReferenceSolution');

        res.status(200).send(getAllProblem);

    } catch (error) {
         res.status(500).send("Error: "+error);
    }

};

const solvedAllProblemByUser = async (req,res) => {
    
    try {

        const userId= req.result._id;

        const user = await User.findById(userId).populate({
            path:"problemSolved",
            select:"_id title difficulty tags"
        });

        res.status(200).send(user.problemSolved);
        
    } catch (error) {
        res.status(500).send("Server Error: "+error);
    }
};

const submittedProblem = async (req,res) => {
    
    try {
        const userId = req.result._id;

        const problemId = req.params.id;

        if(!userId || !problemId){
            return res.status(400).send('Missing userId or problemId');
        }

        // console.log('Fetching submissions for userId:', userId, 'problemId:', problemId);

        const ans = await Submission.find({userId, problemId});

        // console.log('Found submissions:', ans.length);

        res.status(200).send(ans);

    } catch (error) {
        console.error('Submission fetch error:', error);
        res.status(500).send('Internal Server Error: '+error.message);
    }
}

module.exports={createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemByUser,submittedProblem};