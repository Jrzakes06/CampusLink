import { useState } from 'react';
import { User, Lock, Mail, UserPlus, Building2 } from 'lucide-react';
import { FileUpload } from './FileUpload';

const ZIMBABWE_UNIVERSITIES = [
  'Africa University (AU)',
  'Arrupe Jesuit University (AJU)',
  'Bindura University of Science Education (BUSE)',
  'Catholic University of Zimbabwe (CUZ)',
  'Chinhoyi University of Technology (CUT)',
  'Great Zimbabwe University',
  'Gwanda State University (GSU)',
  'Harare Institute of Technology (HIT)',
  'Lupane State University (LSU)',
  'Midlands State University (MSU)',
  'National University of Science and Technology (NUST)',
  'Reformed Church University',
  'Solusi University',
  'University of Zimbabwe (UZ)',
  "Women's University in Africa (WUA)",
  'Zimbabwe Ezekiel Guti University (ZEGU)',
  'Zimbabwe Open University (ZOU)',
];

interface SignupProps {
  onSignup: (data: SignupData) => Promise<boolean>;
  onSwitchToLogin: () => void;
}

interface SignupData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  university: string;
  studentIdFile?: File;
}

export function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [university, setUniversity] = useState('');
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!university) {
      setError('Please select your university');
      return;
    }

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onSignup({
        fullName,
        username,
        email,
        password,
        role,
        university,
        studentIdFile: studentIdFile || undefined,
      });

      if (!result) {
        setError('Email already exists or signup failed');
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#081032_45%,#0f183b_100%)] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 dark:border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Join CampusLink</h1>
          <p className="text-gray-600 dark:text-slate-300">Create your student account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Oneal Dube"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-slate-950 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Onealdube"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-slate-950 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              University Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="oneal.dube@uz.ac.zw"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-slate-950 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Use your university email address</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-slate-950 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white text-slate-950 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              required
            >
              <option value="student">Student</option>
              <option value="seller">Seller/Vendor</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              University *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              >
                <option value="">Select your university</option>
                {ZIMBABWE_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FileUpload
            label="Student ID / Proof of Enrollment (Optional)"
            onUpload={(file) => setStudentIdFile(file)}
            accept="image/*,.pdf"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-slate-300">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
