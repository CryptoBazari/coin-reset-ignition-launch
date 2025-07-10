import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";

interface AdminControlsProps {
  isAdmin: boolean;
  isAdminMode: boolean;
  onModeToggle: (checked: boolean) => void;
}

const AdminControls = ({ isAdmin, isAdminMode, onModeToggle }: AdminControlsProps) => {
  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">User Mode</span>
        <Switch
          checked={isAdminMode}
          onCheckedChange={onModeToggle}
        />
        <span className="text-sm text-muted-foreground">Admin Mode</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary">
          {isAdminMode ? 'ADMIN VIEW' : 'USER VIEW'}
        </span>
      </div>
    </div>
  );
};

export default AdminControls;