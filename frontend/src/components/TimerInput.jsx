import React from "react";

const TimerInput = ({ value, onChange }) => {
  const increment = () => onChange(Number(value) + 1);
  const decrement = () => onChange(Math.max(1, Number(value) - 1));

  return (
    <div className="flex items-center bg-secondary p-2 rounded-2xl shadow-sm w-full">
      {/* Decrement Button */}
      <button
        onClick={decrement}
        className="w-10 h-10 flex items-center justify-center bg-tertiary rounded-xl hover:opacity-80 text-primary cursor-pointer transition-all font-bold"
      >
        −
      </button>

      {/* The Input */}
      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange((e.target.value = e.target.value.replace(/\D/g, "")))
        }
        className="w-full text-center text-xl font-bold outline-none text-primary bg-transparent"
      />

      {/* Increment Button */}
      <button
        onClick={increment}
        className="w-10 h-10 flex items-center justify-center bg-tertiary rounded-xl hover:opacity-80 text-primary cursor-pointer  transition-all font-bold"
      >
        +
      </button>
    </div>
  );
};

export default TimerInput;
