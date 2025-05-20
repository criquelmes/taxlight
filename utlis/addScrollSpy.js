const addScrollspy = (
  defalutClass = "",
  linksContainer = ".scrollSpyLinks",
  activeClass = "current"
) => {
  var section = document.querySelectorAll(".scrollSpySection");
  // console.log(section);

  var sections = {};
  var i = 0;

  Array.prototype.forEach.call(section, function (e) {
    sections[e.id] = e.offsetTop - 40;
  });
  var scrollPosition =
    document.documentElement.scrollTop || document.body.scrollTop;

  for (i in sections) {
    if (sections[i] <= scrollPosition) {
      document
        .querySelector(linksContainer + ` .${activeClass}`)
        ?.setAttribute("class", defalutClass);
      const navLink = document.querySelector(
        linksContainer + " a[href*=" + i + "]"
      );

      navLink?.setAttribute("class", `${defalutClass} ${activeClass}`);
    }
  }
};
export default addScrollspy;
