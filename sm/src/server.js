require('dotenv').config(); // config biến môi trường
const express = require('express');
const path = require('path'); // để sử dụng đường dẫn tương đối
const configviewengine = require('./config/viewengine'); // nơi cấu hình file giao diện và file tĩnh
const webRoutes = require('./routes/web'); // nơi chứa toàn bộ route của chương trình
const connection = require("./config/database");
const cookie = require('cookie-parser'); //dùng để lấy cookie từ trình duyệt về
const cors = require('cors'); //cho phép gọi api thông qua reverse-proxy

const app = express(); // app express
const port = process.env.PORT || 8888; //port
const hostname = process.env.HOST_NAME; //localhost

// Cấu hình CORS để cho phép tất cả các origin (hoặc có thể hạn chế cho origin cụ thể)
app.use(cors({
  origin: 'http://localhost',  // Chỉ cho phép yêu cầu từ localhost (hoặc bạn có thể thay đổi thành tên miền khác)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Các phương thức HTTP được phép
  allowedHeaders: ['Content-Type', 'Authorization'],  // Các header được phép
}));

//config cookie
app.use(cookie());  

//config req.body
app.use(express.json()); //for json()
app.use(express.urlencoded({extended: true})); //for form data

//config template engine
configviewengine(app);

// khai báo route
app.use('/', webRoutes);

//tạo luồng route thứ 2
app.use('/v2', webRoutes);

// chạy app
app.listen(port, hostname, () => {
  console.log(`${hostname} app listening on port ${port}`);
})