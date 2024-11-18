const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
const sequelize = require("../proyecto/db/sequelize");
const Solucion = require("./src/model/solucion_ia");
const { Op, where, literal } = require("sequelize");
const Categoria = require("./src/model/categoria");
const Busqueda = require('./src/model/busqueda');




// Inicializar la aplicación
const app = express();
// Configurar el puerto
const PORT = process.env.PORT || 3000;

// Configurar el motor de plantillas EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./src/views"));

// Configurar el middleware para analizar datos del body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Configurar la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Probar la conexión a la base de datos
sequelize
  .authenticate()
  .then(() =>
    console.log("Conexión a la base de datos establecida exitosamente.")
  )
  .catch((err) =>
    console.error("No se pudo conectar a la base de datos:", err)
  );

// Rutas
// Ruta para la página principal con categorías
app.get("/", async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render("index", { categorias });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).send("Error al cargar la página principal");
  }
});

sequelize.sync({ force: false })
  .then(() => console.log('Tablas recreadas correctamente'))
  .catch((err) => console.error('Error al recrear tablas:', err));

// Ruta para la búsqueda de IA específica, incluyendo el filtro de categoría
// Ruta para mostrar soluciones filtradas por búsqueda o categoría
/*app.get("/buscar", async (req, res) => {
  const { nombre, categoria } = req.query;

  const where = {};

  if (nombre) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${nombre}%` } },
      { descripcion: { [Op.iLike]: `%${nombre}%` } }
    ];
  }

  if (categoria && !isNaN(categoria)) {
    where.id_categoria = parseInt(categoria);
  }

  try {
    const soluciones = await Solucion.findAll({ where });
    const categorias = await Categoria.findAll();
    res.render("soluciones", { soluciones, categorias });
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error);
    res.status(500).send("Error al realizar la búsqueda");
  }
});*/

app.get('/soluciones', async (req, res) => {
  try {
    const soluciones = [];
    const categorias = await Categoria.findAll();

    console.log('Soluciones:', soluciones);
    console.log('Categorías:', categorias);

    // Pasa todas las variables necesarias con valores predeterminados
    res.render('soluciones', { 
      soluciones, 
      categorias, 
      nombre: '',  // Valores predeterminados para evitar errores
      categoria: '',
      modelo_negocio: '',
      precio_desde: '',
      precio_hasta: '',
    });
  } catch (error) {
    console.error('Error al obtener soluciones o categorías:', error);
    res.status(500).send('Error al obtener las soluciones o categorías');
  }
});



app.get('/buscar', async (req, res) => {
  const { nombre, categoria, modelo_negocio, precio_desde, precio_hasta, usuarioId } = req.query;

  const where = {};

  // Filtro por nombre o descripción
  if (nombre) {
    where[Op.or] = [
      literal(`unaccent("solucion_ia"."nombre") ILIKE unaccent('%${nombre}%')`),
      literal(`unaccent("solucion_ia"."descripcion") ILIKE unaccent('%${nombre}%')`),
    ];
  }

  // Filtro por categoría
  if (categoria && !isNaN(categoria)) {
    where.id_categoria = parseInt(categoria);
  }

  // Filtro por modelo de negocio
  if (modelo_negocio) {
    where.modelo_negocio = modelo_negocio;
  }

  // Filtros de precio
  if (precio_desde) {
    where.precio = { [Op.gte]: parseFloat(precio_desde) };  // Filtro de precio mínimo
  }

  if (precio_hasta) {
    where.precio = { 
      ...where.precio, 
      [Op.lte]: parseFloat(precio_hasta),  // Filtro de precio máximo
    };
  }

  try {
    // Obtener soluciones con los filtros aplicados
    const soluciones = await Solucion.findAll({
      where,
      include: [{ model: Categoria, as: 'categoria' }], // Incluir la categoría asociada
    });

    // Obtener categorías para el menú de filtros
    const categorias = await Categoria.findAll();

    // Si se especifica usuarioId, guardar la búsqueda
    if (usuarioId) {
      await Busqueda.create({
        id_usuario: usuarioId,
        palabras_claves: nombre,
        id_solucion: soluciones.length > 0 ? soluciones[0].id_solucion : null,
      });
    }

    console.log('Nombre recibido:', nombre);  // Verificar si 'nombre' tiene valor

    // Renderizar la vista con los resultados, categorías y parámetros de filtro
    res.render('soluciones', {
      soluciones,
      categorias,
      nombre: nombre || '',  // Asegúrate de pasar 'nombre' a la vista
      categoria,
      modelo_negocio,
      precio_desde,
      precio_hasta,
    });
  } catch (error) {
    console.error('Error al realizar la búsqueda:', error);
    res.status(500).send('Error al realizar la búsqueda');
  }
});




    // Renderizar la vista pasando las soluciones y categorías
    /*app.get('/soluciones', async (req, res) => {
      try {
        const categorias = await Categoria.findAll();
        res.render('soluciones', { soluciones: null, categorias });
      } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).send('Error al cargar la página de soluciones');
      }
    });*/
    
    app.get('/solucion/:id', async (req, res) => {
      const { id } = req.params;
  
      try {
          // Busca la solución junto con su categoría
          const solucion = await Solucion.findOne({
              where: { id_solucion: id },
              include: {
                  model: Categoria,  // Incluir la categoría asociada
                  as: 'categoria'    // Alias de la relación (si es necesario)
              },
              attributes: ['id_solucion', 'nombre', 'descripcion', 'precio', 'modelo_negocio', 'id_categoria', 'pagina_web']
          });
  
          if (!solucion) {
              return res.status(404).send('Solución no encontrada');
          }
          console.log(solucion);
  
          // Pasar la solución a la vista
          res.render('solucion-detalle', { solucion });
      } catch (error) {
          console.error('Error al obtener los detalles de la solución:', error);
          res.status(500).send('Error al obtener los detalles');
      }
  });
  
  
  

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
