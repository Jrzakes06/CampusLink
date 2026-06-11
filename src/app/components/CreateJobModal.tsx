import { X } from 'lucide-react';
import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { uploadFile } from '../../../utils/upload';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    company: string,
    companyLogo: string,
    location: string,
    type: 'remote' | 'hybrid' | 'onsite',
    salary: string,
    description: string,
    requirements: string[]
  ) => void;
  isVerified?: boolean;
}

export function CreateJobModal({ isOpen, onClose, onSubmit, isVerified }: CreateJobModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  if (!isOpen) return null;

  if (isVerified === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Required</h2>
            <p className="text-gray-600 mb-6">
              You need to complete KYC verification before you can post job listings. Please complete your verification in the Profile section.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && company && description) {
      const reqArray = requirements
        .split('\n')
        .filter(r => r.trim())
        .map(r => r.trim());

      const companyLogo = companyLogoFile ? await uploadFile(companyLogoFile) : '';

      onSubmit(title, company, companyLogo, location, type, salary, description, reqArray);
      setTitle('');
      setCompany('');
      setCompanyLogoFile(null);
      setLocation('');
      setType('remote');
      setSalary('');
      setDescription('');
      setRequirements('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white text-gray-900">
          <h2 className="font-semibold text-gray-900">Post a Job</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-900">
            <X className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Full-Stack Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Logo</label>
              <FileUpload
                label="Company Logo"
                accept="image/*"
                onUpload={setCompanyLogoFile}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Job Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'remote' | 'hybrid' | 'onsite')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Salary Range</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="$80k - $120k"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zimbabwe, Harare or Remote"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="We are looking for an experienced full-stack developer..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Requirements (one per line)</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="5+ years experience with React&#10;Strong TypeScript skills&#10;Experience with Node.js"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
}
