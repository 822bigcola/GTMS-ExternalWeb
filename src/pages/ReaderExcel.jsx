import * as XLSX from "xlsx";
import "./ReadExcel.css";
import { isTokenExpired } from "../utils/authy";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

function ReadExcel() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorRows, setErrorRows] = useState([]);
  const [ischeck, setIscheck] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const decoded = jwtDecode(token);
    const timeLeft = decoded.exp * 1000 - Date.now();
    console.log("Token expires in:", timeLeft / 1000, "seconds");
    if (timeLeft <= 0) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      const timeout = setTimeout(() => {
        alert("Hết phiên đăng nhập!");
        sessionStorage.removeItem("token");
        window.location.href = "/login";
      }, timeLeft);

      return () => clearTimeout(timeout);
    }
  }, []);

  const rowsPerPage = 10;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = (e) => {
      const buffer = e.target.result;
      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const parsedData = XLSX.utils.sheet_to_json(sheet);
      setData(parsedData);
      setCurrentPage(1);
    };
  };

  // SEARCH
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(start, start + rowsPerPage);

  // CHECK
  const handleCheck = async () => {
    if (data.length === 0) {
      alert("Chưa có dữ liệu!");
      return;
    }

    try {
      // 🚀 gọi API backend
      const res = await fetch("http://localhost:5000/api/artikel");

      if (!res.ok) {
        throw new Error("API lỗi");
      }

      const validArtikel = await res.json(); // array từ DB
      const normalize = (val) => val?.toString().trim().toLowerCase();
      // 👉 convert về Map để check nhanh hơn
      const artikelMap = new Map();

      validArtikel.forEach((item) => {
        const key = normalize(item.Artikel);

        if (!artikelMap.has(key)) {
          artikelMap.set(key, []);
        }

        artikelMap.get(key).push(item);
      });

      const errors = [];

      data.forEach((row, index) => {
        const artikel = row.Article?.toString().trim();
        const condition = row.Condition?.toString().trim();
        const lagerort = row.Lagerort?.toString().trim();
        const line = row.Line?.toString().trim();

        const dbItems = artikelMap.get(normalize(artikel));

        if (!dbItems) {
          errors.push(index);
          return;
        }

        const match = dbItems.find((item) => {
          return (
            normalize(item.Condition) === normalize(condition) &&
            normalize(item.Lagerort) === normalize(lagerort) &&
            normalize(item.Kostentraeger) === normalize(line)
          );
        });

        if (!match) {
          errors.push(index);
        }
      });

      setErrorRows(errors);

      if (errors.length <= 0) {
        alert("✅ Tất cả Artikel hợp lệ");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối API!");
    }

    setIscheck(true);
  };
  // IMPORT
  const handleImport = async () => {
    if (data.length === 0) {
      alert("Chưa có dữ liệu!");
      return;
    }
    if (!ischeck) {
      handleCheck();
    }
    if (errorRows.length > 0) {
      alert("Vui lòng kiểm tra lại dữ liệu trước khi import!");
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }

    if (isTokenExpired()) {
      sessionStorage.removeItem("token");
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/buchung", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      console.log("Sending data to server:", JSON.stringify(data));
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Import failed");
      }

      alert("Import thành công!");
      console.log("Server:", result);
    } catch (err) {
      console.error(err);
      alert("Import thất bại!");
    }

    window.location.reload();
  };

  // CLOSE
  const handleClose = () => {
    setData([]);
    setFileName("");
    setSearch("");
    setCurrentPage(1);
  };

  return (
    <div className="excel-container">
      <div className="card">
        <h2>📊 Đọc file Excel</h2>

        <div className="top-bar">
          <label className="upload-box">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
            📁 Chọn file
          </label>

          <input
            type="text"
            placeholder="🔍 Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search"
          />
        </div>

        <div className="actions">
          <button className="btn check" onClick={handleCheck}>
            ✔ Check
          </button>
          <button className="btn import" onClick={handleImport}>
            🚀 Import
          </button>

          <button className="btn close" onClick={handleClose}>
            ❌ Close
          </button>
        </div>

        {fileName && <p className="file-name">File: {fileName}</p>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {data.length > 0 &&
                  Object.keys(data[0]).map((key) => <th key={key}>{key}</th>)}
              </tr>
            </thead>

            <tbody>
              {currentData.map((row, index) => (
                <tr
                  key={index}
                  className={
                    errorRows.includes(start + index) ? "row-error" : ""
                  }
                >
                  {Object.entries(row).map(([key, val], i) => (
                    <td
                      key={i}
                      className={
                        key === "Article" && errorRows.includes(start + index)
                          ? "cell-error"
                          : ""
                      }
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <p className="empty">Không có dữ liệu</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              ◀
            </button>

            <span>
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadExcel;
