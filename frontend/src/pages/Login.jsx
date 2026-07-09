import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginDirect, user } = useAuth();

  const handleLogin = async () => {
    // Clear any existing token before login
    localStorage.removeItem("token");
    await loginDirect();
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-navy px-16 text-white lg:flex">
        <div className="flex items-center gap-6 mb-8">
          <img
            src="/profile.svg.jpg"
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover border-4 border-accent"
          />
          <div>
            <h1 className="text-4xl font-bold">TMT InventoryPro</h1>
            <p className="mt-1 text-lg text-slate-300">Robel Hagos Mahray</p>
          </div>
        </div>
        <p className="mt-4 max-w-md text-lg text-slate-300">
          Professional inventory management for modern businesses.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          Computer Science Graduate, IUEA Uganda
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Email: robihagos18@gmail.com
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Phone: +256706780673
        </p>
        <a href="https://github.com/Robel-code24" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-accent hover:underline block">
          GitHub Profile →
        </a>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-navy">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">Click the button below to access the system</p>

          <div className="mt-8">
            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition hover:bg-accent-dark"
            >
              Enter App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
