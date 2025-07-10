import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Newspaper, 
  BookOpen, 
  Coins, 
  Users, 
  CreditCard,
  Settings
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'News Management',
      href: '/admin/news',
      icon: Newspaper,
    },
    {
      label: 'Learning Management',
      href: '/admin/learning',
      icon: BookOpen,
    },
    {
      label: 'Crypto Listings',
      href: '/admin/crypto-listings',
      icon: Coins,
    },
    {
      label: 'User Management',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Subscriptions',
      href: '/admin/subscriptions',
      icon: CreditCard,
    },
    {
      label: 'Payments',
      href: '/admin/payments',
      icon: CreditCard,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;