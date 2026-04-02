import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import ReadExcel from "./pages/ReaderExcel";
import Login from "./pages/Login";
import { isTokenExpired } from "./utils/authy";

function App() {
  const token = sessionStorage.getItem("token");
  const expired = isTokenExpired();

  if (token && expired) {
    sessionStorage.removeItem("token");
    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  return (
    <Routes>
      <Route
        path="/"
        element={token ? <ReadExcel /> : <Navigate to="/login" />}
      />
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;
