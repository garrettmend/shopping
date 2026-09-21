import { Link } from "react-router-dom";
const NotFound = () => (
  <div className="empty-state">
    <h1>Page not found</h1>
    <Link to="/">Go to shop</Link>
  </div>
);
export default NotFound;
