import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield, RotateCcw } from "lucide-react";

interface AdminControlsProps {
  isAdmin: boolean;
  isAdminMode: boolean;
  onModeToggle: (checked: boolean) => void;
  onRefreshAdminStatus?: () => void;
}

const AdminControls = ({ isAdmin, isAdminMode, onModeToggle, onRefreshAdminStatus }: AdminControlsProps) => {
  // Always show refresh button for debugging, but only show admin toggle if user is admin
  return (
    <div className="flex items-center gap-3">
      {onRefreshAdminStatus && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshAdminStatus}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Check Admin Status
        </Button>
      )}
      
      {isAdmin && (
        <>
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
        </>
      )}
    </div>
  );
};

export default AdminControls;