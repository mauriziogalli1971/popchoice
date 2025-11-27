import { useEffect, useRef, useState } from 'react';

const CF_WORKER_URL = import.meta.env.VITE_CF_WORKER_URL;
const CF_WORKER_OPTS = {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
  },
};

export default function UserSettings({
  users,
  setUsers,
  preferences,
  setMovies,
}) {
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
        getUserMovie(input).then((movie) => {
          setMovies((movies) => [...movies, movie]);
        });
      }
    }
  }, [users]);

  return (
    <form className="form" onSubmit={submitHandler} onInput={inputHandler}>
      <div className="loader"></div>
      <div className="form-group">
        <h2>
          <span>Person</span> #
          {users.length + (users.length < preferences.usersCount ? 1 : 0)}
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
        {isLastUser() || disabled
          ? `Get Movie${users.length > 1 ? 's' : ''}`
          : 'Next Person'}
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

  /**
   * Retrieve movie from Cloudflare Worker
   * @param input
   * @return {Promise<*>}
   */
  async function getUserMovie(input) {
    try {
      const response = await fetch(CF_WORKER_URL, {
        ...CF_WORKER_OPTS,
        body: JSON.stringify({ input }),
      });
      const { movie } = await response.json();
      return movie;
    } catch (error) {
      console.error('Error retrieving movie:', error);
      throw error;
    }
  }
}
