import { LayoutDashboard, MessageSquare, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AstrologerSidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/astrologer-dashboard",
    },
    {
      label: "Chat Requests",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/astrologer-chat-request",
    },
    {
      label: "Profile",
      icon: <User className="w-5 h-5" />,
      path: "/astrologer-profile",
    },
  ];

  return (
    <div className="h-screen w-64 bg-white shadow-lg border-r flex flex-col">
      {/* Logo/Header */}
      <div className="px-6 py-4 border-b">
        <h2
          className="text-2xl font-bold text-indigo-600 cursor-pointer"
          onClick={() => navigate("/astrologer-dashboard")}
        >
          🔯 AstroPanel
        </h2>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={() => {
            localStorage.clear(); // or your logout logic
            navigate("/");
          }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AstrologerSidebar;
