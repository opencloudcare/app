import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router";
import { IconArrowLeft } from "@tabler/icons-react";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center">
      <h1 className="text-9xl md:text-[374px] text-center font-medium leading-none font-bebas">404</h1>
      <p className="text-lg md:text-2xl font-semibold">This page could not be found</p>
        <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mt-6">
          <IconArrowLeft />
          Back to dashboard
        </Button>
    </div>
  );
};
