// ===== DANH SÁCH THIẾT BỊ =====
const devices = ["Đèn LED 1", "Đèn LED 2"];

// ===== DỮ LIỆU MẪU: 120 bản ghi, mỗi bản ghi cách nhau 5 phút =====
const historyData = [];
let t = new Date(2026, 7, 18, 8, 15);
for (let i = 1; i <= 120; i++) {
  historyData.push({
    id: "#" + i,
    device: devices[Math.floor((i - 1) / 2) % devices.length],
    status: (i % 7 === 3 || i % 11 === 0) ? "Thất bại"
        : (i % 5 === 0) ? "Đang xử lý"
            : "Thành công",
    action: i % 2 === 1 ? "Bật thiết bị" : "Tắt thiết bị",
    time: formatTime(t),
    ts: t.getTime(),
  });
  t = new Date(t.getTime() + 5 * 60000);
}

// ===== MÀU NHÃN TRẠNG THÁI =====
const statusClass = { "Thành công": "ok", "Thất bại": "fail", "Đang xử lý": "wait" };

// ===== CẤU HÌNH BẢNG =====
// Không còn searchOptions, nên ô tìm kiếm mặc định tìm theo THỜI GIAN.
createDataTable({
  data: historyData,
  pageSize: 10,

  // 3 dropdown lọc nhanh phía trên bảng
  filterDropdowns: [
    { key: "device", allLabel: "Tất cả thiết bị",   options: ["Đèn LED 1", "Đèn LED 2"] },
    { key: "status", allLabel: "Tất cả trạng thái", options: ["Thành công", "Thất bại", "Đang xử lý"] },
    { key: "action", allLabel: "Tất cả hành động",  options: ["Bật thiết bị", "Tắt thiết bị"] },
  ],

  columns: [
    { key: "id",     label: "ID",         render: v => `<b>${v}</b>` },
    { key: "device", label: "Thiết bị",   filter: true, render: v => `<div class="cell-flex">${icon("device")}<b>${v}</b></div>` },
    { key: "status", label: "Trạng thái", filter: true, render: v => `<span class="badge ${statusClass[v]}">${v}</span>` },
    { key: "action", label: "Hành động",  filter: true },
    { key: "time",   label: "Thời gian" },
  ],
});