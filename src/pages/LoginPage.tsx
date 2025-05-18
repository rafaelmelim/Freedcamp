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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[450px] w-full">
        <div className="bg-white w-full rounded-lg shadow-lg px-8 py-10 space-y-8">
          <div>
            <h1 className="text-center text-2xl font-normal text-gray-900">
              Fazer login
            </h1>
            <h2 className="mt-3 text-center text-base text-gray-600">
              para continuar ao Freedcamp
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-lg border border-gray-300 p-6 space-y-4">
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
                  className={`block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
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
                  className={`block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base`}
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
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                  Permanecer conectado
                </label>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                className="flex-1 py-2 px-4 text-sm font-medium text-primary-700 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => window.location.href = '/signup'}
              >
                Criar conta
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Entrando...' : 'Avançar'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <select className="text-sm text-gray-600 bg-transparent border-none cursor-pointer focus:outline-none">
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (United States)</option>
          </select>
          <div className="text-gray-300">|</div>
          <button className="text-sm text-gray-600 hover:text-gray-900">Ajuda</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Privacidade</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Termos</button>
        </div>
      </div>
    </div>
  )
}