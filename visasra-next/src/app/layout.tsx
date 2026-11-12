import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.visasra.com'),
  title: {
    default: 'Visasra — Shop India, Delivered Anywhere',
    template: '%s | Visasra',
  },
  description: "Your trusted hands on the ground in India. A verified personal shopper sources, verifies with GST store bills, and ships authentic Indian products to your door globally.",
  icons: {
    icon: '/images/logo/visasra-logo.png',
  },
  openGraph: {
    title: 'Visasra — Authentic Indian Sourcing & Worldwide Delivery',
    description: 'Shop from local markets, GRT, Fabindia, or custom artisans in India with real-time personal shoppers.',
    url: 'https://www.visasra.com',
    siteName: 'Visasra',
    images: [
      {
        url: '/images/banner/home-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Visasra — Shop India, Delivered Anywhere',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visasra — Shop India, Delivered Anywhere',
    description: 'Verified personal shopping from India to anywhere in the world.',
    images: ['/images/banner/home-banner.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Fraunces:wght@600;700;800&family=Libre+Bodoni:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
          id="razorpay-checkout-script"
        />
        {children}
      </body>
    </html>
  );
}
