import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registeredAccounts = [
    { role: 'Managing Partner (P1)', email: 'rajesh@shivshakti.com', pass: 'rajesh123', scope: 'Pune & Kolhapur' },
    { role: 'Partner (P2)', email: 'suresh@shivshakti.com', pass: 'suresh123', scope: 'Mumbai High-Rise' },
    { role: 'Partner (P3)', email: 'vikram@shivshakti.com', pass: 'vikram123', scope: 'Nagpur Earthwork' },
    { role: 'Corporate Client', email: 'client@apexinfa.com', pass: 'client123', scope: 'Apex Infrastructures' },
    { role: 'Worker / Driver', email: 'driver@shivshakti.com', pass: 'driver123', scope: 'Vehicle MH 12 QG 4821' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Real backend authentication with bcrypt verification & JWT issuance
      const result = await api.login(email.trim(), password);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify your email and password.');
    }
  };

  const handleFillCredentials = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#2563EB] shadow-xs">
            <Building2 className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Shivshakti Construction Co.
          </h1>
          <p className="text-xs text-slate-500">
            Enterprise ERP & Remote Multi-Site Management
          </p>
        </div>

        {/* Real Login Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Secure Sign In</h2>
              <span className="badge badge-success text-[10px] uppercase font-semibold">
                JWT & Bcrypt Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered corporate credentials to access your allocated sites.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@shivshakti.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-400 text-white w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs transition-colors mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Authorized Accounts Directory (for testing) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                <span>Authorized Directory</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to fill form</span>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/70 overflow-hidden bg-slate-50/50">
              {registeredAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleFillCredentials(acc)}
                  className="p-2.5 flex items-center justify-between hover:bg-blue-50/60 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      {acc.role}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {acc.email} &bull; <strong className="text-slate-700">{acc.pass}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-[#2563EB] font-semibold">Select</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Shivshakti Construction Management System &bull; 256-bit Encrypted JWT Session
        </p>
      </div>
    </div>
  );
}
