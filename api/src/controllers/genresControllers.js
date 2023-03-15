const URL = "https://api.rawg.io/api/genres";
const { API_KEY } = process.env;
const axios = require("axios");
const { Genre } = require("../db");

const getAllGenres = async () => {
    const apiGenresRaw = (await axios.get(`${URL}?key=${API_KEY}`)).data;
    const apiGenres = apiGenresRaw.results.map(genre => genre.name);

    //lo guardo en la DB para luego utilizarlo desde ahí
    const saveGenresInDB = await apiGenres.forEach(genre => {
        Genre.findOrCreate({where: {name: genre}});
    });
    
    //retorno todos los géneros q ahora están en la DB
    const allGenresInDB = await Genre.findAll();
    return allGenresInDB;
};

module.exports = {getAllGenres};