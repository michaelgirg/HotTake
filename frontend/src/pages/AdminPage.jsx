import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import TitlePoster from '../components/TitlePoster';
import { del, get, patch } from '../lib/api';
import { formatRating, formatStatus } from '../lib/format';

function describeItem(item) {
  if (item.kind === 'rating') return `Rated ${item.title_name} ${formatRating(item.rating)}/10`;
  if (item.kind === 'review') return `Reviewed ${item.title_name}`;
  return `${formatStatus(item.body)} ${item.title_name}`;
}

function actionLabel(kind) {
  if (kind === 'rating') return 'Remove rating';
  if (kind === 'review') return 'Remove review';
  return 'Remove log';
}

function moderationPath(item) {
  if (item.kind === 'rating') return `/api/admin/moderation/ratings/${item.id}`;
  if (item.kind === 'review') return `/api/admin/moderation/reviews/${item.id}`;
  return `/api/admin/moderation/logs/${item.id}`;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const loadAdminData = useCallback(async () => {
    setError('');
    try {
      const [activity, userList] = await Promise.all([
        get('/api/admin/moderation/activity'),
        get('/api/admin/moderation/users'),
      ]);
      setItems(activity);
      setUsers(userList);
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else if (err.status === 403) setError('Admin access required.');
      else setError(err.message);
    }
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const removeItem = async (item) => {
    const key = `${item.kind}-${item.id}`;
    setBusyKey(key);
    setError('');
    setMessage('');

    try {
      await del(moderationPath(item));
      setItems((current) => current.filter((entry) => `${entry.kind}-${entry.id}` !== key));
      setMessage(`${actionLabel(item).replace('Remove', 'Removed')} for ${item.title_name}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey('');
    }
  };

  const deactivateUser = async (user) => {
    setBusyKey(`user-${user.id}`);
    setError('');
    setMessage('');

    try {
      const updated = await patch(`/api/admin/moderation/users/${user.id}/deactivate`, {});
      setUsers((current) =>
        current.map((entry) =>
          entry.id === updated.id ? { ...entry, is_active: updated.is_active } : entry
        )
      );
      setMessage(`${user.display_name || user.username} was deactivated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content">
        <section className="page-heading">
          <h1>Admin</h1>
          <p>Moderate activity and manage demo users.</p>
        </section>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <div className="two-column admin-layout">
          <section>
            <h2 className="section-title">Recent activity</h2>
            <div className="activity-list">
              {items.map((item) => {
                const key = `${item.kind}-${item.id}`;
                return (
                  <article className="activity-card media-card" key={key}>
                    <TitlePoster title={item} size="small" />
                    <div className="admin-card-body">
                      <h2>{item.display_name || item.username}</h2>
                      <p>{describeItem(item)}</p>
                      {item.kind === 'review' && <p className="muted">"{item.body}"</p>}
                      <small>
                        {item.format || item.type} - {item.genre} -{' '}
                        {new Date(item.created_at).toLocaleString()}
                      </small>
                    </div>
                    <button
                      className="btn-danger fit"
                      type="button"
                      onClick={() => removeItem(item)}
                      disabled={busyKey === key}
                    >
                      {actionLabel(item.kind)}
                    </button>
                  </article>
                );
              })}
              {items.length === 0 && <p className="status-text">No activity to moderate.</p>}
            </div>
          </section>

          <section>
            <h2 className="section-title">Users</h2>
            <div className="compact-list">
              {users.map((user) => (
                <article className="activity-card admin-user-card" key={user.id}>
                  <div>
                    <h2>{user.display_name || user.username}</h2>
                    <p className="muted">@{user.username}</p>
                    <small>
                      {user.email} - {user.role} - {user.is_active ? 'Active' : 'Inactive'}
                    </small>
                  </div>
                  <button
                    className="btn-danger fit"
                    type="button"
                    onClick={() => deactivateUser(user)}
                    disabled={!user.is_active || busyKey === `user-${user.id}`}
                  >
                    {user.is_active ? 'Deactivate' : 'Inactive'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
