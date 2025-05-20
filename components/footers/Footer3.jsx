import React from "react";
import Image from "next/image";
import Link from "next/link";
import { footerSections, socialLinks } from "@/data/footerLinks";
export default function Footer3() {
  return (
    <>
      {/* Start Footer Area  */}
      <footer className="rainbow-footer footer-style-default variation-two">
        <div className="rainbow-callto-action clltoaction-style-default style-7">
          <div className="container">
            <div className="row row--0 align-items-center content-wrapper">
              <div className="col-lg-8 col-md-8">
                <div className="inner">
                  <div className="content text-left">
                    <div className="logo">
                      <Link href={`/`}>
                        <Image
                          className="logo-light"
                          alt="Taxlight Logo"
                          src="/assets/images/logo/taxlight-light.png"
                          width={288}
                          height={100}
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
                    <p
                      className="subtitle"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={150}
                    >
                      ¿Necesitas ayuda para suscribirte a Astrobot®?
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="col-lg-4 col-md-4"
                data-sal="slide-up"
                data-sal-duration={400}
                data-sal-delay={150}
              >
                <div className="call-to-btn text-left mt_sm--20 text-lg-right">
                  <a className="btn-default" href="#">
                    Ayuda <i className="feather-arrow-right" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-top">
          <div className="container">
            <div className="row">
              {footerSections.map((section, index) => (
                <div className="col-lg-8 col-md-6 col-sm-6 col-12" key={index}>
                  <div className="rainbow-footer-widget">
                    <h4 className="title">{section.title}</h4>
                    <div className="inner">
                      <ul className="footer-link link-hover">
                        {section.links.map((link, i) => (
                          <li key={i}>
                            <Link href={link.href}>{link.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-lg-4 col-md-6 col-sm-6 col-12">
                <div className="rainbow-footer-widget">
                  <h4 className="title">Conecta con nosotros.</h4>
                  <div className="inner">
                    <h6 className="subtitle">
                      Síguenos en nuestras redes sociales y mantente al tanto de
                      nuestras novedades.
                    </h6>
                    <ul className="social-icon social-default justify-content-start">
                      {socialLinks.map((link, index) => (
                        <li key={index}>
                          <a href={link.href}>
                            <i className={link.iconClass} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* End Footer Area  */}
      {/* Start Copy Right Area  */}
      <div className="copyright-area copyright-style-one">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-8 col-sm-12 col-12">
              <div className="copyright-left">
                <ul className="ft-menu link-hover">
                  <li>
                    <Link href={`#`}>Política de Privacidad</Link>
                  </li>
                  <li>
                    <a href="#">Terminos y Condiciones</a>
                  </li>
                  <li>
                    <Link href={`/contact`}>Contáctanos</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6 col-md-4 col-sm-12 col-12">
              <div className="copyright-right text-center text-lg-end">
                <p className="copyright-text">
                  © Taxlight {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
