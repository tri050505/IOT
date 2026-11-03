// ===== LOẠI CẢM BIẾN (tiếng Việt) =====
const sensorTypes = [
  { name: "Ánh sáng", unit: " Lux" },
  { name: "Nhiệt độ", unit: "°C" },
  { name: "Độ ẩm",    unit: "%" },
];

// ===== DỮ LIỆU MẪU: 120 bản ghi, mỗi bản ghi cách nhau 7 phút =====
const sensorData = [];
let t = new Date(2026, 7, 18, 8, 15);          // 18/08/2026 08:15
for (let i = 1; i <= 120; i++) {
  const k = (i - 1) % 3;                        // 0: Ánh sáng, 1: Nhiệt độ, 2: Độ ẩm
  const type = sensorTypes[k];
  let value;
  if (k === 0)      value = 250 + ((i * 7) % 12) * 20;
  else if (k === 1) value = (27 + ((i * 3) % 15) / 10).toFixed(1);
  else              value = 60 + ((i * 5) % 12);

  sensorData.push({
    id: "#" + i,                                // ID bắt đầu từ #1
    type: type.name,
    value: value + type.unit,
    status: i % 17 === 0 ? "Ngừng hoạt động" : i % 23 === 0 ? "Lỗi" : "Hoạt động",
    time: formatTime(t),
    ts: t.getTime(),
  });
  t = new Date(t.getTime() + 7 * 60000);
}

// ===== MÀU NHÃN TRẠNG THÁI =====
const statusClass = { "Hoạt động": "ok", "Ngừng hoạt động": "off", "Lỗi": "fail" };

// ===== CÁC CỘT CỦA BẢNG =====
createDataTable({
  data: sensorData,
  pageSize: 10,
  searchOptions: [
    { label: "Nhiệt độ",  placeholder: "Nhập giá trị nhiệt độ, ví dụ 28...", get: r => r.type === "Nhiệt độ" ? r.value : null },
    { label: "Độ ẩm",     placeholder: "Nhập giá trị độ ẩm, ví dụ 65...",    get: r => r.type === "Độ ẩm"    ? r.value : null },
    { label: "Ánh sáng",  placeholder: "Nhập giá trị ánh sáng, ví dụ 350...", get: r => r.type === "Ánh sáng" ? r.value : null },
    { label: "Thời gian", placeholder: "Tìm kiếm theo thời gian...",         get: r => r.time },
  ],
  columns: [
    { key: "id",     label: "ID",            render: v => `<b>${v}</b>` },
    { key: "type",   label: "Loại cảm biến", filter: true },   // chỉ hiện tên, không icon
    { key: "value",  label: "Giá trị",       filter: true, render: v => `<b>${v}</b>` },
    { key: "status", label: "Trạng thái",    filter: true, render: v => `<span class="badge ${statusClass[v]}">${v}</span>` },
    { key: "time",   label: "Thời gian" },
  ],
});