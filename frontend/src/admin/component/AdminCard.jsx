import { Link } from "react-router-dom";

const AdminCard = ({ title, count, icon, link }) => {
  return (
    <Link to={link} className="p-6 bg-white shadow-lg rounded-lg flex items-center gap-4">
      <div className="text-blue-500">{icon}</div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </Link>
  );
};

export default AdminCard;
