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
    <div className="min-h-screen flex flex-col bg-[#ec0000]">
      <header className="bg-white py-4 px-6 shadow-md">
        <h1 className="text-[#ec0000] text-2xl font-bold">Freedcamp</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[#333] mb-8 text-center">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#666] mb-1">
                  Email
                </label>
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
                  className="w-full px-4 py-3 border border-[#ddd] rounded-lg text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#ec0000] focus:border-transparent transition-all duration-200"
                  placeholder="Digite seu email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#ec0000]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#666] mb-1">
                  Senha
                </label>
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
                  className="w-full px-4 py-3 border border-[#ddd] rounded-lg text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#ec0000] focus:border-transparent transition-all duration-200"
                  placeholder="Digite sua senha"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-[#ec0000]">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#ec0000] focus:ring-2 focus:ring-[#ec0000] border-[#ddd] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#666]">
                  Lembrar meus dados
                </label>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-[#ec0000] hover:text-[#cc0000] focus:outline-none focus:underline"
              >
                Esqueceu sua senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#ec0000] text-white font-medium rounded-lg hover:bg-[#cc0000] focus:outline-none focus:ring-2 focus:ring-[#ec0000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Entrando...' : 'Acessar'}
            </button>

            <div className="text-center">
              <span className="text-[#666]">Ainda não tem conta? </span>
              <button
                type="button"
                className="text-[#ec0000] font-medium hover:text-[#cc0000] focus:outline-none focus:underline"
                onClick={() => window.location.href = '/signup'}
              >
                Abra a sua conta
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-[#333] text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
          <div className="flex space-x-6 mb-4 sm:mb-0">
            <a href="#" className="hover:text-[#ec0000] transition-colors duration-200">
              Ajuda
            </a>
            <a href="#" className="hover:text-[#ec0000] transition-colors duration-200">
              Segurança
            </a>
            <a href="#" className="hover:text-[#ec0000] transition-colors duration-200">
              Privacidade
            </a>
          </div>
          <p>© 2025 Freedcamp. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}