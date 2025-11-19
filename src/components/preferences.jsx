import { useState } from 'react';

export default function Preferences({ setPreferences }) {
  return (
    <form className="form" onSubmit={submitHandler}>
      <fieldset className="form-group">
        <legend>How many people are going to watch the movie?</legend>
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
      </fieldset>
      <fieldset className="form-group">
        <legend>How much time do you have?</legend>
        <div className="form-row">
          <Spinner
            label="hrs"
            id="hours"
            name="hours"
            min={1}
            max={6}
            step={1}
            value={1}
            right={true}
            required={true}
          />{' '}
          <Spinner
            label="min"
            id="minutes"
            name="minutes"
            min={1}
            max={55}
            step={5}
            value={45}
            right={true}
            required={true}
          />
        </div>
      </fieldset>
      <button type="submit">Start</button>
    </form>
  );

  function submitHandler(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const { usersCount, hours, minutes } = Object.fromEntries(
      new FormData(form)
    );
    form.reset();
    setPreferences({
      usersCount: +usersCount,
      duration: convertDuration(+hours, +minutes),
    });
  }

  function convertDuration(hours, minutes) {
    return hours * 60 + minutes;
  }
}

function Spinner({ label, id, name, min, max, step, value, right, required }) {
  const [inputValue, setInputValue] = useState(value);

  return (
    <div className={`${right ? 'spinner spinner-right' : 'spinner'}`}>
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
