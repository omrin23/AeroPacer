import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../lib/auth-context'
import Navbar from '../components/layout/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], weight: ['400','600','700','800'], variable: '--font-sora' })

export const metadata: Metadata = {
  title: 'AeroPacer - AI-Powered Running Analytics',
  description: 'Personalized running insights and coaching powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Block unwanted tracking scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block Facebook tracking and GTM containers with Facebook Pixel
              (function() {
                const originalFetch = window.fetch;
                const originalXHR = window.XMLHttpRequest.prototype.open;
                
                // Block Facebook domains
                window.fetch = function(url, ...args) {
                  if (typeof url === 'string' && url.includes('facebook.net')) {
                    console.log('Blocked Facebook tracking request:', url);
                    return Promise.reject(new Error('Blocked by AeroPacer privacy protection'));
                  }
                  return originalFetch.apply(this, [url, ...args]);
                };
                
                // Block XHR requests to Facebook
                window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
                  if (typeof url === 'string' && url.includes('facebook.net')) {
                    console.log('Blocked Facebook XHR request:', url);
                    throw new Error('Blocked by AeroPacer privacy protection');
                  }
                  return originalXHR.apply(this, [method, url, ...args]);
                };
                
                // Prevent dynamic script injection for Facebook
                const originalAppendChild = Node.prototype.appendChild;
                Node.prototype.appendChild = function(child) {
                  if (child.tagName === 'SCRIPT' && child.src && child.src.includes('facebook.net')) {
                    console.log('Blocked Facebook script injection:', child.src);
                    return child;
                  }
                  return originalAppendChild.call(this, child);
                };
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.variable} ${sora.variable} bg-background text-foreground` }>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}