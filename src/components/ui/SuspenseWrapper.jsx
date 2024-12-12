import { Suspense } from "react";
import PropTypes from "prop-types";
import LoadinSpinner from "./LoadinSpinner";

const SuspenseWrapper = ({ children }) => {
  return <Suspense fallback={<LoadinSpinner />}>{children}</Suspense>;
};

SuspenseWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SuspenseWrapper;
