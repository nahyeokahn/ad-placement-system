import './globals.css';

export const metadata = {
  title: '세계일보 광고 게재 원표',
  description: '세계일보 광고 게재 원표 — Ad Placement Management',
  other: {
    'theme-color': '#1f4a5c',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
