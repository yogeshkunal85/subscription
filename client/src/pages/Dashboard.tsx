import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useDashboardParams from '../hooks/useDashboardParams';
import useSubscriptions from '../hooks/useSubscriptions';
import { deleteSubscription } from '../api/subscriptionApi';
import StatBar from '../components/StatBar';
import SubscriptionTable from '../components/SubscriptionTable';
import Pagination from '../components/Pagination';
import UpcomingReminders from '../components/UpcomingReminders';
import Toast from '../components/Toast';

interface LocationState {
  successMessage?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const {
    page,
    limit,
    status,
    searchInput,
    debouncedSearch,
    setPage,
    setStatus,
    setSearchInput,
    dashboardPath,
  } = useDashboardParams();

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.successMessage) {
      setToast({ message: state.successMessage, variant: 'success' });
      void navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const { subscriptions, loading, error, meta, refetch } = useSubscriptions({
    page,
    limit,
    status: status === 'all' ? undefined : status,
    search: debouncedSearch || undefined,
  });

  const goToForm = (path: string) => {
    void navigate(path, { state: { returnTo: dashboardPath } });
  };

  const handleEdit = (id: number) => {
    goToForm(`/subscriptions/${id}/edit`);
  };

  const handleDelete = (id: number, name: string) => {
    deleteSubscription(id)
      .then(() => {
        refetch();
        setToast({ message: `Subscription "${name}" has been cancelled.`, variant: 'success' });
      })
      .catch((err: Error) =>
        setToast({ message: `Failed to cancel: ${err.message}`, variant: 'error' }),
      );
  };

  return (
    <div className="dashboard">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
      <div className="dashboard__header">
        <h1 className="dashboard__title">Subscription Tracker</h1>
        <button
          className="btn-primary"
          onClick={() => goToForm('/subscriptions/new')}
          type="button"
        >
          + Add Subscription
        </button>
      </div>

      <StatBar subscriptions={subscriptions} />

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <main style={{ flex: 1, minWidth: 0 }}>
          <SubscriptionTable
            subscriptions={subscriptions}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onFilterChange={setStatus}
            onSearchChange={setSearchInput}
            currentStatus={status}
            currentSearch={searchInput}
            onRetry={refetch}
          />
          <Pagination
            currentPage={page}
            totalPages={meta?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </main>

        <aside style={{ width: '300px', flexShrink: 0 }}>
          <UpcomingReminders />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
