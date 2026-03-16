const axios=require('axios');

const getLanguageBYId = (lang)=>{
    const language={
        "c++":54,
        "java":62,
        "javascript":63
    }

    return language[lang.toLowerCase()];
}

//Create a batched submission
const submitBatch = async (submissions) =>{
    
    const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
      params: {
        base64_encoded: 'false'
      },
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_API,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        submissions
      }
    };
    
    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error('Judge0 submitBatch error:', error.message);
            throw new Error(`Judge0 API Error: ${error.message}`);
        }
    }
    
     return await fetchData();
}


const waiting = (timer) => {
    return new Promise((resolve) => setTimeout(resolve, timer));
}
//Get a batched submission
const submitToken = async (resultToken) => {
    
    const options = {
      method: 'GET',
      url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
      params: {
        tokens: resultToken.join(","),
        base64_encoded: 'false',
        fields: '*'
      },
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_API,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
      }
    };
    
    async function fetchData() {
      try {
        const response = await axios.request(options);
        return response.data;
      } catch (error) {
        console.error('Judge0 submitToken error:', error.message);
        throw new Error(`Judge0 API Error: ${error.message}`);
      }
    }

    while (true){

      const result = await fetchData();

      const IsResultObtained = result.submissions.every((r)=>r.status_id>2);

      if(IsResultObtained)
        return result.submissions;

      await waiting(1000);
    }
}

module.exports={getLanguageBYId,submitBatch,submitToken};