const updateProblem = async (req, res) => {
    const { id } = req.params;
    const { title, description, difficulty, tags, visibleTestCases, hiddenTestCases, startCode, referenceSolution } = req.body;

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