const connection = require("../config/database");
const bcrypt = require("bcryptjs");
const { timeStamp } = require("console");
const fs = require("fs");
const { fetch } = require("undici"); //cho phép thiết lập timeout
const transporter = require("../config/emailJS");
let IP = ""; // Địa chỉ IP của ESP8266
let serverIP = "http://" + IP; // Địa chỉ miền của ESP8266
//Homepage
const getIotHomePage = async (req, res) => {
    return res.render("iot.ejs");
};
const getPersonalPage = async (req, res) => {
    return res.render("personal.ejs");
};

// mock api
function delayedFunction() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Hàm đã trả về sau 3 giây");
        }, 3000);
    });
}
function getRandomInt0to99() {
    //test thông báo lỗi và thông báo thành công
    return Math.floor(Math.random() * 100);
}
const timeConvert = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
};
const unlockByFinger = async (req, res) => {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu GET
    const apiUrl = serverIP + "/fingerprint"; // Thay URL này bằng URL của API thực tế
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
                return res.json({ status: "success", message: "Door unlocked!", data: [{ fingerprintID: 1, dateTime: timeConvert() }] });
            } else {
                return res.json({ status: "error", message: "Unlock fail." });
            }
        } else {
            console.error("Request failed:", response.status);
            return res.json({ status: "error", message: "Unlock fail." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.json({ status: "error", message: "Unlock fail." });
    }
};
const unlockByPassword = async (req, res) => {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu GET
    const apiUrl = serverIP + "/password"; // Thay URL này bằng URL của API thực tế
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
                return res.json({ status: "success", message: "Door unlocked!", data: [{ fingerprintID: null, dateTime: timeConvert() }] });
            } else {
                return res.json({ status: "error", message: "Unlock fail." });
            }
        } else {
            console.error("Request failed:", response.status);
            return res.json({ status: "error", message: "Unlock fail." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.json({ status: "error", message: "Unlock fail." });
    }
};
const unlockHistory = async (req, res) => {
    const { unlockStatus, unlockType, fingerprintID, timestamp, systemID } = req.body;
    // Lấy kết nối từ pool
    const nt = await connection.getConnection();
    let maNguoiDung = null,
        owner = null,
        email = null,
        tenHeThong = null,
        method = null,
        emailUnlock = null;
    try {
        await nt.beginTransaction(); // Bắt đầu giao dịch
        // Bước 1: Lấy maNguoiDung từ bảng VanTay dựa trên fingerprintID
        if (fingerprintID != null) {
            const [user] = await nt.execute(`SELECT maNguoiDung FROM VanTay WHERE vanTayID = ?;`, [fingerprintID]);
            if (user.length === 0) {
                throw new Error("Người dùng không tồn tại.");
            }
            maNguoiDung = user[0].maNguoiDung;

            // Dùng cho sendEmail()
            const [chuSoHuu] = await nt.execute(`SELECT chuSoHuu, email FROM NguoiDung WHERE maNguoiDung = ?`, [maNguoiDung]);
            if (chuSoHuu.length === 0) {
                throw new Error("Chủ sở hữu không tồn tại.");
            }
            owner = chuSoHuu[0].chuSoHuu;
            emailUnlock = chuSoHuu[0].email;
        }
        // Lấy email nhận và tên hệ thống cho gửi email
        const [emailNhan] = await nt.execute(`SELECT emailNhanTB, tenHeThong FROM HeThongKhoa WHERE heThongID = ?`, [systemID]);
        if (emailNhan.length === 0) {
            throw new Error("Email nhận không tồn tại.");
        }
        email = emailNhan[0].emailNhanTB;
        tenHeThong = emailNhan[0].tenHeThong;

        // Lấy mã hệ thống
        const [system] = await nt.execute(
            `SELECT maHeThong
            FROM HeThongKhoa
            WHERE heThongID = ?;`,
            [systemID]
        );
        const maHeThong = system[0].maHeThong;
        // Bước 3: Chèn thông tin truy cập mới vào LichSuMoCua
        const [kq] = await nt.execute(
            `INSERT INTO LichSuMoCua (thoiGian, loaiTruyCap, thanhCong, maHeThong, maNguoiDung)
            VALUES (?, ?, ?, ?, ?)`,
            [timestamp, unlockType, unlockStatus, maHeThong, maNguoiDung]
        );

        // Dùng cho sendEmail()
        const [phuongThuc] = await nt.execute(`SELECT loaiTruyCap FROM LichSuMoCua WHERE maNhatKy = ?`, [kq.insertId]);
        if (phuongThuc.length === 0) {
            throw new Error("Phương thức không tồn tại.");
        }
        method = phuongThuc[0].loaiTruyCap;
        await nt.commit(); // Commit giao dịch nếu mọi thứ thành công
        console.log("Ghi nhật ký truy cập thành công.");
    } catch (error) {
        await nt.rollback(); // Rollback nếu có lỗi
        console.error("Lỗi:", error.message);
    } finally {
        nt.release(); // Chỉ gọi release() nếu nó tồn tại
    }
    return res.json({ status: "success", message: "Save unlockHistory success!", data: [{ owner: owner, emailUnlock: emailUnlock, method: method, email: email, systemName: tenHeThong }] });
};
const getListFinger = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT 
            NguoiDung.chuSoHuu, 
            NguoiDung.email, 
            VanTay.tenBanTay, 
            VanTay.vanTay,
            VanTay.vanTayID
        FROM 
            NguoiDung
        JOIN 
            VanTay ON NguoiDung.maNguoiDung = VanTay.maNguoiDung;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list fingerprint success!",
        data: results,
    });
};
const getListOwner = async (req, res) => {
    const [results, fields] = await connection.query(`SELECT maNguoiDung, chuSoHuu FROM NguoiDung`); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list owner success!",
        data: results,
    });
};

