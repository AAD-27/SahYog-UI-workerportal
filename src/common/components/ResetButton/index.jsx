import React, { useState } from 'react';

/**
 * ResetButton Component
 * Resets form to either:
 * - Original state (if data exists from initialize)
 * - Empty state (if new record)
 */
function ResetButton({ 
  form, 
  initialData, 
  initialState, 
  onReset, 
  disabled = false,
  className = ''
}) {
  const [confirming, setConfirming] = useState(false);

  const hasModifications = () => {
    if (!initialData || Object.keys(initialData).length === 0) {
      return true; // New record - show reset as active
    }
    // Check if any field has been modified from initial data
    return JSON.stringify(form) !== JSON.stringify(initialData);
  };

  const handleReset = () => {
    setConfirming(false);
    if (initialData && Object.keys(initialData).length > 0) {
      // Revert to initial data (maintain flow)
      onReset(initialData);
    } else {
      // Reset to empty state (new record)
      onReset(initialState);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className={`secondary-button ${className}`}
        onClick={() => setConfirming(true)}
        disabled={disabled || !hasModifications()}
        title={!hasModifications() ? 'No changes to reset' : 'Reset form to original state'}
      >
        ↺ Reset
      </button>

      {confirming && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: 260,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {initialData && Object.keys(initialData).length > 0
              ? 'Revert to original values?'
              : 'Clear all fields?'}
          </div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#475569' }}>
            {initialData && Object.keys(initialData).length > 0
              ? 'Changes will be discarded and values restored to the last saved state.'
              : 'All entered data will be cleared.'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirming(false)}
              style={{ fontSize: 12, padding: '10px 14px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleReset}
              style={{ fontSize: 12, padding: '10px 14px', background: '#dc2626' }}
              onMouseEnter={(e) => (e.target.style.background = '#b91c1c')}
              onMouseLeave={(e) => (e.target.style.background = '#dc2626')}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ResetButton;
