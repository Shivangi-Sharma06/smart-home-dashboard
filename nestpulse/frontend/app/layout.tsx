import '@mantine/core/styles.css';
import './styles.css';

import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NestPulse — Smart Home Dashboard',
  description: 'Real-time SmartHome monitoring dashboard with MQTT & WebSockets',
};

const theme = createTheme({
  primaryColor: 'nestBlue',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', monospace",
  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: '800',
  },
  colors: {
    nestBlue: [
      '#edf5ff',
      '#d7e8ff',
      '#acd0ff',
      '#7db6ff',
      '#579fff',
      '#3b8dff',
      '#3b82f6',
      '#256fdf',
      '#1d61c8',
      '#104fae',
    ],
    nestCyan: [
      '#ecfeff',
      '#cffafe',
      '#a5f3fc',
      '#67e8f9',
      '#22d3ee',
      '#06b6d4',
      '#0891b2',
      '#0e7490',
      '#155e75',
      '#164e63',
    ],
    nestGreen: [
      '#f0fdf4',
      '#dcfce7',
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e',
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d',
    ],
  },
  defaultRadius: 'md',
  components: {
    Card: {
      defaultProps: {
        withBorder: false,
      },
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider defaultColorScheme="dark" theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
