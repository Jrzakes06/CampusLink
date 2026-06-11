import { ArrowLeft, MapPin, DollarSign, Briefcase, Send } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState } from 'react';

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

interface JobDetailsProps {
  job: Job;
  onBack: () => void;
  onApply: (jobId: string, coverLetter: string, resumeUrl: string) => void;
}

export function JobDetails({ job, onBack, onApply }: JobDetailsProps) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please upload your resume before submitting.');
      return;
    }

    setIsSubmitting(true);
    const resumeBase64 = await convertFileToBase64(resumeFile);
    await onApply(job.id, coverLetter, resumeBase64);
    setIsSubmitting(false);
    setCoverLetter('');
    setResumeFile(null);
    setShowApplicationForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </button>

      <div className="bg-white text-gray-900 rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              src={job.companyLogo}
              username={job.company}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{job.title}</h1>
              <p className="text-xl text-gray-600 mb-3">{job.company}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                  <MapPin className="w-4 h-4" />
                  {job.type}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                )}
                <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                  <Briefcase className="w-4 h-4" />
                  {job.applications} applications
                </span>
              </div>
            </div>
          </div>

          {!showApplicationForm && (
            <button
              onClick={() => setShowApplicationForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
              Apply Now
            </button>
          )}
        </div>

        {showApplicationForm && (
          <div className="p-6 bg-blue-50 border-b border-gray-200">
            <h3 className="font-semibold mb-4">Apply for this position</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload Resume</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      setResumeFile(selectedFile);
                    }}
                    className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    required
                  />
                </div>
                {resumeFile && (
                  <p className="text-sm text-gray-600 mt-2">Selected file: {resumeFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit for this role..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">About the role</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.location && (
            <div>
              <h2 className="text-xl font-bold mb-3">Location</h2>
              <p className="text-gray-700">{job.location}</p>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold mb-3">Posted by</h2>
            <div className="flex items-center gap-3">
              <Avatar
                src={job.posterAvatar}
                username={job.poster}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{job.poster}</p>
                <p className="text-sm text-gray-500">
                  Posted {Number(job.createdAt) > 0 ? new Date(Number(job.createdAt)).toLocaleDateString() : 'Invalid Date'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
