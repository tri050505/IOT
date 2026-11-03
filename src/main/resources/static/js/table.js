// Bảng dùng chung cho trang "Dữ liệu cảm biến" và "Lịch sử".
// Có: tìm kiếm (theo dropdown), sắp xếp thời gian, lọc theo từng cột, dropdown lọc nhanh, phân trang, chọn số dòng mỗi trang.
//
// cfg = { data, columns, pageSize, pageSizeOptions, searchOptions, filterDropdowns }
// column = { key: "tên trường", label: "Tiêu đề", filter: true/false, render: (giá trị, dòng) => "html" }

function createDataTable(cfg) {
  const state = { page: 1, order: "asc", search: "", mode: 0, pageSize: cfg.pageSize || 10, filters: {} };
  const $ = id => document.getElementById(id);

  // ---------- Tiêu đề cột + nút lọc ----------
  $("thead").innerHTML = "<tr>" + cfg.columns.map(c =>
      `<th>${c.label}${c.filter ? `<button class="filter-btn" data-key="${c.key}">${icon("filter")}</button>` : ""}</th>`
  ).join("") + "</tr>";

  // ---------- Lấy dữ liệu sau khi tìm kiếm + lọc + sắp xếp ----------
  function getRows() {
    const kw = state.search.trim().toLowerCase();
    const opt = cfg.searchOptions ? cfg.searchOptions[state.mode] : null;   // lựa chọn dropdown đang chọn

    const rows = cfg.data.filter(r => {
      // 1) Tìm kiếm: chỉ so từ khoá với đúng giá trị mà dropdown đang chọn
      let okSearch = true;
      if (kw !== "") {
        const text = opt ? opt.get(r) : r.time;        // không có dropdown thì tìm theo thời gian như cũ
        okSearch = text !== null && text.toLowerCase().includes(kw);
      }
      // 2) Lọc theo cột (phễu và dropdown lọc nhanh dùng chung state.filters)
      const okFilter = Object.entries(state.filters).every(([key, val]) => String(r[key]) === val);
      return okSearch && okFilter;
    });

    rows.sort((a, b) => state.order === "desc" ? b.ts - a.ts : a.ts - b.ts);
    return rows;
  }

  // ---------- Vẽ bảng ----------
  function render() {
    const rows = getRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageRows = rows.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    $("tbody").innerHTML = pageRows.length
        ? pageRows.map(r => "<tr>" + cfg.columns.map(c =>
            `<td>${c.render ? c.render(r[c.key], r) : r[c.key]}</td>`).join("") + "</tr>").join("")
        : `<tr><td class="empty" colspan="${cfg.columns.length}">Không tìm thấy bản ghi phù hợp</td></tr>`;

    $("info").textContent = `Hiển thị ${pageRows.length}/${rows.length} bản ghi`;
    renderPager(totalPages);

    // tô xanh nút lọc đang được dùng
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("on", b.dataset.key in state.filters));
    // đồng bộ các dropdown lọc nhanh với bộ lọc hiện tại
    document.querySelectorAll(".filter-select").forEach(s => s.value = state.filters[s.dataset.key] || "");
  }

  // ---------- Phân trang: Trước 1 2 3 ... 12 Sau ----------
  function renderPager(total) {
    const cur = state.page;
    const nums = [...new Set([1, 2, 3, cur - 1, cur, cur + 1, total])]
        .filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    let html = `<button data-page="${cur - 1}" ${cur === 1 ? "disabled" : ""}>Trước</button>`;
    nums.forEach((p, i) => {
      if (i > 0 && p - nums[i - 1] > 1) html += "<span>...</span>";
      html += `<button data-page="${p}" class="${p === cur ? "active" : ""}">${p}</button>`;
    });
    html += `<button data-page="${cur + 1}" ${cur === total ? "disabled" : ""}>Sau</button>`;
    $("pager").innerHTML = html;
  }
  $("pager").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page);
    render();
  });

  // ---------- Ô tìm kiếm ----------
  $("searchInput").addEventListener("input", e => {
    state.search = e.target.value;
    state.page = 1;
    render();
  });

  // ---------- Dropdown chọn tìm kiếm theo giá trị nào ----------
  const modeSelect = $("searchMode");
  if (modeSelect && cfg.searchOptions) {
    modeSelect.innerHTML = cfg.searchOptions.map((o, i) => `<option value="${i}">${o.label}</option>`).join("");
    $("searchInput").placeholder = cfg.searchOptions[0].placeholder;

    modeSelect.addEventListener("change", () => {
      state.mode = Number(modeSelect.value);
      $("searchInput").placeholder = cfg.searchOptions[state.mode].placeholder;
      state.page = 1;
      render();
    });
  }

  // ---------- Các dropdown lọc nhanh phía trên bảng (Thiết bị, Trạng thái, Hành động) ----------
  const filterBar = $("filterBar");
  if (filterBar && cfg.filterDropdowns) {
    filterBar.innerHTML = cfg.filterDropdowns.map(f => {
      // nếu không khai báo options thì tự lấy các giá trị khác nhau trong dữ liệu
      const opts = f.options || [...new Set(cfg.data.map(r => String(r[f.key])))];
      return `<select class="select-box filter-select" data-key="${f.key}">` +
          `<option value="">${f.allLabel}</option>` +
          opts.map(o => `<option value="${o}">${o}</option>`).join("") +
          `</select>`;
    }).join("");

    filterBar.querySelectorAll(".filter-select").forEach(sel => {
      sel.addEventListener("change", () => {
        if (sel.value === "") delete state.filters[sel.dataset.key];   // chọn "Tất cả" thì bỏ lọc
        else state.filters[sel.dataset.key] = sel.value;
        state.page = 1;
        render();
      });
    });
  }

  // ---------- Dropdown chọn số dòng mỗi trang (page size) ----------
  const sizeSelect = $("pageSizeSelect");
  if (sizeSelect) {
    const sizes = cfg.pageSizeOptions || [5, 10, 20, 50];     // các lựa chọn, sửa ở đây
    sizeSelect.innerHTML = sizes.map(n =>
        `<option value="${n}" ${n === state.pageSize ? "selected" : ""}>${n} dòng/trang</option>`).join("");

    sizeSelect.addEventListener("change", () => {
      state.pageSize = Number(sizeSelect.value);
      state.page = 1;                                          // đổi cỡ trang thì về trang 1
      render();
    });
  }

  // ---------- Dropdown sắp xếp thời gian ----------
  const sortBox = $("sortDropdown");
  $("sortBtn").addEventListener("click", e => { e.stopPropagation(); closeFilter(); sortBox.classList.toggle("open"); });
  sortBox.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", () => {
      state.order = item.dataset.order;
      sortBox.querySelectorAll(".dropdown-item").forEach(i => i.classList.toggle("active", i === item));
      sortBox.classList.remove("open");
      state.page = 1;
      render();
    });
  });

  // ---------- Popup lọc theo cột ----------
  const popup = document.createElement("div");
  popup.className = "filter-popup";
  document.body.appendChild(popup);

  function closeFilter() { popup.classList.remove("show"); }

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      sortBox.classList.remove("open");
      const key = btn.dataset.key;

      // các giá trị khác nhau của cột này
      const values = [...new Set(cfg.data.map(r => String(r[key])))]
          .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));

      popup.innerHTML = "";
      ["Tất cả", ...values].forEach((v, i) => {
        const item = document.createElement("div");
        const selected = i === 0 ? !(key in state.filters) : state.filters[key] === v;
        item.className = "dropdown-item" + (selected ? " active" : "");
        item.textContent = v;
        item.addEventListener("click", () => {
          if (i === 0) delete state.filters[key]; else state.filters[key] = v;
          state.page = 1;
          closeFilter();
          render();
        });
        popup.appendChild(item);
      });

      const r = btn.getBoundingClientRect();
      popup.style.left = (r.left + window.scrollX) + "px";
      popup.style.top = (r.bottom + window.scrollY + 6) + "px";
      popup.classList.add("show");
    });
  });

  // bấm ra ngoài thì đóng các menu
  document.addEventListener("click", e => {
    if (!popup.contains(e.target)) closeFilter();
    sortBox.classList.remove("open");
  });

  render();
}