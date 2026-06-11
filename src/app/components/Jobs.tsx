import { Briefcase, MapPin, DollarSign, Clock, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite';
  salary: string;
  description: string;
  requirements: string[];
  poster: string;
  posterAvatar: string;
  createdAt: number;
  applications: number;
}

interface JobsProps {
  onCreateJob: () => void;
  onJobClick: (job: Job) => void;
}

export function Jobs({ onCreateJob, onJobClick }: JobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        headers: apiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.log(`Error fetching jobs: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  usePolling(fetchJobs, 60_000);

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Remote Jobs</h2>
        <button
          onClick={onCreateJob}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Post Job
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'remote', 'hybrid', 'onsite'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === type
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs found. Post the first job!</p>
          <button
            onClick={onCreateJob}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Post Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onJobClick(job)}
              className="bg-white text-gray-900 rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                  <p className="text-gray-600 mb-3">{job.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="capitalize">{job.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{Number(job.createdAt) > 0 ? new Date(Number(job.createdAt)).toLocaleDateString() : 'Invalid Date'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.applications} applications</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
