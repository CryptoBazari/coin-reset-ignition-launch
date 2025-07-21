
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  List, 
  Users, 
  CreditCard,
  Database,
  Settings
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard
    },
    {
      title: 'Data Population',
      href: '/admin/data-population',
      icon: Database
    },
    {
      title: 'News Management',
      href: '/admin/news',
      icon: FileText
    },
    {
      title: 'Learning Management',
      href: '/admin/learning',
      icon: BookOpen
    },
    {
      title: 'Crypto Listings',
      href: '/admin/crypto-listings',
      icon: List
    },
    {
      title: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: Users
    },
    {
      title: 'Payments',
      href: '/admin/payments',
      icon: CreditCard
    }
  ];

  return (
    <div className="w-64 bg-card border-r h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
