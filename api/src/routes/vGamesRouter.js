const {Router} = require("express");
const {
    getVideogamesHandler,
    getVideogameIdHandler,
    createVideogameHandler
} = require("../handlers/vGamesHandlers");

const vGamesRouter = Router();

vGamesRouter.get("/", getVideogamesHandler);
vGamesRouter.get("/:id", getVideogameIdHandler);
vGamesRouter.post("/", createVideogameHandler)

module.exports = vGamesRouter;