import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

const PublicLayout: React.FC = () => (
  <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <Header />
    <main id="main-content">
      <Outlet />
    </main>
    <Footer />
    <BackToTop />
  </>
);

export default PublicLayout;
