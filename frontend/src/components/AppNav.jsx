import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api';

export default function AppNav() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    get('/api/auth/me')
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const handleLogout = async () => {
    await post('/api/auth/logout', {});
    navigate('/login');
  };

  return (
    <header className="app-nav">
      <Link className="nav-brand" to="/feed">
        HotTake
      </Link>
      <nav>
        <NavLink to="/feed">Feed</NavLink>
        <NavLink to="/search">Search</NavLink>
        <NavLink to="/activity">Activity</NavLink>
        <NavLink to="/friends">Friends</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        {currentUser?.role === 'Admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <button className="btn-secondary" type="button" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}
