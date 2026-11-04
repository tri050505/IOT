// ============ 1. SỐ LIỆU 3 Ô (cập nhật mỗi 2 giây) ============
async function loadLatest() {
  try {
    const d = await api("/api/sensors/latest");
    if (!d.hasData) return;
    document.getElementById("lightVal").textContent = Math.round(d.light) + " Lux";

    const dhtError = d.temperature === 0 && d.humidity === 0;   // DHT11 đọc lỗi
    document.getElementById("tempVal").textContent = dhtError ? "Lỗi" : d.temperature.toFixed(1) + "°C";
    document.getElementById("humVal").textContent = dhtError ? "Lỗi" : Math.round(d.humidity) + "%";
  } catch (e) { console.log(e); }
}
loadLatest();
setInterval(loadLatest, 2000);

// ============ 2. BẬT / TẮT THIẾT BỊ ============
// Đổi màu bóng đèn: đang bật thì xanh, đang tắt thì xám
function updateBulb(sw) {
  sw.closest(".device").querySelector(".device-icon").classList.toggle("off", !sw.checked);
}

function setStatusText(sw) {
  document.getElementById("status" + sw.id.slice(-1)).textContent =
      "Đèn chiếu sáng - Đang " + (sw.checked ? "bật" : "tắt");
}

// Nạp trạng thái 2 đèn từ server (khi mở trang và mỗi 5 giây)
async function loadDevices() {
  try {
    const list = await api("/api/devices");
    list.forEach(dv => {
      const sw = document.getElementById("dev" + dv.code.slice(-1));   // LED1 -> dev1
      if (!sw || sw.disabled) return;                                   // đang xử lý thì bỏ qua
      sw.checked = dv.on;
      updateBulb(sw);
      setStatusText(sw);
    });
  } catch (e) { console.log(e); }
}
loadDevices();
setInterval(loadDevices, 5000);

// Bấm công tắc: gọi API, chờ ESP phản hồi (vòng quay chính là thời gian chờ thật)
document.querySelectorAll(".switch input").forEach(sw => {
  sw.addEventListener("change", async () => {
    const box = sw.parentElement;
    const wantOn = sw.checked;

    box.classList.add("loading");
    sw.disabled = true;
    document.getElementById("status" + sw.id.slice(-1)).textContent = "Đang xử lý...";

    try {
      const r = await api("/api/devices/LED" + sw.id.slice(-1) + "/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: wantOn })
      });
      if (r.success) {
        showToast(sw.dataset.name + " đã " + (wantOn ? "bật" : "tắt"));
      } else {
        sw.checked = !wantOn;                  // thất bại: trả công tắc về vị trí cũ
        showToast(r.message, true);
      }
    } catch (e) {
      sw.checked = !wantOn;
      showToast("Không kết nối được server", true);
    }

    box.classList.remove("loading");
    sw.disabled = false;
    updateBulb(sw);
    setStatusText(sw);
  });
});

// ============ 3. BIỂU ĐỒ XU HƯỚNG ============
// min/max là thang đo của từng cột (chia 4 khoảng nên có 5 mức).
// Giá trị vượt thang sẽ bị chặn ở mép biểu đồ.
const chartData = {
  labels: [],
  series: [
    { name: "Ánh sáng", unit: " Lux", color: "#f59e0b", min: 0,  max: 1024, values: [] },
    { name: "Nhiệt độ", unit: "°C",   color: "#ef4444", min: 20, max: 40,   values: [] },
    { name: "Độ ẩm",    unit: "%",    color: "#3b82f6", min: 20, max: 100,  values: [] },
  ],
};

// Lấy dữ liệu biểu đồ từ server (mỗi 60 giây)
async function loadChart() {
  try {
    const c = await api("/api/sensors/chart");
    chartData.labels = c.labels;
    chartData.series[0].values = c.light;
    chartData.series[1].values = c.temperature;
    chartData.series[2].values = c.humidity;
    drawChart();
  } catch (e) { console.log(e); }
}

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
  const n = chartData.labels.length;

  // Chưa đủ dữ liệu thì báo, không vẽ
  if (n < 2) {
    box.innerHTML = '<p class="chart-note" style="padding:100px 0;text-align:center">Chưa đủ dữ liệu để vẽ biểu đồ (cần dữ liệu của ít nhất 2 mốc giờ).</p>';
    return;
  }

  const W = box.clientWidth, H = box.clientHeight;
  const pad = { l: 56, r: 104, t: 30, b: 30 };     // l: cột Ánh sáng, r: 2 cột Nhiệt độ + Độ ẩm
  const stepX = (W - pad.l - pad.r) / (n - 1);
  const innerH = H - pad.t - pad.b;
  const X = i => pad.l + i * stepX;
  const STEPS = 4;                                   // 4 khoảng = 5 đường kẻ ngang

  // đổi giá trị -> toạ độ y theo thang min..max của từng đường (chặn trong khung)
  const lines = chartData.series.map(s =>
      s.values.map((v, i) => {
        const r = Math.max(0, Math.min(1, (v - s.min) / (s.max - s.min)));
        return { x: X(i), y: pad.t + (1 - r) * innerH };
      })
  );

  let svg = `<svg width="${W}" height="${H}">`;

  // đường kẻ ngang + số trên 3 cột thang đo
  for (let g = 0; g <= STEPS; g++) {
    const y = pad.t + (innerH / STEPS) * g;
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="#e5e7eb"/>`;

    chartData.series.forEach((s, k) => {
      const tick = s.max - ((s.max - s.min) / STEPS) * g;
      const label = Number.isInteger(tick) ? tick : tick.toFixed(1);
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
loadChart();
setInterval(loadChart, 60000);
window.addEventListener("resize", drawChart);