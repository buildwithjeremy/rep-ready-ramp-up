
import { Home, Users, UserPlus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

interface MobileNavProps {
  currentPath: string;
  userRole: 'trainer' | 'admin';
  onNavigate: (path: string) => void;
}

export function MobileNav({ currentPath, userRole, onNavigate }: MobileNavProps) {
  const navItems: NavItem[] = userRole === 'admin' 
    ? [
        { icon: BarChart3, label: 'Admin', href: '/admin', active: currentPath === '/admin' },
        { icon: Users, label: 'Reps', href: '/reps', active: currentPath === '/reps' },
        { icon: UserPlus, label: 'Add Rep', href: '/add-rep', active: currentPath === '/add-rep' }
      ]
    : [
        { icon: Home, label: 'Dashboard', href: '/dashboard', active: currentPath === '/dashboard' },
        { icon: Users, label: 'My Reps', href: '/reps', active: currentPath === '/reps' },
        { icon: UserPlus, label: 'Add Rep', href: '/add-rep', active: currentPath === '/add-rep' }
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              item.active 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
