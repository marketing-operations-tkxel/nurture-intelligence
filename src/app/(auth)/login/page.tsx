'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/executive')
    }
  }

  return (
    <div className="min-h-screen bg-graphite-900 flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-core-flow flex-col justify-between p-12 relative overflow-hidden">
        {/* Background blur shapes */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-black/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NI</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Nurture Intelligence</p>
              <p className="text-white/50 text-[10px] font-mono uppercase tracking-widest">by tkxel</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white font-bold text-4xl leading-tight mb-4">
            Revenue &amp;<br />Nurture Intelligence
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-md">
            Unify Salesforce CRM and Account Engagement data into one trusted platform for executive visibility and nurture operations intelligence.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Data Sources', value: '2' },
            { label: 'KPIs Tracked', value: '30+' },
            { label: 'Phases', value: '5' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-white font-bold text-2xl">{s.value}</p>
              <p className="text-white/60 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 gradient-core-flow rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">NI</span>
            </div>
            <p className="text-white font-bold text-sm">Nurture Intelligence</p>
          </div>

          <h1 className="text-white font-bold text-2xl mb-1">Sign in</h1>
          <p className="text-white/40 text-sm mb-8">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-mono uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full bg-graphite-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-pulse-blue/60 focus:ring-1 focus:ring-pulse-blue/30 transition"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs font-mono uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-graphite-800 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-pulse-blue/60 focus:ring-1 focus:ring-pulse-blue/30 transition"
              />
            </div>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 text-accent-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-core-flow text-white font-semibold py-3 rounded-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-white/20 text-xs text-center mt-8 font-mono">
            © 2026 Tkxel · Nurture Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  )
}
