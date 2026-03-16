import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { Play, Send, Terminal, CheckCircle } from 'lucide-react'; // Added icons for attractiveness

// Custom CSS for hiding scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

const langMap = {
    cpp: 'C++',
    java: 'Java',
    javascript: 'JavaScript'
};

const ProblemPage = () => {
    const [problem, setProblem] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [activeRightTab, setActiveRightTab] = useState('code');
    const editorRef = useRef(null);
    let { problemId } = useParams();

    const { handleSubmit } = useForm();

    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get(`/problem/problemById/${problemId}`);
                const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
                setProblem(response.data);
                setCode(initialCode);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching problem:', error);
                setLoading(false);
            }
        };
        fetchProblem();
    }, [problemId]);

    // Update code when language changes
    useEffect(() => {
        if (problem) {
            const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
            setCode(initialCode);
        }
    }, [selectedLanguage, problem]);

    const handleEditorChange = (value) => {
        setCode(value || '');
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const handleLanguageChange = (language) => {
        setSelectedLanguage(language);
    };

    const handleRun = async () => {
        setLoading(true);
        setRunResult(null);

        try {
            if (!code || code.trim() === '') {
                throw new Error('Please write some code before running');
            }
            const response = await axiosClient.post(`/submission/run/${problemId}`, {
                code,
                language: selectedLanguage
            });
            setRunResult(response.data);
            setLoading(false);
            setActiveRightTab('testcase');
        } catch (error) {
            console.error('Error running code:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to run code.';
            setRunResult({ success: false, error: errorMessage });
            setLoading(false);
            setActiveRightTab('testcase');
        }
    };

    const handleSubmitCode = async () => {
        setLoading(true);
        setSubmitResult(null);
        try {
            if (!code || code.trim() === '') {
                throw new Error('Please write some code before submitting');
            }
            const response = await axiosClient.post(`/submission/submit/${problemId}`, {
                code: code,
                language: selectedLanguage
            });
            setSubmitResult(response.data);
            setLoading(false);
            setActiveRightTab('result');
        } catch (error) {
            console.error('Error submitting code:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit code.';
            setSubmitResult({
                accepted: false,
                error: errorMessage,
                passedTestCases: 0,
                totalTestCases: 0
            });
            setLoading(false);
            setActiveRightTab('result');
        }
    };

    const getLanguageForMonaco = (lang) => {
        switch (lang) {
            case 'javascript': return 'javascript';
            case 'java': return 'java';
            case 'cpp': return 'cpp';
            default: return 'javascript';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-success';
            case 'medium': return 'text-warning';
            case 'hard': return 'text-error';
            default: return 'text-base-content';
        }
    };

    if (loading && !problem) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-base-100">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <>
            <style>{scrollbarHideStyles}</style>
            <div className="h-screen flex flex-col lg:flex-row bg-base-100 overflow-hidden">
                
                {/* Left Panel - Content (Description, AI, etc) */}
                {/* On mobile: h-[45%], On desktop: w-1/2 h-full */}
                <div className="h-[45%] lg:h-full w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-base-300 min-h-0 bg-base-100">
                    
                    {/* Left Tabs */}
                    <div className="bg-base-200/50 backdrop-blur border-b border-base-300">
                        <div className="tabs tabs-bordered w-full overflow-x-auto scrollbar-hide flex-nowrap px-2">
                            {['description', 'editorial', 'solutions', 'submissions', 'chatAI'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`tab tab-sm md:tab-md whitespace-nowrap px-4 transition-all ${activeLeftTab === tab ? 'tab-active font-bold border-primary text-primary' : 'text-base-content/70'}`}
                                    onClick={() => setActiveLeftTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('AI', ' AI')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Left Content Area */}
                    <div className={`flex-1 overflow-y-auto scrollbar-hide min-h-0 ${activeLeftTab === 'chatAI' ? 'p-0 overflow-hidden' : 'p-3 md:p-6'}`}>
                        {problem && (
                            <>
                                {activeLeftTab === 'description' && (
                                    <div className="space-y-4 max-w-3xl mx-auto">
                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className="flex items-center justify-between">
                                                <h1 className="text-xl md:text-2xl font-bold">{problem.title}</h1>
                                                <div className={`badge badge-outline font-medium ${getDifficultyColor(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {problem.tags && problem.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="badge badge-secondary badge-xs opacity-90">{tag.trim()}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="prose prose-sm max-w-none text-base-content/90">
                                            <p className="whitespace-pre-wrap leading-relaxed">{problem.description}</p>
                                        </div>

                                        <div className="divider my-4"></div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-lg">Examples</h3>
                                            {problem?.visibleTestCases?.length > 0 ? (
                                                problem.visibleTestCases.map((example, index) => (
                                                    <div key={index} className="card bg-base-200/50 border border-base-300 shadow-sm compact">
                                                        <div className="card-body p-4 text-sm font-mono">
                                                            <div><span className="text-base-content/60 font-sans font-bold block mb-1">Input:</span> {example.input}</div>
                                                            <div className="mt-2"><span className="text-base-content/60 font-sans font-bold block mb-1">Output:</span> {example.output}</div>
                                                            {example.explanation && (
                                                                <div className="mt-2 text-base-content/80 font-sans">
                                                                    <span className="font-bold block mb-1 text-base-content/60">Explanation:</span>
                                                                    {example.explanation}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : <p className="text-base-content/60 italic">No public test cases.</p>}
                                        </div>
                                    </div>
                                )}

                                {activeLeftTab === 'editorial' && 
                                <div className="h-full">
                                  <Editorial secureUrl={problem?.secureUrl} thumbnailUrl={problem?.thumbnailUrl} duration={problem?.duration} />
                                </div>
                                }
                                
                                {activeLeftTab === 'solutions' && (
                                  <div>
                                    <h2 className="text-xl font-bold mb-4">Solutions</h2>
                                    <div className="space-y-6">
                                      {problem.referenceSolution?.map((solution, index) => (
                                        <div key={index} className="border border-base-300 rounded-lg">
                                          <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                                            <h3 className="font-semibold">{problem?.title} - {solution?.language}</h3>
                                          </div>
                                          <div className="p-4">
                                            <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
                                              <code>{solution?.completeCode}</code>
                                            </pre>
                                          </div>
                                        </div>
                                      )) || <p className="text-gray-500">Solutions will be available after you solve the problem.</p>}
                                    </div>
                                  </div>
                                )}

                                {activeLeftTab === 'submissions' && <SubmissionHistory problemId={problemId} />}

                                {/* Chat AI Component */}
                                {activeLeftTab === 'chatAI' && (
                                  <div className="prose max-w-none">
                                    
                                    <div className="h-full p-2 md:p-4 whitespace-pre-wrap leading-relaxed bg-base-200/30">
                                        <ChatAi problem={problem} />
                                    </div>
                                  </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel - Code Editor & Actions */}
                {/* On mobile: h-[55%], On desktop: w-1/2 h-full */}
                <div className="h-[55%] lg:h-full w-full lg:w-1/2 flex flex-col bg-base-100 min-h-0">
                    
                    {/* ATTRACTIVE NAVIGATION BAR */}
                    <div className="bg-base-200 px-2 py-2 flex items-center justify-between border-b border-base-300 shrink-0 gap-2">
                         {/* Navigation Pills */}
                        <div className="flex bg-base-300/50 p-1 rounded-lg flex-1 md:flex-none">
                            {['code', 'testcase', 'result'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveRightTab(tab)}
                                    className={`
                                        flex-1 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all duration-200
                                        ${activeRightTab === tab 
                                            ? 'bg-base-100 text-primary shadow-sm' 
                                            : 'text-base-content/60 hover:text-base-content'}
                                    `}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Language Selector (Only show if on code tab to save space on mobile, or keep always) */}
                         <select 
                            className="select select-bordered select-xs md:select-sm bg-base-100 max-w-25" 
                            value={selectedLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {activeRightTab === 'code' && (
                            <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    language={getLanguageForMonaco(selectedLanguage)}
                                    value={code}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorDidMount}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 13,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 2,
                                        padding: { top: 10, bottom: 10 }
                                    }}
                                />
                            </div>
                        )}

                        {activeRightTab === 'testcase' && (
                            <div className="flex-1 overflow-auto p-4 bg-base-100">
                                {runResult ? (
                                    <div className="space-y-4">
                                        <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'} shadow-sm rounded-lg`}>
                                            <div className="flex flex-col gap-1">
                                                <h4 className="font-bold flex items-center gap-2">
                                                    {runResult.success ? <CheckCircle size={20}/> : <span className="text-xl">✗</span>}
                                                    {runResult.success ? 'Success' : 'Execution Failed'}
                                                </h4>
                                                {runResult.runtime && <p className="text-xs opacity-90">Time: {runResult.runtime}s | Mem: {runResult.memory}KB</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {runResult.testCases?.map((tc, i) => (
                                                <div key={i} className="collapse collapse-arrow border border-base-300 bg-base-200/30 rounded-lg">
                                                    <input type="checkbox" defaultChecked={i===0} /> 
                                                    <div className="collapse-title text-sm font-medium flex justify-between">
                                                        <span>Test Case {i + 1}</span>
                                                        <span className={tc.status_id === 3 ? "text-success" : "text-error"}>
                                                            {tc.status_id === 3 ? "Passed" : "Failed"}
                                                        </span>
                                                    </div>
                                                    <div className="collapse-content text-xs font-mono">
                                                        <div className="grid grid-cols-1 gap-2 p-2 bg-base-100 rounded">
                                                            <div><span className="text-base-content/50">Input:</span> {tc.stdin}</div>
                                                            <div><span className="text-base-content/50">Expected:</span> {tc.expected_output}</div>
                                                            <div><span className="text-base-content/50">Output:</span> {tc.stdout}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {!runResult.testCases && <div className="text-error text-sm p-2">{runResult.error}</div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-base-content/40">
                                        <Terminal size={48} className="mb-2 opacity-20" />
                                        <p>Run code to see output</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeRightTab === 'result' && (
                            <div className="flex-1 overflow-auto p-4 bg-base-100">
                                {submitResult ? (
                                    <div className={`card ${submitResult.accepted ? 'bg-success/10 border-success' : 'bg-error/10 border-error'} border shadow-sm`}>
                                        <div className="card-body p-5 items-center text-center">
                                            <h2 className={`card-title text-2xl ${submitResult.accepted ? 'text-success' : 'text-error'}`}>
                                                {submitResult.accepted ? 'Accepted!' : submitResult.error || 'Wrong Answer'}
                                            </h2>
                                            <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-100 mt-4 w-full">
                                                <div className="stat place-items-center p-2">
                                                    <div className="stat-title text-xs">Test Cases</div>
                                                    <div className="stat-value text-lg">{submitResult.passedTestCases}/{submitResult.totalTestCases}</div>
                                                </div>
                                                <div className="stat place-items-center p-2">
                                                    <div className="stat-title text-xs">Runtime</div>
                                                    <div className="stat-value text-lg text-primary">{submitResult.runtime || 0}s</div>
                                                </div>
                                                <div className="stat place-items-center p-2">
                                                    <div className="stat-title text-xs">Memory</div>
                                                    <div className="stat-value text-lg text-secondary">{submitResult.memory || 0}KB</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-base-content/40 text-sm">
                                        No submission yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* BOTTOM ACTION BAR - Run/Submit on LEFT */}
                    <div className="p-3 bg-base-100 border-t border-base-300 flex items-center shrink-0 gap-2">
                        {/* LEFT: Run & Submit Buttons (Primary Actions) */}
                        <div className="flex items-center gap-2 mr-auto">
                            <button
                                className={`btn btn-sm ${loading ? 'btn-disabled' : 'btn-neutral'} gap-2`}
                                onClick={handleRun}
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : <Play size={14} fill="currentColor" />}
                                Run
                            </button>
                            <button
                                className={`btn btn-sm ${loading ? 'btn-disabled' : 'btn-primary'} gap-2`}
                                onClick={handleSubmitCode}
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : <Send size={14} />}
                                Submit
                            </button>
                        </div>

                        {/* RIGHT: Secondary Actions */}
                        <button
                            className="btn btn-sm btn-ghost text-xs font-normal"
                            onClick={() => setActiveRightTab('testcase')}
                        >
                            Console
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProblemPage;