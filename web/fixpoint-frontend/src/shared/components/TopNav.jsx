import React from 'react';

const TopNav = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  return (
    <nav className="top-nav">
      <div className="nav-logo">
        FIX<span style={{ color: 'var(--text2)' }}>POINT</span>
      </div>
      {isAdmin && (
        <span style={{
          position: 'absolute',
          right: '24px',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '2px',
          color: '#FF4D2D',
          border: '1px solid #FF4D2D',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          ADMIN
        </span>
      )}
    </nav>
  );
};

export default TopNav;