import { useEffect, useState } from 'react';
import { initApp } from './js/utilities.js';
import Preferences from './components/preferences.jsx';
import UserSettings from './components/user-settings.jsx';
import Results from './components/results.jsx';

function App() {
  const [preferences, setPreferences] = useState({
    usersCount: 0,
    duration: 0,
  });
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);

  function hasPreferences() {
    const { usersCount, duration } = preferences;
    return usersCount > 0 && duration > 0;
  }

  function resetHandler() {
    setPreferences({ usersCount: 0, duration: 0 });
    setUsers([]);
    setMovies([]);
  }

  useEffect(() => {
    const init = async () => {
      await initApp();
    };
    init();
  }, []);

  return (
    <div className={'app-container'}>
      {movies.length > 0 ? (
        <Results movies={movies} resetHandler={resetHandler} />
      ) : (
        <>
          <header>
            <img src="/logo.png" alt="PopChoice Logo" width={99} height={108} />
            <h1>PopChoice</h1>
          </header>
          {hasPreferences() ? (
            <UserSettings
              users={users}
              setUsers={setUsers}
              preferences={preferences}
              setMovies={setMovies}
            />
          ) : (
            <Preferences setPreferences={setPreferences} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
