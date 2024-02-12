import { Router } from "express";
import multer from 'multer';
import fs from 'fs'; // Si aún no está importado

// Configuración de Multer para almacenar archivos en una ubicación temporal
const upload = multer({ dest: 'uploads/' });

import {methods as videojuegoControladores} from "./../controladores/videojuego.controladores"

const router = Router();

router.get("/videojuegos", videojuegoControladores.getVideojuegos);
router.get("/videojuego/:id", videojuegoControladores.getVideojuegoPorId);
router.post("/videojuego", upload.single('archivo'), videojuegoControladores.addVideojuego);
router.delete("/videojuego/:id", videojuegoControladores.deleteVideojuegoPorId);
router.put("/videojuego/:id", upload.none(), videojuegoControladores.updateVideojuegoPorId);
router.get('/videojuegos/sort/:cad', videojuegoControladores.sortVideojuegos);
router.get('/videojuegos/desarrolladora/:cad', videojuegoControladores.filtrarPorDesarrolladora);



export default router



