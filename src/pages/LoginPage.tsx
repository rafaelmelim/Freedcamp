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
            <h1 className="text-center text-2xl font-normal text-[#202124]">
              Fazer login
            </h1>
            <h2 className="mt-3 text-center text-[15px] text-[#202124]">
              para continuar ao Freedcamp
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-lg border border-[#dadce0] p-6 space-y-5">
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
                  className={`block w-full px-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-[#dadce0]'
                  } rounded-md placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base transition-all duration-200`}
                  placeholder="Email ou telefone"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
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
                  className={`block w-full px-3 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-[#dadce0]'
                  } rounded-md placeholder-[#5f6368] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base transition-all duration-200`}
                  placeholder="Digite sua senha"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border-[#dadce0] rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#5f6368] cursor-pointer select-none">
                  Permanecer conectado
                </label>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-primary-600 hover:text-primary-800 focus:outline-none focus:underline transition-colors duration-200"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                className="flex-1 py-2.5 px-4 text-sm font-medium text-primary-700 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded transition-colors duration-200"
                onClick={() => window.location.href = '/signup'}
              >
                Criar conta
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Entrando...' : 'Avançar'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex justify-center items-center space-x-8">
          <select className="appearance-none bg-transparent border-none text-sm text-[#5f6368] hover:text-[#202124] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200">
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (United States)</option>
          </select>

          <div className="flex items-center space-x-8">
            <button className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
              Ajuda
            </button>
            <button className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
              Privacidade
            </button>
            <button className="text-sm text-[#5f6368] hover:text-[#202124] focus:outline-none focus:underline transition-colors duration-200">
              Termos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}