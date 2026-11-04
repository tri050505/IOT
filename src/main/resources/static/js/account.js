const MAX_SIZE = 10 * 1024 * 1024;   // 10MB - sửa giới hạn dung lượng ở đây
let selectedFile = null;             // file vừa chọn, chưa lưu
let savedPdfName = "";               // tên file đã lưu trên server

const $ = id => document.getElementById(id);
const dropzone = $("dropzone"), input = $("pdfInput");

// ----- Mở hộp thoại chọn file khi bấm vào vùng upload -----
dropzone.addEventListener("click", () => input.click());
input.addEventListener("change", () => { if (input.files[0]) chooseFile(input.files[0]); });

// ----- Kéo thả file -----
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("over"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("over"));
dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.classList.remove("over");
  if (e.dataTransfer.files[0]) chooseFile(e.dataTransfer.files[0]);
});

// ----- Hiển thị khung thông tin file (file vừa chọn hoặc file đã lưu trên server) -----
function renderFile() {
  if (selectedFile) {
    $("fileName").textContent = selectedFile.name;
    $("fileSize").textContent = (selectedFile.size / 1024 / 1024).toFixed(2) + " MB (chưa lưu)";
    $("fileView").href = URL.createObjectURL(selectedFile);
    $("fileRemove").hidden = false;
    $("fileItem").hidden = false;
  } else if (savedPdfName) {
    $("fileName").textContent = savedPdfName;
    $("fileSize").textContent = "Đã lưu trên server";
    $("fileView").href = API_URL + "/api/account/pdf";
    $("fileRemove").hidden = true;
    $("fileItem").hidden = false;
  } else {
    $("fileItem").hidden = true;
  }
}

// ----- Kiểm tra file vừa chọn -----
function chooseFile(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("Chỉ chấp nhận file PDF", true); return;
  }
  if (file.size > MAX_SIZE) {
    showToast("File vượt quá 10MB", true); return;
  }
  selectedFile = file;
  renderFile();
  showToast("Đã chọn file " + file.name + ". Bấm Lưu thay đổi để tải lên");
}

$("fileRemove").addEventListener("click", () => {
  selectedFile = null;
  input.value = "";
  renderFile();
});

// ----- Lưu thay đổi: lưu 3 link rồi upload file (nếu có chọn file mới) -----
$("saveBtn").addEventListener("click", async () => {
  const github = $("github").value.trim();
  const figma = $("figma").value.trim();
  const postman = $("postman").value.trim();

  if (github && !github.startsWith("http")) { showToast("Link GitHub phải bắt đầu bằng http", true); return; }
  if (figma && !figma.startsWith("http")) { showToast("Link Figma phải bắt đầu bằng http", true); return; }
  if (postman && !postman.startsWith("http")) { showToast("Link Postman phải bắt đầu bằng http", true); return; }

  try {
    await api("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github, figma, postman })
    });

    if (selectedFile) {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const r = await api("/api/account/upload", { method: "POST", body: fd });
      savedPdfName = r.pdfName;
      selectedFile = null;
      input.value = "";
      renderFile();
    }
    showToast("Đã lưu thay đổi");
  } catch (e) {
    showToast("Lưu thất bại: " + e.message, true);
  }
});

// ----- Nạp dữ liệu từ server khi mở trang -----
api("/api/account")
    .then(a => {
      $("github").value = a.github || "";
      $("figma").value = a.figma || "";
      $("postman").value = a.postman || "";
      savedPdfName = a.pdfName || "";
      renderFile();
    })
    .catch(() => showToast("Không tải được thông tin tài khoản", true));