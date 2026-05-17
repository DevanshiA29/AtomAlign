import { useEffect, useState } from 'react';
import { Globe, MapPin, Save, UserRound } from 'lucide-react';
import { API_URL } from '../lib/api';

const emptyForm = {
  name: '',
  title: '',
  department: '',
  dateOfJoining: '',
  phone: '',
  location: '',
  bio: '',
  websiteUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  managerId: ''
};

const ProfileWorkbench = ({ profile, managers = [], allowManagerEdit = false, onProfileUpdate }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      title: profile?.title || '',
      department: profile?.department || '',
      dateOfJoining: profile?.dateOfJoining ? new Date(profile.dateOfJoining).toISOString().slice(0, 10) : '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      websiteUrl: profile?.websiteUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || '',
      managerId: profile?.managerId || ''
    });
  }, [profile]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/portal/profile/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profile update failed.');
      }

      onProfileUpdate?.(data.profile);
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to save profile right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 border border-borderColor space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-textMuted mb-2">Identity Profile</p>
          <h3 className="text-2xl font-bold text-textColor">{profile?.name || 'Team Member'}</h3>
          <p className="text-sm text-textMuted mt-1">
            {profile?.staffCode || 'Pending ID'} • {profile?.role}
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-atomPink/20 to-atomPurple/20 border border-borderColor flex items-center justify-center">
          <UserRound className="text-textColor" size={24} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Full Name</label>
          <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="input-field w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Email</label>
          <input value={profile?.email || ''} readOnly className="input-field w-full text-sm opacity-70 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Title</label>
          <input value={form.title} onChange={(e) => updateField('title', e.target.value)} className="input-field w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Department</label>
          <input value={form.department} onChange={(e) => updateField('department', e.target.value)} className="input-field w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Date of Joining</label>
          <input type="date" value={form.dateOfJoining} onChange={(e) => updateField('dateOfJoining', e.target.value)} className="input-field w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Phone</label>
          <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="input-field w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Location</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className="input-field w-full text-sm pl-9" />
          </div>
        </div>
        {allowManagerEdit && (
          <div>
            <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Reporting Manager</label>
            <select value={form.managerId} onChange={(e) => updateField('managerId', e.target.value)} className="input-field w-full text-sm">
              <option value="">Select a manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} • {manager.department}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">About</label>
        <textarea value={form.bio} onChange={(e) => updateField('bio', e.target.value)} className="input-field w-full text-sm h-24 resize-none" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Website</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input value={form.websiteUrl} onChange={(e) => updateField('websiteUrl', e.target.value)} className="input-field w-full text-sm pl-9" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">LinkedIn</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input value={form.linkedinUrl} onChange={(e) => updateField('linkedinUrl', e.target.value)} className="input-field w-full text-sm pl-9" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">GitHub</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input value={form.githubUrl} onChange={(e) => updateField('githubUrl', e.target.value)} className="input-field w-full text-sm pl-9" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-textMuted">{message || 'Your staff ID and profile live in the shared Supabase workforce directory.'}</p>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfileWorkbench;
