const selectButton = document.querySelector('.select-btn');
let activeSelectButton = true;
// const successNotification2 = document.getElementById("successNotification");
const updateIP = async (ip) => {
    const apiUrl = "http://localhost:8080/api/updateIP"; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ip: ip })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                console.log(data.message);

                //Gửi tín hiệu heartbeat
                if(activeSelectButton){
                    setInterval(() => {
                        sendHearbeat();
                    }, 2000);
                }
            } else {
                // Lấy danh sách thát bại (test)
                console.log("cập nhật IP thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
const notiShow = (status, msg) => {
    if(status == "success"){
        console.log(msg);
        successNotification.style.backgroundColor = "#007BFF";
        successNotification.textContent = msg;
        successNotification.style.display = "block";
        overlay.style.display = "none";
        // Tự động ẩn thông báo thành công sau 3 giây
        setTimeout(() => {
            successNotification.style.display = "none";
        }, 3000);
    } else if(status == "error"){
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
    } else if(status == "warning"){
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
}
// Lấy danh sách hệ thống
function populateSystems(data) {
    const dropdown = document.querySelector('.select-dropdown');
    dropdown.innerHTML = ''; // Xóa nội dung cũ (nếu có)

    // Lấy lựa chọn từ cookie (nếu có)
    const savedSystem = getCookie("selectedSystem");
    if (savedSystem) {
        selectButton.textContent = `${savedSystem}`;
    }

    if (data && data.status === "success" && Array.isArray(data.data)) {
        data.data.forEach(system => {
            const selectItem = document.createElement('div');
            selectItem.classList.add('select-item');
            selectItem.setAttribute('ten-cua', system.tenHeThong); // Giá trị 'active' là ví dụ

            const systemName = document.createElement('span');
            systemName.classList.add('system-name');
            systemName.textContent = system.tenHeThong;

            const ipAddress = document.createElement('span');
            ipAddress.classList.add('ip-address');
            ipAddress.textContent = system.diaChiIP;

            selectItem.appendChild(systemName);
            selectItem.appendChild(ipAddress);

            // Thêm sự kiện click vào mỗi hàng
            selectItem.addEventListener('click', () => {
                // Lưu lựa chọn vào cookie
                setCookie("selectedSystem", system.tenHeThong);

                // Hiển thị tên hệ thống đã chọn
                selectButton.textContent = `${system.tenHeThong}`;

                //Gửi dữ liệu lên cho BE
                updateIP(system.diaChiIP);

                //Lấy systemID
                getSystemID();

                // Ẩn dropdown sau khi chọn
                dropdown.classList.remove('open');
            });

            dropdown.appendChild(selectItem);
        });

        // Thêm sự kiện click cho nút chọn hệ thống
        selectButton.addEventListener('click', (event) => {
            dropdown.classList.toggle('open');
            event.stopPropagation();
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target) && !selectButton.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
    } else {
        console.error("Dữ liệu không hợp lệ hoặc bị thiếu!");
    }
}
let deviceStatus = true;
let deviceStatusON = true;
const sendHearbeat = async () => {
    const apiUrl = "http://localhost:8080/api/arduino/heartbeat"; // Thay URL này bằng URL của API thực tế
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
                console.log(data.message);
                deviceStatus = true;
                if(deviceStatusON){
                    notiShow("success", "Hệ thống cửa đang hoạt động!");
                    deviceStatusON = false;
                }
            } else {
                deviceStatusON = true;
                if(deviceStatus){
                    notiShow("warning", "Hệ thống cửa không hoạt động");
                    deviceStatus = false;
                }
                // Lấy danh sách thát bại (test)
                console.log("Device offline: ", data.timestamp);
            }
        } else {
            console.error("Request failed: ", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Hàm lưu cookie (session cookie)
function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/`; // Không đặt thời gian hết hạn -> tự động hết khi đóng trình duyệt
}

// Hàm lấy giá trị cookie
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, val] = cookie.split('=');
        if (key === name) return val;
    }
    return null;
}
const getListSystem = async () => {
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
                if(selectButton.textContent == "Chọn hệ thống"){
                    statusSelectButton = false;
                }
                //Lấy danh sách về thành công (test)
                populateSystems(data);
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
getListSystem();
