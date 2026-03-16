import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate, useParams } from 'react-router';
import { Info } from 'lucide-react';

// Zod schema: Hidden test cases are optional (since we are only adding NEW ones)
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  // Optional, allows empty array
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).optional(),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [], referenceSolution: [], visibleTestCases: [], hiddenTestCases: []
    }
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({
    control, name: 'visibleTestCases'
  });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({
    control, name: 'hiddenTestCases'
  });

  // Fetch Existing Data
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const response = await axiosClient.get(`/problem/problemById/${id}`);
        // Backend doesn't send hiddenTestCases. We initialize it as empty array to represent "No NEW cases added yet"
        reset({ ...response.data, hiddenTestCases: [] });
        setLoading(false);
      } catch (error) {
        alert("Error fetching problem");
        navigate('/admin/update');
      }
    };
    if (id) fetchProblemData();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      await axiosClient.put(`/problem/update/${id}`, data);
      alert('Problem updated successfully!');
      navigate('/admin/update');
    } catch (error) {
       alert(`Update Failed: ${error.response?.data || error.message}`);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Problem</h1>
        <button onClick={() => navigate(-1)} className="btn btn-outline">Cancel</button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Info */}
        <div className="card bg-base-100 shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <div className="form-control">
              <label className="label">Title</label>  &nbsp;
              <input {...register('title')} className="input input-bordered" />
              {errors.title && <span className="text-error">{errors.title.message}</span>}
            </div>
            <div className="form-control">
              <label className="label">Description</label>
              <textarea {...register('description')} 
              className="textarea textarea-bordered w-full h-48 text-lg" 
              placeholder="Write the problem description here..."
               />
            </div>
            <div className="flex gap-4">
              <div className="form-control w-1/2">
                <label className="label">Difficulty</label>
                <select {...register('difficulty')} className="select select-bordered">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-control w-1/2">
                <label className="label">Tags</label>
                <select {...register('tags')} className="select select-bordered">
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                </select>
              </div>
            </div>
        </div>

        {/* Visible Test Cases - UPDATED STYLING */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Visible Test Cases (Editable)</h2>
              <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="btn btn-sm btn-primary">Add Visible Case</button>
          </div>
          {visibleFields.map((field, index) => (
            <div key={field.id} className="border border-primary p-4 rounded-lg mb-2 relative bg-primary/5">
                <div className="badge badge-primary badge-outline mb-2">Visible Case #{index + 1}</div>
                <button type="button" onClick={() => removeVisible(index)} className="btn btn-xs btn-error absolute top-2 right-2">Remove</button>
                <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full mb-2" />
                <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full mb-2" />
                <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="textarea textarea-bordered w-full" />
            </div>
          ))}
          {errors.visibleTestCases && <p className="text-error">{errors.visibleTestCases.message}</p>}
        </div>

        {/* Hidden Test Cases - APPEND ONLY */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Hidden Test Cases</h2>
              <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="btn btn-sm btn-accent">Add NEW Case</button>
          </div>

          <div className="alert alert-info shadow-sm mb-4">
             <Info size={24} />
             <div className="text-sm">
                <strong>Note:</strong> Existing hidden test cases are hidden on the server. <br/>
                Cases added below will be <strong>appended</strong> to the existing list.
             </div>
          </div>

          {hiddenFields.length === 0 && <p className="text-center text-gray-500 italic">No new cases added.</p>}

          {hiddenFields.map((field, index) => (
            <div key={field.id} className="border border-accent p-4 rounded-lg mb-2 relative bg-accent/5">
                <div className="badge badge-accent badge-outline mb-2">New Append #{index + 1}</div>
                <button type="button" onClick={() => removeHidden(index)} className="btn btn-xs btn-error absolute top-2 right-2">Remove</button>
                <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full mb-2" />
                <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full" />
            </div>
          ))}
        </div>

        {/* Code Templates */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
          {[0, 1, 2].map((index) => (
             <div key={index} className="mb-4">
                <h3 className="font-bold text-lg mb-2">{index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}</h3>
                <label className="label">Initial Code</label>
                <textarea {...register(`startCode.${index}.initialCode`)} className="textarea textarea-bordered w-full font-mono h-48 bg-neutral text-neutral-content" />
                <label className="label">Reference Solution</label>
                <textarea {...register(`referenceSolution.${index}.completeCode`)} className="textarea textarea-bordered w-full font-mono h-68  bg-neutral text-neutral-content" />
             </div>
          ))}
        </div>

        <button type="submit" className="btn btn-warning w-full font-bold text-lg">Update Problem</button>
      </form>
    </div>
  );
}

export default AdminUpdate;