import { createContext, useContext, useEffect } from 'react';
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
  const { data: settings, isLoading, error } = useQuery({
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
      const primaryColor = settings.primary_color || '#0EA5E9';
      document.documentElement.style.setProperty('--primary-50', `${primaryColor}10`);
      document.documentElement.style.setProperty('--primary-100', `${primaryColor}20`);
      document.documentElement.style.setProperty('--primary-200', `${primaryColor}30`);
      document.documentElement.style.setProperty('--primary-300', `${primaryColor}40`);
      document.documentElement.style.setProperty('--primary-400', `${primaryColor}50`);
      document.documentElement.style.setProperty('--primary-500', primaryColor);
      document.documentElement.style.setProperty('--primary-600', `${primaryColor}70`);
      document.documentElement.style.setProperty('--primary-700', `${primaryColor}80`);
      document.documentElement.style.setProperty('--primary-800', `${primaryColor}90`);
      document.documentElement.style.setProperty('--primary-900', `${primaryColor}95`);
      document.documentElement.style.setProperty('--primary-950', `${primaryColor}99`);

      // Apply system font color
      const systemFontColor = settings.system_font_color || '#000000';
      document.documentElement.style.setProperty('--system-font-color', systemFontColor);

      // Apply form position as CSS variable
      const formPosition = settings.form_position || 'center';
      document.documentElement.style.setProperty('--form-position', formPosition);

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
      const layoutType = settings.layout_type || 'default';
      const headerStyle = settings.header_style || 'default';
      const footerStyle = settings.footer_style || 'default';
      const formLayout = settings.form_layout || 'default';
      document.body.className = `layout-${layoutType} header-${headerStyle} footer-${footerStyle} form-${formLayout}`;
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