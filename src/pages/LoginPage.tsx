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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#ec0000] to-[#b30000]">
      <header className="bg-white py-6 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-[#ec0000] text-3xl font-bold tracking-tight">Freedcamp</h1>
          <nav className="hidden sm:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-[#ec0000] transition-colors">Para você</a>
            <a href="#" className="text-gray-600 hover:text-[#ec0000] transition-colors">Para empresas</a>
            <a href="#" className="text-gray-600 hover:text-[#ec0000] transition-colors">Sobre nós</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl p-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Bem-vindo ao Internet Banking
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ec0000] transition-colors"
                  placeholder="Digite seu email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-[#ec0000] font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ec0000] transition-colors"
                  placeholder="Digite sua senha"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-[#ec0000] font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 rounded border-2 border-gray-300 text-[#ec0000] focus:ring-[#ec0000] focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="ml-2.5 text-sm text-gray-600">
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#ec0000] text-white text-base font-semibold rounded-xl hover:bg-[#cc0000] focus:outline-none focus:ring-2 focus:ring-[#ec0000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Entrando...
                  </span>
                ) : (
                  'Acessar sua conta'
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  className="text-[#ec0000] font-semibold hover:text-[#cc0000] focus:outline-none focus:underline"
                  onClick={() => window.location.href = '/signup'}
                >
                  Abra a sua conta
                </button>
              </p>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              <button className="text-sm text-gray-600 hover:text-[#ec0000] transition-colors">
                Ajuda para acessar sua conta
              </button>
              <button className="text-sm text-gray-600 hover:text-[#ec0000] transition-colors">
                Problemas com o acesso?
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Para você</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Conta corrente</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Cartões</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Empréstimos</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Para empresas</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Conta empresarial</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Financiamentos</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Investimentos</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Segurança</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Dicas de segurança</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Política de privacidade</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Termos de uso</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Atendimento</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Central de ajuda</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Fale conosco</a></li>
                <li><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Ouvidoria</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center sm:text-left">
            <p className="text-sm text-gray-400">© 2025 Freedcamp. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}