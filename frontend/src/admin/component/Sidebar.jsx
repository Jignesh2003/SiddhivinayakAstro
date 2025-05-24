import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <ul className="space-y-2">
        <li><Link to="/admin" className="block p-2 hover:bg-gray-700 rounded">Dashboard</Link></li>
        <li><Link to="/admin/add-product" className="block p-2 hover:bg-gray-700 rounded">Add Product</Link></li>
        <li><Link to="/admin/manage-products" className="block p-2 hover:bg-gray-700 rounded">Manage Products</Link></li>
        <li><Link to="/admin/orders" className="block p-2 hover:bg-gray-700 rounded">Orders</Link></li>
        <li><Link to="/admin/daily-astrology" className="block p-2 hover:bg-gray-700 rounded">Daily Astrology Zodiac</Link></li>

      </ul>
    </div>
  );
};

export default Sidebar;
