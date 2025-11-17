import { useEffect, useRef, useState } from 'react';
import {
  getMovies,
  initApp,
  retrieveMatches,
  retrieveMoviePoster,
  retrieveQueryEmbedding,
} from './js/utilities.js';

function App() {
  const [preferences, setPreferences] = useState({ usersCount: 0, time: '' });
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);

  function hasPreferences() {
    return preferences.usersCount > 0 && preferences.time.trim() !== '';
  }

  function resetHandler() {
    setPreferences({ usersCount: 0, time: '' });
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

function Preferences({ setPreferences }) {
  const [disabled, setDisabled] = useState(true);

  return (
    <form className="form" onInput={inputHandler} onSubmit={submitHandler}>
      <div className="form-group">
        <p>How many people are going to watch the movie?</p>
        <Spinner
          label="Users"
          id="users-count"
          name="usersCount"
          min={1}
          max={5}
          step={1}
          value={1}
          required={true}
        />
      </div>
      <div className="form-group">
        <p>How much time do you have?</p>
        <div className="form-row">
          <Spinner
            label="Hours"
            id="hours"
            name="hours"
            min={1}
            max={120}
            step={15}
            value={15}
            required={true}
          />{' '}
          <Spinner
            label="Minutes"
            id="minutes"
            name="minutes"
            min={1}
            max={120}
            step={15}
            value={15}
            required={true}
          />
        </div>
        {/*<label htmlFor="time">How much time do you have?</label>{' '}
        <input
          type="text"
          id="time"
          name="time"
          placeholder="2 hours 30 minutes"
          required
          aria-required="true"
        />*/}
      </div>
      <button type="submit" disabled={disabled} aria-disabled={disabled}>
        Start
      </button>
    </form>
  );

  function inputHandler(e) {
    const fields = [...e.currentTarget.elements].filter((el) => el.name !== '');
    setDisabled([...fields].some((el) => el.value.trim() === ''));
  }

  function submitHandler(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const { usersCount, time } = Object.fromEntries(new FormData(form));
    form.reset();
    setPreferences({ usersCount: +usersCount, time });
  }
}

function UserSettings({ users, setUsers, preferences, setMovies }) {
  const [disabled, setDisabled] = useState(true);

  const genres = ['classic', 'new'];
  const moods = ['fun', 'serious', 'inspiring', 'scary'];
  const fieldNames = useRef([]);

  useEffect(() => {
    const form = document.querySelector('form');
    const namedElements = [...form.elements].filter((el) => el.name !== '');
    fieldNames.current = [...new Set(namedElements.map((el) => el.name))];
  }, []);

  useEffect(() => {
    const form = document.querySelector('form');
    form.reset();
    if (users.length === preferences.usersCount) {
      const loader = document.querySelector('.loader');
      loader.classList.add('loading');

      for (const user of users) {
        const input = JSON.stringify(user);
        getMovie(input).then((movie) => {
          setMovies((movies) => [...movies, movie]);
        });
      }

      async function getMovie(input) {
        // Retrieve the query embedding from OpenAI API
        const query = await retrieveQueryEmbedding(input);

        // Retrieve the matches from Supabase
        const context = await retrieveMatches(query);

        // Get the movies from the OpenAI API
        let movie = JSON.parse(await getMovies(input, context));
        if (!movie) {
          movie = {
            title: 'No movies found',
            content: 'Sorry, no movies found for your query. Please try again.',
          };
        }

        movie.poster = await retrieveMoviePoster(movie);

        return movie;
      }
    }
  }, [users]);

  return (
    <form className="form" onSubmit={submitHandler} onInput={inputHandler}>
      <div className="loader"></div>
      <div className="form-group">
        <h2>
          <span>Person</span> #{users.length + 1}
        </h2>
        <label htmlFor="favorite-movie">
          {' '}
          What’s your favorite movie and why?{' '}
        </label>{' '}
        <textarea
          id="favorite-movie"
          name="favoriteMovie"
          rows={3}
          placeholder="The Shawshank Redemption because it taught me to never give up hope no matter how hard life gets"
          required
          aria-required="true"
        ></textarea>
      </div>

      <div className="form-group">
        <p>Are you in the mood for something new or a classic?</p>
        <div className="form-options">
          {genres.map((genre, index) => (
            <div key={index}>
              <input
                type="radio"
                id={`genre-${genre}`}
                name="genre"
                value={genre}
              />{' '}
              <label htmlFor={`genre-${genre}`}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <p>What are you in the mood for?</p>
        <div className="form-options">
          {moods.map((mood, index) => (
            <div key={index}>
              <input
                type="radio"
                id={`mood-${mood}`}
                name="mood"
                value={mood}
              />{' '}
              <label htmlFor={`mood-${mood}`}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" disabled={disabled} aria-disabled={disabled}>
        {isLastUser() ? 'Get Movie' : 'Next Person'}
      </button>
    </form>
  );

  function isLastUser() {
    return preferences.usersCount === users.length + 1;
  }

  function inputHandler(e) {
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    setDisabled(
      !fieldNames.current.every((key) => key in data && data[key] !== '')
    );
  }

  async function submitHandler(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    setUsers((users) => [...users, data]);
    setDisabled(true);
  }
}

function Results({ movies, resetHandler }) {
  const [index, setIndex] = useState(0);
  const isLastMovie = index === movies.length - 1;

  return (
    <>
      <div className="results-container">
        <figure>
          <h2>{`${movies[index].title} (${movies[index].releaseYear})`}</h2>
          <img src={movies[index].poster} alt={movies[index].title} />
          <figcaption>{`${movies[index].content}`}</figcaption>
        </figure>
      </div>
      <button
        type="button"
        onClick={handleResults}
        aria-label={isLastMovie ? 'Start Again' : 'Next Movie'}
      >
        {isLastMovie ? 'Start Again' : 'Next Movie'}
      </button>
    </>
  );

  function handleResults() {
    if (isLastMovie) {
      resetHandler();
    }

    setIndex(index + 1);
  }
}

function Spinner({ label, id, name, min, max, step, value, required }) {
  const [inputValue, setInputValue] = useState(value);

  return (
    <div className="spinner">
      <label htmlFor={id}>{label}</label>
      <div className="spinner-container">
        <input
          type="number"
          min={`${min}`}
          max={`${max}`}
          step={`${step}`}
          value={`${inputValue}`}
          readOnly={true}
          id={id}
          name={name}
          required={required}
          aria-required={required}
          aria-label={`Spinner for ${label.toLowerCase()}`}
          role="spinbutton"
        />
        <div className="spinner-buttons">
          <button type="button" aria-label={`Increment`} onClick={increment}>
            +
          </button>
          <button type="button" aria-label={`Decrement`} onClick={decrement}>
            -
          </button>
        </div>
      </div>
    </div>
  );

  function increment() {
    inputValue < max && setInputValue(inputValue + step);
  }

  function decrement() {
    inputValue > min && setInputValue(inputValue - step);
  }
}

export default App;
