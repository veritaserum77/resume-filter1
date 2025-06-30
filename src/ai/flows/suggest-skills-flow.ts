'use client';

import { useState } from 'react';
import { suggestSkills } from '@/actions/suggest-skills';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

export function SkillSuggestForm() {
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { skills } = await suggestSkills({ 
        jobDescription: jobDescription.trim() 
      });
      setSkills(skills);
    } catch (err) {
      setError('Failed to generate suggestions. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium mb-2">
            Job Description
          </label>
          <Textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={8}
            className="w-full"
            disabled={isLoading}
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading || !jobDescription.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Suggest Skills
            </>
          )}
        </Button>
      </form>

      {skills.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Suggested Skills</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {skills.map((skill, index) => (
              <div 
                key={index} 
                className="bg-secondary/50 px-4 py-2 rounded-md border"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
