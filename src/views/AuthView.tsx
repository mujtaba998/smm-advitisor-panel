import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { signInWithGooglePopup, oAuthClientId } from '../lib/firebase';
import {
  Sparkles,
  Lock,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthView: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services with real provisioned client ID
  useEffect(() => {
    if (!oAuthClientId) return;

    const setupGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: oAuthClientId,
            callback: handleGsiCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
          });

          // Render official Google button if container is present
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 380,
              logo_alignment: 'left',
            });
          }

          // Trigger native One-Tap account chooser
          window.google.accounts.id.prompt();
        } catch (e) {
          console.log('GSI setup note:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGsi();
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, []);

  const handleGsiCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    const payload = parseJwt(response.credential);
    if (payload && payload.email) {
      const result = await googleLogin(
        payload.email,
        payload.name || payload.email.split('@')[0],
        payload.picture
      );
      setLoading(false);
      if (result.success) {
        showToast(`Signed in as ${payload.email}`, 'success');
      } else {
        showToast(result.error || 'Google sign-in failed', 'error');
      }
    } else {
      setLoading(false);
      showToast('Could not parse Google credential', 'error');
    }
  };

  // Official Google OAuth Popup with account selection
  const handleGoogleSignInClick = async () => {
    setLoading(true);
    try {
      // Opens Google's official account chooser popup listing all device accounts
      const userCredential = await signInWithGooglePopup();
      const gUser = userCredential.user;

      if (!gUser.email) {
        showToast('Google account has no email address', 'error');
        setLoading(false);
        return;
      }

      const result = await googleLogin(
        gUser.email,
        gUser.displayName || gUser.email.split('@')[0],
        gUser.photoURL || undefined
      );

      setLoading(false);

      if (result.success) {
        showToast(`Welcome! Signed in with Google (${gUser.email})`, 'success');
      } else {
        showToast(result.error || 'Failed to complete sign in', 'error');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Google Sign-In popup error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show annoying error
        return;
      }
      showToast(err.message || 'Google sign-in canceled or failed', 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    const result = await login(usernameOrEmail, password);
    setLoading(false);

    if (result.success) {
      showToast('Welcome back! Successfully signed in.', 'success');
    } else {
      showToast(result.error || 'Failed to sign in', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      showToast('Please fill in email, username, and password', 'error');
      return;
    }

    setLoading(true);
    const result = await register({ email, username, name: name || username, password });
    setLoading(false);

    if (result.success) {
      showToast('Account created successfully! Welcome to SMM Advisor.', 'success');
    } else {
      showToast(result.error || 'Registration failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SMM ADVISOR
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            AI-Powered Social Media Growth & SMM Panel (PKR)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Forms */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1E293B] px-3 text-slate-500 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        {/* Official Google Identity Services Container */}
        <div className="w-full flex justify-center">
          <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
        </div>

        {/* Official Google OAuth Popup Button (Shows device accounts via Google) */}
        <button
          type="button"
          onClick={handleGoogleSignInClick}
          disabled={loading}
          className="w-full mt-1 py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-sm hover:border-slate-600 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};
