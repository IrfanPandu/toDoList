import { useState } from 'react'
import { Eye, EyeOff, CheckSquare, User, Mail, Lock, ArrowRight, Repeat } from 'lucide-react'
import { supabase } from '../lib/supabase'

function InputField({ label, id, type = 'text', icon: Icon, value, onChange, placeholder, required, minLength, rightElement }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon size={16} className="auth-input-icon" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={id}
        />
        {rightElement}
      </div>
    </div>
  )
}

function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <Lock size={16} className="auth-input-icon" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || 'Minimal 6 karakter'}
          required
          minLength={6}
          autoComplete={id}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const switchMode = (toLogin) => {
    setIsLogin(toLogin)
    setError('')
    setMessage('')
    setEmail('')
    setPassword('')
    setUsername('')
  }

  const validateUsername = (name) => {
    if (!name.trim()) return 'Username tidak boleh kosong'
    if (name.trim().length < 3) return 'Username minimal 3 karakter'
    if (name.trim().length > 30) return 'Username maksimal 30 karakter'
    if (!/^[a-zA-Z0-9_]+$/.test(name.trim())) return 'Username hanya boleh huruf, angka, dan underscore (_)'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        // Validate username first
        const usernameError = validateUsername(username)
        if (usernameError) throw new Error(usernameError)

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              display_name: username.trim(),
            },
          },
        })

        if (error) throw error

        if (data.user) {
          // Check if email confirmation is required
          if (data.session === null) {
            setMessage('Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun, lalu masuk.')
          } else {
            setMessage('Pendaftaran berhasil! Kamu sudah bisa masuk sekarang.')
          }
          setIsLogin(true)
          setPassword('')
          setUsername('')
        }
      }
    } catch (err) {
      // Translate common Supabase error messages to Indonesian
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau kata sandi salah.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek inbox atau folder spam kamu.')
      } else if (msg.includes('User already registered') || msg.includes('already been registered')) {
        setError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.')
      } else if (msg.includes('Password should be at least')) {
        setError('Kata sandi minimal 6 karakter.')
      } else if (msg.includes('Unable to validate email address')) {
        setError('Format email tidak valid. Pastikan email kamu benar.')
      } else if (msg.includes('Email address') && msg.includes('invalid')) {
        setError('Format email tidak valid. Pastikan email kamu benar.')
      } else if (msg.includes('signup is disabled')) {
        setError('Pendaftaran akun sedang dinonaktifkan. Hubungi admin.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-split">
        {/* Left panel — branding */}
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="auth-brand-logo">
              <Repeat size={32} />
            </div>
            <h1>TodoApp</h1>
            <p>Kelola tugas, rutinitas, dan target harianmu dalam satu tempat.</p>
            <ul className="auth-brand-features">
              <li>✓ Manajemen tugas harian</li>
              <li>✓ Tracker rutinitas berulang</li>
              <li>✓ Target &amp; reward kerja</li>
            </ul>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2>{isLogin ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
              <p>{isLogin ? 'Masuk untuk melanjutkan' : 'Gratis selamanya, mulai sekarang'}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <InputField
                  label="Username"
                  id="username"
                  icon={User}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: irfan_pandu"
                  required
                />
              )}

              <InputField
                label="Email"
                id="email"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@kamu.com"
                required
              />

              <PasswordInput
                id={isLogin ? 'current-password' : 'new-password'}
                label="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {!isLogin && (
                <p className="auth-username-hint">
                  Username hanya boleh huruf, angka, dan underscore. Min. 3 karakter.
                </p>
              )}

              {error && (
                <div className="auth-alert error" role="alert">
                  <span>⚠</span> {error}
                </div>
              )}

              {message && (
                <div className="auth-alert success" role="status">
                  <span>✓</span> {message}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-btn-loading">
                    <span className="spinner-sm" /> Memproses...
                  </span>
                ) : (
                  <span className="auth-btn-content">
                    {isLogin ? 'Masuk' : 'Buat Akun'}
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            <div className="auth-switch-row">
              {isLogin ? (
                <p>Belum punya akun? <button type="button" onClick={() => switchMode(false)}>Daftar gratis</button></p>
              ) : (
                <p>Sudah punya akun? <button type="button" onClick={() => switchMode(true)}>Masuk</button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
