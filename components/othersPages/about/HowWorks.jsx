"use client";
import { useState } from "react";
import ModalVideo from "react-modal-video";
import Image from "next/image";
import Link from "next/link";
export default function HowWorks() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <div className="about-area about-style-4 rainbow-section-gap">
        <div className="container">
          <div className="row row--40 align-items-center">
            <div className="col-lg-6">
              <div className="video-btn">
                <div className="video-popup icon-center">
                  <div className="overlay-content">
                    <div className="thumbnail">
                      <Image
                        className="radius-small"
                        alt="Video explicativo"
                        src="/assets/images/about/contact-image.jpg"
                        width={615}
                        height={560}
                      />
                    </div>
                    <div className="video-icon">
                      <a
                        className="btn-default rounded-player popup-video"
                        onClick={() => setOpen(true)}
                      >
                        <span>
                          <i className="feather-play" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="video-lightbox-wrapper" />
              </div>
            </div>
            <div className="col-lg-6 mt_md--40 mt_sm--40">
              <div className="content">
                <div className="inner">
                  <h3 className="title">
                    ¿Cómo funciona <strong>Astrobot?</strong>
                  </h3>
                  <ul className="feature-list">
                    <li>
                      <div className="icon">
                        <i className="feather-check" />
                      </div>
                      <div className="title-wrapper">
                        <h4 className="title">
                          Nuestro Chatbot es amigable y fácil de usar.
                        </h4>
                        <p className="text">
                          Una vez hayas pagado la suscripción. Simplemente,
                          ingresa tu consulta en el espacio provisto y en
                          segundos obtendrás una respuesta.
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <i className="feather-check" />
                      </div>
                      <div className="title-wrapper">
                        <h4 className="title">
                          ¿Tienes una pregunta más compleja o buscas una
                          consulta personalizada?
                        </h4>
                        <p className="text">
                          El Chatbot te guiará para ponerte en contacto con uno
                          de nuestros especialistas.
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <i className="feather-check" />
                      </div>
                      <div className="title-wrapper">
                        <h4 className="title">
                          ¿Cómo contratar los servicios de Astrobot®?
                        </h4>
                        <p className="text">
                          Si necesitas ayuda puedes ver sl siguiente video:
                        </p>
                      </div>
                    </li>
                  </ul>
                  <div className="about-btn mt--30">
                    <Link className="btn-default" href="/">
                      Contratar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalVideo
        channel="youtube"
        youtube={{ mute: 0, autoplay: 0 }}
        isOpen={isOpen}
        // videoId="tj9-MGHCs38"
        onClose={() => setOpen(false)}
      />
    </>
  );
}
