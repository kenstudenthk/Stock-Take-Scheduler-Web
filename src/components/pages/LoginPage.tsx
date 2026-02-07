import React from 'react';

export const LoginPage: React.FC = () => {
  return (
    <div className="flex w-full min-h-screen bg-[var(--bh-bg)]">
      {/* Left Side */}
      <div className="flex-1 bg-[var(--bh-black)] text-white flex flex-col justify-between p-16">
        {/* Brand Top */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--bh-red)]" />
            <h1 className="text-2xl font-bold">StockTake</h1>
          </div>

          {/* Brand Middle */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight -tracking-wide">
              Streamline your<br />
              inventory operations
            </h2>
            <p className="text-lg leading-relaxed text-gray-300 max-w-md">
              Schedule and monitor stock takes across Hong Kong retail locations with ease.
            </p>
          </div>
        </div>

        {/* Brand Bottom */}
        <div className="flex gap-8">
          <div>
            <div className="text-2xl font-bold">150+</div>
            <div className="text-sm text-gray-400">Shops Managed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">98%</div>
            <div className="text-sm text-gray-400">On Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm text-gray-400">Support</div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 bg-[var(--bh-bg)] flex items-center justify-center p-16">
        <div className="w-full max-w-sm space-y-8">
          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[var(--bh-black)]">Welcome back</h2>
            <p className="text-[var(--bh-gray-700)]">Sign in to your account to continue</p>
          </div>

          {/* Form Fields */}
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-2 border-2 border-[var(--bh-border)] rounded-lg focus:outline-none focus:border-[var(--bh-black)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border-2 border-[var(--bh-border)] rounded-lg focus:outline-none focus:border-[var(--bh-black)]"
              />
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-[var(--bh-black)]">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[var(--bh-blue)] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:opacity-90 transition"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--bh-border)]" />
            <span className="text-sm text-[var(--bh-gray-700)]">Or continue with</span>
            <div className="flex-1 h-px bg-[var(--bh-border)]" />
          </div>

          {/* Microsoft Button */}
          <button className="w-full py-3 border-2 border-[var(--bh-black)] text-[var(--bh-black)] font-bold rounded-lg hover:bg-[var(--bh-bg)] transition flex items-center justify-center gap-2">
            <span>Sign in with Microsoft</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[var(--bh-gray-700)]">
            Don't have an account?{' '}
            <a href="#" className="text-[var(--bh-black)] font-bold hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
