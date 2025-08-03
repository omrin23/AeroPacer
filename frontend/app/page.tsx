export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AeroPacer 🏃‍♂️💨
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Powered Running Analytics & Personalized Coaching
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">🔗 Data Integration</h3>
              <p className="text-sm text-gray-600">Connect with Strava & health apps</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">🤖 AI Coaching</h3>
              <p className="text-sm text-gray-600">Personalized training insights</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">📊 Performance Analytics</h3>
              <p className="text-sm text-gray-600">Track fatigue & recovery</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">🏁 Race Planning</h3>
              <p className="text-sm text-gray-600">Strategy simulation & planning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}