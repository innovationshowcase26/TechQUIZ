import { useState } from 'react';
import type { Participant, BoothConfig, BoothResult } from '../types';
import {
  fetchParticipantFromFirestore,
  saveParticipantRegistrationInFirestore,
} from '../services/firebaseService';
import { getBoothIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface ParticipantDetailsProps {
  initialData: Partial<Participant> | null;
  targetBooth?: BoothConfig | null;
  onContinue: (participant: Participant, restoredResults?: Record<string, BoothResult>) => void;
  onBack?: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

function getInitials(nameStr: string): string {
  if (!nameStr.trim()) return 'WF';
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParticipantDetails({
  initialData,
  targetBooth,
  onContinue,
  onBack,
}: ParticipantDetailsProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [phone, setPhone] = useState(
    initialData?.phone ?? initialData?.email ?? (initialData as any)?.entId ?? ''
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const e: FormErrors = {};
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      e.name = 'Please enter your full name.';
    } else if (cleanName.length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      e.phone = 'Please enter your phone number.';
    } else if (digitsOnly.length < 10) {
      e.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    const cleanName = name.trim().replace(/\s+/g, ' ');
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const existing = await fetchParticipantFromFirestore(cleanPhone);
      if (existing.error) {
        console.warn('[Registration] Unable to check existing attendee:', existing.error);
        setSubmitError('We could not check your passport right now. Please check your connection and try again.');
        return;
      }

      const participant: Participant = {
        name: cleanName || existing.participant?.name || '',
        email: cleanPhone,
        phone: cleanPhone,
        role: 'Summit Attendee',
      };

      if (existing.exists) {
        onContinue(participant, existing.boothResults ?? {});
        return;
      }

      const saveRes = await saveParticipantRegistrationInFirestore(participant);
      if (!saveRes.success) {
        console.warn('[Registration] Unable to save attendee:', saveRes.error);
        setSubmitError('We could not save your registration right now. Please check your connection and try again.');
        return;
      }

      onContinue(participant);
    } catch (error) {
      console.warn('[Registration] Attendee registration failed:', error);
      setSubmitError('We could not save your registration right now. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const avatarInitials = getInitials(name);

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Sticky Top Header */}
      <AppStickyHeader
        subtitle="Attendee Registration"
        rightAction={
          <span className="app-tag-pill" style={{ margin: 0 }}>
            PASS 2026
          </span>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body" style={{ padding: '8px 10px 68px', gap: '6px' }}>
        {/* Scanned Target Booth Banner if scanned via QR */}
        {targetBooth && (
          <div
            className="app-card"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'var(--app-primary-light)',
              borderColor: 'rgba(37, 99, 235, 0.25)',
              borderRadius: '10px',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                background: 'var(--app-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getBoothIcon(targetBooth.number, 16)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--app-primary)', textTransform: 'uppercase' }}>
                Scanned Booth #{targetBooth.number}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--app-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {targetBooth.title}
              </div>
            </div>
          </div>
        )}

        {/* Official Summit Pass Preview Card */}
        <section
          className="app-card app-pass-card"
          aria-label="Official Pass Preview"
          style={{ padding: '6px 10px', borderRadius: '10px', gap: 0 }}
        >
          <div className="app-pass-card__header" style={{ gap: '8px' }}>
            <div
              className="app-pass-avatar"
              aria-hidden="true"
              style={{ width: 28, height: 28, fontSize: '11px', flexShrink: 0 }}
            >
              {avatarInitials}
            </div>
            <div className="app-pass-info">
              <span className="app-pass-label" style={{ fontSize: '8.5px', letterSpacing: '0.06em' }}>OFFICIAL SUMMIT PASS</span>
              <h2 className="app-pass-name" style={{ fontSize: '13px', margin: 0, lineHeight: 1.2 }}>{name.trim() || 'Attendee Name'}</h2>
              <span className="app-pass-email" style={{ fontSize: '10.5px' }}>{phone.trim() || '+91 98765 43210'}</span>
            </div>
            <div
              className="app-pass-status-pill"
              style={{ padding: '2px 7px', fontSize: '9px', letterSpacing: '0.04em' }}
            >
              VERIFIED
            </div>
          </div>
        </section>

        {/* Registration Form Card */}
        <section
          className="app-card"
          aria-label="Registration Form"
          style={{ padding: '10px 12px', gap: '6px', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1 className="app-card-title" style={{ fontSize: '15px', lineHeight: '1.2' }}>Attendee Access</h1>
            <p className="app-card-subtitle" style={{ fontSize: '10.5px', lineHeight: '1.35', color: 'var(--app-text-secondary)', margin: 0 }}>
              Enter your name and phone number to join the Technology Showcase Challenge! Explore exciting tech experiences, take on fun challenges across 9 booths, and complete any 4 booths to unlock your chance to win exciting prizes.
            </p>
            <span style={{ fontSize: '10.5px', color: 'var(--app-primary)', fontWeight: 700, letterSpacing: '0.1px', marginTop: '1px' }}>
              Discover. Challenge Yourself. Compete. Win!
            </span>
          </div>

          <form id="app-login-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            {/* Full Name Field */}
            <div className="app-field-group" style={{ gap: '2px' }}>
              <label htmlFor="reg-name" className="app-field-label" style={{ fontSize: '11px', fontWeight: 600 }}>
                Full Name <span style={{ color: 'var(--app-danger)' }}>*</span>
              </label>
              <div className="app-input-wrap">
                <svg className="app-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ left: '10px' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  className={`app-text-input ${errors.name ? 'app-text-input--error' : ''}`}
                  placeholder="e.g. Krishna Sabbu"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoComplete="name"
                  disabled={isSubmitting}
                  autoFocus
                  style={{ height: '35px', padding: '0 10px 0 30px', fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
              {errors.name && <span className="app-field-error-text" style={{ fontSize: '10.5px' }}>{errors.name}</span>}
            </div>

            {/* Phone Number Field */}
            <div className="app-field-group" style={{ gap: '2px' }}>
              <label htmlFor="reg-phone" className="app-field-label" style={{ fontSize: '11px', fontWeight: 600 }}>
                Phone Number <span style={{ color: 'var(--app-danger)' }}>*</span>
              </label>
              <div className="app-input-wrap">
                <svg className="app-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ left: '10px' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  id="reg-phone"
                  type="tel"
                  className={`app-text-input ${errors.phone ? 'app-text-input--error' : ''}`}
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  autoComplete="tel"
                  disabled={isSubmitting}
                  style={{ height: '35px', padding: '0 10px 0 30px', fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
              {errors.phone && <span className="app-field-error-text" style={{ fontSize: '10.5px' }}>{errors.phone}</span>}
            </div>

            {/* Error Message */}
            {submitError && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'var(--app-danger-light)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--app-danger)',
                  fontSize: '11px',
                  lineHeight: '1.3',
                }}
                role="alert"
              >
                {submitError}
              </div>
            )}
          </form>

          {/* Highlights */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginTop: '2px',
            }}
          >
            {/* Highlight 1: Play & Win */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🏆</span>
              <div style={{ fontSize: '10.5px', lineHeight: '1.25' }}>
                <strong style={{ color: '#D97706', fontWeight: 700 }}>Play & Win!</strong>
                <span style={{ color: 'var(--app-text-secondary)', marginLeft: '3px' }}>
                  – Complete challenges and unlock your chance to win exciting Summit prizes.
                </span>
              </div>
            </div>

            {/* Highlight 2: Explore & Experience */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.03) 100%)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🚀</span>
              <div style={{ fontSize: '10.5px', lineHeight: '1.25' }}>
                <strong style={{ color: '#2563EB', fontWeight: 700 }}>Explore & Experience!</strong>
                <span style={{ color: 'var(--app-text-secondary)', marginLeft: '3px' }}>
                  – Discover fun games and exciting challenges across 9 booths.
                </span>
              </div>
            </div>

            {/* Highlight 3: Your Goal: 4 Booths */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>🎯</span>
              <div style={{ fontSize: '10.5px', lineHeight: '1.25' }}>
                <strong style={{ color: '#059669', fontWeight: 700 }}>Your Goal: 4 Booths!</strong>
                <span style={{ color: 'var(--app-text-secondary)', marginLeft: '3px' }}>
                  – Complete any 4 out of 9 booths to qualify for Summit prizes.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Bottom Sticky Action Dock */}
      <footer className="app-bottom-dock" style={{ padding: '8px 12px' }}>
        {onBack && (
          <button
            type="button"
            className="app-dock-btn app-dock-btn--secondary"
            onClick={onBack}
            disabled={isSubmitting}
            style={{ height: '40px', fontSize: '13.5px' }}
          >
            ← Back
          </button>
        )}
        <button
          type="submit"
          form="app-login-form"
          className="app-dock-btn app-dock-btn--primary"
          disabled={isSubmitting}
          style={{ width: onBack ? 'auto' : '100%', height: '40px', fontSize: '13.5px' }}
        >
          {isSubmitting ? (
            'Preparing Passport…'
          ) : targetBooth ? (
            'Start Booth Challenge →'
          ) : (
            'Continue to Passport →'
          )}
        </button>
      </footer>
    </div>
  );
}
