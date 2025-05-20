"use client";
import React from "react";

export default function Login() {
  return (
    <div className="rainbow-prfile-area rainbow-section-gap">
      <div className="container">
        <div className="row gy-5 row--30">
          <div className="col-lg-6">
            <div className="edu-contact-form contact-form-style-1 w-100">
              <div className="section-title">
                <h2 className="title w-600 mb--40">Login</h2>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="w-100">
                <div className="form-group position-relative">
                  <label>Username or email *</label>
                  <input required name="con_name" type="email" />
                  <span className="focus-border" />
                </div>
                <div className="form-group position-relative">
                  <label>Password *</label>
                  <input required name="con_email" type="password" />
                  <span className="focus-border" />
                </div>
                <div className="row mb--30">
                  <div className="col-lg-6">
                    <div className="edu-checkbox">
                      <input
                        type="checkbox"
                        id="rememberme"
                        name="rememberme"
                      />
                      <label htmlFor="rememberme">Remember me</label>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="edu-lost-password text-end">
                      <a className="btn-read-more" href="#">
                        <span>Lost your password?</span>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="form-submit-group">
                  <button type="submit" className="btn-default btn-large w-100">
                    Log In <i className="feather-arrow-right" />
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="edu-contact-form contact-form-style-1 w-100">
              <div className="section-title">
                <h2 className="title w-600 mb--40">Register</h2>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="w-100">
                <div className="form-group position-relative">
                  <label>Email address *</label>
                  <input required name="register-email" type="email" />
                  <span className="focus-border" />
                </div>
                <div className="form-group position-relative">
                  <label>Username *</label>
                  <input required name="register_user" type="text" />
                  <span className="focus-border" />
                </div>
                <div className="form-group position-relative">
                  <label>Password *</label>
                  <input required name="register_password" type="password" />
                  <span className="focus-border" />
                </div>
                <div className="form-group position-relative">
                  <label>Confirm Password *</label>
                  <input required name="register_conpassword" type="password" />
                  <span className="focus-border" />
                </div>
                <div className="form-submit-group">
                  <button type="submit" className="btn-default btn-large w-100">
                    Register <i className="feather-arrow-right" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