async function increaseID() {
    try {
        // Thực hiện truy vấn để lấy `vanTayID` của hàng cuối cùng
        const [results] = await connection.query(`
            SELECT vanTayID 
            FROM VanTay 
            ORDER BY maVanTay DESC 
            LIMIT 1;
        `);

        // Kiểm tra xem kết quả có dữ liệu hay không
        let id = results.length > 0 ? results[0].vanTayID : 0;

        // Tăng giá trị `id` lên 1
        id += 1;
        return id;
    } catch (error) {
        console.error("Error fetching vanTayID:", error);
        throw error; // Ném lỗi để xử lý bên ngoài nếu cần
    }
}
const addNewFinger = async (req, res) => {
    let id;
    try {
        id = await increaseID();
    } catch (error) {
        console.error("Error:", error);
    }
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu GET
    const apiUrl = serverIP + "/addNewFingerprint?id=" + id; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                return res.json({ status: "success", message: "Add fingerprint success!", data: [{ fingerprintID: id }] });
            } else {
                return res.json({ status: "error", message: "Add fingerprint fail." });
            }
        } else {
            console.error("Request failed:", response.status);
            return res.json({ status: "error", message: "Add fingerprint fail." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.json({ status: "error", message: "Add fingerprint fail." });
    }
};
const addNewFingerDB = async (req, res) => {
    const { owner, ownerSelect, ownerStatus, gender, age, phone, email, hand, finger, fingerprintID, maHeThong } = req.body.userInfo;
    const systemID = maHeThong;
    // Lấy kết nối từ pool
    const nt = await connection.getConnection();
    try {
        await nt.beginTransaction(); // Bắt đầu giao dịch
        let userID;
        if (ownerStatus) {
            //Thêm thông tin người dùng
            const [userInfo] = await nt.execute(`INSERT INTO NguoiDung (chuSoHuu, gioiTinh, tuoi, soDienThoai, email) VALUES (?, ?, ?, ?, ?)`, [owner, gender, age, phone, email]);
            userID = userInfo.insertId;
        } else {
            // Lấy mã người dùng khi biết vanTayID
            userID = ownerSelect;
        }
        //Kiểm tra xem bàn tay, vân tay, người dùng có bị trùng lặp nhau hay không
        const [checkFinger] = await nt.execute(
            `SELECT 
            COUNT(*) AS soLanTrungLap
            FROM 
                VanTay
            WHERE 
                maNguoiDung = ? 
                AND tenBanTay = ? 
                AND vanTay = ?`,
            [userID, hand, finger]
        );
        if (checkFinger[0].soLanTrungLap > 0) {
            return res.json({ status: "error", message: "Vân tay đã tồn tại." });
        }
        await nt.execute(`INSERT INTO VanTay (tenBanTay, ngayDangKy, vanTay, vanTayID, maNguoiDung) VALUES (?, ?, ?, ?, ?)`, [hand, timeConvert(), finger, fingerprintID, userID]);
        //Thêm lịch sử thao tác
        const [history] = await nt.execute(`INSERT INTO LichSuThaoTac (ngayThayDoi, noiDungThayDoi, maNguoiDung, maHeThong) VALUES (?, ?, ?, ?)`, [timeConvert(), "Thêm vân tay mới", null, systemID]);
        if (history.length === 0) {
            throw new Error("Cập nhật lịch sử thao tác thất bại.");
        }
        await nt.commit(); // Commit giao dịch nếu mọi thứ thành công
        console.log("Ghi nhật ký truy cập thành công.");
    } catch (error) {
        await nt.rollback(); // Rollback nếu có lỗi
        console.error("Lỗi:", error.message);
        return res.json({ status: "error", message: error.message });
    } finally {
        nt.release(); // Chỉ gọi release() nếu nó tồn tại
    }
    return res.json({ status: "success", message: "Add fingerprint to DB success!" });
};
const deleteFinger = async (req, res) => {
    const { fingerprintId } = req.body;
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = serverIP + "/deleteFingerprint?id=" + fingerprintId; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                return res.json({ status: "success", message: "Delete fingerprint success!" });
            } else {
                return res.json({ status: "error", message: "Delete fingerprint fail." });
            }
        } else {
            console.error("Request failed:", response.status);
            return res.json({ status: "error", message: "Delete fingerprint fail." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.json({ status: "error", message: "Add fingerprint fail." });
    }
};
const deleteFingerDB = async (req, res) => {
    const { fingerprintId, maHeThong } = req.body;
    const systemID = maHeThong;
    // Lấy kết nối từ pool
    const nt = await connection.getConnection();
    let deleteFingerprint;
    try {
        await nt.beginTransaction(); // Bắt đầu giao dịch
        //Xoá vân tay trong bảng
        deleteFingerprint = await nt.execute(`DELETE FROM VanTay WHERE vanTayID = ?;`, [fingerprintId]);

        //Thêm lịch sử thao tác
        const [history] = await nt.execute(`INSERT INTO LichSuThaoTac (ngayThayDoi, noiDungThayDoi, maNguoiDung, maHeThong) VALUES (?, ?, ?, ?)`, [timeConvert(), "Xoá vân tay trong hệ thống", null, systemID]);
        if (history.length === 0) {
            throw new Error("Cập nhật lịch sử thao tác thất bại.");
        }
        await nt.commit(); // Commit giao dịch nếu mọi thứ thành công
        console.log("Ghi nhật ký truy cập thành công.");
    } catch (error) {
        await nt.rollback(); // Rollback nếu có lỗi
        console.error("Lỗi:", error.message);
        return res.json({ status: "error", message: error.message });
    } finally {
        nt.release(); // Chỉ gọi release() nếu nó tồn tại
    }
    if (deleteFingerprint[0].affectedRows) {
        return res.json({ status: "success", message: "Delete fingerprint on DB success!" });
    } else {
        return res.json({ status: "error", message: "Delete fingerprint on DB fail." });
    }
};
const updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = serverIP + "/changePassword?currentPassword=" + oldPassword + "&newPassword=" + newPassword; // Thay URL này bằng URL của API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                return res.json({ status: "success", message: "Update password success!", data: [{ maHeThong: 1 }] });
            } else {
                return res.json({ status: "error", message: "Update password fail." });
            }
        } else {
            console.error("Request failed:", response.status);
            return res.json({ status: "error", message: "Update password fail." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.json({ status: "error", message: "Update password fail." });
    }
};
const updatePasswordDB = async (req, res) => {
    let { maHeThong, oldPassword, newPassword } = req.body.passwordInfo;
    const systemID = maHeThong;
    // Lấy kết nối từ pool
    const nt = await connection.getConnection();
    try {
        await nt.beginTransaction(); // Bắt đầu giao dịch
        //Kiểm tra mật khẩu cũ
        const [reslt] = await nt.execute("SELECT matKhauMaHoa FROM HeThongKhoa WHERE maHeThong = ?", [maHeThong]);
        if (reslt.length == 0) {
            return res.json({ status: "error", message: "Hệ thống không tồn tại." });
        }
        const currentPassword = reslt[0].matKhauMaHoa;
        if (!(await bcrypt.compare(oldPassword, currentPassword))) {
            return res.json({ status: "error", message: "Mật khẩu cũ không đúng." });
        } else if (await bcrypt.compare(newPassword, currentPassword)) {
            return res.json({ status: "error", message: "Mật khẩu mới bị trùng với các mật khẩu trước đây." });
        }
        // Dữ liệu bạn muốn lưu
        const data = "Mật khẩu hệ thống: " + newPassword;
        newPassword = await bcrypt.hash(newPassword, 8);
        //Cập nhật mật khẩu
        const [result] = await nt.execute("UPDATE HeThongKhoa SET matKhauMaHoa = ?, lanThayDoiMKCuoi = ? WHERE maHeThong = ?", [newPassword, timeConvert(), maHeThong]);

        // Lưu dữ liệu vào file 'output.txt'
        fs.writeFile("password_IOT.txt", data, (err) => {
            if (err) {
                console.error("Lỗi khi ghi file:", err);
            } else {
                console.log("Mật khẩu đã được lưu vào file password_IOT.txt");
            }
        });

        //Thêm lịch sử thao tác
        const [history] = await nt.execute(`INSERT INTO LichSuThaoTac (ngayThayDoi, noiDungThayDoi, maNguoiDung, maHeThong) VALUES (?, ?, ?, ?)`, [timeConvert(), "Cập nhật mật khẩu mới", null, systemID]);
        if (history.length === 0) {
            throw new Error("Cập nhật lịch sử thao tác thất bại.");
        }
        await nt.commit(); // Commit giao dịch nếu mọi thứ thành công
        console.log("Ghi nhật ký truy cập thành công.");
    } catch (error) {
        await nt.rollback(); // Rollback nếu có lỗi
        console.error("Lỗi:", error.message);
        return res.json({ status: "error", message: error.message });
    } finally {
        nt.release(); // Chỉ gọi release() nếu nó tồn tại
    }
    return res.json({ status: "success", message: "Update password to DB success!" });
};

const getListUser = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT maNguoiDung, chuSoHuu, gioiTinh, tuoi, soDienThoai, email
        FROM NguoiDung;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list users success!",
        data: results,
    });
};
const getSystemID = async (req, res) => {
    const [results, fields] = await connection.query(`SELECT heThongID FROM HeThongKhoa WHERE diaChiIP = ?`,[IP]); // dùng `` được phép xuống dòng
    const systemID = results[0].heThongID;
    // console.log(systemID);
    return res.json({ status: "success", message: "Get systemID success!", data: [{ maHeThong: systemID }] });
};
const getToggleStatus = async (req, res) => {
    const { maHeThong } = req.body;
    const [results, fields] = await connection.query(
        `
        SELECT thongBaoTuXa, emailNhanTB FROM HeThongKhoa WHERE maHeThong = ?`,
        [maHeThong]
    ); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get toggle status success!",
        data: results,
    });
};
const updateToggleStatus = async (req, res) => {
    const { status, maHeThong } = req.body.status;
    const systemID = maHeThong;
    const [results, fields] = await connection.query(
        `
        UPDATE HeThongKhoa SET thongBaoTuXa = ? WHERE maHeThong = ?
        `,
        [status, maHeThong]
    ); // dùng `` được phép xuống dòng

    //Thêm lịch sử thao tác
    const [history] = await connection.execute(`INSERT INTO LichSuThaoTac (ngayThayDoi, noiDungThayDoi, maNguoiDung, maHeThong) VALUES (?, ?, ?, ?)`, [timeConvert(), "Bật/tắt chức năng gửi tin nhắn", null, systemID]);
    if (history.length === 0) {
        throw new Error("Cập nhật lịch sử thao tác thất bại.");
    }
    return res.json({
        status: "success",
        message: "Update toggle status on DB success!",
        data: results,
    });
};
const updateEmailReceive = async (req, res) => {
    const { email, maHeThong } = req.body.status;
    const systemID = maHeThong;
    const [results, fields] = await connection.query(
        `
        UPDATE HeThongKhoa SET emailNhanTB = ? WHERE maHeThong = ?
        `,
        [email, maHeThong]
    ); // dùng `` được phép xuống dòng

    const [history] = await connection.execute(`INSERT INTO LichSuThaoTac (ngayThayDoi, noiDungThayDoi, maNguoiDung, maHeThong) VALUES (?, ?, ?, ?)`, [timeConvert(), "Cập nhật email nhận tin nhắn", null, systemID]);
    if (history.length === 0) {
        throw new Error("Cập nhật lịch sử thao tác thất bại.");
    }
    return res.json({
        status: "success",
        message: "Update email receive on DB success!",
        data: results,
    });
};
const getListDiary = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT thoiGian, loaiTruyCap, thanhCong
        FROM LichSuMoCua;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list diary success!",
        data: results,
    });
};
const getListAction = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT ngayThayDoi, noiDungThayDoi
        FROM LichSuThaoTac;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list action success!",
        data: results,
    });
};

