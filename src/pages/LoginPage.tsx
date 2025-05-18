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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-primary-100">
      <header className="w-full bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <img 
            src="https://images.pexels.com/photos/20001482/pexels-photo-20001482.jpeg" 
            alt="Freedcamp" 
            className="h-8 w-auto"
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 mb-8">
                Acesse sua conta
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1">
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
                    className="block w-full rounded-lg border-gray-300 shadow-sm
                             focus:border-primary-500 focus:ring-primary-500 
                             px-4 py-3 text-gray-900"
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Senha
                </label>
                <div className="mt-1">
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
                    className="block w-full rounded-lg border-gray-300 shadow-sm
                             focus:border-primary-500 focus:ring-primary-500 
                             px-4 py-3 text-gray-900"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 
                             focus:ring-primary-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Lembrar-me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Esqueceu sua senha?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-lg bg-primary-600 
                           px-4 py-3 text-sm font-semibold text-white shadow-sm 
                           hover:bg-primary-500 focus:outline-none focus:ring-2 
                           focus:ring-primary-500 focus:ring-offset-2 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent 
                                   rounded-full animate-spin mr-2">
                      </div>
                      Entrando...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Cadastre-se
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 bg-white shadow-sm mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between 
                      items-center gap-4 text-sm text-gray-600">
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary-600 transition-colors">Ajuda</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Privacidade</a>
          </div>
          <p>© 2025 Freedcamp. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}