import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BoothConfig } from '../types';

interface GameRulesModalProps {
  isOpen: boolean;
  booth: BoothConfig | null;
  onClose: () => void;
  onPlay: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  isOpen,
  booth,
  onClose,
  onPlay,
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-rules-title"
      aria-label={`Game rules for ${booth?.title || 'challenge'}`}
      className="app-rules-modal-overlay"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-rules-modal-card"
      >
        {/* Top-Right Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rules"
          className="app-modal-close-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Decorative Top Skyline & Corner Swoosh */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '110px',
            pointerEvents: 'none',
            overflow: 'hidden',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
        >
          {/* Top-Left Blue Swoosh */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '130px', height: '90px' }}
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

          {/* Top-Right Skyline Art */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '180px',
              height: '80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              padding: '10px 46px 0 0',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748B',
                lineHeight: '1.25',
                textAlign: 'right',
                letterSpacing: '0.02em',
              }}
            >
              Smarter Solutions.<br />
              Brighter Future.
            </span>
            {/* Skyline Buildings Silhouette */}
            <svg width="150" height="42" viewBox="0 0 150 42" fill="none" style={{ marginTop: '2px', opacity: 0.85 }}>
              <rect x="15" y="16" width="12" height="26" fill="#CBD5E1" rx="1" />
              <rect x="30" y="8" width="14" height="34" fill="#94A3B8" rx="1" />
              <rect x="47" y="14" width="10" height="28" fill="#CBD5E1" rx="1" />
              <rect x="60" y="2" width="18" height="40" fill="#3B82F6" opacity="0.6" rx="2" />
              <rect x="81" y="10" width="15" height="32" fill="#F59E0B" opacity="0.65" rx="1" />
              <rect x="99" y="18" width="12" height="24" fill="#94A3B8" rx="1" />
              <rect x="114" y="6" width="16" height="36" fill="#64748B" rx="1" />
              <rect x="133" y="15" width="14" height="27" fill="#CBD5E1" rx="1" />
            </svg>
          </div>
        </div>

        {/* Golden Trophy Illustration with Sparkle Rays */}
        <div style={{ position: 'relative', marginTop: '2px', marginBottom: '4px' }}>
          <svg width="76" height="66" viewBox="0 0 76 66" fill="none">
            {/* Radiating Sunshine Rays (Left) */}
            <line x1="8" y1="20" x2="18" y2="24" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="11" x2="20" y2="17" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="4" x2="24" y2="12" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

            {/* Radiating Sunshine Rays (Right) */}
            <line x1="68" y1="20" x2="58" y2="24" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="11" x2="56" y2="17" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="4" x2="52" y2="12" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

            {/* Trophy Cup */}
            <path
              d="M26 12 H50 V28 C50 35 44 41 38 41 C32 41 26 35 26 28 V12 Z"
              fill="url(#trophyGrad)"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            {/* Trophy Handles */}
            <path
              d="M26 15 C20 15 18 25 26 27"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M50 15 C56 15 58 25 50 27"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Trophy Stem */}
            <rect x="35" y="41" width="6" height="8" fill="#F59E0B" />
            {/* Trophy Pedestal Base */}
            <path d="M29 49 H47 L49 55 H27 L29 49 Z" fill="#D97706" />
            <rect x="25" y="55" width="26" height="5" rx="1.5" fill="#B45309" />
            {/* Center Star on Cup */}
            <polygon
              points="38,20 39.5,23.5 43,24 40.5,26.5 41,30 38,28 35,30 35.5,26.5 33,24 36.5,23.5"
              fill="#FFFFFF"
              opacity="0.95"
            />

            <defs>
              <linearGradient id="trophyGrad" x1="26" y1="12" x2="50" y2="41" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="0.5" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h1
          id="game-rules-title"
          className="app-rules-title"
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0A2540',
            margin: '2px 0 4px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          Game Rules
        </h1>
        <p
          className="app-rules-subtitle"
          style={{
            fontSize: '13.5px',
            fontWeight: 500,
            color: '#334155',
            margin: '0 0 16px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Get ready for an exciting Technology Showcase Challenge!
        </p>

        {/* Formula Section: 3 MCQs + 2 Games = 90 Seconds */}
        <div
          className="app-rules-formula-row"
        >
          {/* Card 1: 3 MCQs */}
          <div
            className="app-rules-formula-card"
            style={{
              backgroundColor: '#EBF5FF',
              border: '1px solid rgba(191, 219, 254, 0.7)',
            }}
          >
            {/* MCQ Icon: Chat Bubble with Question Mark */}
            <div
              className="app-rules-formula-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                marginBottom: '6px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M12 8v3" />
                <path d="M12 14h.01" />
              </svg>
            </div>
            <span className="app-rules-formula-val" style={{ fontSize: '17px', fontWeight: 800, color: '#0A2540', lineHeight: 1.2 }}>
              3 MCQs
            </span>
            <span className="app-rules-formula-desc" style={{ fontSize: '11px', color: '#475569', marginTop: '3px', lineHeight: 1.25 }}>
              Test your knowledge with 3 multiple choice questions.
            </span>
          </div>

          {/* Plus Sign */}
          <span className="app-rules-operator" style={{ fontSize: '20px', fontWeight: 800, color: '#0A2540', flexShrink: 0 }}>
            +
          </span>

          {/* Card 2: 2 Games */}
          <div
            className="app-rules-formula-card"
            style={{
              backgroundColor: '#F3E8FF',
              border: '1px solid rgba(233, 213, 255, 0.7)',
            }}
          >
            {/* Game Controller Icon */}
            <div
              className="app-rules-formula-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                marginBottom: '6px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" />
                <line x1="18" y1="11" x2="18.01" y2="11" />
                <rect x="2" y="6" width="20" height="12" rx="6" />
              </svg>
            </div>
            <span className="app-rules-formula-val" style={{ fontSize: '17px', fontWeight: 800, color: '#0A2540', lineHeight: 1.2 }}>
              2 Games
            </span>
            <span className="app-rules-formula-desc" style={{ fontSize: '11px', color: '#475569', marginTop: '3px', lineHeight: 1.25 }}>
              Enjoy 2 fun &amp; engaging games.
            </span>
          </div>

          {/* Equals Sign */}
          <span className="app-rules-operator" style={{ fontSize: '20px', fontWeight: 800, color: '#0A2540', flexShrink: 0 }}>
            =
          </span>

          {/* Card 3: 90 Seconds */}
          <div
            className="app-rules-formula-card"
            style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid rgba(253, 230, 138, 0.7)',
            }}
          >
            <div>
              {/* Timer Stopwatch Icon */}
              <div
                className="app-rules-formula-icon"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  margin: '0 auto 6px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="14" r="8" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="14" x2="15" y2="11" />
                </svg>
              </div>
              <span className="app-rules-formula-val" style={{ fontSize: '17px', fontWeight: 800, color: '#0A2540', lineHeight: 1.2 }}>
                90 Seconds
              </span>
              <span className="app-rules-formula-desc" style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px', lineHeight: 1.2, display: 'block' }}>
                Total time for all questions.
              </span>
            </div>
            {/* Pill Badge */}
            <span
              className="app-rules-badge-pill"
              style={{
                backgroundColor: '#FDE68A',
                color: '#92400E',
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '999px',
                marginTop: '4px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              + 30 Seconds for each Game
            </span>
          </div>
        </div>

        {/* Section Divider: Points Pill */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            textAlign: 'center',
            margin: '4px 0 10px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              borderTop: '1px solid #E2E8F0',
              zIndex: 1,
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 2,
              backgroundColor: '#E0F2FE',
              color: '#1D4ED8',
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '2px 14px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Points
          </span>
        </div>

        {/* Points Banner Card */}
        <div
          className="app-rules-points-banner"
          style={{
            width: '100%',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '14px',
            padding: '10px 14px',
            textAlign: 'center',
            boxSizing: 'border-box',
            marginBottom: '14px',
          }}
        >
          <div
            className="app-rules-points-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '15px',
              fontWeight: 800,
              color: '#0A2540',
            }}
          >
            <span style={{ fontSize: '18px' }}>⭐</span>
            <span>Each Question is Worth 1 Point!</span>
          </div>
          <div
            className="app-rules-points-sub"
            style={{
              fontSize: '11.5px',
              color: '#475569',
              fontStyle: 'italic',
              marginTop: '2px',
            }}
          >
            Answer correctly and make the most of your time.
          </div>
        </div>

        {/* 3 Pillars / Value Columns */}
        <div
          className="app-rules-pillars-row"
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '18px',
          }}
        >
          {/* Pillar 1: Play Smart */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 6px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>🚀</span>
            <span className="app-rules-pillar-title" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A2540' }}>
              Play Smart
            </span>
            <span className="app-rules-pillar-sub" style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748B', marginTop: '1px' }}>
              Be quick and accurate
            </span>
          </div>

          <div style={{ width: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

          {/* Pillar 2: Complete the Challenge */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 6px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>🏆</span>
            <span className="app-rules-pillar-title" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A2540' }}>
              Complete the Challenge
            </span>
            <span className="app-rules-pillar-sub" style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748B', marginTop: '1px' }}>
              Answer all questions
            </span>
          </div>

          <div style={{ width: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

          {/* Pillar 3: Win Exciting Prizes */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 6px',
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>🎁</span>
            <span className="app-rules-pillar-title" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A2540' }}>
              Win Exciting Prizes
            </span>
            <span className="app-rules-pillar-sub" style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748B', marginTop: '1px' }}>
              Complete any 4 booths
            </span>
          </div>
        </div>

        {/* Action Button: Let's Play! > */}
        <button
          type="button"
          onClick={onPlay}
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
            padding: '12px 38px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.15s ease',
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
          <span>Let&apos;s Play!</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

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
