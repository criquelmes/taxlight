"use client";
import React from "react";
import Nav from "./Nav";
import Image from "next/image";
import Link from "next/link";
import ModeSwitcher from "../common/ModeSwitcher";
import { openMenu } from "../../utlis/toggleMenu";
export default function Header2({
  parentClass = "rainbow-header header-default header-left-align header-not-transparent header-sticky",
  btnClass = "btn-default btn-small round",
}) {
  return (
    <header className={parentClass}>
      <div className="container position-relative">
        <div className="row align-items-center">
          <div className="col-lg-2 col-md-6 col-4 position-static">
            <div className="header-left d-flex">
              <div className="logo">
                <Link href={`/`}>
                  <Image
                    className="logo-light"
                    alt="Taxlight Logo"
                    src="/assets/images/logo/taxlight-light.png"
                    width={300}
                    height={300}
                  />
                  <Image
                    className="logo-dark"
                    alt="Corporate Logo"
                    src="/assets/images/logo/taxlight-dark.png"
                    width={288}
                    height={100}
                  />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-10 col-md-6 col-8 d-flex justify-content-end align-items-center">
            <div className="header-right">
              <nav className="mainmenu-nav d-none d-lg-block">
                <ul className="mainmenu">
                  <Nav />
                </ul>
              </nav>
              <div className="header-btn">
                <a className={btnClass} target="_blank" href="/purshase">
                  Acceder
                </a>
              </div>
              {/* Start Mobile-Menu-Bar */}
              <div className="mobile-menu-bar ml--5 d-block d-lg-none">
                <div className="hamberger">
                  <button onClick={openMenu} className="hamberger-button">
                    <i className="feather-menu" />
                  </button>
                </div>
              </div>
              {/* Start Mobile-Menu-Bar */}
              {/* Start Switcher Area  */}
              <ModeSwitcher />
              {/* Start Switcher Area  */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
