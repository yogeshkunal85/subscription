import React, { useState } from 'react';
import type { User } from '../types';
import { createUser } from '../api/userApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

interface ModalErrors {
  name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ModalErrors>({});

  if (!isOpen) return null;

  const reset = () => {
    setName('');
    setEmail('');
    setSubmitError(null);
    setSuccessMessage(null);
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = (): ModalErrors => {
    const errs: ModalErrors = {};
    if (!name || name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!email || !EMAIL_RE.test(email.trim())) errs.email = 'A valid email address is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const user = await createUser(name.trim(), email.trim().toLowerCase());
      setSuccessMessage(`User "${user.name}" created successfully.`);
      window.setTimeout(() => {
        onCreated(user);
        reset();
      }, 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal">
        <div className="modal__header">
          <h3 id="create-user-title" className="modal__title">Create New User</h3>
          <button
            className="modal__close"
            onClick={handleClose}
            type="button"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            {successMessage && (
              <div className="form-alert form-alert--success" role="status">
                ✓ {successMessage}
              </div>
            )}

            {submitError && (
              <div className="form-alert form-alert--error" role="alert">
                ⚠ {submitError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="modal-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="modal-name"
                type="text"
                className={`form-control${errors.name ? ' form-control--error' : ''}`}
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="e.g. Arjun Sharma"
                autoFocus
              />
              {errors.name && <p className="form-field-error">⚠ {errors.name}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="modal-email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="modal-email"
                type="email"
                className={`form-control${errors.email ? ' form-control--error' : ''}`}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="arjun@example.com"
              />
              {errors.email && <p className="form-field-error">⚠ {errors.email}</p>}
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn-dialog-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={loading || !!successMessage}>
              {loading ? 'Creating…' : successMessage ? 'Created!' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
