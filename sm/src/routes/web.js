const express = require("express");
const router = express.Router(); // dùng để định nghĩa route
const { getIotHomePage, getPersonalPage, test, unlockByFinger, unlockByPassword, unlockHistory,
    getListFinger, getListOwner, addNewFinger, addNewFingerDB, deleteFinger, deleteFingerDB, 
    updatePassword, updatePasswordDB, getListUser, getSystemID, getToggleStatus, 
    updateToggleStatus, updateEmailReceive, getListDiary, getListAction, getListSystem, updateIP, heartBeat, 
    checkOnline, getSystemActiveStatus, getListSystemInfo, addListSystemInfo, updateListSystemInfo } = require("../controllers/homeController");

//Homepage
router.get("/", getIotHomePage);
router.get("/caNhan", getPersonalPage);
router.get("/test", test);

//mock api
//Trang điều khiển
router.post("/api/arduino/unlockByFinger", unlockByFinger);
router.post("/api/arduino/unlockByPassword", unlockByPassword);
router.post("/api/unlockHistory", unlockHistory);
router.get("/api/getListFinger", getListFinger);
router.post("/api/arduino/deleteFinger", deleteFinger);
router.post("/api/deleteFingerDB", deleteFingerDB);
router.get("/api/getListOwner", getListOwner);
router.get("/api/arduino/addNewFinger", addNewFinger);
router.post("/api/addNewFingerDB", addNewFingerDB);
router.post("/api/arduino/updatePassword", updatePassword);
router.post("/api/updatePasswordDB", updatePasswordDB);

//Trang cá nhân
router.get("/api/getListUser", getListUser);
router.get("/api/arduino/getSystemID", getSystemID);
router.post("/api/getToggleStatus", getToggleStatus);
router.put("/api/updateToggleStatus", updateToggleStatus);
router.put("/api/updateEmailReceive", updateEmailReceive);
router.get("/api/getListDiary", getListDiary);
router.get("/api/getListAction", getListAction);

//Quản lý hệ thống
router.get("/api/getListSystem", getListSystem);
router.post("/api/updateIP", updateIP);
router.get("/api/arduino/heartbeat", heartBeat);
router.post("/api/checkOnline", checkOnline);
router.post("/api/getSystemActiveStatus", getSystemActiveStatus);
router.get("/api/getListSystemInfo", getListSystemInfo);
router.post("/api/addListSystemInfo", addListSystemInfo);
router.post("/api/updateListSystemInfo", updateListSystemInfo);


module.exports = router; // export default
