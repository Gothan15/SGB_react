import PropTypes from "prop-types";

const Bubble = ({ count }) => {
  return (
    <div className="relative">
      <div className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {count}
      </div>
    </div>
  );
};

Bubble.propTypes = {
  count: PropTypes.number.isRequired,
};

export default Bubble;
