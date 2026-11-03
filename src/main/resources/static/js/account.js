const MAX_SIZE = 10 * 1024 * 1024;   // 10MB - sửa giới hạn dung lượng ở đây
let selectedFile = null;

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

// ----- Kiểm tra và hiển thị file đã chọn -----
function chooseFile(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("Chỉ chấp nhận file PDF", true); return;
  }
  if (file.size > MAX_SIZE) {
    showToast("File vượt quá 10MB", true); return;
  }
  selectedFile = file;
  $("fileName").textContent = file.name;
  $("fileSize").textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";
  $("fileView").href = URL.createObjectURL(file);   // bấm "Xem" để mở PDF
  $("fileItem").hidden = false;
  showToast("Đã chọn file " + file.name);
}

$("fileRemove").addEventListener("click", () => {
  selectedFile = null; input.value = ""; $("fileItem").hidden = true;
});

// ----- Lưu thay đổi -----
$("saveBtn").addEventListener("click", () => {
  const github = $("github").value.trim();
  const figma = $("figma").value.trim();
  const postman = $("postman").value.trim();

  if (github && !github.startsWith("http")) { showToast("Link GitHub phải bắt đầu bằng http", true); return; }
  if (figma && !figma.startsWith("http")) { showToast("Link Figma phải bắt đầu bằng http", true); return; }
  if (postman && !postman.startsWith("http")) { showToast("Link Postman phải bắt đầu bằng http", true); return; }

  localStorage.setItem("account", JSON.stringify({ github, figma, postman, pdf: selectedFile ? selectedFile.name : "" }));

  // Khi có backend thì gửi file lên server như sau:
  // const fd = new FormData();
  // fd.append("file", selectedFile);
  // fetch("/api/upload", { method: "POST", body: fd });

  showToast("Đã lưu thay đổi");
});

// ----- Nạp lại dữ liệu đã lưu khi mở trang -----
const saved = JSON.parse(localStorage.getItem("account") || "{}");
$("github").value = saved.github || "";
$("figma").value = saved.figma || "";
$("postman").value = saved.postman || "";