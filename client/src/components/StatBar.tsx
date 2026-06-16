import React from 'react';
import type { Subscription } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  subscriptions: Subscription[];
}

const StatBar: React.FC<Props> = ({ subscriptions }) => {
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;

  const monthlySpend = subscriptions
    .filter((s) => s.status === 'active' && s.billing_cycle === 'monthly')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const yearlySpend = subscriptions
    .filter((s) => s.status === 'active' && s.billing_cycle === 'yearly')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  // Use INR as display currency — in a real app this would be per-user preference
  const displayCurrency = 'INR';

  return (
    <div className="stat-bar">
      <div className="stat-card">
        <div className="stat-card__label">Active Subscriptions</div>
        <div className="stat-card__value stat-card__value--lg">{activeCount}</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Monthly Spend</div>
        <div className="stat-card__value stat-card__value--md">
          {formatCurrency(monthlySpend, displayCurrency)}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Yearly Spend</div>
        <div className="stat-card__value stat-card__value--md">
          {formatCurrency(yearlySpend, displayCurrency)}
        </div>
      </div>
    </div>
  );
};

export default StatBar;
