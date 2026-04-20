import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { get, post } from '../lib/api';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadFriends = useCallback(async () => {
    const [friendData, requestData] = await Promise.all([
      get('/api/friends'),
      get('/api/friends/requests'),
    ]);
    setFriends(friendData);
    setRequests(requestData);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialFriends() {
      try {
        await loadFriends();
      } catch (err) {
        if (ignore) return;
        if (err.status === 401) navigate('/login');
        else setError(err.message);
      }
    }

    loadInitialFriends();

    return () => {
      ignore = true;
    };
  }, [loadFriends, navigate]);

  const sendRequest = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await post('/api/friends/requests', { username });
      setUsername('');
      setMessage('Friend request sent.');
      await loadFriends();
    } catch (err) {
      setError(err.message || 'Could not send request.');
    }
  };

  const respond = async (id, action) => {
    setError('');
    setMessage('');

    try {
      await post(`/api/friends/requests/${id}/respond`, { action });
      setMessage(`Request ${action === 'accept' ? 'accepted' : 'declined'}.`);
      await loadFriends();
    } catch (err) {
      setError(err.message || 'Could not update request.');
    }
  };

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content two-column">
        <section>
          <div className="page-heading">
            <h1>Friends</h1>
            <p>Add friends and see their activity in your feed.</p>
          </div>
          <form className="inline-form" onSubmit={sendRequest}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <button className="btn-primary fit" type="submit">
              Add
            </button>
          </form>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          <div className="activity-list">
            {friends.map((friend) => (
              <article className="activity-card" key={friend.id}>
                <h2>{friend.display_name || friend.username}</h2>
                <p className="muted">@{friend.username}</p>
                <Link to={`/profile/${friend.id}`}>View profile</Link>
              </article>
            ))}
            {friends.length === 0 && <p className="status-text">No friends yet.</p>}
          </div>
        </section>

        <section>
          <div className="page-heading">
            <h1>Requests</h1>
          </div>
          <div className="activity-list">
            {requests.map((request) => (
              <article className="activity-card" key={request.id}>
                <h2>{request.display_name || request.username}</h2>
                <p className="muted">@{request.username}</p>
                <div className="button-row">
                  <button className="btn-primary fit" type="button" onClick={() => respond(request.id, 'accept')}>
                    Accept
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => respond(request.id, 'decline')}>
                    Decline
                  </button>
                </div>
              </article>
            ))}
            {requests.length === 0 && <p className="status-text">No pending requests.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
