import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ResetPasswordFormProps {
  onClose: () => void;
}

interface FormData {
  email: string;
}

export function ResetPasswordForm({ onClose }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    step: 'idle' | 'validating' | 'sending' | 'complete' | 'error';
    error?: string;
  }>({ step: 'idle' });
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setResetStatus({ step: 'validating' });

      setResetStatus({ step: 'sending' });

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetStatus({ step: 'complete' });
      toast.success('Password reset instructions sent to your email');

      // Close the form after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setResetStatus({ step: 'error', error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-sm text-gray-500">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <EnvelopeIcon className="h-5 w-5" />
              </span>
              <input
                id="reset-email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="flex-1 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          
          {resetStatus.step !== 'idle' && (
            <div className="mt-4">
              {resetStatus.step === 'error' ? (
                <div className="flex items-center text-red-600">
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm">{resetStatus.error}</span>
                </div>
              ) : resetStatus.step === 'complete' ? (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm">Reset instructions sent!</span>
                </div>
              ) : (
                <div className="flex items-center text-primary-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2" />
                  <span className="text-sm">
                    {resetStatus.step === 'validating' && 'Validating email...'}
                    {resetStatus.step === 'sending' && 'Sending reset instructions...'}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || resetStatus.step === 'complete'}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg 
                       hover:bg-primary-700 focus:outline-none focus:ring-2 
                       focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 
                       disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}