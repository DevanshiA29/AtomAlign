import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../lib/api';

const AdminContext = createContext();

export const useAdminContext = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [windows, setWindows] = useState({ phase1: false, q1: false, q2: false, q3: false, q4: false });
  const [auditLog, setAuditLog] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState([]);
  const [orgHierarchy, setOrgHierarchy] = useState([]);
  const [managerDirectory, setManagerDirectory] = useState([]);
  const [stats, setStats] = useState({ globalSubmissionRate: 0, managerCheckinRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [dashboardRes, hierarchyRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`),
        fetch(`${API_URL}/admin/hierarchy`)
      ]);

      const dashboardData = await dashboardRes.json();
      const hierarchyData = await hierarchyRes.json();

      if (dashboardData.success) {
        setWindows(dashboardData.data.windowStates || { phase1: false, q1: false, q2: false, q3: false, q4: false });
        setAuditLog(dashboardData.data.auditLogs || []);
        setTeamMetrics(dashboardData.data.teams || []);
        setStats(dashboardData.data.stats || { globalSubmissionRate: 0, managerCheckinRate: 0 });
      }

      if (hierarchyData.success) {
        setOrgHierarchy(hierarchyData.data.roots || []);
        setManagerDirectory(hierarchyData.data.managers || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleWindow = async (windowName, active) => {
    try {
      // Optimistic update
      setWindows(prev => ({ ...prev, [windowName]: active }));

      const res = await fetch(`${API_URL}/admin/windows/${windowName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      const data = await res.json();
      
      if (data.success && data.log) {
        setAuditLog(prev => [data.log, ...prev]);
        setWindows(data.windowStates);
      }
    } catch (err) {
      console.error('Error toggling window:', err);
      // Revert on error
      setWindows(prev => ({ ...prev, [windowName]: !active }));
    }
  };

  const forceUnlockUser = async (employeeId) => {
    try {
      const res = await fetch(`${API_URL}/admin/goals/unlock/${employeeId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.log) {
        setAuditLog(prev => [data.log, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error forcing unlock:', err);
      return false;
    }
  };

  const pushGlobalKPI = async (goalData) => {
    try {
      const res = await fetch(`${API_URL}/admin/goals/shared-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      const data = await res.json();
      if (data.success && data.log) {
        setAuditLog(prev => [data.log, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error pushing KPI:', err);
      return false;
    }
  };

  const exportAchievements = () => {
    window.location.href = `${API_URL}/reports/achievements/export`;
  };

  return (
    <AdminContext.Provider value={{
      windows,
      auditLog,
      teamMetrics,
      orgHierarchy,
      managerDirectory,
      stats,
      loading,
      toggleWindow,
      forceUnlockUser,
      pushGlobalKPI,
      exportAchievements
    }}>
      {children}
    </AdminContext.Provider>
  );
};
