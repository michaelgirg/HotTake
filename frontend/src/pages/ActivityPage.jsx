import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { get, post } from '../lib/api';

const STATUSES = ['planning', 'watching', 'reading', 'completed', 'paused', 'dropped'];

export default function ActivityPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [form, setForm] = useState({ status: 'watching', rating: '', review: '' });
  const [activity, setActivity] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMine = async () => {
    const data = await get('/api/activity/mine');
    setActivity(data);
  };

  useEffect(() => {
    loadMine().catch((err) => {
      if (err.status === 401) navigate('/login');
      else setError(err.message);
    });
  }, [navigate]);

  const searchTitles = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const data = await get(`/api/titles/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else setError(err.message);
    }
  };

  const submitActivity = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedTitle) {
      return setError('Choose a title first.');
    }

    try {
      const log = await post('/api/activity/logs', {
        titleId: selectedTitle.id,
        status: form.status,
      });

      if (form.rating) {
        await post('/api/activity/ratings', {
          titleId: selectedTitle.id,
          rating: Number(form.rating),
        });
      }

      if (form.review.trim()) {
        await post('/api/activity/reviews', {
          titleId: selectedTitle.id,
          logId: log.id,
          content: form.review,
        });
      }

      setMessage('Activity saved.');
      setForm({ status: 'watching', rating: '', review: '' });
      await loadMine();
    } catch (err) {
      setError(err.message || 'Could not save activity.');
    }
  };

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content two-column">
        <section>
          <div className="page-heading">
            <h1>Log activity</h1>
            <p>Track progress, ratings, and reviews from one place.</p>
          </div>

          <form className="inline-form" onSubmit={searchTitles}>
            <input
              type="text"
              placeholder="Find a title"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn-primary fit" type="submit">
              Search
            </button>
          </form>

          <div className="compact-list">
            {results.map((title) => (
              <button
                className={`list-button ${selectedTitle?.id === title.id ? 'active' : ''}`}
                key={title.id}
                type="button"
                onClick={() => setSelectedTitle(title)}
              >
                <span>{title.name}</span>
                <small>{title.type}</small>
              </button>
            ))}
          </div>

          <form className="panel-form" onSubmit={submitActivity}>
            <h2>{selectedTitle ? selectedTitle.name : 'Choose a title'}</h2>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rating
              <input
                type="number"
                min="1"
                max="10"
                placeholder="1-10"
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: event.target.value })}
              />
            </label>
            <label>
              Review
              <textarea
                rows="5"
                placeholder="Write a short take"
                value={form.review}
                onChange={(event) => setForm({ ...form, review: event.target.value })}
              />
            </label>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <button className="btn-primary" type="submit">
              Save activity
            </button>
          </form>
        </section>

        <section>
          <div className="page-heading">
            <h1>Recent logs</h1>
          </div>
          <div className="activity-list">
            {activity.map((item) => (
              <article className="activity-card" key={item.log_id}>
                <h2>{item.name}</h2>
                <p>
                  {item.status} {item.rating ? `- ${item.rating}/10` : ''}
                </p>
                {item.review && <p className="muted">"{item.review}"</p>}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
