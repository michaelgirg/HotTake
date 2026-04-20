import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import TitlePoster from '../components/TitlePoster';
import { get, post } from '../lib/api';

function titleFormat(title) {
  return title.format || title.type || 'Anime';
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [externalLoading, setExternalLoading] = useState(false);
  const [importingId, setImportingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setExternalResults([]);
      setSelected(null);
      setMessage('');
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      setMessage('');
      setSelected(null);
      try {
        const data = await get(`/api/titles/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (err) {
        if (err.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [navigate, query]);

  const searchJikan = async () => {
    if (!query.trim()) return;

    setExternalLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await get(`/api/titles/external/search?q=${encodeURIComponent(query)}`);
      setExternalResults(data);
      if (data.length === 0) setMessage('No anime found from Jikan.');
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else setError(err.message || 'Could not search Jikan.');
    } finally {
      setExternalLoading(false);
    }
  };

  const importAnime = async (anime) => {
    setImportingId(anime.external_id);
    setError('');
    setMessage('');

    try {
      const imported = await post('/api/titles/import', {
        externalSource: anime.external_source,
        externalId: anime.external_id,
      });
      setResults((current) => {
        const exists = current.some((title) => title.id === imported.id);
        return exists ? current : [imported, ...current];
      });
      setSelected(imported);
      setMessage(`${imported.name} was added to HotTake.`);
    } catch (err) {
      setError(err.message || 'Could not import anime.');
    } finally {
      setImportingId('');
    }
  };

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content">
        <section className="page-heading">
          <h1>Search anime</h1>
          <p>Find anime already in HotTake or import a new title from Jikan.</p>
        </section>

        <div className="inline-form">
          <input
            type="text"
            placeholder="Search anime, movies, OVA, ONA..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
          />
          <button className="btn-primary fit" type="button" onClick={searchJikan} disabled={externalLoading}>
            {externalLoading ? 'Searching...' : 'Search Jikan'}
          </button>
        </div>

        {loading && <p className="status-text">Searching HotTake...</p>}
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="search-layout">
          <section>
            <h2 className="section-title">HotTake titles</h2>
            {results.length > 0 ? (
              <ul className="results-list">
                {results.map((title) => (
                  <li
                    key={title.id}
                    className={`result-item with-poster ${selected?.id === title.id ? 'active' : ''}`}
                    onClick={() => setSelected(title)}
                  >
                    <TitlePoster title={title} size="small" />
                    <span className="result-name">{title.name}</span>
                    <span className="result-type">{titleFormat(title)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              !loading &&
              query && <p className="status-text">No local results. Try Search Jikan to import one.</p>
            )}

            {externalResults.length > 0 && (
              <>
                <h2 className="section-title">From Jikan</h2>
                <div className="external-grid">
                  {externalResults.map((anime) => (
                    <article className="external-card" key={anime.external_id}>
                      <TitlePoster title={anime} size="large" />
                      <div>
                        <h3>{anime.name}</h3>
                        <p>
                          {anime.format || 'Anime'} {anime.release_year ? `- ${anime.release_year}` : ''}
                        </p>
                        <p className="muted line-clamp">{anime.synopsis || 'No synopsis available.'}</p>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => importAnime(anime)}
                          disabled={importingId === anime.external_id}
                        >
                          {importingId === anime.external_id ? 'Importing...' : 'Import'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          {selected && (
            <aside className="title-detail">
              <TitlePoster title={selected} size="detail" />
              <h2>{selected.name}</h2>
              <div className="detail-row">
                <span className="detail-label">Format</span>
                <span className="detail-value">{titleFormat(selected)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Genre</span>
                <span className="detail-value">{selected.genre}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Released</span>
                <span className="detail-value">{selected.release_year || 'Unknown'}</span>
              </div>
              {selected.score && (
                <div className="detail-row">
                  <span className="detail-label">MAL Score</span>
                  <span className="detail-value">{selected.score}</span>
                </div>
              )}
              {selected.synopsis && <p className="muted detail-copy">{selected.synopsis}</p>}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
