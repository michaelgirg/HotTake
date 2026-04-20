import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppNav from '../components/AppNav';
import TitlePoster from '../components/TitlePoster';
import { get, patch } from '../lib/api';
import { formatRating, formatStatus } from '../lib/format';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMe = !id;
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: '', bio: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    const data = await get(isMe ? '/api/profile/me' : `/api/profile/${id}`);
    setProfile(data);
    setForm({
      displayName: data.user.display_name || '',
      bio: data.user.bio || '',
    });
  }, [id, isMe]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialProfile() {
      try {
        await loadProfile();
      } catch (err) {
        if (ignore) return;
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      }
    }

    loadInitialProfile();

    return () => {
      ignore = true;
    };
  }, [loadProfile, navigate]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await patch('/api/profile/me', form);
      setMessage('Profile updated.');
      await loadProfile();
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    }
  };

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content two-column">
        <section>
          <div className="page-heading">
            <h1>{profile?.user.display_name || profile?.user.username || 'Profile'}</h1>
            {profile?.user.username && <p>@{profile.user.username}</p>}
          </div>
          <p className="profile-bio">{profile?.user.bio || 'No bio yet.'}</p>

          {isMe && (
            <form className="panel-form" onSubmit={saveProfile}>
              <h2>Edit profile</h2>
              <label>
                Display name
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                />
              </label>
              <label>
                Bio
                <textarea
                  rows="5"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
              </label>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message">{error}</p>}
              <button className="btn-primary" type="submit">
                Save profile
              </button>
            </form>
          )}
        </section>

        <section>
          <div className="page-heading">
            <h1>Recent activity</h1>
          </div>
          <div className="activity-list">
            {profile?.activity.map((item) => (
              <article className="activity-card media-card" key={item.log_id}>
                <TitlePoster title={item} size="small" />
                <div>
                  <h2>{item.name}</h2>
                  <p>
                    {formatStatus(item.status)} {item.rating ? `- ${formatRating(item.rating)}/10` : ''}
                  </p>
                  {item.review && <p className="muted">"{item.review}"</p>}
                </div>
              </article>
            ))}
            {profile?.activity.length === 0 && <p className="status-text">No visible activity yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
