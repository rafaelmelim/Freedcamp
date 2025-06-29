import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react'
import { useState } from 'react'
import { validateEnvironment } from '../lib/supabase'

interface ConnectionErrorProps {
  onRetry: () => Promise<void>
  className?: string
}

export function ConnectionError({ onRetry, className = '' }: ConnectionErrorProps) {
  const [retrying, setRetrying] = useState(false)
  const validation = validateEnvironment()

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erro de Conexão
          </h3>
          <p className="text-red-700 mb-4">
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
          </p>
          
          {!validation.isValid && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Problemas de Configuração Detectados:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                Verifique o arquivo .env na raiz do projeto.
              </p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-red-600 mb-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Verifique sua conexão com a internet</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Verifique se o serviço está funcionando</span>
            </div>
          </div>

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Tentando...' : 'Tentar Novamente'}
          </button>
        </div>
      </div>
    </div>
  )
}