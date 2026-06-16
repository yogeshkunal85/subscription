import React from 'react';
import useReminders from '../hooks/useReminders';
import { formatDate, formatCurrency } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const UpcomingReminders: React.FC = () => {
  const { reminders, loading, error, refetch } = useReminders(7);

  const renderContent = () => {
    if (loading) return <LoadingSpinner size="md" />;

    if (error) return <ErrorMessage message={error} onRetry={refetch} />;

    if (reminders.length === 0) {
      return (
        <div className="reminders-empty">
          🎉 No upcoming renewals in the next 7 days
        </div>
      );
    }

    return reminders.map((r) => (
      <div key={r.id} className="reminder-card">
        <div className="reminder-card__name">
          {r.subscription_name ?? `Subscription #${r.subscription_id}`}
        </div>

        <div className="reminder-card__row">
          <span className="reminder-card__label">Renews on</span>
          <span className="reminder-card__value">{formatDate(r.remind_on)}</span>
        </div>

        {r.amount !== undefined && r.currency && (
          <div className="reminder-card__row">
            <span className="reminder-card__label">Amount</span>
            <span className="reminder-card__value">
              {formatCurrency(Number(r.amount), r.currency)}
            </span>
          </div>
        )}

        <div className="reminder-card__row">
          <span className="reminder-card__label">Status</span>
          <span className={`badge badge--${r.status}`}>{r.status}</span>
        </div>

        {r.user_email && (
          <div className="reminder-card__email">✉ {r.user_email}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="reminders-panel">
      <div className="reminders-panel__header">
        <h2 className="reminders-panel__title">Upcoming Renewals</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Next 7 days
        </span>
      </div>
      <div className="reminders-panel__body">{renderContent()}</div>
    </div>
  );
};

export default UpcomingReminders;
