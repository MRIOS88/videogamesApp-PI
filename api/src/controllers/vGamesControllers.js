//--------------------------------controllers para videogames---------------------
//
const { Videogame, Genre } = require("../db");
const { Op } = require("sequelize");
const axios = require("axios");
const { getVideogameIdHandler } = require("../handlers/vGamesHandlers");
const { API_KEY } = process.env;
const URL = 'https://api.rawg.io/api/games';

//fn auxiliar que emprolija el array recibido de genres. En vez de [{id:1, name:drama},{id:2, name:drama},{id:3, name:drama}]
// retorna ahora con esta fn [drama, drama, drama]
const cleanArrayDB = (array) => array.map(game => {
    return {
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        released: game.released,
        rating: game.rating,
        genres: game.genres.map(g => g.name),
        platform: game.platform,
        created: game.created
    };
});


//No se puede hacer esta fn por problemas de scope. No tendría sentido almacenar en el
//back la info si solo es para pasarsela al front q si va a tener estado global con
//redux o estados en los componentes de react. 
//const cleanArrayAPI = (array) => array.results.map(game => {
//     return {
//         id: game.id,
//         name: game.name,
//         background_image: game.background_image,
//         released: game.released,
//         rating: game.rating,
//         genres: game.genres.map(g => g.name),
//         platform: game.platform.map(plat => plat.platform.name),
//         created: false
//     }
// })


//----------------------------obtener todos los juegos----------------------------

const getAllGames = async () => {
    //traigo los games de la DB
    const databaseRaw = await Videogame.findAll({
        include: [{
            model: Genre,
            attributes: ["name"],
            through: { attributes: [] }
        }]
    });
    const database = cleanArrayDB(databaseRaw);
    //traigo los primeros 100 games de la API, por eficiencia.
    const oneHundredGames = [];

    for (let i = 1; i <= 5; i++) {
        const allApiGames = (await axios.get(`${URL}?page=${i}&key=${API_KEY}`)).data;
        //console.log(allApiGames);
        allApiGames.results.map(game => {
            oneHundredGames.push({
                id: game.id,
                name: game.name,
                background_image: game.background_image,
                released: game.released,
                rating: game.rating,
                genres: game.genres?.map(g => g.name),
                platform: game.platforms?.map(plat => plat.platform.name),
                created: false
            });
        });
    };
    return [...database, ...oneHundredGames];
};

//----------------------------obtener juegos por nombre---------------------------

const searchGameByName = async (name) => {
    //busca en la DB por nombre
    const databaseGamesRaw = await Videogame.findAll({
        where: {
            name: { [Op.iLike]: `%${name}%` }
        },
        include: [
            {
                model: Genre,
                attributes: ["name"],
                through: {
                    attributes: []
                }
            }
        ]
    });
    //console.log(databaseGames);
    const databaseGames = cleanArrayDB(databaseGamesRaw);
    //busca en la API por nombre
    const sixtyGamesByName = [];
    for (let i = 1; i <= 3; i++) {
        const apiGamesByName = ((await axios.get(`${URL}?search=${name}&page=${i}&key=${API_KEY}`)).data);
        //console.log(apiGamesByName);
        apiGamesByName.results.map(game => {
            sixtyGamesByName.push({
                id: game.id,
                name: game.name,
                background_image: game.background_image,
                released: game.released,
                rating: game.rating,
                genres: game.genres?.map(g => g.name),
                platform: game.platforms?.map(plat => plat.platform.name),
                created: false
            });
        });

        //console.log(sixtyGamesByName);
    };
    return [...databaseGames, ...sixtyGamesByName];
};


//------------------------------obtener juegos por id-----------------------------

const getGameById = async (id, source) => {
    if (source === "db") {
        //base de datos
        const databaseIdRaw = await Videogame.findByPk(id, {
            include: [
                {
                    model: Genre,
                    attributes: ["name"],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });
        return databaseIdRaw;
        //console.log(databaseIdRaw);
        //ME parece q tengo q pasar databaseIdRaw por cleanArray.
        //const databaseId = cleanArrayDB([databaseIdRaw])
        //LO DEJO EN STAND BY Y LO TERMINO LUEGO DE TERMINAR Y CREAR USURIOS
    } else {
        const game = (await axios.get(`${URL}/${id}?key=${API_KEY}`)).data;
        const result = {
            id: game.id,
            name: game.name,
            description: game.description,
            background_image: game.background_image,
            background_image_additional: game.background_image_additional,
            rating: game.rating,
            genres: game.genres?.map((g) => g.name),
            released: game.released,
            developers: game.developers?.map((d) => d.name),
            esrb: game.esrb_rating?.name,
            tags: game.tags?.map((t) => t.name).slice(0, 9),
            platform: game.platforms?.map((p) => p.platform.name),
            comments: game.ratings?.map((r) => `${r.title} (${r.count})`),
            created: false,
        };
        return result;
    };
}

//------------------------------crear juego nuevo---------------------------------

const createGame = async (name,
    background_image,
    description,
    releaseDate,
    genres,
    rating,
    platforms) => {
    const allgames = await getAllGames();
    const allgamesFiltered = allgames.filter(game => game.name === name);
    if (allgamesFiltered.length !== 0) {
        throw Error("Ya existe un juego con ese nombre");
    } else {
        const newGame = await Videogame.create({
            //genre aca no
            name,
            background_image,
            description,
            releaseDate,
            rating,
            platforms
        });
        const genreDb = await Genre.findAll({
            where: { name: genres}
        });
        newGame.addGenre(genreDb);

        return newGame;
    };
};

//hacer el create de game, averiguar si setearlo o add erirlo. Es decir como
//relacionar las tablas de videogames con genres cuando creo un juego nuevo.
//agregar esta validación aca no más porq al crear un juego y usar un nombre de otro
//ya creado en la API, si bien nuestro código lo soporta(traería el de la DB y el
//de la API), por cuestiones de calidad de la app es mejor no dejar a los usuarios crear
//un juego con un nombre ya usado en la API(en la DB ya usamos el atributo unique).
module.exports = {
    getAllGames,
    searchGameByName,
    getGameById,
    createGame
};
//NOTAS DE PRUEBAS VARIAS, BORRARLAS DESPUES

// INSERT INTO videogames("name", "description", "releaseDate", "rating", "platforms", "background_image")
// VALUES("PRUEBAgame","ninguna","2023-03-12","0.3","[{play}]","NOimage");

// const hola = [{name: "Miguel", apellido: "Rios"}];
// const resultado = hola.toJSON();
// console.log(resultado);

// var id = 1;
// if(isNaN(id)){
//     console.log("OK");
// } else {
//     console.log("ELSE");
// };

// var prueba = [];
// if(prueba){
//     console.log("es TRUE");
// } else {
//     console.log("es FALSE");
// };  // cosas locas de javascript