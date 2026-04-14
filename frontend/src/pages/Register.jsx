import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (res.ok) {
        login(data);
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[600px] bg-secondary rounded-2xl overflow-hidden flex">
        {/* LEFT SIDE */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.png" className="w-20 h-auto" />
            <span className="text-primary font-bold text-2xl mt-5">SYNC</span>
          </div>

          <h2 className="text-2xl font-bold text-primary mb-2">
            Create Account
          </h2>
          <p className="text-gray-400 text-sm mb-6">Start your study journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Username"
              className="w-full p-3 rounded-lg bg-tertiary text-primary outline-none"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
              type="email"
              pattern=".*@.*"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-tertiary text-primary outline-none"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-tertiary text-primary outline-none"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              disabled={loading}
              className="w-full cursor-pointer bg-primary text-background py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-primary cursor-pointer"
            >
              Login
            </span>
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/2 hidden md:block relative overflow-hidden">
          {/* IMAGE (FULL COVER) */}
          <img
            src="/side.jpg"
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* OVERLAY (for readability) */}
          <div className="absolute inset-0 bg-black/60" />

          {/* TEXT ABOVE IMAGE */}
          <div className="relative z-10 flex items-center justify-center h-full text-center px-6">
            <h1 className="text-3xl font-bold text-primary">
              Build focus. Build consistency.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