const getListSystem = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT heThongID, tenHeThong, diaChiIP
        FROM HeThongKhoa;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list action success!",
        data: results,
    });
};
const updateIP = async (req, res) => {
    IP = req.body.ip;
    serverIP = "http://" + IP;
    return res.json({
        status: "success",
        message: "Update IP success!",
    });
};

function getFormattedDateTime() {
    const now = new Date();

    // Lấy thông tin về ngày, tháng, năm, giờ, phút, giây
    const daysOfWeek = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng tính từ 0-11
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // Format kết quả
    return `${dayOfWeek}, ngày ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

//Gửi email trạng thái
const sendEmail = async (fromName, toEmail) => {
    const time = getFormattedDateTime();
    try {
        // Nội dung email
        const mailOptions = {
            from: "Hệ thống cửa thông minh", // Người gửi
            to: toEmail, // Người nhận
            subject: fromName + " không hoạt động", // Tiêu đề email
            text: `Xin chào,
            ${fromName} của bạn hiện đang không hoạt động, vui lòng kiểm tra lại để đảm bảo an toàn.

            Dưới đây là thông tin chi tiết:

            Thời gian: ${time}
            Tình trạng cửa: không hoạt động
            Nguyên nhân dự đoán: mất điện
            
            Trân trọng,
            Hệ thống cửa thông minh`, // Nội dung text (fallback)
            html: `
                    <p>Xin chào,</p>
                    <p>${fromName} của bạn hiện đang không hoạt động, vui lòng kiểm tra lại để đảm bảo an toàn.</p>
                    <p><b>Dưới đây là thông tin chi tiết:</b></p>
                    <ul>
                        <li><b>Thời gian:</b> ${time}</li>
                        <li><b>Tình trạng cửa:</b> không hoạt động</li>
                        <li><b>Nguyên nhân dự đoán:</b> mất điện</li>
                    </ul>
                    <p>Trân trọng,</p>
                    <p><i>Hệ thống cửa thông minh</i></p>
                  `, // Nội dung HTML
        };

        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
};
// Map lưu trạng thái thiết bị (Key: IP, Value: trạng thái)
const deviceStatusMap = new Map();
const heartBeatBE = async (id, ip) => {
    const serverPing = "http://" + ip;
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = serverPing + "/heartbeat"; // Thay URL này bằng URL của API thực tế

    //Lấy email gửi TB
    const [results, fields] = await connection.query(
        `
    SELECT tenHeThong, emailNhanTB FROM HeThongKhoa WHERE maHeThong = ?`,
        [id]
    ); // dùng `` được phép xuống dòng
    const { tenHeThong, emailNhanTB } = results[0];
    // Tạo AbortController để quản lý timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // Timeout 3000ms
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ send_from_client: "localhost:8080" }),
            signal: controller.signal, // Sử dụng signal từ AbortController
        });
        clearTimeout(timeout); // Hủy timeout nếu yêu cầu hoàn thành
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                console.log("Device online!");
                deviceStatusMap.set(ip, true); // Cập nhật trạng thái thành online
            }
        } else {
            console.error("Device offline.");
            if (deviceStatusMap.get(ip)) {
                sendEmail(tenHeThong, emailNhanTB);
                //cập nhật trạng thái trong DB
                await connection.query("UPDATE HeThongKhoa SET dangHoatDong = 0 WHERE maHeThong = ?", [id]);
                deviceStatusMap.set(ip, false); // Cập nhật trạng thái thành offline
            }
        }
    } catch (error) {
        console.error("Device offline.");
        if (deviceStatusMap.get(ip)) {
            sendEmail(tenHeThong, emailNhanTB);
            await connection.query("UPDATE HeThongKhoa SET dangHoatDong = 0 WHERE maHeThong = ?", [id]);
            deviceStatusMap.set(ip, false); // Cập nhật trạng thái thành offline
        }
    }
};
const heartBeat = async (req, res) => {
    // Đoạn mã JavaScript dùng fetch để gửi yêu cầu POST
    const apiUrl = serverIP + "/heartbeat"; // Thay URL này bằng URL của API thực tế
    // Tạo AbortController để quản lý timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // Timeout 3000ms
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ send_from_client: "localhost:8080" }),
            signal: controller.signal, // Sử dụng signal từ AbortController
        });
        clearTimeout(timeout); // Hủy timeout nếu yêu cầu hoàn thành
        if (response.ok) {
            const data = await response.json();
            if (data.status == "success") {
                return res.json({ status: "success", message: "Device actived!" });
            }
        } else {
            return res.json({ status: "error", message: "Device offline.", timestamp: timeConvert() });
        }
    } catch (error) {
        return res.json({ status: "error", message: "Device offline.", timestamp: timeConvert() });
    }
};

//Chức năng kiểm soát hệ thống
const streamIntervals = [];
// Hàm tắt luồng
function stopStream(id, ip) {
    if (!streamIntervals[id]) {
        console.log(`Luồng với ID ${id} chưa chạy.`);
        return; // Nếu luồng chưa chạy, không làm gì
    }

    clearInterval(streamIntervals[id]); // Dừng luồng
    delete streamIntervals[id]; // Xóa trạng thái luồng
    console.log(`Đã tắt luồng với ID ${id} - địa chỉ IP ${ip}`);
}
// Hàm bật luồng
function startStream(id, ip) {
    if (streamIntervals[id]) {
        console.log(`Luồng với ID ${id} đã chạy.`);
        return; // Nếu luồng đã chạy, không tạo thêm
    }
    deviceStatusMap.set(ip, true); // Cập nhật trạng thái thành online
    const message = `Luồng với ID ${id} đang chạy`;
    streamIntervals[id] = setInterval(async () => {
        await heartBeatBE(id, ip);
    }, 3000);

    console.log(`Đã bật luồng với ID ${id}`);
}
const checkOnline = async (req, res) => {
    const { id, ip, status } = req.body;
    // Lưu các intervalId của từng luồng
    streamIntervals.push(null); // Thêm trạng thái luồng mới vào mảng

    if (status) {
        startStream(id, ip);
        const [results, fields] = await connection.query(`UPDATE HeThongKhoa SET thongBaoTTHD = ? WHERE maHeThong = ?`, [1, id]); // dùng `` được phép xuống dòng
    } else {
        stopStream(id, ip);
        const [results, fields] = await connection.query(`UPDATE HeThongKhoa SET thongBaoTTHD = ? WHERE maHeThong = ?`, [0, id]); // dùng `` được phép xuống dòng
    }
    return res.json({ status: "success", message: "Device actived!" });
};
const getSystemActiveStatus = async (req, res) => {
    const { maHeThong } = req.body;
    const [results, fields] = await connection.query(
        `
        SELECT thongBaoTTHD, emailNhanTB FROM HeThongKhoa WHERE maHeThong = ?`,
        [maHeThong]
    ); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get toggle system status success!",
        data: results,
    });
};
const getListSystemInfo = async (req, res) => {
    const [results, fields] = await connection.query(`
        SELECT tenHeThong, diaChiIP, dangHoatDong
        FROM HeThongKhoa;
        `); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list action success!",
        data: results,
    });
};
const addListSystemInfo = async (req, res) => {
    const { tenHeThong, diaChiIP, dangHoatDong } = req.body;
    const nt = await connection.getConnection();
    try {
        await nt.beginTransaction(); // Bắt đầu giao dịch
        // Lấy mã hệ thống ID
        const [system] = await nt.execute(
            `SELECT *
            FROM HeThongKhoa
            ORDER BY heThongID DESC
            LIMIT 1;`
        );
        let maHeThong = system[0].heThongID;
        maHeThong += 1;
        // Bước 3: Chèn thông tin truy cập mới vào LichSuMoCua
        const [kq] = await nt.execute(
            `INSERT INTO HeThongKhoa (tenHeThong, diaChiIP, dangHoatDong, heThongID) VALUES  (?, ?, ?, ?)`, [tenHeThong, diaChiIP, dangHoatDong, maHeThong]
        );
        await nt.commit(); // Commit giao dịch nếu mọi thứ thành công
        console.log("Ghi nhật ký truy cập thành công.");
    } catch (error) {
        await nt.rollback(); // Rollback nếu có lỗi
        console.error("Lỗi:", error.message);
    } finally {
        nt.release(); // Chỉ gọi release() nếu nó tồn tại
    }
    return res.json({
        status: "success",
        message: "Get list action success!",
        data: 1,
    });
};
const updateListSystemInfo = async (req, res) => {
    const { tenHeThong, diaChiIP, dangHoatDong } = req.body;
    const [rslt, flds] = await connection.query(`SELECT heThongID FROM HeThongKhoa WHERE tenHeThong = ?`, [tenHeThong]); // dùng `` được phép xuống dòng
    console.log(rslt);
    // const [results, fields] = await connection.query(`UPDATE HeThongKhoa SET tenHeTHong, diaChiIP, dangHoatDong = ? WHERE maHeThong = ?`, [0, id]); // dùng `` được phép xuống dòng
    return res.json({
        status: "success",
        message: "Get list action success!",
        data: 1,
    });
};

const test = async (req, res) => {};
module.exports = {
    getIotHomePage,
    getPersonalPage,
    test,
    unlockByFinger,
    unlockByPassword,
    unlockHistory,
    getListFinger,
    getListOwner,
    addNewFinger,
    addNewFingerDB,
    deleteFinger,
    deleteFingerDB,
    updatePassword,
    updatePasswordDB,
    getListUser,
    getSystemID,
    getToggleStatus,
    updateToggleStatus,
    updateEmailReceive,
    getListDiary,
    getListAction,
    getListSystem,
    updateIP,
    heartBeat,
    checkOnline,
    getListSystemInfo,
    getSystemActiveStatus,
    addListSystemInfo,
    updateListSystemInfo
};
