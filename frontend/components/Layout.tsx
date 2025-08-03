import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            AeroPacer 🏃‍♂️💨
          </h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-gray-100 border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>&copy; 2024 AeroPacer. AI-Powered Running Analytics.</p>
        </div>
      </footer>
    </div>
  );
}