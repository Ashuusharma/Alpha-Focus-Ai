"use client";

import { useEffect } from "react";
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add logic here if we need to sync i18n state with other stored preferences
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
