import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  isLoading: boolean;
  error: Error | null;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      // Apply primary color
      document.documentElement.style.setProperty('--primary-50', `${settings.primary_color}10`);
      document.documentElement.style.setProperty('--primary-100', `${settings.primary_color}20`);
      document.documentElement.style.setProperty('--primary-200', `${settings.primary_color}30`);
      document.documentElement.style.setProperty('--primary-300', `${settings.primary_color}40`);
      document.documentElement.style.setProperty('--primary-400', `${settings.primary_color}50`);
      document.documentElement.style.setProperty('--primary-500', settings.primary_color);
      document.documentElement.style.setProperty('--primary-600', `${settings.primary_color}70`);
      document.documentElement.style.setProperty('--primary-700', `${settings.primary_color}80`);
      document.documentElement.style.setProperty('--primary-800', `${settings.primary_color}90`);
      document.documentElement.style.setProperty('--primary-900', `${settings.primary_color}95`);
      document.documentElement.style.setProperty('--primary-950', `${settings.primary_color}99`);

      // Apply system font color
      document.documentElement.style.setProperty('--system-font-color', settings.system_font_color);

      // Apply form position as CSS variable
      document.documentElement.style.setProperty('--form-position', settings.form_position);

      // Update favicon
      if (settings.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.setAttribute('href', settings.favicon_url);
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = settings.favicon_url;
          document.head.appendChild(newFavicon);
        }
      }

      // Update document title
      if (settings.site_name) {
        document.title = settings.site_name;
      }

      // Apply layout classes to body
      document.body.className = `layout-${settings.layout_type} header-${settings.header_style} footer-${settings.footer_style} form-${settings.form_layout}`;
    }
  }, [settings]);

  return (
    <SystemSettingsContext.Provider value={{ settings, isLoading, error }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}