const PrevArrow = ({ onClick }) => {
  return (
    <button className="slick-arrow prev-arrow" onClick={onClick}>
      <i className="feather-arrow-left"></i>
    </button>
  );
};
const NextArrow = ({ onClick }) => {
  return (
    <button className="slick-arrow next-arrow" onClick={onClick}>
      <i className="feather-arrow-right"></i>
    </button>
  );
};

export { PrevArrow, NextArrow };
