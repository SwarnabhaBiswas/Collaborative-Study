import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MutatingDots } from 'react-loader-spinner'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <MutatingDots
        visible={true}
        height="100"
        width="100"
        color="#ebedce"
        secondaryColor="#ebedce"
        radius="12.5"
        ariaLabel="mutating-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
