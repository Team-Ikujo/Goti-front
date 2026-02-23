import { Outlet } from "react-router-dom";

const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/*TODO: 헤더*/}
      <Outlet />
      {/*TODO: 풋터*/}
    </div>
  );
};

export default HomeLayout;
