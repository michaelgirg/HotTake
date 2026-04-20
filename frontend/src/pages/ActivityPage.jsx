import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import TitlePoster from '../components/TitlePoster';
import { get, post } from '../lib/api';
import { formatRating, formatStatus } from '../lib/format';

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

  const loadMine = useCallback(async () => {
    const data = await get('/api/activity/mine');
    setActivity(data);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialActivity() {
      try {
        await loadMine();
      } catch (err) {
        if (ignore) return;
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      }
    }

    loadInitialActivity();

    return () => {
      ignore = true;
    };
  }, [loadMine, navigate]);

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

  const chooseTitle = async (title) => {
    setSelectedTitle(title);
    setError('');
    setMessage('');

    try {
      const data = await get(`/api/activity/titles/${title.id}`);
      setForm({
        status: data.status || 'watching',
        rating: data.rating ? String(data.rating) : '',
        review: data.review || '',
      });
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else setError(err.message || 'Could not load saved activity.');
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
      await loadMine();
    } catch (err) {
      setError(err.message || 'Could not save activity.');
    }
  };

  const editActivity = async (item) => {
    setQuery(item.name);
    setResults((current) => {
      const exists = current.some((title) => title.id === item.title_id);
      return exists ? current : [{ ...item, id: item.title_id }, ...current];
    });
    await chooseTitle({ ...item, id: item.title_id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                onClick={() => chooseTitle(title)}
              >
                <TitlePoster title={title} size="small" />
                <span>{title.name}</span>
                <small>{title.format || title.type}</small>
              </button>
            ))}
          </div>

          <form className="panel-form" onSubmit={submitActivity}>
            {selectedTitle && <TitlePoster title={selectedTitle} size="detail" />}
            <h2>{selectedTitle ? selectedTitle.name : 'Choose a title'}</h2>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
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
                step="0.1"
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
              <article className="activity-card media-card" key={item.log_id}>
                <TitlePoster title={item} size="small" />
                <div>
                  <h2>{item.name}</h2>
                  <p>
                    {formatStatus(item.status)} {item.rating ? `- ${formatRating(item.rating)}/10` : ''}
                  </p>
                  {item.review && <p className="muted">"{item.review}"</p>}
                  <button className="text-button" type="button" onClick={() => editActivity(item)}>
                    Edit review
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
