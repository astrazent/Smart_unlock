//Thông báo lunadev
let notifications = document.querySelector(".notifications");
function createToast(type, icon, title, text) {
    let newToast = document.createElement("div");
    newToast.innerHTML = `
            <div class="toast ${type}">
                <i class="${icon}"></i>
                <div class="content">
                    <div class="title">${title}</div>
                    <span>${text}</span>
                </div>
                <i class="fa-solid fa-xmark" onclick="(this.parentElement).remove()"></i>
            </div>`;
    notifications.appendChild(newToast);
    newToast.timeOut = setTimeout(() => newToast.remove(), 5000);
}
const success = (text) => {
    let type = "success";
    let icon = "fa-solid fa-circle-check";
    let title = "Thành công";
    createToast(type, icon, title, text);
};
const error_nofi = (text) => {
    let type = "error";
    let icon = "fa-solid fa-circle-exclamation";
    let title = "Lỗi";
    createToast(type, icon, title, text);
};
const warning = (text) => {
    let type = "warning";
    let icon = "fa-solid fa-triangle-exclamation";
    let title = "Warning";
    createToast(type, icon, title, text);
};
const info = (text) => {
    let type = "info";
    let icon = "fa-solid fa-circle-info";
    let title = "Info";
    createToast(type, icon, title, text);
};

//----------------------------------------------------------------------------------------------
// Thông báo của nút mở cửa
const showMessageButtons = document.querySelectorAll(".show-message-button");
const modal = document.querySelector(".modal2");
const modalFinger = document.querySelector(".modal2-btn-finger");
const modalPass = document.querySelector(".modal2-btn-pass");
const openNoti = document.getElementById("modal2-confirmationContainer");
const overlay = document.getElementById("overlay");
const closeButton = document.querySelector(".close2");

// Hiện thông báo khi bấm nút
showMessageButtons.forEach((button) => {
    button.addEventListener("click", function () {
        modal.style.display = "flex"; // Hiện modal với display flex để căn giữa
    });
});

const deleteElement = (id) => {
    let container = document.getElementById(id);
    // Kiểm tra nếu container có phần tử con, sau đó xóa phần tử cuối cùng
    if (container.lastElementChild) {
        container.lastElementChild.remove();
    }
};

