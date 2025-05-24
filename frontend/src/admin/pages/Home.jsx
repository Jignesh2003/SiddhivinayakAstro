import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Package, Users } from "lucide-react";
import AdminCard from "../component/AdminCard";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    // Simulate fetching stats (Replace with actual API calls)
    setStats({
      totalProducts: 120,
      totalOrders: 50,
      totalUsers: 15,
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard title="Total Products" count={stats.totalProducts} icon={<Package />} link="/admin/manage-products" />
        <AdminCard title="Total Orders" count={stats.totalOrders} icon={<ShoppingCart />} link="/admin/orders" />
        <AdminCard title="Total Users" count={stats.totalUsers} icon={<Users />} link="/admin/users" />
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <Link to="/admin/add-product" className="bg-blue-600 text-white px-4 py-2 rounded-md">Add Product</Link>
          <Link to="/admin/manage-products" className="bg-gray-800 text-white px-4 py-2 rounded-md">Manage Products</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
