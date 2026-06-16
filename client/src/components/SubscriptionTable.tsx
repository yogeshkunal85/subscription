import React, { useState } from 'react';
import type { Subscription, SubscriptionStatus } from '../types';
import { formatDate, formatCurrency } from '../utils';
import ErrorMessage from './ErrorMessage';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number, name: string) => void;
  onEdit: (id: number) => void;
  onFilterChange: (status: SubscriptionStatus | 'all') => void;
  onSearchChange: (search: string) => void;
  currentStatus: SubscriptionStatus | 'all';
  currentSearch: string;
  onRetry?: () => void;
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}

const SKELETON_ROWS = 5;

const SubscriptionTable: React.FC<Props> = ({
  subscriptions,
  loading,
  error,
  onDelete,
  onEdit,
  onFilterChange,
  onSearchChange,
  currentStatus,
  currentSearch,
  onRetry,
}) => {
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  const handleCancelClick = (id: number, name: string) => setConfirmTarget({ id, name });

  const handleConfirm = () => {
    if (confirmTarget !== null) {
      onDelete(confirmTarget.id, confirmTarget.name);
      setConfirmTarget(null);
    }
  };

  const handleCancelDialog = () => setConfirmTarget(null);

  const renderBody = () => {
    if (error) {
      return (
        <tr>
          <td colSpan={6} style={{ padding: '1.5rem' }}>
            <ErrorMessage message={error} onRetry={onRetry} />
          </td>
        </tr>
      );
    }

    if (loading) {
      return Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="skeleton-td">
              <span className="skeleton" style={{ width: j === 5 ? '80px' : '100%', height: '14px' }} />
            </td>
          ))}
        </tr>
      ));
    }

    if (subscriptions.length === 0) {
      return (
        <tr>
          <td colSpan={6}>
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <p className="empty-state__text">No subscriptions found</p>
            </div>
          </td>
        </tr>
      );
    }

    return subscriptions.map((sub) => (
      <tr key={sub.id}>
        <td className="data-table__name">{sub.name}</td>
        <td className="data-table__amount">
          {formatCurrency(Number(sub.amount), sub.currency)}
        </td>
        <td>{sub.billing_cycle}</td>
        <td>{formatDate(sub.next_renewal_date)}</td>
        <td>
          <StatusBadge status={sub.status} />
        </td>
        <td>
          <div className="table-actions">
            <button
              className="btn-edit"
              onClick={() => onEdit(sub.id)}
              type="button"
              disabled={sub.status !== 'active'}
              title="Edit subscription"
            >
              Edit
            </button>
            <button
              className="btn-cancel-row"
              onClick={() => handleCancelClick(sub.id, sub.name)}
              type="button"
              disabled={sub.status !== 'active'}
              title="Cancel subscription"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <div className="table-container">
        <div className="filter-bar">
          <input
            className="filter-bar__search"
            type="text"
            placeholder="Search by name…"
            value={currentSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            aria-label="Search subscriptions"
          />
          <select
            className="filter-bar__select"
            value={currentStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onFilterChange(e.target.value as SubscriptionStatus | 'all')
            }
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <table className="data-table" aria-label="Subscriptions">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Cycle</th>
              <th>Next Renewal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmTarget !== null}
        title="Cancel subscription?"
        message={
          confirmTarget
            ? `Are you sure you want to cancel "${confirmTarget.name}"? The record will be kept but marked as cancelled.`
            : ''
        }
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Active"
        onConfirm={handleConfirm}
        onCancel={handleCancelDialog}
      />
    </>
  );
};

export default SubscriptionTable;
