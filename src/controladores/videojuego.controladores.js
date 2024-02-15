import {getConnection} from "./../database/database"
import multer from 'multer';
import fs from 'fs'; // Si aún no está importado

// Configuración de Multer para almacenar archivos en una ubicación temporal
const upload = multer({ dest: 'uploads/' });


const getVideojuegos= async (req,res) =>{

    try{
        const connection = await getConnection();
        const result = await connection.query("SELECT id,nombre,categoria,multijugador,precio,desarrolladora,img_url,fecha_creacion FROM juegos")

        res.json(result)

    }catch(error){
        res.status(500)
        res.send(error.message)
    }
    
};

//ESTO REALIZA CONSULTAS; SE PODRIA HACER CON PROCEDIMIENTOS ALMACENADOS

const getVideojuegoPorId= async (req,res) =>{

    try{

        const {id} = req.params

        const connection = await getConnection();
        const result = await connection.query("SELECT id,nombre,categoria,multijugador,precio,desarrolladora, img_url, fecha_creacion FROM juegos WHERE id = ?", id)

        res.json(result)

    }catch(error){
        res.status(500)
        res.send(error.message)
    }
    
};

const addVideojuego = async (req, res) => {
    try {
        const { nombre, categoria, multijugador, precio, desarrolladora } = req.body;
        let originalname = null;
        let path = null;

        // Verificar si se proporciona un archivo
        if (req.file) {
            originalname = req.file.originalname;
            path = req.file.path;
        }

        const connection = await getConnection();

        if (!nombre || !categoria || !multijugador || !precio || !desarrolladora) {
            return res.status(400).json({ message: "El cuerpo del mensaje debe contener todos los campos: nombre, categoria, multijugador, precio, desarrolladora" });
        }

        const videojuego = {
            nombre, categoria, multijugador, precio, desarrolladora,
            img_url: originalname, // Si no se proporciona un archivo, se establecerá como null
            img_blob: path ? fs.readFileSync(path) : null, // Si no se proporciona un archivo, se establecerá como null
            fecha_creacion: new Date().toISOString().slice(0,10)
        };

        // Inserta el videojuego en la base de datos
        const result = await connection.query("INSERT INTO juegos SET ?", videojuego);

        // Si se proporciona un archivo, eliminar el archivo temporal después de almacenarlo en la base de datos
        if (path) {
            fs.unlinkSync(path);
        }

        res.json("Videojuego añadido correctamente");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deleteVideojuegoPorId= async (req,res) =>{

    try{

        const {id} = req.params

        const connection = await getConnection();
        const result = await connection.query("DELETE FROM juegos WHERE id = ?", id)

        res.json(result)

    }catch(error){
        res.status(500)
        res.send(error.message)
    }
    
};

const updateVideojuegoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, multijugador, precio, desarrolladora } = req.body;

        console.log(req.body)

        if (!id) {
            return res.status(400).json({ message: "No se encuentra el ID" });
        }

        // Construir un objeto con los campos que se desean actualizar
        const camposActualizables = {};
        if (nombre) camposActualizables.nombre = nombre;
        if (categoria) camposActualizables.categoria = categoria;
        if (multijugador !== undefined) camposActualizables.multijugador = multijugador;
        if (precio) camposActualizables.precio = precio;
        if (desarrolladora) camposActualizables.desarrolladora = desarrolladora;

        // Si no se proporciona ningún campo para actualizar, devolver un mensaje
        if (Object.keys(camposActualizables).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        // Construir la consulta SQL dinámicamente utilizando los campos a actualizar
        const updateQuery = "UPDATE juegos SET ? WHERE id = ?";
        const connection = await getConnection();
        const result = await connection.query(updateQuery, [camposActualizables, id]);

        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const sortVideojuegos = async (req, res) => {
    const { cad } = req.params;

    try {
        const connection = await getConnection();

        let orderByClause = "";
        if (cad === 'precio') {
            orderByClause = "ORDER BY precio";
        } else if (cad === 'nombre') {
            orderByClause = "ORDER BY nombre";
        } else {
            return res.status(400).json({ message: "La opción de ordenación no es válida" });
        }

        const query = `SELECT id, nombre, categoria, multijugador, precio, desarrolladora, img_url, fecha_creacion FROM juegos ${orderByClause}`;
        const result = await connection.query(query);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Controlador para filtrar los videojuegos por desarrolladora
const filtrarPorDesarrolladora = async(req, res) => {
    try {
        const { cad } = req.params;

        const connection = await getConnection();

        // Consulta SQL para filtrar los videojuegos por desarrolladora
        const query = `SELECT id,nombre,categoria,multijugador,precio,desarrolladora, img_url, fecha_creacion FROM juegos WHERE LOWER(desarrolladora) = LOWER(?)`;
        const videojuegos = await connection.query(query, [cad]);

        res.json(videojuegos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const methods = {
    getVideojuegos,
    getVideojuegoPorId,
    addVideojuego,
    deleteVideojuegoPorId,
    updateVideojuegoPorId,
    sortVideojuegos,
    filtrarPorDesarrolladora
}