import { useEffect, useRef, useState } from 'react';
import { getMovie, retrieveMatches, retrieveMoviePoster, retrieveQueryEmbedding, } from '../js/utilities.js';

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

      async function getUserMovie(input) {
        // Retrieve the query embedding from OpenAI API
        const query = await retrieveQueryEmbedding(input);

        // Retrieve the matches from Supabase
        const context = await retrieveMatches(query);

        // Get the movies from the OpenAI API
        let movie = JSON.parse(await getMovie({ input, context }));
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
        {isLastUser()
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
}
