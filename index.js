// Importar las dependencias necesarias
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();  
const sequelize = require('./db/sequelize');
const Solucion = require('./src/model/solucion_ia');
const { Op } = require('sequelize');

// Inicializar la aplicación
const app = express();

// Configurar el puerto
const PORT = process.env.PORT || 3000;

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './src/views'));

// Configurar el middleware para analizar datos del body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));


// Probar la conexión a la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida exitosamente.');
})
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err);
});

// Rutas

// Ruta para la página principal
app.get('/', (req, res) => {
    res.render('index');  // Renderiza la vista 'index.ejs'
});


app.get('/soluciones', async (req, res) => {
    try {
      // Obtener todas las soluciones de la tabla
      const soluciones = await Solucion.findAll();
  
      // Renderizar la vista 'soluciones' pasando los datos obtenidos
      res.render('soluciones', { soluciones });
    } catch (error) {
      console.error('Error al obtener soluciones:', error);
      res.status(500).send('Error al obtener las soluciones');
    }
});

// Ruta para la búsqueda de IA específica
app.get('/buscar', async (req, res) => {
  const { nombre } = req.query;

  try {
      // Buscar coincidencias en la base de datos
      const soluciones = await Solucion.findAll({
        where: {
            nombre: {
                [Op.iLike]: `%${nombre}%` // Búsqueda insensible a mayúsculas
            }
        }
    });

      // Renderizar la vista 'soluciones' pasando los datos encontrados
      res.render('soluciones', { soluciones });
  } catch (error) {
      console.error('Error al realizar la búsqueda:', error);
      res.status(500).send('Error al realizar la búsqueda');
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
