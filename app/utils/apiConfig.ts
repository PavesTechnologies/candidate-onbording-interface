/**
 * Centralized API configuration management.
 * Provides type-safe access to window.__APP_CONFIG__ with fallbacks.
 */

export interface AppConfig {
  EMPLOYEE_ONBOARDING_URL: string;
  USER_MANAGEMENT_URL: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

/**
 * Retrieves the application configuration.
 * Prioritizes window.__APP_CONFIG__ then falls back to environment variables.
 */
export const getApiConfig = (): AppConfig => {
  if (typeof window !== "undefined" && window.__APP_CONFIG__) {
    return window.__APP_CONFIG__;
  }

  // Fallback for SSR or local development without config.js
  return {
    EMPLOYEE_ONBOARDING_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001",
    USER_MANAGEMENT_URL:
      process.env.NEXT_PUBLIC_USER_MANAGEMENT_URL || "http://localhost:8000",
  };
};

/**
 * Dynamic API_CONFIG object that re-evaluates on access.
 * This ensures window.__APP_CONFIG__ is picked up even if module loads early.
 */
export const API_CONFIG = {
  get EMPLOYEE_ONBOARDING_URL() {
    return getApiConfig().EMPLOYEE_ONBOARDING_URL;
  },
  get USER_MANAGEMENT_URL() {
    return getApiConfig().USER_MANAGEMENT_URL;
  }
};
