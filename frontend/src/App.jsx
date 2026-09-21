import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const App = () => {
  return (
    <>
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
};

export default App;

// NavBar is included at the top, so it stays visible on every page.

// <Outlet /> is a placeholder for whatever child route you navigate to. React Router will render the route component (like Shop, or Cart) inside this <Outlet />.

// This setup eliminates the need to repeat <NavBar /> in every page component — you only put it once in App.jsx.

// The <main> element is just styling to separate the page content from the navbar.