import { useState } from 'react';

export default function Results({ movies, resetHandler }) {
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
