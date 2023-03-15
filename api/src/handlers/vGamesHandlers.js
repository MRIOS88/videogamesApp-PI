const {
    searchGameByName,
    getAllGames,
    getGameById,
    createGame
} = require("../controllers/vGamesControllers");

const getVideogamesHandler = async (req, res) => {
    //también le pude haber llamado game al {name} como en el README
    const { name } = req.query;
    try {
        const results = name ? await searchGameByName(name) : await getAllGames();
        res.status(200).json(results);
    } catch (error) {
        res.status(400).json({ error: error.message });
    };
};

const getVideogameIdHandler = async (req, res) => {
    const { id } = req.params;
    const source = isNaN(id) ? "db" : "api";
    try {
        const detailVideogame = await getGameById(id, source);
        res.status(200).json(detailVideogame);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const createVideogameHandler = async (req, res) => {
    const { name,
        background_image,
        description,
        releaseDate,
        genres,
        rating,
        platforms } = req.body;

    try {
        const newVideogame = await createGame(name,
            background_image,
            description,
            releaseDate,
            genres,
            rating,
            platforms);
        res.status(200).json(newVideogame);
    } catch (error) {
        res.status(400).json( {error: error.message} );
    };
};

module.exports = {
    getVideogamesHandler,
    getVideogameIdHandler,
    createVideogameHandler
}