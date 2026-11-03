// ===== MENU BÊN TRÁI: thêm/sửa/xóa mục menu ở đây =====
const MENU = [
  { href: "index.html",   label: "Dashboard",        icon: "grid" },
  { href: "sensors.html", label: "Dữ liệu cảm biến", icon: "chip" },
  { href: "history.html", label: "Lịch sử",          icon: "clock" },
  { href: "account.html", label: "Tài khoản",        icon: "user" },
];

// ===== ICON (SVG) =====
const ICONS = {
  grid:   '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chip:   '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  bulb:   '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  temp:   '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
  drop:   '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  filter: '<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sort:   '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
  down:   '<path d="M6 9l6 6 6-6"/>',
  upload: '<path d="M7 18a5 5 0 0 1-.5-9.9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H16M12 12v8M9 15l3-3 3 3"/>',
  link:   '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  file:   '<path d="M6 2h8l5 5v15H6zM14 2v5h5"/>',
  device: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="3"/>',
};
function icon(name) {
  return '<svg class="ico" viewBox="0 0 24 24">' + ICONS[name] + '</svg>';
}
function fillIcons() {
  document.querySelectorAll("[data-icon]").forEach(el => el.innerHTML = icon(el.dataset.icon));
}

// ===== VẼ SIDEBAR =====
(function () {
  const page = location.pathname.split("/").pop() || "index.html";
  const links = MENU.map(m =>
    `<a href="${m.href}" class="${m.href === page ? "active" : ""}">${icon(m.icon)}<span>${m.label}</span></a>`
  ).join("");
  document.getElementById("sidebar").innerHTML =
    `<div class="logo"><div class="logo-icon">${icon("bolt")}</div><div><b>Smart Sensor</b><small>IOT ECOSYSTEM</small></div></div>
     <nav class="menu">${links}</nav>`;
})();

// ===== THÔNG BÁO NHỎ GÓC PHẢI =====
function showToast(msg, isError) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.toggle("error", !!isError);
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ===== ĐỊNH DẠNG NGÀY GIỜ: dd/mm/yyyy hh:mm =====
function formatTime(d) {
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

fillIcons();
