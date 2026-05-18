import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

const AdminContext = createContext(null);

const INITIAL_SNAPSHOT = {
  roleScope: {
    title: 'HR Admin',
    subtitle: 'ADMIN - Human Resources'
  },
  dashboard: {
    metrics: [],
    completionRows: [],
    escalations: []
  },
  users: [],
  cycles: [],
  reports: [],
  auditLogs: [],
  analytics: {
    progressRows: [],
    goalDistribution: [],
    qoqTrend: [],
    managerEffectiveness: []
  }
};

export const useAdminContext = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let eventSource;

    const loadSnapshot = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/portal`);
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Unable to load admin portal.');
        }

        if (isMounted) {
          setSnapshot(payload.data);
          setError('');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSnapshot();

    try {
      eventSource = new EventSource(`${API_URL}/admin/stream`);
      eventSource.addEventListener('snapshot', (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        setSnapshot(data);
        setError('');
        setLoading(false);
      });
      eventSource.addEventListener('error', () => {
        if (!isMounted) return;
        setError((current) => current || 'Live updates disconnected. Actions still work with manual refresh.');
      });
    } catch (streamError) {
      setError(streamError.message);
    }

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, []);

  const runAction = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, options);
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Action failed.');
    }

    if (payload.data) {
      setSnapshot(payload.data);
    }

    setError('');
    return payload.data;
  };

  const downloadCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/achievements/export`);
      if (!response.ok) {
        throw new Error('Unable to download CSV.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      link.href = blobUrl;
      link.download = fileNameMatch?.[1] || 'atomquest-admin-reports.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setError('');
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download CSV.');
      throw downloadError;
    }
  };

  const value = useMemo(() => ({
    snapshot,
    loading,
    error,
    resetDemo: () => runAction('/admin/reset-demo', { method: 'POST' }),
    addUser: (user) =>
      runAction('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }),
    toggleCycle: (cycleId) =>
      runAction(`/admin/cycles/${cycleId}`, {
        method: 'PATCH'
      }),
    unlockEmployee: (employeeId) =>
      runAction(`/admin/reports/${employeeId}/unlock`, {
        method: 'PATCH'
      }),
    downloadCsv
  }), [snapshot, loading, error]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
