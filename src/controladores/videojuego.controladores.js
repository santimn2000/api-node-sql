import {getConnection} from "./../database/database"
import multer from 'multer';
import fs from 'fs'; // Si aún no está importado

// Configuración de Multer para almacenar archivos en una ubicación temporal
const upload = multer({ dest: 'uploads/' });

const getVideojuegos= async (req,res) =>{

    try {
        const connection = await getConnection();
        const result = await connection.query(`
            SELECT j.id, j.nombre as nombre_videojuego, j.categoria, j.multijugador, j.precio, d.nombre as nombre_desarrolladora, j.img_url, j.fecha_creacion 
            FROM videojuego j
            INNER JOIN desarrolladora d ON j.id_desarrolladora = d.id
        `);

        res.json(result);
    } catch(error) {
        res.status(500).send(error.message);
    }
    
};

const getVideojuegoPorId= async (req,res) =>{

    try {
        const { id } = req.params;

        const connection = await getConnection();
        const [videojuego] = await connection.query(`
            SELECT j.id, j.nombre, j.categoria, j.multijugador, j.precio, j.img_url, j.fecha_creacion, d.nombre AS nombre_desarrolladora
            FROM videojuego j
            JOIN desarrolladora d ON j.id_desarrolladora = d.id
            WHERE j.id = ?
            `, id);

        if (!videojuego) {
            return res.status(404).json({ message: "Videojuego no encontrado" });
        }

        res.json(videojuego);
    } catch (error) {
        res.status(500).send(error.message);
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

        if (!nombre || !categoria || multijugador===undefined || multijugador!==0 || multijugador!==1 || precio<0 || precio===undefined || !desarrolladora) {
            return res.status(400).json({ message: "El cuerpo del mensaje debe contener todos los campos: nombre, categoria, multijugador, precio, desarrolladora y respetar el formato" });
        }

        let resultado = await connection.query("SELECT id FROM desarrolladora WHERE nombre = ?", [desarrolladora]);

        // Verificar si la consulta devolvió resultados
        if (!resultado || resultado.length === 0) {
            return res.status(400).json({ message: "La desarrolladora especificada no existe" });
        }

        const desarrolladoraIdRow = resultado[0];

        // Verificar si se encontró el ID de la desarrolladora
        if (!desarrolladoraIdRow || !desarrolladoraIdRow.id) {
            return res.status(400).json({ message: "No se encontró el ID de la desarrolladora" });
        }

        const desarrolladoraId = desarrolladoraIdRow.id;

        const videojuego = {
            nombre,
            categoria,
            multijugador,
            precio,
            id_desarrolladora: desarrolladoraId,
            img_url: originalname, // Si no se proporciona un archivo, se establecerá como null
            img_blob: path ? fs.readFileSync(path) : null, // Si no se proporciona un archivo, se establecerá como null
            fecha_creacion: new Date().toISOString().slice(0, 10)
        };

        // Insertar el videojuego en la base de datos
        const result = await connection.query("INSERT INTO videojuego SET ?", videojuego);

        // Si se proporciona un archivo, eliminar el archivo temporal después de almacenarlo en la base de datos
        if (path) {
            fs.unlinkSync(path);
        }

        res.json("Videojuego añadido correctamente");
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const deleteVideojuegoPorId= async (req,res) =>{

    try{

        const {id} = req.params

        const connection = await getConnection();
        const result = await connection.query("DELETE FROM videojuego WHERE id = ?", id)

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

        const connection = await getConnection();

        if (!id) {
            return res.status(400).json({ message: "No se encuentra el ID" });
        }

        // Verificar si se proporciona el nombre de la desarrolladora
        let idDesarrolladora = null;
        if (desarrolladora) {
            // Consulta para obtener el ID de la desarrolladora
            const [desarrolladoraRow] = await connection.query("SELECT id FROM desarrolladora WHERE nombre = ?", [desarrolladora]);

            // Verificar si la desarrolladora existe
            if (desarrolladoraRow.length === 0) {
                return res.status(400).json({ message: "La desarrolladora especificada no existe" });
            }
            idDesarrolladora = desarrolladoraRow.id;
        }

        // Construir un objeto con los campos que se desean actualizar
        const camposActualizables = {};
        if (nombre) camposActualizables.nombre = nombre;
        if (categoria) camposActualizables.categoria = categoria;
        if (multijugador !== undefined) camposActualizables.multijugador = multijugador;
        if (precio) camposActualizables.precio = precio;
        if (idDesarrolladora) camposActualizables.id_desarrolladora = idDesarrolladora;

        // Si no se proporciona ningún campo para actualizar, devolver un mensaje
        if (Object.keys(camposActualizables).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        // Construir la consulta SQL dinámicamente utilizando los campos a actualizar
        const updateQuery = "UPDATE videojuego SET ? WHERE id = ?";
        
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
            orderByClause = "ORDER BY videojuego.precio";
        } else if (cad === 'nombre') {
            orderByClause = "ORDER BY videojuego.nombre";
        } else {
            return res.status(400).json({ message: "La opción de ordenación no es válida" });
        }
    
        const query = `
            SELECT videojuego.id, videojuego.nombre, videojuego.categoria, videojuego.multijugador, videojuego.precio, desarrolladora.nombre AS desarrolladora, videojuego.img_url, videojuego.fecha_creacion 
            FROM videojuego 
            INNER JOIN desarrolladora ON videojuego.id_desarrolladora = desarrolladora.id
            ${orderByClause}
        `;
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

        const query = `
            SELECT videojuego.id, videojuego.nombre, videojuego.categoria, videojuego.multijugador, videojuego.precio, desarrolladora.nombre AS desarrolladora, videojuego.img_url, videojuego.fecha_creacion 
            FROM videojuego 
            INNER JOIN desarrolladora ON videojuego.id_desarrolladora = desarrolladora.id
            WHERE LOWER(desarrolladora.nombre) = LOWER(?)
        `;
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
