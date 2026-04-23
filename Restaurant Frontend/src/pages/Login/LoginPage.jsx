import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { Mail, Lock, ChefHat, ArrowRight, Loader2, User, Shield } from 'lucide-react';

const LoginPage = () => {
  const { login, isLoading, error } = useAuth();
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [userType, setUserType] = useState('restaurant');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await login({
      email: formData.get('email'),
      password: formData.get('password'),
    }, userType);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-gray-900">
      {/* Left side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/login-bg.png" 
            alt="Restaurant Interior" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        </div>
        
        {/* Branding Content */}
        <div className="relative z-10 p-12 max-w-2xl text-center">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/20 backdrop-blur-md rounded-2xl mb-8 border border-amber-500/30 shadow-2xl">
            <ChefHat size={48} className="text-amber-400 drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Dining Experience
            </span>
          </h1>
          <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-lg mx-auto">
            The all-in-one platform for restaurant owners, staff, and guests. Streamline operations, manage orders, and deliver exceptional service.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (hidden on desktop) */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="p-3 bg-amber-100 rounded-xl">
              <ChefHat size={32} className="text-amber-600" />
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Welcome back</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">Please enter your details to sign in to your portal.</p>
            
            {/* User Type Toggle */}
            <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl mb-6 border border-gray-200/50 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setUserType('restaurant')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  userType === 'restaurant'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User size={16} className={userType === 'restaurant' ? 'text-amber-500' : ''} />
                Restaurant
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  userType === 'admin'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield size={16} className={userType === 'admin' ? 'text-amber-500' : ''} />
                Platform Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <div className={`relative transition-all duration-200 rounded-xl overflow-hidden border ${emailFocus ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-gray-200 hover:border-gray-300'} bg-white`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className={`${emailFocus ? 'text-amber-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    className="block w-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none sm:text-sm bg-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className={`relative transition-all duration-200 rounded-xl overflow-hidden border ${passwordFocus ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-gray-200 hover:border-gray-300'} bg-white`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className={`${passwordFocus ? 'text-amber-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    className="block w-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none sm:text-sm bg-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in to Portal
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
            
            {/* Disclaimer or Additional Info */}
            <p className="text-center text-xs text-gray-500 mt-6 font-medium">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
