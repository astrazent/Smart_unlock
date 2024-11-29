const overlay = document.getElementById("overlay");
const successNotification = document.getElementById("successNotification");
//Gửi tin nhắn mỗi khi mở cửa
document.getElementById("buttonA").addEventListener("click", function () {
    document.querySelector(".notification-container").style.display = "block";
    overlay.style.display = "block";
});
document.querySelector(".close-button").addEventListener("click", function () {
    document.querySelector(".notification-container").style.display = "none";
    overlay.style.display = "none";
});

// Lấy phần tử checkbox
const toggleSwitch = document.getElementById("notificationToggle");
// Hàm lấy giá trị cookie
function getCookiePersonnal(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [key, val] = cookie.split("=");
        if (key === name) return val;
    }
    return null;
}
//Lấy trạng thái của toggle
async function getToggleStatus(id) {
    const apiUrl = "http://localhost:8080/api/getToggleStatus"; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ maHeThong: id }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                //Lấy danh sách về thành công (test)
                console.log("lấy trạng thái tin nhắn thành công!");
                const status = data.data[0].thongBaoTuXa;
                document.getElementById("emailDisplay").textContent = data.data[0].emailNhanTB;
                if (status) {
                    toggleSwitch.checked = true;
                } else {
                    toggleSwitch.checked = false;
                }
            } else {
                // Lấy danh sách thát bại (test)
                console.log("lấy trạng thái tin nhắn thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
getToggleStatus(getCookiePersonnal("systemID"));

//Lấy trạng thái của toggle
async function updateToggleStatus(status) {
    const apiUrl = "http://localhost:8080/api/updateToggleStatus"; // Thay URL này bằng URL của API thực tế
    const email = document.getElementById("emailReceive").value;
    const systemID = getCookiePersonnal("systemID");
    const updateInfo = {
        status: status,
        maHeThong: systemID,
    };
    try {
        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: updateInfo }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                //Cập nhật trạng thái toggle về thành công (test)
                console.log("Cập nhật trạng thái toggle thành công!");
            } else {
                // Cập nhật trạng thái toggle thát bại (test)
                console.log("Cập nhật trạng thái toggle thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Bắt sự kiện thay đổi trạng thái checkbox
toggleSwitch.addEventListener("change", function () {
    let status;
    if (this.checked) {
        // Nếu checkbox được tích (bật)
        console.log("Chức năng gửi tin nhắn đã được bật");
        status = 1;
    } else {
        // Nếu checkbox không được tích (tắt)
        console.log("Chức năng gửi tin nhắn đã được tắt");
        status = 0;
    }
    // Cập nhật DB
    updateToggleStatus(status);
});

//Cập nhật email nhận tin nhắn
async function updateEmailReceive(email) {
    const apiUrl = "http://localhost:8080/api/updateEmailReceive"; // Thay URL này bằng URL của API thực tế
    const systemID = getCookiePersonnal("systemID");
    const updateInfo = {
        email: email,
        maHeThong: systemID,
    };
    try {
        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: updateInfo }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                //Cập nhật email nhận thông báo về thành công (test)
                console.log("Cập nhật email nhận thông báo thành công!");
                emailDisplay.textContent = email;
                emailForm.style.display = "none";
                emailDisplay.style.display = "block";
                changeEmailButton.style.display = "inline-block"; // Hiển thị lại nút "Thay đổi"
                // Hiển thị hộp thông báo thành công
                showMessage("Email đã được cập nhật thành công!", "success");
            } else {
                // Cập nhật email nhận thông báo thát bại (test)
                console.log("Cập nhật email nhận thông báo thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Khi bấm vào nút thay đổi email
const changeEmailButton = document.querySelector(".changeEmail");
const emailDisplay = document.getElementById("emailDisplay");
const emailForm = document.getElementById("emailForm");
const saveEmailButton = document.querySelector(".saveEmail");
const cancelChangeButton = document.querySelector(".cancelChange");
const messageBox = document.getElementById("messageBox");

// Khi bấm vào nút "Thay đổi", ẩn đi phần hiển thị email và nút "Thay đổi", hiển thị form nhập email mới
changeEmailButton.addEventListener("click", function () {
    emailDisplay.style.display = "none";
    changeEmailButton.style.display = "none"; // Ẩn nút "Thay đổi"
    emailForm.style.display = "block";
    messageBox.style.display = "none"; // Ẩn hộp thông báo
});

// Khi bấm "Lưu", cập nhật email và quay lại giao diện ban đầu
saveEmailButton.addEventListener("click", function () {
    const newEmail = document.getElementById("newEmail").value;
    // Kiểm tra email có đuôi @example hay không
    if (!newEmail) {
        // Hiển thị hộp thông báo lỗi nếu email trống
        showMessage("Vui lòng nhập email mới.", "error");
    } else if (!newEmail.endsWith("@gmail.com")) {
        // Hiển thị hộp thông báo lỗi nếu email không có đuôi @example
        showMessage('Email phải có đuôi "@example.com".', "error");
    } else {
        updateEmailReceive(newEmail);
    }
});

// Khi bấm "Hủy", quay lại giao diện ban đầu mà không thay đổi gì
cancelChangeButton.addEventListener("click", function () {
    emailForm.style.display = "none";
    emailDisplay.style.display = "block";
    changeEmailButton.style.display = "inline-block"; // Hiển thị lại nút "Thay đổi"

    // Ẩn hộp thông báo
    messageBox.style.display = "none";
});

// Hàm hiển thị hộp thông báo
function showMessage(message, type) {
    messageBox.style.display = "block";
    messageBox.textContent = message;
    messageBox.className = type; // Áp dụng class "success" hoặc "error" cho hộp thông báo
}

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === overlay) {
        document.querySelector(".notification-container").style.display = "none";
        overlay.style.display = "none";
    }
});

function populateTable(data) {
    const tableBody = document.getElementById("userTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Xóa nội dung cũ (nếu có)

    // Sắp xếp data theo thứ tự tên chuSoHuu
    data.sort((a, b) => a.chuSoHuu.localeCompare(b.chuSoHuu));

    data.forEach((item, index) => {
        const row = document.createElement("tr");

        // Thêm maNguoiDung vào thuộc tính data-maNguoiDung của thẻ tr
        row.setAttribute("data-maNguoiDung", item.maNguoiDung);

        // Tạo ô cho số thứ tự
        const serialCell = document.createElement("td");
        serialCell.textContent = index + 1; // Số thứ tự bắt đầu từ 1
        row.appendChild(serialCell);

        // Tạo ô cho chuSoHuu
        const ownerCell = document.createElement("td");
        ownerCell.textContent = item.chuSoHuu;
        row.appendChild(ownerCell);

        // Tạo ô cho gioiTinh và chuyển đổi sang tiếng Việt
        const genderCell = document.createElement("td");
        genderCell.textContent = item.gioiTinh === "male" ? "Nam" : item.gioiTinh === "female" ? "Nữ" : "Khác";
        row.appendChild(genderCell);

        // Tạo ô cho tuoi
        const ageCell = document.createElement("td");
        ageCell.textContent = item.tuoi;
        row.appendChild(ageCell);

        // Tạo ô cho soDienThoai
        const phoneCell = document.createElement("td");
        phoneCell.textContent = item.soDienThoai;
        row.appendChild(phoneCell);

        // Tạo ô cho email
        const emailCell = document.createElement("td");
        emailCell.textContent = item.email;
        row.appendChild(emailCell);

        tableBody.appendChild(row);
    });
}

// Quản lý danh sách người dùng
const modal2 = document.querySelector(".modal3");
const closeButton2 = document.querySelector(".close3");
// Hiện thông báo khi bấm nút
document.getElementById("buttonB").addEventListener("click", function () {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/getListUser"; // Thay URL này bằng URL của API thực tế
    async function getListUser() {
        try {
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //Lấy danh sách về thành công (test)
                    console.log("lấy danh sách người dùng thành công!");
                    // Gọi hàm để hiển thị dữ liệu
                    populateTable(data.data);
                } else {
                    // Lấy danh sách thát bại (test)
                    console.log("lấy danh sách người dùng thất bại.");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    getListUser();
    modal2.style.display = "flex"; // Hiện modal với display flex để căn giữa
});

// Xử lý lọc tìm kiếm
document.getElementById("searchInput").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#userTable tbody tr");

    rows.forEach((row) => {
        // Kiểm tra tất cả các ô trong hàng
        const cells = Array.from(row.cells);
        const rowMatches = cells.some((cell) => cell.textContent.toLowerCase().includes(filter));

        if (rowMatches) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

// Đóng thông báo khi bấm nút đóng
closeButton2.addEventListener("click", function () {
    modal2.style.display = "none"; // Ẩn modal
});

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === modal2) {
        modal2.style.display = "none"; // Ẩn modal nếu click ra ngoài
        document.querySelector(".modal-content3").style.display = "block";
    }
});

//Lịch sử mở cửa
function populateTable2(data) {
    const tableBody = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Xóa nội dung cũ (nếu có)
    data.forEach((item, index) => {
        const row = document.createElement("tr");

        // Tạo ô cho số thứ tự
        const serialCell = document.createElement("td");
        serialCell.textContent = index + 1; // Số thứ tự bắt đầu từ 1
        row.appendChild(serialCell);

        // Tạo ô cho ngày (tách từ thoiGian)
        const dateCell = document.createElement("td");
        const date = new Date(item.thoiGian);
        dateCell.textContent = date.toLocaleDateString("vi-VN"); // Hiển thị ngày theo định dạng Việt Nam
        row.appendChild(dateCell);

        // Tạo ô cho giờ (tách từ thoiGian)
        const timeCell = document.createElement("td");
        timeCell.textContent = date.toLocaleTimeString("vi-VN"); // Hiển thị giờ theo định dạng Việt Nam
        row.appendChild(timeCell);

        // Tạo ô cho loaiTruyCap
        const accessTypeCell = document.createElement("td");
        accessTypeCell.textContent = item.loaiTruyCap;
        row.appendChild(accessTypeCell);

        // Tạo ô cho thanhCong, chuyển đổi giá trị true/false thành "Thành công" hoặc "Thất bại"
        const successCell = document.createElement("td");
        successCell.textContent = item.thanhCong ? "Thành công" : "Thất bại";
        row.appendChild(successCell);

        tableBody.appendChild(row);
    });
}

// Lịch sử mở cửa
const modal3 = document.querySelector(".modal4");
const closeButton3 = document.querySelector(".close4");
// Hiện thông báo khi bấm nút
document.getElementById("buttonC").addEventListener("click", function () {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/getListDiary"; // Thay URL này bằng URL của API thực tế
    async function getListDiary() {
        try {
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //Lấy danh sách về thành công (test)
                    console.log("lấy danh sách lịch sử mở cửa thành công!");
                    // Gọi hàm để hiển thị dữ liệu
                    populateTable2(data.data);
                } else {
                    // Lấy danh sách thát bại (test)
                    console.log("lấy danh sách lịch sử mở cửa thất bại.");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    getListDiary();
    modal3.style.display = "flex"; // Hiện modal với display flex để căn giữa
});

// Xử lý lọc tìm kiếm
document.getElementById("searchInput2").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#diaryTable tbody tr");

    rows.forEach((row) => {
        // Kiểm tra tất cả các ô trong hàng
        const cells = Array.from(row.cells);
        const rowMatches = cells.some((cell) => cell.textContent.toLowerCase().includes(filter));

        if (rowMatches) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

// Đóng thông báo khi bấm nút đóng
closeButton3.addEventListener("click", function () {
    modal3.style.display = "none"; // Ẩn modal
});

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === modal3) {
        modal3.style.display = "none"; // Ẩn modal nếu click ra ngoài
        document.querySelector(".modal-content4").style.display = "block";
    }
});

//Lịch sử thao tác
function populateTable3(data) {
    const tableBody = document.getElementById("actionTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Xóa nội dung cũ (nếu có)

    data.forEach((item, index) => {
        const row = document.createElement("tr");

        // Tạo ô cho số thứ tự
        const serialCell = document.createElement("td");
        serialCell.textContent = index + 1; // Số thứ tự bắt đầu từ 1
        row.appendChild(serialCell);

        // Tạo ô cho ngày (tách từ ngayThayDoi)
        const dateCell = document.createElement("td");
        const date = new Date(item.ngayThayDoi);
        dateCell.textContent = date.toLocaleDateString("vi-VN"); // Hiển thị ngày theo định dạng Việt Nam
        row.appendChild(dateCell);

        // Tạo ô cho giờ (tách từ ngayThayDoi)
        const timeCell = document.createElement("td");
        timeCell.textContent = date.toLocaleTimeString("vi-VN"); // Hiển thị giờ theo định dạng Việt Nam
        row.appendChild(timeCell);

        // Tạo ô cho noiDungThayDoi
        const changeContentCell = document.createElement("td");
        changeContentCell.textContent = item.noiDungThayDoi;
        row.appendChild(changeContentCell);

        tableBody.appendChild(row);
    });
}

// Lịch sử mở cửa
const modal4 = document.querySelector(".modal5");
const closeButton4 = document.querySelector(".close5");
// Hiện thông báo khi bấm nút
document.getElementById("buttonD").addEventListener("click", function () {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/getListAction"; // Thay URL này bằng URL của API thực tế
    async function getListAction() {
        try {
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //Lấy danh sách về thành công (test)
                    console.log("lấy danh sách lịch sử thao tác thành công!");
                    // Gọi hàm để hiển thị dữ liệu
                    populateTable3(data.data);
                } else {
                    // Lấy danh sách thát bại (test)
                    console.log("lấy danh sách lịch sử thao tác thất bại.");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    getListAction();
    modal4.style.display = "flex"; // Hiện modal với display flex để căn giữa
});

// Xử lý lọc tìm kiếm
document.getElementById("searchInput3").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#actionTable tbody tr");

    rows.forEach((row) => {
        const cells = Array.from(row.cells);

        // Kiểm tra nếu ô trong hàng chứa nội dung tìm kiếm
        const rowMatches = cells.some((cell, index) => {
            // Chỉ tìm kiếm trong các cột cụ thể
            if (index === 1 || index === 2 || index === 3) {
                // Giả sử bạn tìm kiếm trong cột số thứ tự, ngày và nội dung thay đổi
                return cell.textContent.toLowerCase().includes(filter);
            }
            return false; // Bỏ qua các cột khác
        });

        if (rowMatches) {
            row.style.display = ""; // Hiển thị nếu có kết quả
        } else {
            row.style.display = "none"; // Ẩn nếu không khớp
        }
    });
});

// Đóng thông báo khi bấm nút đóng
closeButton4.addEventListener("click", function () {
    modal4.style.display = "none"; // Ẩn modal
});

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === modal4) {
        modal4.style.display = "none"; // Ẩn modal nếu click ra ngoài
        document.querySelector(".modal-content4").style.display = "block";
    }
});

// Quản lý hệ thống cửa
const modal5 = document.querySelector(".modal6");
const closeButton5 = document.querySelector(".close6");
// Hiện thông báo khi bấm nút
document.getElementById("buttonE").addEventListener("click", function () {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/getListSystemInfo"; // Thay URL này bằng URL của API thực tế
    async function getListSystemInfo() {
        try {
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //Lấy danh sách về thành công (test)
                    console.log("lấy danh sách quản lý hệ thống cửa thành công!");
                    const newData = data.data;
                    //Hàm hiển thị dữ liệu
                    function populateTable4(data) {
                        const tableBody = document.getElementById("systemTable").getElementsByTagName("tbody")[0];
                        tableBody.innerHTML = ""; // Xóa nội dung cũ (nếu có)

                        data.forEach((item, index) => {
                            const row = document.createElement("tr");

                            // Tạo ô cho số thứ tự
                            const serialCell = document.createElement("td");
                            serialCell.textContent = index + 1; // Số thứ tự bắt đầu từ 1
                            row.appendChild(serialCell);

                            // Tạo ô cho tên hệ thống
                            const systemNameCell = document.createElement("td");
                            systemNameCell.textContent = item.tenHeThong; // Tên hệ thống
                            row.appendChild(systemNameCell);

                            // Tạo ô cho địa chỉ IP
                            const ipAddressCell = document.createElement("td");
                            ipAddressCell.textContent = item.diaChiIP; // Địa chỉ IP
                            row.appendChild(ipAddressCell);

                            // Tạo ô cho trạng thái hoạt động
                            const statusCell = document.createElement("td");
                            statusCell.textContent = item.dangHoatDong ? "Đang hoạt động" : "Không hoạt động"; // Hiển thị trạng thái
                            row.appendChild(statusCell);

                            // Cột hành động (Sửa/Xóa)
                            const actionCell = document.createElement("td");

                            // Nút Sửa
                            const editButton = document.createElement("button");
                            editButton.textContent = "Sửa";
                            editButton.classList.add("edit-button");
                            editButton.onclick = function () {
                                console.log("Đang sửa hệ thống tại index:", index); // Debug
                                editSystem(index); // Gọi hàm sửa
                            };
                            actionCell.appendChild(editButton);

                            // Nút Xóa
                            const deleteButton = document.createElement("button");
                            deleteButton.textContent = "Xóa";
                            deleteButton.classList.add("delete-button");
                            deleteButton.onclick = function () {
                                deleteSystem(index); // Gọi hàm xóa
                            };
                            actionCell.appendChild(deleteButton);
                            row.appendChild(actionCell);
                            tableBody.appendChild(row);
                        });
                    }
                    function addSystem() {
                        editingIndex = -1;
                        document.getElementById("formTitle").textContent = "Thêm hệ thống";
                        document.getElementById("tenHeThong").value = "";
                        document.getElementById("diaChiIP").value = "";
                        document.getElementById("dangHoatDong").value = "1";
                        document.getElementById("formContainer").style.display = "block";
                    }

                    function editSystem(index) {
                        if (!newData[index]) { // Kiểm tra nếu không có dữ liệu tại index
                            console.error("Không tìm thấy hệ thống với index:", index);
                            return;
                        }
                        editingIndex = index;
                        document.getElementById("formTitle").textContent = "Sửa hệ thống";
                        document.getElementById("tenHeThong").value = newData[index].tenHeThong;
                        document.getElementById("diaChiIP").value = newData[index].diaChiIP;
                        document.getElementById("dangHoatDong").value = newData[index].dangHoatDong;
                        document.getElementById("formContainer").style.display = "block";
                    }

                    function deleteSystem(index) {
                        if (confirm("Bạn có chắc muốn xóa hệ thống này?")) {
                            newData.splice(index, 1);
                            populateTable();
                        }
                    }

                    async function saveSystem() {
                        const tenHeThong = document.getElementById("tenHeThong").value;
                        const diaChiIP = document.getElementById("diaChiIP").value;
                        const dangHoatDong = parseInt(document.getElementById("dangHoatDong").value);
                        const systemData = { tenHeThong, diaChiIP, dangHoatDong};

                        if (editingIndex === -1) {
                            // Thêm mới
                            try {
                                const response = await fetch("http://localhost:8080/api/addListSystemInfo", {
                                    method: "POST", // Gửi yêu cầu POST để thêm mới
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(systemData), // Gửi dữ liệu hệ thống mới
                                });
                    
                                if (!response.ok) {
                                    throw new Error("Lỗi khi thêm mới hệ thống!");
                                }
                    
                                const newSystem = await response.json();
                                newData.push(newSystem); // Thêm dữ liệu vừa được lưu từ BE vào mảng
                            } catch (error) {
                                console.error("Lỗi:", error);
                                alert("Không thể thêm hệ thống mới. Vui lòng thử lại!");
                            }
                        } else {
                            // Cập nhật
                            try {
                                const response = await fetch(`http://localhost:8080/api/updateListSystemInfo`, {
                                    method: "POST", // Gửi yêu cầu PUT để cập nhật
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(systemData), // Gửi dữ liệu hệ thống cần cập nhật
                                });
                    
                                if (!response.ok) {
                                    throw new Error("Lỗi khi cập nhật hệ thống!");
                                }
                    
                                const updatedSystem = await response.json();
                                newData[editingIndex] = updatedSystem; // Cập nhật dữ liệu trong mảng
                            } catch (error) {
                                console.error("Lỗi:", error);
                                alert("Không thể cập nhật hệ thống. Vui lòng thử lại!");
                            }
                        }
                    
                        // Ẩn form và cập nhật bảng
                        document.getElementById("formContainer").style.display = "none";
                        populateTable4(newData);
                    }

                    function cancelEdit() {
                        document.getElementById("formContainer").style.display = "none";
                    }

                    document.getElementById("addButton").onclick = addSystem;
                    document.getElementById("saveButton").onclick = saveSystem;
                    document.getElementById("cancelButton").onclick = cancelEdit;

                    // Hiển thị dữ liệu ban đầu
                    populateTable4(newData);
                } else {
                    // Lấy danh sách thát bại (test)
                    console.log("lấy danh sách quản lý hệ thống cửa thất bại.");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    getListSystemInfo();
    modal5.style.display = "flex"; // Hiện modal với display flex để căn giữa
});

// Xử lý lọc tìm kiếm
document.getElementById("searchInput4").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#systemTable tbody tr");

    rows.forEach((row) => {
        const cells = Array.from(row.cells);

        // Kiểm tra nếu ô trong hàng chứa nội dung tìm kiếm
        const rowMatches = cells.some((cell, index) => {
            // Chỉ tìm kiếm trong các cột cụ thể
            if (index === 1 || index === 2 || index === 3) {
                // Giả sử bạn tìm kiếm trong cột số thứ tự, ngày và nội dung thay đổi
                return cell.textContent.toLowerCase().includes(filter);
            }
            return false; // Bỏ qua các cột khác
        });

        if (rowMatches) {
            row.style.display = ""; // Hiển thị nếu có kết quả
        } else {
            row.style.display = "none"; // Ẩn nếu không khớp
        }
    });
});

// Đóng thông báo khi bấm nút đóng
closeButton5.addEventListener("click", function () {
    modal5.style.display = "none"; // Ẩn modal
});

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === modal5) {
        modal5.style.display = "none"; // Ẩn modal nếu click ra ngoài
        document.querySelector(".modal-content6").style.display = "block";
    }
});

// Kiểm soát trạng thái hệ thống
document.getElementById("buttonF").addEventListener("click", function () {
    document.querySelector(".custom-notification-container").style.display = "block";
    overlay.style.display = "block";
});
document.querySelector(".close-button2").addEventListener("click", function () {
    document.querySelector(".custom-notification-container").style.display = "none";
    overlay.style.display = "none";
});

//Lấy trạng thái của toggle system
async function getToggleSystemStatus(item) {
    const apiUrl = "http://localhost:8080/api/getSystemActiveStatus"; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ maHeThong: item.heThongID }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                //Lấy danh sách về thành công (test)
                console.log("lấy trạng thái tin nhắn thành công!");
                const status = data.data[0].thongBaoTTHD;
                const customNameItem = document.getElementById(item.heThongID); // Chọn phần tử cha (li có id="2")
                const emailValue = customNameItem.querySelector(".custom-email-value"); // Chọn email value bên trong
                emailValue.textContent = data.data[0].emailNhanTB;
                if (status) {
                    customNameItem.querySelector(".custom-toggle-checkbox").checked = true;
                } else {
                    customNameItem.querySelector(".custom-toggle-checkbox").checked = false;
                }
            } else {
                // Lấy danh sách thát bại (test)
                console.log("lấy trạng thái tin nhắn thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

const notiShow = (status, msg) => {
    if (status == "success") {
        console.log(msg);
        successNotification.style.backgroundColor = "#007BFF";
        successNotification.textContent = msg;
        successNotification.style.display = "block";
        overlay.style.display = "none";
        // Tự động ẩn thông báo thành công sau 3 giây
        setTimeout(() => {
            successNotification.style.display = "none";
        }, 3000);
    } else if (status == "error") {
        // xoá vân tay trong DB  thất bại (test)
        console.log(msg);
        successNotification.style.backgroundColor = "#CD2C3D";
        successNotification.textContent = msg;
        successNotification.style.display = "block";
        overlay.style.display = "none";
        // Tự động ẩn thông báo thành công sau 3 giây
        setTimeout(() => {
            successNotification.style.display = "none";
        }, 3000);
    } else if (status == "warning") {
        // xoá vân tay trong DB  thất bại (test)
        console.log(msg);
        successNotification.style.backgroundColor = "#F9CA0A";
        successNotification.textContent = msg;
        successNotification.style.display = "block";
        overlay.style.display = "none";
        // Tự động ẩn thông báo thành công sau 3 giây
        setTimeout(() => {
            successNotification.style.display = "none";
        }, 3000);
    }
};

// JavaScript để xử lý sự kiện
document.addEventListener("DOMContentLoaded", async () => {
    const nameListContainer = document.querySelector(".custom-name-items");
    // Render danh sách từ JSON
    const data = await getListSystemInfo();
    data.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.className = "custom-name-item";
        listItem.id = item.heThongID; // Assign unique ID

        // Create system name and IP
        const nameText = document.createElement("span");
        nameText.className = "custom-name-text";
        nameText.textContent = `${item.tenHeThong} (${item.diaChiIP})`;

        // Create toggle switch
        const toggleSwitchSys = document.createElement("label");
        toggleSwitchSys.className = "custom-toggle-switch";

        const toggleInput = document.createElement("input");
        toggleInput.type = "checkbox";
        toggleInput.className = "custom-toggle-checkbox";
        toggleInput.dataset.name = item.tenHeThong;

        const toggleSlider = document.createElement("span");
        toggleSlider.className = "custom-toggle-slider";

        toggleSwitchSys.appendChild(toggleInput);
        toggleSwitchSys.appendChild(toggleSlider);

        // Create email notification section
        const emailSection = document.createElement("div");
        emailSection.className = "custom-email-section";

        const emailLabel = document.createElement("span");
        emailLabel.className = "custom-email-label";
        emailLabel.textContent = "Email nhận thông báo:";

        const emailValue = document.createElement("span");
        emailValue.className = "custom-email-value";
        emailValue.textContent = "example@example.com"; // Default email

        const changeEmailBtn = document.createElement("button");
        changeEmailBtn.className = "custom-change-email-btn";
        changeEmailBtn.textContent = "Thay đổi";

        emailSection.appendChild(emailLabel);
        emailSection.appendChild(emailValue);
        emailSection.appendChild(changeEmailBtn);

        // Email form
        const emailForm = document.createElement("div");
        emailForm.className = "custom-email-form";
        emailForm.style.display = "none";

        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.className = "custom-email-input";
        emailInput.placeholder = "Nhập email mới";

        const formButtons = document.createElement("div");
        formButtons.className = "custom-form-buttons";

        const saveEmailBtn = document.createElement("button");
        saveEmailBtn.className = "custom-save-email-btn";
        saveEmailBtn.textContent = "Lưu";

        const cancelEmailBtn = document.createElement("button");
        cancelEmailBtn.className = "custom-cancel-email-btn";
        cancelEmailBtn.textContent = "Hủy";

        formButtons.appendChild(saveEmailBtn);
        formButtons.appendChild(cancelEmailBtn);
        emailForm.appendChild(emailInput);
        emailForm.appendChild(formButtons);

        // Append elements to list item
        listItem.appendChild(nameText);
        listItem.appendChild(toggleSwitchSys);
        listItem.appendChild(emailSection);
        listItem.appendChild(emailForm);
        nameListContainer.appendChild(listItem);

        getToggleSystemStatus(item);

        // Email change logic
        changeEmailBtn.addEventListener("click", () => {
            emailForm.style.display = "block";
            emailInput.value = emailValue.textContent.trim();
        });

        saveEmailBtn.addEventListener("click", () => {
            const newEmail = emailInput.value.trim();
            if (newEmail === "") {
                notiShow("error", "Email không được để trống.");
                return;
            }
            emailValue.textContent = newEmail;
            updateEmailReceive(newEmail);
            notiShow("success", "Cập nhật Email nhận thông báo thành công!");
            emailForm.style.display = "none";
        });

        cancelEmailBtn.addEventListener("click", () => {
            emailForm.style.display = "none";
        });
    });

    // Xử lý toggle các dòng danh sách
    const toggles = document.querySelectorAll(".custom-toggle-checkbox");
    toggles.forEach((toggle) => {
        toggle.addEventListener("change", async (event) => {
            const name = event.target.dataset.name;
            // console.log(event.target.parentElement.parentElement.querySelector(".custom-name-text"));
            // Lấy thẻ <span> có class 'custom-name-text'
            const spanElement = event.target.parentElement.parentElement.querySelector(".custom-name-text");
            const id = spanElement.parentElement.id;
            // Lấy nội dung văn bản bên trong thẻ <span>
            const textContent = spanElement.textContent;
            // Sử dụng biểu thức chính quy để trích xuất địa chỉ IP
            const ipMatch = textContent.match(/\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)/);
            const ipAddress = ipMatch[1]; // Địa chỉ IP nằm trong nhóm đầu tiên
            if (event.target.checked) {
                const apiUrl = "http://localhost:8080/api/checkOnline"; // Thay URL này bằng URL của API thực tế
                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: id, ip: ipAddress, status: true }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.status == "success") {
                            console.log("ok");
                        } else {
                            // Lấy danh sách thát bại (test)
                            console.log("Lấy ds hệ thống thất bại.");
                        }
                    } else {
                        console.error("Request failed:", response.status);
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            } else {
                const apiUrl = "http://localhost:8080/api/checkOnline"; // Thay URL này bằng URL của API thực tế
                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: id, ip: ipAddress, status: false }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.status == "success") {
                            console.log("ok");
                        } else {
                            // Lấy danh sách thát bại (test)
                            console.log("Lấy ds hệ thống thất bại.");
                        }
                    } else {
                        console.error("Request failed:", response.status);
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            }
        });
    });
});

const getListSystemInfo = async () => {
    const apiUrl = "http://localhost:8080/api/getListSystem"; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                return data.data;
            } else {
                // Lấy danh sách thát bại (test)
                console.log("Lấy ds hệ thống thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

window.addEventListener("click", function (event) {
    if (event.target === overlay) {
        document.querySelector(".custom-notification-container").style.display = "none";
        overlay.style.display = "none";
    }
});
