import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "./Helmet";

const NotFound: React.FC = () => (
  <>
    <Helmet title="Page Not Found | Divine Solutions Healthcare LLC" />
    <section className="section container text-center">
      <h1>404 {"\u2014"} Page Not Found</h1>
      <p>Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" className="btn">Back to Home</Link>
    </section>
  </>
);

export default NotFound;
