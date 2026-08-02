export default function Topbar({ email, menuOpen, onToggleMenu, onUsage, onLogout }) {
  const initials = (email || '?').split('@')[0].slice(0, 2).toUpperCase();
  return (
    <div className="topbar">
      <div className="logo"><div className="dot"></div><span>Pimp My Prompt</span></div>
      <div className="profile-wrap">
        <button className="avatar-btn" onClick={onToggleMenu}>
          <div className="avatar">{initials}</div>
        </button>
        {menuOpen && (
          <div className="profile-menu">
            <div className="pm-email">{email}</div>
            <button className="pm-item" onClick={onUsage}>Usage &amp; alerts</button>
            <button className="pm-item danger" onClick={onLogout}>Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}
