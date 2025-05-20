"use client";
import { menuItems } from "@/data/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Nav() {
  const pathname = usePathname();

  const isActiveParent = (menu) => {
    var isActive = false;
    if (menu.megamenuColumns) {
      menu.megamenuColumns.forEach((elm) => {
        if (elm.some((el) => el.href.split("/")[1] == pathname.split("/")[1])) {
          isActive = true;
        }
      });
    }
    if (menu.submenu) {
      if (
        menu.submenu.some(
          (el) => el.href.split("/")[1] == pathname.split("/")[1]
        )
      ) {
        isActive = true;
      }
    }
    return isActive;
  };

  return (
    <>
      {menuItems.map((item, index) => (
        <li
          key={index}
          className={`${
            item.hasMegamenu ? "with-megamenu has-menu-child-item " : ""
          } ${item.hasDropdown ? "has-droupdown has-menu-child-item" : ""} ${
            item.megamenuClass == "with-mega-item-2" ? "position-relative" : ""
          }`}
        >
          {item.href ? (
            <Link
              className={
                pathname.split("/")[1] == item.href.split("/")[1]
                  ? "active"
                  : ""
              }
              href={item.href}
            >
              {item.title}
            </Link>
          ) : (
            <a className={isActiveParent(item) ? "active" : ""}>{item.title}</a>
          )}
          {item.hasMegamenu && (
            <div className={`rainbow-megamenu ${item.megamenuClass}`}>
              <div className="wrapper">
                <div className="row row--0">
                  {item.megamenuColumns.map((column, colIndex) => (
                    <div key={colIndex} className={item.colclass}>
                      <ul className="mega-menu-item">
                        {column.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <Link
                              href={link.href}
                              className={
                                pathname.split("/")[1] ==
                                link.href.split("/")[1]
                                  ? "active"
                                  : ""
                              }
                            >
                              {link.label}
                              {link.badge && (
                                <span className="rainbow-badge-card">
                                  {link.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {item.hasDropdown && (
            <ul className="submenu">
              {item.submenu.map((submenuItem, submenuIndex) => (
                <li key={submenuIndex}>
                  <Link
                    className={
                      pathname.split("/")[1] == submenuItem.href.split("/")[1]
                        ? "active"
                        : ""
                    }
                    href={submenuItem.href}
                  >
                    {submenuItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </>
  );
}
