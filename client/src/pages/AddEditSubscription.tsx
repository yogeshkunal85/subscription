import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Subscription, SubscriptionFormData } from '../types';
import { getSubscription, createSubscription, updateSubscription } from '../api/subscriptionApi';
import SubscriptionForm from '../components/SubscriptionForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface LocationState {
  returnTo?: string;
  successMessage?: string;
}

const AddEditSubscription: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;

  const returnTo = (location.state as LocationState | null)?.returnTo ?? '/';

  const [existing, setExisting] = useState<Subscription | null>(null);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch existing subscription when editing
  useEffect(() => {
    if (!isEditMode || !id) return;

    const controller = new AbortController();
    setFetchLoading(true);
    setFetchError(null);

    getSubscription(parseInt(id, 10), controller.signal)
      .then((sub) => {
        setExisting(sub);
        setFetchError(null);   // clear any stale error from a prior aborted attempt
        setFetchLoading(false);
      })
      .catch((err: Error) => {
        // CanceledError means AbortController fired — component unmounted or
        // React StrictMode re-ran the effect. Silently ignore.
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setFetchError(err.message);
        setFetchLoading(false);
      });

    return () => controller.abort();
  }, [id, isEditMode]);

  const handleSubmit = async (data: SubscriptionFormData) => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      if (isEditMode && id) {
        await updateSubscription(parseInt(id, 10), data);
        void navigate(returnTo, {
          state: { successMessage: `Subscription "${data.name}" updated successfully.` },
        });
      } else {
        await createSubscription(data);
        void navigate(returnTo, {
          state: { successMessage: `Subscription "${data.name}" added successfully.` },
        });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderContent = () => {
    if (fetchLoading) return <LoadingSpinner size="lg" />;

    if (fetchError) {
      return (
        <ErrorMessage
          message={fetchError}
          onRetry={() => {
            setFetchError(null);
            setFetchLoading(true);
          }}
        />
      );
    }

    return (
      <>
        {submitError && (
          <div className="form-alert form-alert--error" role="alert">
            ⚠ {submitError}
          </div>
        )}
        <SubscriptionForm
          initialData={existing ?? undefined}
          onSubmit={handleSubmit}
          loading={submitLoading}
        />
      </>
    );
  };

  return (
    <div className="page">
      <button
        className="page__back"
        onClick={() => void navigate(returnTo)}
        type="button"
        aria-label="Back to dashboard"
      >
        ← Back to Dashboard
      </button>

      <h1 className="page__title">
        {isEditMode ? 'Edit Subscription' : 'Add Subscription'}
      </h1>

      {renderContent()}
    </div>
  );
};

export default AddEditSubscription;
