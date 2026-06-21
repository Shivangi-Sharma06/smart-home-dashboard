import '@mantine/core/styles.css';
import './styles.css';

import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NestPulse',
  description: 'Real-time SmartHome monitoring dashboard',
};

const theme = createTheme({
  primaryColor: 'blue',
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
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider defaultColorScheme="dark" theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
