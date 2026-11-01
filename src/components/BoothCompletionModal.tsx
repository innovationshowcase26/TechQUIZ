import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';

interface BoothCompletionModalProps {
  isOpen: boolean;
  completedCount: number;
  onClose: () => void;
  onViewPassport: () => void;
}

export const BoothCompletionModal: React.FC<BoothCompletionModalProps> = ({
  isOpen,
  completedCount,
  onClose,
  onViewPassport,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      className="app-completion-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-completion-modal-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          boxSizing: 'border-box',
          padding: '28px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top-Right Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="app-modal-close-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            padding: 0,
            color: '#1E293B',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.backgroundColor = '#F8FAFC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#FFFFFF';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Decorative Top-Left Waves */}
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, width: '130px', height: '90px', pointerEvents: 'none' }}
          viewBox="0 0 130 90"
          fill="none"
        >
          <path
            d="M0 0 C40 10, 80 40, 110 80 C80 50, 40 20, 0 35 Z"
            fill="rgba(59, 130, 246, 0.18)"
          />
          <path
            d="M0 0 C50 15, 90 45, 125 90 C95 55, 50 25, 0 45 Z"
            fill="rgba(245, 158, 11, 0.15)"
          />
        </svg>

        {/* Golden Trophy with Confetti Streamers & Stars */}
        <div className="app-completion-trophy" style={{ position: 'relative', width: '110px', height: '80px', marginTop: '2px', marginBottom: '6px' }}>
          {/* Confetti Particles */}
          <span style={{ position: 'absolute', top: '4px', left: '10px', fontSize: '13px' }}>✨</span>
          <span style={{ position: 'absolute', top: '0', right: '12px', fontSize: '14px' }}>⭐</span>
          <span style={{ position: 'absolute', bottom: '26px', left: '2px', fontSize: '12px', transform: 'rotate(-20deg)', color: '#3B82F6' }}>🎉</span>
          <span style={{ position: 'absolute', bottom: '28px', right: '4px', fontSize: '12px', transform: 'rotate(20deg)', color: '#F59E0B' }}>⭐</span>

          {/* Confetti geometric shapes */}
          <svg width="100%" height="100%" viewBox="0 0 110 80" fill="none" style={{ position: 'absolute', inset: 0 }}>
            {/* Confetti rects / ribbons */}
            <rect x="18" y="14" width="7" height="3" rx="1.5" transform="rotate(-35 18 14)" fill="#3B82F6" />
            <rect x="84" y="16" width="7" height="3" rx="1.5" transform="rotate(30 84 16)" fill="#8B5CF6" />
            <rect x="12" y="38" width="6" height="3" rx="1.5" transform="rotate(45 12 38)" fill="#F59E0B" />
            <rect x="90" y="38" width="6" height="3" rx="1.5" transform="rotate(-40 90 38)" fill="#10B981" />
            <rect x="25" y="4" width="5" height="3" rx="1.5" transform="rotate(15 25 4)" fill="#EC4899" />
            <rect x="78" y="6" width="5" height="3" rx="1.5" transform="rotate(-25 78 6)" fill="#F59E0B" />

            {/* Radiating Sparkle Rays Left */}
            <line x1="28" y1="28" x2="36" y2="32" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="20" x2="38" y2="25" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="36" y1="14" x2="42" y2="21" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

            {/* Radiating Sparkle Rays Right */}
            <line x1="82" y1="28" x2="74" y2="32" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="80" y1="20" x2="72" y2="25" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="74" y1="14" x2="68" y2="21" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

            {/* Trophy Cup */}
            <path
              d="M44 20 H66 V35 C66 41 61 46 55 46 C49 46 44 41 44 35 V20 Z"
              fill="url(#trophyCompGrad)"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            {/* Trophy Handles */}
            <path
              d="M44 22 C39 22 37 31 44 33"
              stroke="#F59E0B"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M66 22 C71 22 73 31 66 33"
              stroke="#F59E0B"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Trophy Stem */}
            <rect x="52" y="46" width="6" height="8" fill="#F59E0B" />
            {/* Trophy Pedestal Base */}
            <path d="M47 54 H63 L65 60 H45 L47 54 Z" fill="#D97706" />
            <rect x="43" y="60" width="24" height="5" rx="1.5" fill="#B45309" />
            {/* Center Star on Cup */}
            <polygon
              points="55,27 56.5,30 60,30.5 57.5,33 58,36.5 55,34.5 52,36.5 52.5,33 50,30.5 53.5,30"
              fill="#FFFFFF"
              opacity="0.95"
            />

            <defs>
              <linearGradient id="trophyCompGrad" x1="44" y1="20" x2="66" y2="46" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="0.5" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Headings */}
        <h1
          id="completion-title"
          className="app-completion-title"
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#0A2540',
            margin: '2px 0 4px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          Great Job!
        </h1>

        <div
          className="app-completion-subhead"
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0A2540',
            textAlign: 'center',
            margin: '2px 0',
          }}
        >
          You&apos;ve successfully completed this booth!
        </div>

        <p
          className="app-completion-subtext"
          style={{
            fontSize: '13px',
            color: '#475569',
            fontStyle: 'italic',
            textAlign: 'center',
            margin: '0 0 18px',
            lineHeight: 1.4,
          }}
        >
          Keep going to unlock your chance to win exciting prizes.
        </p>

        {/* 2-Column Progress & Gift Card */}
        <div
          className="app-completion-progress-card"
          style={{
            width: '100%',
            backgroundColor: '#EFF6FF',
            border: '1px solid rgba(191, 219, 254, 0.75)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            boxSizing: 'border-box',
            marginBottom: '20px',
          }}
        >
          {/* Left: Booths Completed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
            <div
              className="app-completion-circle-icon"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="app-completion-stat-val" style={{ fontSize: '24px', fontWeight: 800, color: '#0A2540', lineHeight: 1.1 }}>
                {completedCount} / {TOTAL_BOOTHS}
              </span>
              <span className="app-completion-stat-lbl" style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
                Booths Completed
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: '1px', height: '48px', backgroundColor: '#CBD5E1', margin: '0 6px', flexShrink: 0 }} />

          {/* Right: Gift Eligibility */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
            <div
              className="app-completion-gift-icon"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="8" width="18" height="4" rx="1" fill="#8B5CF6" />
                <path d="M4 12V20C4 20.55 4.45 21 5 21H19C19.55 21 20 20.55 20 20V12H4Z" fill="#7C3AED" />
                <rect x="11" y="8" width="2" height="13" fill="#FDE68A" />
                <path
                  d="M12 8C12 8 11.5 5.5 9 5.5C6.5 5.5 6.5 8 12 8Z"
                  fill="#A78BFA"
                  stroke="#7C3AED"
                  strokeWidth="1.2"
                />
                <path
                  d="M12 8C12 8 12.5 5.5 15 5.5C17.5 5.5 17.5 8 12 8Z"
                  fill="#A78BFA"
                  stroke="#7C3AED"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="app-completion-stat-val" style={{ fontSize: '24px', fontWeight: 800, color: isWinner ? '#059669' : '#0A2540', lineHeight: 1.1 }}>
                {isWinner ? 'Qualified!' : `${remaining} More`}
              </span>
              <span className="app-completion-stat-lbl" style={{ fontSize: '12px', color: isWinner ? '#059669' : '#475569', fontWeight: 500, marginTop: '2px' }}>
                {isWinner ? 'Eligible for Gifts' : 'to be eligible for Gifts'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: View Passport > */}
        <button
          type="button"
          onClick={onViewPassport}
          className="app-modal-primary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 700,
            padding: '13px 44px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.15s ease',
            marginBottom: '16px',
            zIndex: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
          }}
        >
          <span>View Passport</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Tagline: Explore More. Complete More. Win Big! */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
          }}
        >
          <div style={{ height: '1px', width: '36px', backgroundColor: '#CBD5E1' }} />
          <span
            className="app-completion-tagline"
            style={{
              fontSize: '12.5px',
              fontStyle: 'italic',
              color: '#475569',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            Explore More. Complete More. Win Big!
          </span>
          <div style={{ height: '1px', width: '36px', backgroundColor: '#CBD5E1' }} />
        </div>

        {/* Decorative Bottom Corner Wave Ribbon */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            pointerEvents: 'none',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
          }}
          viewBox="0 0 500 24"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 24 C100 12, 200 20, 320 8 C400 0, 460 16, 500 8 L500 24 L0 24 Z"
            fill="rgba(59, 130, 246, 0.18)"
          />
          <path
            d="M0 24 C140 16, 260 22, 360 12 C440 4, 480 18, 500 14 L500 24 L0 24 Z"
            fill="rgba(245, 158, 11, 0.15)"
          />
        </svg>
      </div>
    </div>,
    document.body
  );
};
