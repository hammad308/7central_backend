const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    create,
    getAll,
    getSingle,
    update,
    deleteSector
} = require("../controllers/sectorController");
const { printRequest } = require("../logger")("SECTOR_CONTROLLER");
const { protect , checkActionAccess } = require('../middlewares/protect');

router.route('/')
    .post(
        printRequest ,
        protect , 
        checkActionAccess(menus.sectors, "create") ,
        create
    )
    .get(printRequest , protect , checkActionAccess(menus.sectors,"list") , getAll);


router.route('/:id')
    .get(printRequest , protect , checkActionAccess(menus.sectors,"read") , getSingle)
    .put(
        printRequest , 
        protect , 
        checkActionAccess(menus.sectors,"update") , 
        update
    )
    .delete(printRequest , protect , checkActionAccess(menus.sectors,"delete") , deleteSector);


module.exports = router;