"use client";
import React, { useRef, useState } from "react";

import emailjs from "@emailjs/browser";

const Result = ({ success }) => {
  return success ? (
    <p className="success-message">
      Tu mensaje ha sido enviado exitosamente. Nos pondremos en contacto contigo
      pronto.
    </p>
  ) : (
    <p className="error-message">
      Hubo un problema al enviar tu mensaje. Por favor intenta nuevamente.
    </p>
  );
};
export default function Contact() {
  const [result, showResult] = useState({ show: false, success: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef();

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    emailjs
      .sendForm(serviceId, templateId, formRef.current, { publicKey })
      .then(
        (result) => {
          showResult({ show: true, success: true });
          e.target.reset();
        },
        (error) => {
          console.log("Error sending email:", error.text);
          showResult({ show: true, success: false });
        }
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Usar useEffect para el timer
  React.useEffect(() => {
    let timer;
    if (result.show) {
      timer = setTimeout(() => {
        showResult({ show: false, success: false });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [result.show]);

  return (
    <div className="main-content">
      <div className="rainbow-contact-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 mb--40">
              <div
                className="section-title text-center"
                data-sal="slide-up"
                data-sal-duration={700}
                data-sal-delay={100}
              >
                <h4 className="subtitle">
                  <span className="theme-gradient">Formulario de contacto</span>
                </h4>
                <h2 className="title w-600 mb--20">
                  Si tienes alguna consulta o necesidad especial no dudes en
                  escribirnos.
                </h2>
              </div>
            </div>
          </div>
          <div className="row row--15">
            <div className="col-lg-12">
              <div className="rainbow-contact-address mt_dec--30">
                <div className="row">
                  <div className="col-lg-4 col-md-6 col-12">
                    <div className="rainbow-address">
                      <div className="icon">
                        <i className="feather-headphones" />
                      </div>
                      <div className="inner">
                        <h4 className="title">Números de contacto</h4>
                        <p>
                          <a href="tel:+444555666777">+56 5555 6666</a>
                        </p>
                        <p>
                          <a href="tel:+222222222333">+56 2222 3333</a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 col-12">
                    <div className="rainbow-address">
                      <div className="icon">
                        <i className="feather-mail" />
                      </div>
                      <div className="inner">
                        <h4 className="title">Direcciones de correo</h4>
                        <p>
                          <a href="mailto:admin@gmail.com">email@taxlight.cl</a>
                        </p>
                        <p>
                          <a href="mailto:example@gmail.com">
                            email@grupowolf.cl
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 col-12">
                    <div className="rainbow-address">
                      <div className="icon">
                        <i className="feather-map-pin" />
                      </div>
                      <div className="inner">
                        <h4 className="title">Dirección</h4>
                        <p>
                          Camino el Alba 8760, of. 602 <br />
                          Las Condes, Santiago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row mt--40 row--15">
            <div className="col-lg-7">
              <form
                ref={formRef}
                className="contact-form-1 rainbow-dynamic-form"
                onSubmit={sendEmail}
              >
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Tu Nombre"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    placeholder="Número de teléfono"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Tu Email"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="Tu asunto"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    id="message"
                    placeholder="Tu mensaje"
                    required
                    defaultValue={""}
                  />
                </div>
                <div className="form-group">
                  <button
                    name="submit"
                    type="submit"
                    id="submit"
                    className="btn-default btn-large rainbow-btn"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? "Enviando..." : "Enviar"}</span>
                  </button>
                </div>
                <div className="form-group">
                  {result.show && <Result success={result.success} />}
                </div>
              </form>
            </div>
            <div className="col-lg-5 mt_md--30 mt_sm--30">
              <div className="google-map-style-1">
                <iframe
                  src="https://maps.google.com/maps?q=Camino+el+Alba+8760,+of.+602,+Las+Condes,+Santiago,+Chile&z=16&output=embed"
                  width={600}
                  height={550}
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
