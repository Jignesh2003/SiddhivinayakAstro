import { useState } from "react";
import { LayoutDashboard, MessageSquare, User, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore"

const AstrologerSidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore.getState().logout

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
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 shadow border-b">
        <h2
          className="text-xl font-bold text-indigo-600 cursor-pointer"
          onClick={() => navigate("/astrologer-dashboard")}
        >
          🔯 AstroPanel
        </h2>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } md:block md:w-64 w-full bg-white shadow-lg border-r fixed md:relative z-50`}
      >
        <div className="px-6 py-4 border-b hidden md:block">
          <h2
            className="text-2xl font-bold text-indigo-600 cursor-pointer"
            onClick={() => navigate("/astrologer-dashboard")}
          >
            🔯 AstroPanel
          </h2>
        </div>

        {/* Menu */}
        <nav className="flex flex-col p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false); // close on mobile after selection
              }}
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
              logout() // or your logout logic
              navigate("/");
            }}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AstrologerSidebar;
