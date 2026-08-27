import { Outlet } from "react-router-dom";

import AppNavbar from "../components/AppNavbar";

const AppLayout = () => {
  return (
    <div className="app-shell">
      <AppNavbar />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
