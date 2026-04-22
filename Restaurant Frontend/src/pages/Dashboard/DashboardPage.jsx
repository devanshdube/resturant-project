import useAuth from '../../hooks/useAuth';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Restaurant MS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-semibold">{user?.name || 'User'}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2>
            <p className="text-gray-500 mt-2">
              Aapka dashboard yahan aayega. Menu, Orders, Tables sab kuch yahan manage hoga.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
