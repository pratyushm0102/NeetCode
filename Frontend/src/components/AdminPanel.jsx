import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';
import { Info } from 'lucide-react';

// Zod schema matching the problem schema (logic remains unchanged)
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
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
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

function AdminPanel() {
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (data) => {
    try {
      await axiosClient.post('/problem/create', data);
      alert('Problem created successfully!');
      navigate('/');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Error: You must be logged in as an admin to create problems!');
      } else {
        alert(`Error: ${error.response?.data || error.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Problem</h1>
        <button onClick={() => navigate(-1)} className="btn btn-outline">Cancel</button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Title</span>  &nbsp;
            </label>
            <input
              {...register('title')}
              className={`input input-bordered ${errors.title && 'input-error'}`}
            />
            {errors.title && (
              <span className="text-error">{errors.title.message}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              {...register('description')}
              className={`textarea textarea-bordered w-full h-48 text-lg ${errors.description && 'textarea-error'}`}
              placeholder="Write the problem description here..."
            />
            {errors.description && (
              <span className="text-error">{errors.description.message}</span>
            )}
          </div>

          <div className="flex gap-4">
            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text">Difficulty</span>
              </label>
              <select
                {...register('difficulty')}
                className={`select select-bordered ${errors.difficulty && 'select-error'}`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text">Tag</span>
              </label>
              <select
                {...register('tags')}
                className={`select select-bordered ${errors.tags && 'select-error'}`}
              >
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="dp">DP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visible Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Visible Test Cases</h2>
            <button
              type="button"
              onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
              className="btn btn-sm btn-primary"
            >
              Add Visible Case
            </button>
          </div>
          
          {visibleFields.map((field, index) => (
            <div key={field.id} className="border border-primary p-4 rounded-lg mb-4 relative bg-primary/5">
              <div className="badge badge-primary badge-outline mb-2">Visible Case #{index + 1}</div>
              <button
                type="button"
                onClick={() => removeVisible(index)}
                className="btn btn-xs btn-error absolute top-2 right-2"
              >
                Remove
              </button>
              
              <input
                {...register(`visibleTestCases.${index}.input`)}
                placeholder="Input"
                className="input input-bordered w-full mb-2"
              />
              
              <input
                {...register(`visibleTestCases.${index}.output`)}
                placeholder="Output"
                className="input input-bordered w-full mb-2"
              />
              
              <textarea
                {...register(`visibleTestCases.${index}.explanation`)}
                placeholder="Explanation"
                className="textarea textarea-bordered w-full"
              />
            </div>
          ))}
          {errors.visibleTestCases && <p className="text-error">{errors.visibleTestCases.message}</p>}
        </div>

        {/* Hidden Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Hidden Test Cases</h2>
            <button
              type="button"
              onClick={() => appendHidden({ input: '', output: '' })}
              className="btn btn-sm btn-accent"
            >
              Add Hidden Case
            </button>
          </div>

          <div className="alert alert-info shadow-sm mb-4">
             <Info size={24} />
             <div className="text-sm">
                <strong>Note:</strong> These cases are used for final evaluation and are not shown to users.
             </div>
          </div>
          
          {hiddenFields.map((field, index) => (
            <div key={field.id} className="border border-accent p-4 rounded-lg mb-4 relative bg-accent/5">
              <div className="badge badge-accent badge-outline mb-2">Hidden Case #{index + 1}</div>
              <button
                type="button"
                onClick={() => removeHidden(index)}
                className="btn btn-xs btn-error absolute top-2 right-2"
              >
                Remove
              </button>
              
              <input
                {...register(`hiddenTestCases.${index}.input`)}
                placeholder="Input"
                className="input input-bordered w-full mb-2"
              />
              
              <input
                {...register(`hiddenTestCases.${index}.output`)}
                placeholder="Output"
                className="input input-bordered w-full"
              />
            </div>
          ))}
          {errors.hiddenTestCases && <p className="text-error">{errors.hiddenTestCases.message}</p>}
        </div>

        {/* Code Templates */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
          
          <div className="space-y-6">
            {[0, 1, 2].map((index) => (
              <div key={index} className="mb-6 border-b pb-6 last:border-0">
                <h3 className="font-bold text-lg mb-2">
                  {index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}
                </h3>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Initial Code</span>
                  </label>
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    className="textarea textarea-bordered w-full font-mono h-48 bg-neutral text-neutral-content"
                    placeholder="// Initial template for user"
                  />
                </div>
                
                <div className="form-control mt-2">
                  <label className="label">
                    <span className="label-text">Reference Solution</span>
                  </label>
                  <textarea
                    {...register(`referenceSolution.${index}.completeCode`)}
                    className="textarea textarea-bordered w-full font-mono h-64 bg-neutral text-neutral-content"
                    placeholder="// Complete solution code"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full font-bold text-lg">
          Create Problem
        </button>
      </form>
    </div>
  );
}

export default AdminPanel;