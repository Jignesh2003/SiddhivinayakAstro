import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Hamburger and close icons

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when a link is clicked
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile: Only show hamburger icon (no “Admin Panel” text) */}
      <div className="lg:hidden bg-gray-800 text-white p-4 flex justify-start">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile: Slide-down menu (visible when isOpen) */}
      {isOpen && (
        <nav className="lg:hidden bg-gray-800 text-white space-y-1 px-4 pb-4">
          <Link
            to="/admin"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/add-product"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Add Product
          </Link>
          <Link
            to="/admin/manage-products"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Manage Products
          </Link>
          <Link
            to="/admin/orders"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Orders
          </Link>
          <Link
            to="/admin/verify-astrologers"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Verify Astrologers
          </Link>
          <Link
            to="/admin/withdrawal-requests"
            className="block p-2 hover:bg-gray-700 rounded"
            onClick={handleLinkClick}
          >
            Astologer Withdrawal Requests
          </Link>
          
        </nav>
      )}

      {/* Desktop Sidebar (always visible on lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-gray-800 lg:text-white lg:h-screen lg:p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <ul className="space-y-2">
          <li>
            <Link to="/admin" className="block p-2 hover:bg-gray-700 rounded">
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/admin/add-product"
              className="block p-2 hover:bg-gray-700 rounded"
            >
              Add Product
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-products"
              className="block p-2 hover:bg-gray-700 rounded"
            >
              Manage Products
            </Link>
          </li>
          <li>
            <Link to="/admin/orders" className="block p-2 hover:bg-gray-700 rounded">
              Orders
            </Link>
          </li>
          <li>
            <Link
              to="/admin/verify-astrologers"
              className="block p-2 hover:bg-gray-700 rounded"
            >
              Verify Astrologers
            </Link>
               <Link
              to="/admin/withdrawal-requests"
              className="block p-2 hover:bg-gray-700 rounded"
            >
              Astologer Withdrawal Requests
            </Link>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
