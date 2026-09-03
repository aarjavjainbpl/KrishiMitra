import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Not logged in -> Must go to Login / Work Selection
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: If user role is not in allowedRoles, redirect to their role-appropriate home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'farmer') {
      return <Navigate to="/farmer/place-harvest" replace />;
    }
    if (user.role === 'buyer') {
      return <Navigate to="/buyer/browse" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
