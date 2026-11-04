// ===== MÀU NHÃN TRẠNG THÁI =====
const statusClass = { "Thành công": "ok", "Thất bại": "fail", "Đang xử lý": "wait" };

// ===== LẤY DỮ LIỆU TỪ BACKEND RỒI VẼ BẢNG =====
api("/api/history")
    .then(historyData => {
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
          {
            key: "time",
            label: "Thời gian",
            render: v => `
    <div class="time-cell">
      <span>${v}</span>
      <button class="copy-time-btn"
              type="button"
              data-copy-time="${v}">
        Copy
      </button>
    </div>
  `
          },,
        ],
      });
    })
    .catch(() => showToast("Không tải được dữ liệu từ server", true));