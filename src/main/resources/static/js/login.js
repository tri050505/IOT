
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginButton = document.getElementById("loginButton");

// Nếu đã có token thì chuyển thẳng vào Dashboard
if (sessionStorage.getItem("jwt_token")) {
    window.location.replace("/index.html");
}

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Đang đăng nhập...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Tên đăng nhập hoặc mật khẩu không đúng");
        }

        if (!result.token) {
            throw new Error("Backend không trả về JWT token");
        }

        // Lưu JWT token vào sessionStorage
        sessionStorage.setItem("jwt_token", result.token);

        // Đăng nhập thành công
        window.location.replace("/index.html");

    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Đăng nhập";
    }
});
