import { Home, BarChart2, Users, Settings } from "lucide-react";

export function Sidebar({ setCurrentView }) {
  const navItems = [
    { name: "Home", icon: Home, view: "home" },
    { name: "Analytics", icon: BarChart2, view: "analytics" },
    { name: "Users", icon: Users, view: "users" },
    { name: "Settings", icon: Settings, view: "settings" },
  ];

  return (
    <nav className="bg-gray-800 h-full">
      <div className="px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentView(item.view)}
            className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-base font-medium rounded-md w-full"
          >
            <item.icon
              className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300"
              aria-hidden="true"
            />
            {item.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
