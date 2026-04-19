import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { get } from '../lib/api';

function describeItem(item) {
  if (item.kind === 'rating') return `rated ${item.title_name} ${item.rating}/10`;
  if (item.kind === 'review') return `reviewed ${item.title_name}`;
  return `${item.body} ${item.title_name}`;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/api/feed')
      .then(setItems)
      .catch((err) => {
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      });
  }, [navigate]);

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content">
        <section className="page-heading">
          <h1>Feed</h1>
          <p>Your recent activity and friend activity, newest first.</p>
        </section>

        {error && <p className="error-message">{error}</p>}
        <div className="activity-list">
          {items.map((item) => (
            <article className="activity-card" key={`${item.kind}-${item.id}`}>
              <h2>{item.display_name || item.username}</h2>
              <p>{describeItem(item)}</p>
              {item.kind === 'review' && <p className="muted">"{item.body}"</p>}
              <small>
                {item.type} - {item.genre} - {new Date(item.created_at).toLocaleString()}
              </small>
            </article>
          ))}
          {items.length === 0 && <p className="status-text">No feed activity yet.</p>}
        </div>
      </main>
    </div>
  );
}
