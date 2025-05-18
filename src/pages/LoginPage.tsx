import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
}

export function LoginPage() {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      await signIn(data.email, data.password)
    } catch (error) {
      toast.error('Email ou senha inválidos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[450px] mx-auto">
        <div className="bg-white w-full rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.1)] px-8 py-12 space-y-8">
          <div>
            <h1 className="text-center text-2xl font-normal text-[#202124] mb-2">
              Bem-vindo ao Freedcamp
            </h1>
            <h2 className="text-center text-[15px] text-[#5f6368]">
              Use sua conta para continuar
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border border-[#dadce0] hover:border-[#d2e3fc] focus-within:border-[#1a73e8] p-6 space-y-5 transition-all duration-200">
              <div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', { 
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  className="block w-full px-3 py-3 border border-[#dadce0] rounded-md text-[#202124] placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-base transition-all duration-200"
                  placeholder="Email ou telefone"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-[#d93025]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { 
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'A senha deve ter pelo menos 6 caracteres'
                    }
                  })}
                  className="block w-full px-3 py-3 border border-[#dadce0] rounded-md text-[#202124] placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-base transition-all duration-200"
                  placeholder="Digite sua senha"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-[#d93025]">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 border-[#dadce0] rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#5f6368] cursor-pointer select-none">
                  Permanecer conectado
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium text-[#1a73e8] hover:text-[#174ea6] focus:outline-none focus:underline transition-colors duration-200"
              >
                Esqueceu a senha?
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  className="px-6 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f6fafe] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 rounded transition-all duration-200"
                  onClick={() => window.location.href = '/signup'}
                >
                  Criar conta
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#174ea6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Entrando...' : 'Avançar'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <footer className="mt-8">
          <div className="flex justify-center items-center space-x-8">
            <select className="appearance-none bg-transparent border-none text-sm text-[#5f6368] hover:text-[#202124] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (United States)</option>
            </select>

            <nav className="flex items-center space-x-8">
              <a href="#" className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
                Ajuda
              </a>
              <a href="#" className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
                Privacidade
              </a>
              <a href="#" className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
                Termos
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  )
}