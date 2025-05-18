import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>();

  useEffect(() => {
    const savedCredentials = localStorage.getItem('loginCredentials');
    if (savedCredentials) {
      const { email, password, remember } = JSON.parse(savedCredentials);
      if (remember) {
        setValue('email', email);
        setValue('password', password);
        setRememberMe(true);
      }
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);

      if (rememberMe) {
        localStorage.setItem('loginCredentials', JSON.stringify({
          email: data.email,
          password: data.password,
          remember: true
        }));
      } else {
        localStorage.removeItem('loginCredentials');
      }
    } catch (error) {
      toast.error("Email ou senha inválidos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white py-6 px-4 shadow-lg">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-primary-600 text-3xl font-bold flex items-center gap-2">
            Cloud Operation Center - COC
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-96px)] p-4 bg-gradient-to-br from-primary-50 to-primary-100">
        <section className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 
                           placeholder-gray-500 focus:outline-none focus:ring-2 
                           focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Digite seu email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Senha é obrigatória"
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 
                           placeholder-gray-500 focus:outline-none focus:ring-2 
                           focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Digite sua senha"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 
                           border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Lembrar meus dados
                </label>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-primary-600 hover:text-primary-800 
                         focus:outline-none focus:underline transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg 
                       hover:bg-primary-700 focus:outline-none focus:ring-2 
                       focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 
                       disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span
                    className="w-5 h-5 border-2 border-white border-t-transparent 
                                 rounded-full animate-spin mr-2"
                  ></span>
                  Entrando...
                </span>
              ) : (
                "Acessar"
              )}
            </button>

            <div className="text-center">
              <span className="text-gray-600">Ainda não tem conta? </span>
              <button
                type="button"
                className="text-primary-600 font-medium hover:text-primary-800 
                         focus:outline-none focus:underline transition-colors"
              >
                Abra a sua conta
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div
          className="container mx-auto max-w-7xl flex flex-col md:flex-row 
                      justify-between items-center space-y-4 md:space-y-0"
        >
          <nav>
            <ul className="flex space-x-6flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-center md:text-left">
              <li>
                <a
                  href="#"
                  className="hover:text-primary-400 transition-colors"
                >
                  Ajuda
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary-400 transition-colors"
                >
                  Segurança
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary-400 transition-colors"
                >
                  Privacidade
                </a>
              </li>
            </ul>
          </nav>
          <p className="text-sm text-gray-400">
            © 2025 Freedcamp. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}