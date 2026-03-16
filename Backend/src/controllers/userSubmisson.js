const Problem=require('../models/problem');
const Submission=require('../models/submission');
const {getLanguageBYId,submitBatch,submitToken}=require('../utils/ProblemUtility');


const submitCode = async (req,res) => {

    try {
        
        const userId = req.result._id;

        const problemId = req.params.id;

        let {code , language} =req.body;

        if(!userId||!problemId||!code||!language){
            return res.status(400).send("Some Field is Missing");
        }

        if(language==='cpp')
            language='c++'

        //fetch the problem from the databases // for hidden test cases

        const problem = await Problem.findById(problemId);

        if (!problem) {

            return res.status(404).send("Problem not found");

        }

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status:'pending',
            testCasesTotal:problem.hiddenTestCases.length
        });

        //Judge0 ko code submit karana hai

        const languageId=getLanguageBYId(language);

        const submissions = problem.hiddenTestCases.map((testcases) => ({
                //formet for Create a batched submission;
                source_code: code, //source_code;
                language_id: languageId, //language_Id;
                stdin: testcases.input,  //std_in;
                expected_output: testcases.output //expected_output;

            }));

        const submitResult = await submitBatch(submissions);

        //Create token array;
        const resultToken = submitResult.map((value)=>value.token);

        const testResult = await submitToken(resultToken);
        
        //Submited Result ko Update karna hoga;
        
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for(const test of testResult){
            
            if(test.status_id == 3){

                testCasesPassed++;
                runtime = runtime+parseFloat( test.time );
                memory = Math.max(memory,test.memory);

            }
            else{
                if(test.status_id == 4){
                    status='wrong';
                    errorMessage=test.stderr;
                }else{
                    status='error';
                    errorMessage=test.stderr;
                }
            }

        }

        //Store The Result in database in Submission;

        submittedResult.status=status;

        submittedResult.testCasesPassed=testCasesPassed;

        submittedResult.errorMessage=errorMessage;

        submittedResult.runtime=runtime;

        submittedResult.memory=memory;

        await submittedResult.save();


        //Problem id ko insert karenge userSchema ke ProblemSolved mein if it is not present there;

        if(!req.result.problemSolved.includes(problemId)){
            
            req.result.problemSolved.push(problemId);

            await req.result.save();

        }

        const accepted = (status == 'accepted')

        res.status(201).json({
            accepted,
            totalTestCases:submittedResult.testCasesTotal,
            passedTestCases:testCasesPassed,
            runtime,
            memory
        });

    } catch (error) {
        
        console.error("Submit Code Error:", error);
        res.status(500).send("Internal Server Error: "+error.message);
        
    }
};

const runCode = async (req,res) => {
    
      try {
        
        const userId = req.result._id;

        const problemId = req.params.id;

        let {code , language} =req.body;

        if(!userId||!problemId||!code||!language){
            return res.status(400).send("Some Field is Missing");
        }

        if(language==='cpp')
            language='c++'

        //fetch the problem from the databases // for hidden test cases

        const problem = await Problem.findById(problemId);

        if (!problem) {

            return res.status(404).send("Problem not found");

        }



        //Judge0 ko code submit karana hai

        const languageId=getLanguageBYId(language);

        const submissions = problem.visibleTestCases.map((testcases) => ({
                //formet for Create a batched submission;
                source_code: code, //source_code;
                language_id: languageId, //language_Id;
                stdin: testcases.input,  //std_in;
                expected_output: testcases.output //expected_output;

            }));

        const submitResult = await submitBatch(submissions);

        //Create token array;
        const resultToken = submitResult.map((value)=>value.token);

        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = true;
        let errorMessage = null;

        for(const test of testResult){
            if(test.status_id==3){
            testCasesPassed++;
            runtime = runtime+parseFloat(test.time)
            memory = Math.max(memory,test.memory);
            }else{
            if(test.status_id==4){
                status = false
                errorMessage = test.stderr
            }
            else{
                status = false
                errorMessage = test.stderr
            }
            }
        }

    
    
        res.status(201).json({
            success:status,
            testCases: testResult,
            runtime,
            memory
        });


    } catch (error) {
        
        console.error("Run Code Error:", error);
        res.status(500).send("Internal Server Error: "+error.message);
        
    }

};

module.exports={submitCode,runCode};