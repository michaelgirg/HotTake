import { Link, NavLink, useNavigate } from 'react-router-dom';
import { post } from '../lib/api';

export default function AppNav() {
  const navigate = useNavigate();

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
      </nav>
      <button className="btn-secondary" type="button" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}
