import React, { useState } from 'react';
import type { Subscription, SubscriptionFormData, FormErrors, User } from '../types';
import { toDateInputValue } from '../utils';
import { isValidSubscriptionName, SUBSCRIPTION_NAME_MESSAGE } from '../utils/validation';
import useUsers from '../hooks/useUsers';
import CreateUserModal from './CreateUserModal';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  initialData?: Subscription;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  loading: boolean;
}

const EMPTY_FORM: SubscriptionFormData = {
  user_id: '',
  name: '',
  amount: '',
  currency: 'INR',
  billing_cycle: '',
  next_renewal_date: '',
};

function fromSubscription(sub: Subscription): SubscriptionFormData {
  return {
    user_id: sub.user_id,
    name: sub.name,
    amount: Number(sub.amount),
    currency: sub.currency,
    billing_cycle: sub.billing_cycle,
    next_renewal_date: toDateInputValue(sub.next_renewal_date),
  };
}

function validateForm(data: SubscriptionFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.user_id || Number(data.user_id) <= 0) {
    errors.user_id = 'Please select a user';
  }
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (!isValidSubscriptionName(data.name)) {
    errors.name = SUBSCRIPTION_NAME_MESSAGE;
  }
  if (data.amount === '' || Number(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  if (!data.currency) {
    errors.currency = 'Currency is required';
  }
  if (!data.billing_cycle) {
    errors.billing_cycle = 'Billing cycle is required';
  }
  if (!data.next_renewal_date) {
    errors.next_renewal_date = 'Renewal date is required';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(data.next_renewal_date + 'T00:00:00');
    if (selected < today) {
      errors.next_renewal_date = 'Renewal date must be today or in the future';
    }
  }

  return errors;
}

const SubscriptionForm: React.FC<Props> = ({ initialData, onSubmit, loading }) => {
  const [form, setForm] = useState<SubscriptionFormData>(
    initialData ? fromSubscription(initialData) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch existing users; extra holds users created during this session
  const { users: fetchedUsers, loading: usersLoading, error: usersError } = useUsers();
  const [extraUsers, setExtraUsers] = useState<User[]>([]);
  const allUsers = [...fetchedUsers, ...extraUsers];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleUserCreated = (user: User) => {
    setExtraUsers((prev) => [...prev, user]);
    setForm((prev) => ({ ...prev, user_id: user.id }));
    if (errors.user_id) setErrors((prev) => ({ ...prev, user_id: undefined }));
    setShowUserModal(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    await onSubmit({
      ...form,
      name: form.name.trim(),
    });
  };

  const fieldClass = (field: keyof FormErrors) =>
    `form-control${errors[field] ? ' form-control--error' : ''}`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-card">
          <div className="form-grid">

            {/* ── User selector ───────────────────────────────── */}
            <div className="form-group form-group--full">
              <label htmlFor="user_id">
                User <span className="required">*</span>
              </label>
              <div className="user-select-row">
                {usersLoading ? (
                  <div className="user-select-loading">
                    <LoadingSpinner size="sm" />
                    <span>Loading users…</span>
                  </div>
                ) : (
                  <select
                    id="user_id"
                    name="user_id"
                    className={fieldClass('user_id')}
                    value={form.user_id}
                    onChange={handleChange}
                  >
                    <option value="">— Select a user —</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className="btn-new-user"
                  onClick={() => setShowUserModal(true)}
                  title="Create a new user"
                >
                  + New User
                </button>
              </div>
              {usersError && (
                <p className="form-field-error">⚠ Could not load users — {usersError}</p>
              )}
              {errors.user_id && <p className="form-field-error">⚠ {errors.user_id}</p>}
            </div>

            {/* ── Subscription Name ────────────────────────────── */}
            <div className="form-group form-group--full">
              <label htmlFor="name">
                Subscription Name <span className="required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={fieldClass('name')}
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Netflix"
              />
              {errors.name && <p className="form-field-error">⚠ {errors.name}</p>}
            </div>

            {/* ── Amount ──────────────────────────────────────── */}
            <div className="form-group">
              <label htmlFor="amount">
                Amount <span className="required">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                className={fieldClass('amount')}
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.amount && <p className="form-field-error">⚠ {errors.amount}</p>}
            </div>

            {/* ── Currency ────────────────────────────────────── */}
            <div className="form-group">
              <label htmlFor="currency">
                Currency <span className="required">*</span>
              </label>
              <select
                id="currency"
                name="currency"
                className={fieldClass('currency')}
                value={form.currency}
                onChange={handleChange}
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
              {errors.currency && <p className="form-field-error">⚠ {errors.currency}</p>}
            </div>

            {/* ── Billing Cycle ───────────────────────────────── */}
            <div className="form-group">
              <label htmlFor="billing_cycle">
                Billing Cycle <span className="required">*</span>
              </label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                className={fieldClass('billing_cycle')}
                value={form.billing_cycle}
                onChange={handleChange}
              >
                <option value="">— Select cycle —</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
              {errors.billing_cycle && (
                <p className="form-field-error">⚠ {errors.billing_cycle}</p>
              )}
            </div>

            {/* ── Next Renewal Date ───────────────────────────── */}
            <div className="form-group">
              <label htmlFor="next_renewal_date">
                Next Renewal Date <span className="required">*</span>
              </label>
              <input
                id="next_renewal_date"
                name="next_renewal_date"
                type="date"
                className={fieldClass('next_renewal_date')}
                value={form.next_renewal_date}
                onChange={handleChange}
              />
              {errors.next_renewal_date && (
                <p className="form-field-error">⚠ {errors.next_renewal_date}</p>
              )}
            </div>

          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving…' : initialData ? 'Update Subscription' : 'Add Subscription'}
            </button>
          </div>
        </div>
      </form>

      <CreateUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onCreated={handleUserCreated}
      />
    </>
  );
};

export default SubscriptionForm;
