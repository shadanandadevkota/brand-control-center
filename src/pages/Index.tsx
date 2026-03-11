import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground mb-6">Start building your amazing project here!</p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/admin">
            <Settings className="mr-2 h-4 w-4" /> Go to Admin Panel
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
