import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';

const PendingAccessNotice = ({ email, signInPath, message }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass-card max-w-xl w-full p-8 text-center border border-amber-500/30">
        <Clock3 size={36} className="mx-auto mb-4 text-amber-300" />
        <h2 className="text-2xl font-bold text-textColor mb-3">Access Pending Approval</h2>
        <p className="text-textMuted mb-3">
          Signed in as <span className="text-textColor font-medium">{email || 'unknown email'}</span>.
        </p>
        <p className="text-sm text-amber-200 mb-6">
          {message || 'Your account was found, but access still needs manager or admin approval before this workspace can open.'}
        </p>
        <Link to={signInPath} className="btn-secondary text-sm">
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default PendingAccessNotice;
