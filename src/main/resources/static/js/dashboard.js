// ============ 1. CỘT NHỎ TRONG 3 THẺ ============
document.querySelectorAll(".mini-bars").forEach(el => {
  const nums = el.dataset.bars.split(",").map(Number);
  const max = Math.max(...nums);
  el.innerHTML = nums.map(n => `<div style="height:${(n / max) * 100}%"></div>`).join("");
});


// ============ 2. BẬT / TẮT THIẾT BỊ  ============
// ============ 2. BẬT / TẮT THIẾT BỊ  ============
const LOADING_TIME = 500;   // thời gian quay (mili-giây). 500 = 0,5 giây

// Đổi màu biểu tượng đèn: đang bật thì xanh, đang tắt thì xám
function updateBulb(sw) {
  const bulb = sw.closest(".device").querySelector(".device-icon");
  bulb.classList.toggle("off", !sw.checked);
}

document.querySelectorAll(".switch input").forEach(sw => {
  updateBulb(sw);   // đặt màu ban đầu khi mở trang (Thiết bị 2 mặc định tắt nên sẽ xám)

  sw.addEventListener("change", () => {
    const box = sw.parentElement;                                   // thẻ <label class="switch">
    const status = document.getElementById("status" + sw.id.slice(-1));
    const state = sw.checked ? "bật" : "tắt";

    // bắt đầu loading: hiện vòng quay, khóa nút để không bấm liên tục
    box.classList.add("loading");
    sw.disabled = true;
    status.textContent = "Đang xử lý...";

    // sau 0,5 giây: tắt vòng quay, đổi màu đèn, cập nhật trạng thái
    setTimeout(() => {
      box.classList.remove("loading");
      sw.disabled = false;
      updateBulb(sw);
      status.textContent = "Đèn chiếu sáng - Đang " + state;
      showToast(sw.dataset.name + " đã " + state);
    }, LOADING_TIME);
  });
});
// ============ 3. BIỂU ĐỒ XU HƯỚNG ============
// min/max là thang đo của từng đường (chia đều thành 4 khoảng nên có 5 mức).
// Sửa số liệu ở values; nếu đổi số liệu vượt thang thì sửa min/max cho phù hợp.
const chartData = {
  labels: ["00:00","02:00","04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"],
  series: [
    { name: "Ánh sáng", unit: " Lux", color: "#f59e0b", min: 0,  max: 1000, values: [20, 15, 60, 300, 520, 680, 820, 900, 760, 480, 220, 90] },
    { name: "Nhiệt độ", unit: "°C",   color: "#ef4444", min: 20, max: 36,   values: [24, 23.5, 23, 25, 27.5, 30, 32, 33, 31.5, 29, 26.5, 25] },
    { name: "Độ ẩm",    unit: "%",    color: "#3b82f6", min: 40, max: 100,  values: [82, 84, 86, 78, 70, 62, 56, 52, 58, 66, 74, 79] },
  ],
};

// Đường cong mượt (Catmull-Rom -> Bezier)
function smoothPath(pts) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}

function drawChart() {
  const box = document.getElementById("chart");
  const W = box.clientWidth, H = box.clientHeight;
  const pad = { l: 56, r: 104, t: 30, b: 30 };     // l: chừa cột Ánh sáng, r: chừa 2 cột Nhiệt độ + Độ ẩm
  const n = chartData.labels.length;
  const stepX = (W - pad.l - pad.r) / (n - 1);
  const innerH = H - pad.t - pad.b;
  const X = i => pad.l + i * stepX;
  const STEPS = 4;                                   // 4 khoảng = 5 đường kẻ ngang

  // đổi giá trị -> toạ độ y theo đúng thang min..max của từng đường
  const lines = chartData.series.map(s =>
      s.values.map((v, i) => ({ x: X(i), y: pad.t + (1 - (v - s.min) / (s.max - s.min)) * innerH }))
  );

  let svg = `<svg width="${W}" height="${H}">`;

  // đường kẻ ngang + số trên 3 cột thang đo
  for (let g = 0; g <= STEPS; g++) {
    const y = pad.t + (innerH / STEPS) * g;
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="#e5e7eb"/>`;

    chartData.series.forEach((s, k) => {
      const tick = s.max - ((s.max - s.min) / STEPS) * g;           // giá trị của mức này
      const label = Number.isInteger(tick) ? tick : tick.toFixed(1);
      // k = 0: cột trái (Ánh sáng); k = 1, 2: hai cột phải (Nhiệt độ, Độ ẩm)
      const x = k === 0 ? pad.l - 8 : W - pad.r + 8 + (k - 1) * 48;
      const anchor = k === 0 ? "end" : "start";
      svg += `<text x="${x}" y="${y + 4}" font-size="11" font-weight="600" fill="${s.color}" text-anchor="${anchor}">${label}</text>`;
    });
  }

  // tên đơn vị phía trên mỗi cột
  chartData.series.forEach((s, k) => {
    const x = k === 0 ? pad.l - 8 : W - pad.r + 8 + (k - 1) * 48;
    const anchor = k === 0 ? "end" : "start";
    svg += `<text x="${x}" y="12" font-size="11" fill="${s.color}" text-anchor="${anchor}">${s.unit.trim()}</text>`;
  });

  // nhãn giờ
  chartData.labels.forEach((t, i) => {
    svg += `<text x="${X(i)}" y="${H - 8}" font-size="11" fill="#9ca3af" text-anchor="middle">${t}</text>`;
  });

  // vùng tô + đường
  chartData.series.forEach((s, k) => {
    const d = smoothPath(lines[k]);
    svg += `<path d="${d} L${X(n - 1)},${pad.t + innerH} L${X(0)},${pad.t + innerH} Z" fill="${s.color}" opacity="0.06"/>`;
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round"/>`;
  });

  // đường dọc + chấm khi rê chuột
  svg += `<line id="cross" y1="${pad.t}" y2="${pad.t + innerH}" stroke="#cbd5e1" stroke-dasharray="4" style="display:none"/>`;
  chartData.series.forEach(s => {
    svg += `<circle class="dot" r="5" fill="#fff" stroke="${s.color}" stroke-width="2.5" style="display:none"/>`;
  });
  svg += `</svg><div class="tooltip" id="tip"></div>`;
  box.innerHTML = svg;

  const cross = box.querySelector("#cross"), dots = box.querySelectorAll(".dot"), tip = box.querySelector("#tip");

  box.onmousemove = e => {
    const mx = e.clientX - box.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(n - 1, Math.round((mx - pad.l) / stepX)));
    cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.style.display = "";
    dots.forEach((c, k) => { c.setAttribute("cx", lines[k][i].x); c.setAttribute("cy", lines[k][i].y); c.style.display = ""; });
    tip.innerHTML = `<b>${chartData.labels[i]}</b>` + chartData.series.map(s =>
        `<br><span style="color:${s.color}">●</span> ${s.name}: <b>${s.values[i]}${s.unit}</b>`).join("");
    tip.style.display = "block";
    tip.style.left = (X(i) > W - pad.r - 150 ? X(i) - 160 : X(i) + 14) + "px";
    tip.style.top = pad.t + "px";
  };
  box.onmouseleave = () => {
    cross.style.display = "none"; tip.style.display = "none";
    dots.forEach(c => c.style.display = "none");
  };
}
drawChart();
window.addEventListener("resize", drawChart);