import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
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
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-secondary rounded-2xl overflow-hidden flex flex-col md:flex-row">
        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
            <img src="/logo.png" className="w-14 md:w-20 h-auto" />
            <span className="text-primary font-bold text-xl md:text-2xl mt-2 md:mt-5">
              SYNC
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-primary mb-2 text-center md:text-left">
            Welcome Back
          </h2>

          <p className="text-gray-400 text-sm mb-6 text-center md:text-left">
            Login to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="cursor-pointer w-full bg-primary text-background py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center md:text-left">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-primary cursor-pointer"
            >
              Sign up
            </span>
          </p>
          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/auth/google`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        credential: credentialResponse.credential,
                      }),
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
                }
              }}
              onError={() => console.log("Google Login Failed")}
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hidden md:block w-1/2 relative overflow-hidden">
          {/* IMAGE */}
          <img
            src="/side.jpg"
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/60" />

          {/* TEXT */}
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

export default Login;
