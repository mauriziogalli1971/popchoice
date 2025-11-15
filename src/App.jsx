import { useEffect, useState } from 'react';
import { getMovies, initApp, retrieveMatches, retrieveQueryEmbedding, } from './js/utilities.js';

function App() {
  const [movies, setMovies] = useState([]);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initApp();
    };
    init();
  }, []);

  async function submitHandler(e) {
    e.preventDefault();
    const loader = document.querySelector('.loader');
    loader.classList.add('loading');

    // 1. Get the form data
    const formData = new FormData(e.currentTarget);

    // 2. Convert the form data to a JavaScript object
    const data = Object.fromEntries(formData);

    // Transform the data into a string
    const input = JSON.stringify(data);

    // Retrieve the query embedding from OpenAI
    const query = await retrieveQueryEmbedding(input);

    // Retrieve the matches from the database
    const context = await retrieveMatches(query);

    // Get the movies from the API
    let movie = JSON.parse(await getMovies(input, context));
    if (!movie) {
      movie = {
        title: 'No movies found',
        content: 'Sorry, no movies found for your query. Please try again.',
      };
    }
    setMovies([movie]);
  }

  function inputHandler(e) {
    const fields = [...e.currentTarget.elements].filter((el) => el.name !== '');
    setDisabled([...fields].some((el) => el.value.trim() === ''));
  }

  function resetHandler() {
    setMovies([]);
    setDisabled(true);
  }

  return (
    <div className={'app-container'}>
      <header>
        <img src="/logo.png" alt="PopChoice Logo" width={99} height={108} />
        <h1>PopChoice</h1>
      </header>
      <main>
        {movies.length > 0 ? (
          <div className="results-container">
            <h2>{`${movies[0].title}`}</h2>
            <p>{`${movies[0].content}`}</p>
            <button type="button" onClick={resetHandler}>
              Go again
            </button>
          </div>
        ) : (
          <form
            className={'search-form'}
            onSubmit={submitHandler}
            onInput={inputHandler}
          >
            <div className={'loader'}></div>
            <div className="form-group">
              <label htmlFor="favorite-movie">
                What’s your favorite movie and why?
              </label>
              <textarea
                id="favorite-movie"
                name="favorite-movie"
                rows={3}
                placeholder="The Shawshank Redemption because it taught me to never give up hope no matter how hard life gets"
                required
                aria-required="true"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="genre">
                Are you in the mood for something new or a classic?
              </label>
              <textarea
                id="genre"
                name="genre"
                rows={2}
                placeholder="I want to watch movies that were released after 1990"
                required
                aria-required="true"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="mood">
                Do you wanna have fun or do you want something serious?
              </label>
              <textarea
                id="mood"
                name="mood"
                rows={2}
                placeholder="I want to watch something stupid and fun"
                required
                aria-required="true"
              ></textarea>
            </div>
            <button type="submit" disabled={disabled} aria-disabled={disabled}>
              Let's go
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default App;
