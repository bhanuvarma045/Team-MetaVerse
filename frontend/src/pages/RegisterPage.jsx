import { useState } from "react";
import { useLocation } from "wouter";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      const meRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      login(meRes.data, res.data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Email may already exist.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2">🌍 Traveloop</h1>
        <p className="text-gray-400 mb-6">Create your account</p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">
            Create Account
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Have account? <a href="/login" className="text-indigo-400 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}