async function unlockHistory(status, type, ownnerID, timestamp, systemID) {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/unlockHistory"; // Thay URL này bằng URL của API thực tế
    try {
        let thanhCong;
        if (status == "success") {
            thanhCong = true;
        } else {
            thanhCong = false;
        }
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                unlockStatus: thanhCong,
                unlockType: type,
                fingerprintID: ownnerID,
                timestamp: timestamp,
                systemID: systemID,
            }),
        });
        const data = await response.json();
        if (response.ok) {
            if (data.status == "success") {
                //Khi lưu vào DB thành công
                console.log("Lưu lịch sử mở cửa vào DB thành công!");
                return data.data[0];
            } else {
                console.log("Lưu lịch sử mở cửa vào DB thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

//Lấy trạng thái của toggle và email để gửi email cho người dùng
let email_Receive;
let status_Receive;
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
                console.log("lấy trạng thái tin nhắn và email thành công!");
                status_Receive = data.data[0].thongBaoTuXa;
                email_Receive = data.data[0].emailNhanTB;
            } else {
                // Lấy danh sách thát bại (test)
                console.log("lấy trạng thái tin nhắn và email thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
// Hàm lưu cookie (session cookie)
function setCookieIOT(name, value) {
    document.cookie = `${name}=${value}; path=/`; // Không đặt thời gian hết hạn -> tự động hết khi đóng trình duyệt
}

// Hàm lấy giá trị cookie
function getCookieIOT(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [key, val] = cookie.split('=');
        if (key === name) return val;
    }
    return null;
}
//Lấy trạng thái của toggle
async function getSystemID() {
    const apiUrl = "http://localhost:8080/api/arduino/getSystemID"; // Thay URL này bằng URL của API thực tế
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
                //Lấy mã hệ thống về thành công (test)
                console.log("lấy mã hệ thống thành công!");
                getToggleStatus(data.data[0].maHeThong);
                setCookieIOT("systemID", data.data[0].maHeThong);
            } else {
                // Lấy mã hệ thống thát bại (test)
                console.log("lấy mã hệ thống thất bại.");
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

if(getCookieIOT("systemID")){
    getToggleStatus(getCookieIOT("systemID"));
}

const sendEmail = (fromName, emailUnlock, method, toEmail = "xyz@gmail.com", systemName, message = getCurrentTime()) => {
    // Khởi tạo EmailJS với User ID của bạn
    emailjs.init("dXTlEPO9Fek7Wcp");
    //null khi mở cửa bằng mật khẩu
    if(fromName == null){
        fromName = "người dùng lạ";
    }
    if(emailUnlock == null){
        emailUnlock = "không rõ";
    }
    const templateParams = {
        from_name: fromName,   // Tên người gửi
        emailUser: emailUnlock, // Email của người mở cửa
        method: method, // Phương thức mở cửa
        to_email: toEmail, // Email người gửi
        from_systemName: systemName, // tên hệ thống
        message: message, // Nội dung tin nhắn
    };
    // Gửi email với Service ID, Template ID, và các thông tin form
    emailjs.send("service_yka40im", "template_fi68hwg", templateParams).then(
        function () {
            console.log("Gửi email thành công!");
        },
        function (error) {
            console.log("Failed to send email: " + error.text);
        }
    );
};

//Lấy thời gian hiện tại
function getCurrentTime() {
    const now = new Date();

    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayOfWeek = daysOfWeek[now.getDay()];

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng trong JavaScript bắt đầu từ 0, nên cần cộng thêm 1
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const currentTime = `${dayOfWeek}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    return currentTime;
}

//hiển thị thông báo vui lòng nhập
modalFinger.addEventListener("click", function () {
    document.querySelector(".modal-content2").style.display = "none"; // Ẩn modal
    document.querySelector(".modal2-confirm-title").innerHTML = "Vui lòng đặt vân tay vào máy quét";
    document.getElementById("modal2-confirmationContainer").insertAdjacentHTML("beforeend", '<i class="bi bi-fingerprint"></i>');
    overlay.style.display = "block";
    openNoti.style.display = "block";

    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/arduino/unlockByFinger"; // Thay URL này bằng URL của API thực tế
    async function unlockDoorByFinger() {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            if (response.ok) {
                const data = await response.json();
                document.querySelector(".modal2").style.display = "none"; // Ẩn modal
                document.querySelector(".modal-content2").style.display = "block"; // Ẩn modal
                deleteElement("modal2-confirmationContainer");
                openNoti.style.display = "none";
                overlay.style.display = "none";
                const userInfo = await unlockHistory(data.status, "vân tay", data.data[0].fingerprintID, data.data[0].dateTime, getCookieIOT("systemID"));
                if (data.status == "success") {
                    //Khi mở cửa thành công
                    if (status_Receive) {
                        success("Đã mở cửa và gửi thông báo");
                        sendEmail(userInfo.owner, userInfo.emailUnlock, userInfo.method, userInfo.email, userInfo.systemName, getCurrentTime());
                    } else {
                        success("Đã mở cửa");
                    }
                } else {
                    error_nofi("Mở cửa thất bại");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    unlockDoorByFinger();
});
modalPass.addEventListener("click", function () {
    document.querySelector(".modal-content2").style.display = "none"; // Ẩn modal
    document.querySelector(".modal2-confirm-title").innerHTML = "Vui lòng nhập mật khẩu vào bàn phím";
    document.getElementById("modal2-confirmationContainer").insertAdjacentHTML("beforeend", '<i class="fa-solid fa-keyboard"></i>');
    overlay.style.display = "block";
    openNoti.style.display = "block";

    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/arduino/unlockByPassword"; // Thay URL này bằng URL của API thực tế
    async function unlockDoorByPass() {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                //khi request thành công
                document.querySelector(".modal2").style.display = "none"; // Ẩn modal
                document.querySelector(".modal-content2").style.display = "block";
                deleteElement("modal2-confirmationContainer");
                openNoti.style.display = "none";
                overlay.style.display = "none";
                const systemInfo = await unlockHistory(data.status, "mật khẩu", data.data[0].fingerprintID, data.data[0].dateTime, getCookieIOT("systemID"));
                if (data.status == "success") {
                    //Khi mở cửa thành công
                    if (status_Receive) {
                        success("Đã mở cửa và gửi thông báo");
                        sendEmail(systemInfo.owner,  systemInfo.emailUnlock, systemInfo.method, systemInfo.email, systemInfo.systemName, getCurrentTime());
                    } else {
                        success("Đã mở cửa");
                    }
                } else {
                    error_nofi("Mở cửa thất bại");
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    unlockDoorByPass();
});

// Đóng thông báo khi bấm nút đóng
closeButton.addEventListener("click", function () {
    modal.style.display = "none"; // Ẩn modal
});

// Đóng thông báo khi bấm ra ngoài modal
window.addEventListener("click", function (event) {
    if (event.target === modal) {
        modal.style.display = "none"; // Ẩn modal nếu click ra ngoài
    }
});

// Thông báo của nút xoá vân tay
const showMessageButtons2 = document.querySelectorAll(".show-message-button2");
const modal2 = document.querySelector(".modal3");
const closeButton2 = document.querySelector(".close3");

function populateTable(data) {
    const tableBody = document.getElementById("fingerprintTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Xóa nội dung cũ (nếu có)

    // Sắp xếp data theo thứ tự vanTayID tăng dần
    data.sort((a, b) => a.vanTayID - b.vanTayID);

    data.forEach((item, index) => {
        const row = document.createElement("tr");

        // Thêm vanTayID vào thuộc tính data-vanTayID của thẻ tr
        row.setAttribute("data-vanTayID", item.vanTayID);

        // Tạo ô cho số thứ tự
        const serialCell = document.createElement("td");
        serialCell.textContent = index + 1;
        row.appendChild(serialCell);

        // Tạo ô cho chuSoHuu
        const ownerCell = document.createElement("td");
        ownerCell.textContent = item.chuSoHuu;
        row.appendChild(ownerCell);

        // Tạo ô cho email
        const emailCell = document.createElement("td");
        emailCell.textContent = item.email;
        row.appendChild(emailCell);

        // Tạo ô cho tenBanTay
        const handCell = document.createElement("td");
        handCell.textContent = item.tenBanTay;
        row.appendChild(handCell);

        // Tạo ô cho vanTay
        const fingerCell = document.createElement("td");
        fingerCell.textContent = item.vanTay;
        row.appendChild(fingerCell);

        tableBody.appendChild(row);
    });
}

let fingerprintID_delete;
// Hiện thông báo khi bấm nút
showMessageButtons2.forEach((button) => {
    button.addEventListener("click", function () {
        // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
        const apiUrl = "http://localhost:8080/api/getListFinger"; // Thay URL này bằng URL của API thực tế
        async function getListFinger() {
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
                        console.log("lấy danh sách vân tay thành công!");
                        // Gọi hàm để hiển thị dữ liệu
                        populateTable(data.data);

                        // Thêm sự kiện click vào từng dòng trong bảng
                        const rows = document.querySelectorAll("#fingerprintTable tbody tr");
                        rows.forEach((row) => {
                            row.addEventListener("click", function () {
                                fingerprintID_delete = row.getAttribute("data-vantayid");
                                document.querySelector(".modal-content3").style.display = "none";
                                document.getElementById("confirmationContainer").style.display = "block";
                            });
                        });
                    } else {
                        // Lấy danh sách thát bại (test)
                        console.log("lấy danh sách vân tay thất bại.");
                    }
                } else {
                    console.error("Request failed:", response.status);
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }
        getListFinger();
        modal2.style.display = "flex"; // Hiện modal với display flex để căn giữa
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
        document.getElementById("confirmationContainer").style.display = "none";
        document.querySelector(".modal-content3").style.display = "block";
    }
});

// Xử lý lọc tìm kiếm
document.getElementById("searchInput").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#fingerprintTable tbody tr");

    rows.forEach((row) => {
        const fingerName = row.cells[1].textContent.toLowerCase();
        const owner = row.cells[2].textContent.toLowerCase();

        if (fingerName.includes(filter) || owner.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

// Xử lý nút "Quay về"
document.getElementById("backButton").addEventListener("click", function () {
    document.getElementById("confirmationContainer").style.display = "none";
    document.querySelector(".modal-content3").style.display = "block";
});

async function deleteFingerDB() {
    const successNotification = document.getElementById("successNotification");
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/deleteFingerDB"; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fingerprintId: fingerprintID_delete, maHeThong: getCookieIOT("systemID") }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                //xoá vân tay trong DB thành công (test)
                console.log("xoá vân tay trong DB thành công!");
                successNotification.style.backgroundColor = "#007BFF";
                successNotification.textContent = "Xoá vân tay thành công!";
                successNotification.style.display = "block";
                overlay.style.display = "none";
                // Tự động ẩn thông báo thành công sau 3 giây
                setTimeout(() => {
                    successNotification.style.display = "none";
                }, 3000);
            } else {
                // xoá vân tay trong DB  thất bại (test)
                console.log("xoá vân tay trong DB thất bại.");
                successNotification.style.backgroundColor = "#CD2C3D";
                successNotification.textContent = "Xoá vân tay thất bại.";
                successNotification.style.display = "block";
                overlay.style.display = "none";
                // Tự động ẩn thông báo thành công sau 3 giây
                setTimeout(() => {
                    successNotification.style.display = "none";
                }, 3000);
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Xử lý nút "Xác nhận"
document.getElementById("confirmButton-delete").addEventListener("click", function () {
    document.querySelector(".modal3").style.display = "none";
    document.getElementById("confirmationContainer").style.display = "none";
    document.querySelector(".modal-content3").style.display = "block";
    overlay.style.display = "block";
    const successNotification = document.getElementById("successNotification");

    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/arduino/deleteFinger"; // Thay URL này bằng URL của API thực tế

    async function deleteFinger() {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fingerprintId: fingerprintID_delete }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //xoá vân tay trong arduino thành công (test)
                    console.log("xoá vân tay trong arduino thành công!");
                    deleteFingerDB();
                } else {
                    //xoá vân tay trong arduino thát bại (test)
                    console.log("xoá vân tay trong arduino thất bại.");
                    successNotification.style.backgroundColor = "#CD2C3D";
                    successNotification.textContent = "Xoá vân tay thất bại.";
                    successNotification.style.display = "block";
                    overlay.style.display = "none";
                    // Tự động ẩn thông báo thành công sau 3 giây
                    setTimeout(() => {
                        successNotification.style.display = "none";
                    }, 3000);
                }
            } else {
                console.error("Request failed:", response.status);
                //xoá vân tay trong arduino thát bại (test)
                console.log("xoá vân tay trong arduino thất bại.");
                successNotification.style.backgroundColor = "#CD2C3D";
                successNotification.textContent = "Xoá vân tay thất bại.";
                successNotification.style.display = "block";
                overlay.style.display = "none";
                // Tự động ẩn thông báo thành công sau 3 giây
                setTimeout(() => {
                    successNotification.style.display = "none";
                }, 3000);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    deleteFinger();
});

// Lấy danh sách chủ sở hữu (cho form thêm vân tay)
// JavaScript: Fetch data from API and populate the select element
async function fetchOwners() {
    try {
        // Gọi API để lấy danh sách chủ sở hữu
        const response = await fetch("http://localhost:8080/api/getListOwner"); // Thay /api/owners bằng đường dẫn đến API của bạn
        const owners = await response.json();
        const ownerList = owners.data;
        // Lấy thẻ select
        const selectElement = document.getElementById("ownerSelect");

        // Xóa các option cũ (nếu cần thiết)
        selectElement.innerHTML = '<option value="">Chọn chủ sở hữu</option>';

        // Thêm các option mới từ API
        ownerList.forEach((owner) => {
            const option = document.createElement("option");
            option.value = owner.maNguoiDung; // Hoặc thuộc tính đại diện ID của chủ sở hữu
            option.textContent = owner.chuSoHuu; // Hoặc thuộc tính đại diện tên của chủ sở hữu
            selectElement.appendChild(option);
        });

        // Thêm tùy chọn "Khác" để nhập tên mới
        const otherOption = document.createElement("option");
        otherOption.value = "other";
        otherOption.textContent = "Khác";
        selectElement.appendChild(otherOption);
    } catch (error) {
        console.error("Lỗi khi tải danh sách chủ sở hữu:", error);
    }
}

// Sự kiện của nút thêm vân tay
document.getElementById("buttonB").addEventListener("click", function () {
    document.getElementById("modal").style.display = "block";
    fetchOwners();
});

// Sự kiện đóng thông báo
document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "none";
    onRequire(true);
});

const openNoti2 = document.getElementById("modal2-confirmationContainer2");
const onRequire = (status) => {
    document.getElementById("gender").required = status;
    document.getElementById("age").required = status;
    document.getElementById("phone").required = status;
    document.getElementById("email").required = status;
    if (status) {
        document.querySelector(".information").style.display = "block";
    } else {
        document.querySelector(".information").style.display = "none";
    }
};
//Hiển thị trường nhập chủ sở hữu
function toggleOwnerInput() {
    const ownerSelect = document.getElementById("ownerSelect");
    const newOwnerDiv = document.getElementById("newOwnerDiv");
    if (ownerSelect.value === "other") {
        newOwnerDiv.style.display = "block";
        document.getElementById("newOwner").required = true;
        onRequire(true);
    } else {
        newOwnerDiv.style.display = "none";
        document.getElementById("newOwner").required = false;
        onRequire(false);
    }
}

// Sự kiện xử lý thông tin form
document.getElementById("infoForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Ngăn không cho form gửi đi (nếu gửi đi là không gửi thêm request nào nữa)
    // Lấy giá trị của các trường
    const ownerSelect = document.getElementById("ownerSelect").value;
    const newOwnerInput = document.getElementById("newOwner").value;
    const gender = document.getElementById("gender").value;
    const age = document.getElementById("age").value;
    const hand = document.getElementById("hand").value;
    const finger = document.getElementById("finger").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;

    // Kiểm tra nếu chủ sở hữu được chọn là "Khác"
    if (ownerSelect === "other") {
        // Kiểm tra trường nhập tên chủ sở hữu mới có rỗng hay không
        if (!newOwnerInput.trim()) {
            alert("Vui lòng nhập tên chủ sở hữu mới.");
            return;
        }
        // Kiểm tra tính hợp lệ của các trường (nếu cần thêm yêu cầu đặc biệt)
        if (!gender || !age || !hand || !finger || !phone || !email) {
            alert("Vui lòng điền đầy đủ thông tin.");
            return;
        }
    } else if (!ownerSelect) {
        // Kiểm tra xem có chọn chủ sở hữu nào không
        alert("Vui lòng chọn một chủ sở hữu.");
        return;
    } else {
        // Kiểm tra tính hợp lệ của các trường (nếu cần thêm yêu cầu đặc biệt)
        if (!hand || !finger) {
            alert("Vui lòng điền đầy đủ thông tin.");
            return;
        }
    }

    let owner;
    let ownerStatus;
    // Kiểm tra nếu chủ sở hữu được chọn là "Khác"
    if (ownerSelect === "other") {
        owner = newOwnerInput;
        ownerStatus = true;
    } else {
        owner = ownerSelect;
        ownerStatus = false;
    }

    //Ẩn form
    document.querySelector(".modal-content").style.display = "none";
    document.querySelector(".modal2-confirm-title2").innerHTML = "Vui lòng đưa vân tay vào máy quét";
    document.getElementById("modal2-confirmationContainer2").insertAdjacentHTML("beforeend", '<i class="bi bi-fingerprint"></i>');
    openNoti2.style.display = "block";
    overlay.style.display = "block";

    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/arduino/addNewFinger"; // Thay URL này bằng URL của API thực tế
    async function addNewFinger() {
        const successNotification = document.getElementById("successNotification");
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
                    //Thêm vân tay thành công (test)
                    console.log("thêm vân tay vào arduino thành công!");
                    //Lấy id vân tay vừa lưu từ arduino
                    const fingerprintID = data.data[0].fingerprintID;
                    // Lưu vào database
                    await addNewFingerDB(fingerprintID);
                } else {
                    // Thêm vân tay vào arduino thất bại (test)
                    console.log("thêm vân tay vào arduino thất bại.");
                    document.querySelector(".modal-content").style.display = "block";
                    openNoti2.style.display = "none";
                    overlay.style.display = "none";
                    document.querySelector(".modal").style.display = "none";
                    onRequire(true);
                    deleteElement("modal2-confirmationContainer2");
                    successNotification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
                    successNotification.textContent = "thêm vân tay vào DB thất bại.";
                    successNotification.style.display = "block";
                    // Tự động ẩn thông báo thành công sau 3 giây
                    setTimeout(() => {
                        successNotification.style.display = "none";
                    }, 3000);
                }
            } else {
                console.error("Request failed:", response.status);
                document.querySelector(".modal-content").style.display = "block";
                openNoti2.style.display = "none";
                overlay.style.display = "none";
                document.querySelector(".modal").style.display = "none";
                onRequire(true);
                deleteElement("modal2-confirmationContainer2");
                successNotification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
                successNotification.textContent = "thêm vân tay vào DB thất bại.";
                successNotification.style.display = "block";
                // Tự động ẩn thông báo thành công sau 3 giây
                setTimeout(() => {
                    successNotification.style.display = "none";
                }, 3000);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
    addNewFinger();

    async function addNewFingerDB(fingerprintID) {
        const successNotification = document.getElementById("successNotification");
        const systemID = getCookieIOT("systemID")
        // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
        const apiUrl = "http://localhost:8080/api/addNewFingerDB"; // Thay URL này bằng URL của API thực tế
        let userInfo;
        if (ownerStatus) {
            userInfo = {
                owner: owner,
                ownerSelect: ownerSelect,
                ownerStatus: ownerStatus,
                gender: gender,
                age: age,
                phone: phone,
                email: email,
                hand: hand,
                finger: finger,
                fingerprintID: fingerprintID,
                maHeThong: systemID
            };
        } else {
            userInfo = {
                owner: owner,
                ownerSelect: ownerSelect,
                ownerStatus: ownerStatus,
                hand: hand,
                finger: finger,
                fingerprintID: fingerprintID,
                maHeThong: systemID
            };
        }
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userInfo: userInfo }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status == "success") {
                    //Thêm vân tay vào DB thành công (test)
                    console.log("thêm vân tay vào DB thành công!");
                    document.querySelector(".modal-content").style.display = "block";
                    openNoti2.style.display = "none";
                    overlay.style.display = "none";
                    document.querySelector(".modal").style.display = "none";
                    onRequire(true);
                    deleteElement("modal2-confirmationContainer2");
                    successNotification.style.backgroundColor = "#007BFF"; // Xanh cho thông báo thành công
                    successNotification.textContent = "Thêm vân tay thành công!";
                    successNotification.style.display = "block";
                    // Tự động ẩn thông báo thành công sau 3 giây
                    setTimeout(() => {
                        successNotification.style.display = "none";
                    }, 3000);
                } else {
                    // thêm vân tay vào DB thát bại (test)
                    console.log("thêm vân tay vào DB thất bại.");
                    document.querySelector(".modal-content").style.display = "block";
                    openNoti2.style.display = "none";
                    overlay.style.display = "none";
                    document.querySelector(".modal").style.display = "none";
                    onRequire(true);
                    deleteElement("modal2-confirmationContainer2");
                    successNotification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
                    successNotification.textContent = data.message;
                    successNotification.style.display = "block";
                    // Tự động ẩn thông báo thành công sau 3 giây
                    setTimeout(() => {
                        successNotification.style.display = "none";
                    }, 3000);
                }
            } else {
                console.error("Request failed:", response.status);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Reset form để xóa các giá trị hiện tại
    document.getElementById("infoForm").reset();
});

// Thông báo của nút thay đổi mật khẩu
const showMessageButtons3 = document.querySelectorAll(".show-message-button3");
const modal3 = document.querySelector(".modal4");
const closeButton3 = document.querySelector(".close4");

// Hiện thông báo khi bấm nút
showMessageButtons3.forEach((button) => {
    button.addEventListener("click", function () {
        modal3.style.display = "flex"; // Hiện modal với display flex để căn giữa
    });
});

// Đóng thông báo khi bấm nút đóng
closeButton3.addEventListener("click", function () {
    modal3.style.display = "none"; // Ẩn modal
});

//xử lý sự kiện thay đổi mật khẩu
// Xử lý sự kiện khi nhấn nút "Xác nhận"
document.getElementById("confirmButton").addEventListener("click", function () {
    const oldPassword = document.getElementById("oldPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const notification = document.getElementById("passwordNotification");
    //Kiểm tra tính hợp lệ
    if (newPassword === "" || oldPassword === "" || confirmPassword === "") {
        notification.textContent = "Vui lòng nhập đủ thông tin.";
        notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
        displayNoti(notification);
    } else if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
        notification.textContent = "Mật khẩu phải là 4 chữ số.";
        notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
        displayNoti(notification);
    } else if (newPassword !== confirmPassword) {
        notification.textContent = "Mật khẩu nhập lại không khớp.";
        notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
        displayNoti(notification);
    } else if (newPassword === oldPassword) {
        notification.textContent = "Mật khẩu mới không được giống mật khẩu cũ.";
        notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
        displayNoti(notification);
    } else {
        // Thành công, tiến hành cập nhật mật khẩu
        updatePassword(oldPassword, newPassword, notification);
    }
});
const displayNoti = (notification) => {
    // Hiển thị thông báo và tự động ẩn sau 3 giây
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
};
async function updatePassword(oldPassword, newPassword, notification) {
    try {
        // Gửi dữ liệu lên API
        const response = await fetch("http://localhost:8080/api/arduino/updatePassword", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword,
            }),
        });
        const data = await response.json();
        // Xử lý phản hồi từ API
        if (data.status == "success") {
            updatePasswordDB(getCookieIOT("systemID"), oldPassword, newPassword, notification);
        } else {
            notification.textContent = "Mật khẩu cũ sai.";
            notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
            displayNoti(notification);
        }
    } catch (error) {
        // Xử lý lỗi kết nối hoặc phản hồi
        notification.textContent = "Có lỗi xảy ra. Vui lòng thử lại.";
        notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
        displayNoti(notification);
    }
}

async function updatePasswordDB(data, oldPassword, newPassword, notification) {
    const successNotification = document.getElementById("successNotification");
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = "http://localhost:8080/api/updatePasswordDB"; // Thay URL này bằng URL của API thực tế
    const passwordInfo = {
        maHeThong: data,
        oldPassword: oldPassword,
        newPassword: newPassword,
    };
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ passwordInfo: passwordInfo }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                notification.textContent = "Đổi mật khẩu thành công!";
                notification.style.backgroundColor = "#4CAF50"; // Xanh lá cho thông báo thành công
                displayNoti(notification);
            } else {
                notification.textContent = data.message;
                notification.style.backgroundColor = "#f44336"; // Đỏ cho thông báo lỗi
                displayNoti(notification);
            }
        } else {
            console.error("Request failed:", response.status);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
