// ===== MÀU NHÃN TRẠNG THÁI =====
const statusClass = {
    "Hoạt động": "ok",
    "Ngừng hoạt động": "off",
    "Lỗi": "fail"
};

// ===== LẤY DỮ LIỆU TỪ BACKEND RỒI VẼ BẢNG =====
api("/api/sensors")
    .then(sensorData => {
        createDataTable({
            data: sensorData,
            pageSize: 10,

            // Dropdown chọn tìm kiếm theo giá trị nào
            searchOptions: [
                {
                    label: "Nhiệt độ",
                    placeholder: "Nhập giá trị nhiệt độ, ví dụ 28...",
                    get: r => r.type === "Nhiệt độ" ? String(r.value) : null
                },
                {
                    label: "Độ ẩm",
                    placeholder: "Nhập giá trị độ ẩm, ví dụ 65...",
                    get: r => r.type === "Độ ẩm" ? String(r.value) : null
                },
                {
                    label: "Ánh sáng",
                    placeholder: "Nhập giá trị ánh sáng, ví dụ 350...",
                    get: r => r.type === "Ánh sáng" ? String(r.value) : null
                },
                {
                    label: "Thời gian",
                    placeholder: "Tìm kiếm theo thời gian...",
                    get: r => r.time
                }
            ],

            columns: [
                {
                    key: "id",
                    label: "ID",
                    render: v => `<b>${v}</b>`
                },
                {
                    key: "type",
                    label: "Loại cảm biến",
                    filter: true
                },
                {
                    key: "value",
                    label: "Giá trị",
                    filter: true,
                    render: v => `<b>${v}</b>`
                },
                {
                    key: "status",
                    label: "Trạng thái",
                    filter: true,
                    render: v => `<span class="badge ${statusClass[v]}">${v}</span>`
                },
                {
                    key: "time",
                    label: "Thời gian",
                    render: v => v
                }
            ]
        });
    })
    .catch(() => showToast("Không tải được dữ liệu từ server", true));