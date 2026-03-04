import Header from "@/shared/widgets/layout/auth/Header";
import { Outlet } from "react-router-dom";

const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <Outlet />
      {/*TODO: 풋터*/}
    </div>
  );
};

export default HomeLayout;
