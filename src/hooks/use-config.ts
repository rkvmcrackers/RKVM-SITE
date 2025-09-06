import { useState, useEffect } from 'react';
import { saveConfig, getConfig } from '../utils/github-api';

interface Config {
  companyName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export const useConfig = () => {
  const [config, setConfig] = useState<Config>({
    companyName: 'RKVM Crackers',
    contactPhone: '9750153358',
    contactEmail: 'rkvmpyrotech2021@gmail.com',
    address: 'RKVM Crackers, India'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        
        // Try to get config from GitHub first
        let githubConfig = await getConfig();
        
        if (githubConfig) {
          // Use GitHub config
          setConfig(githubConfig);
        } else {
                  // Use default config
        setConfig({
          companyName: 'RKVM Crackers',
          contactPhone: '9750153358',
          contactEmail: 'rkvmpyrotech2021@gmail.com',
          address: 'RKVM Crackers, India'
        });
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        console.error('Error fetching config:', err);
        // Use default config on error
        setConfig({
          companyName: 'RKVM Crackers',
          contactPhone: '9750153358',
          contactEmail: 'rkvmpyrotech2021@gmail.com',
          address: 'RKVM Crackers, India'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Update config and save to GitHub
  const updateConfig = async (newConfig: Config) => {
    setConfig(newConfig);
    try {
      await saveConfig(newConfig);
    } catch (err) {
      console.error('Error saving config to GitHub:', err);
    }
  };

  // Update specific config field
  const updateConfigField = async (field: keyof Config, value: string) => {
    const newConfig = { ...config, [field]: value };
    await updateConfig(newConfig);
  };

  // Reset to base config
  const resetToBase = async () => {
    try {
      const defaultConfig = {
        companyName: 'RKVM Crackers',
        contactPhone: '9750153358',
        contactEmail: 'rkvmpyrotech2021@gmail.com',
        address: 'RKVM Crackers, India'
      };
      await updateConfig(defaultConfig);
    } catch (err) {
      console.error('Error resetting to base config:', err);
    }
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    updateConfigField,
    resetToBase
  };
};
