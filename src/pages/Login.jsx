import React, { useState } from "react";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      console.log("Response:", data);

      if (res.ok && data.success) {
        alert("Đăng nhập thành công ✅");
        sessionStorage.setItem("token", data.token);
        window.location.href = "/"; // Chuyển hướng về trang chính
      } else {
        alert(data.message || "Login thất bại ❌");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Không kết nối được server ❌");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* LEFT */}
        <div className="login-left">
          <img
            src="https://guhring.com/media/images/logos/GuhringLogo_Black.webp"
            alt="Guhring Logo"
            className="logo"
          />
          <h2>Tool Management System</h2>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <h2>Sign in</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label>Username</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
            </div>

            <button type="submit">LOGIN</button>
          </form>

          <p className="copyright">© 2026 Guhring System</p>
        </div>
      </div>
    </div>
  );
}
