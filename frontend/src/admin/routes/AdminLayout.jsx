import { Outlet } from "react-router-dom";
import Sidebar from "../component/Sidebar";
import Navbar from "../component/Navbar";

const AdminLayout = () => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1">
        {/* Navbar */}
        <Navbar />
        
        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
