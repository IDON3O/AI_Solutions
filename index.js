const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
const { Op, where, literal } = require("sequelize");
const sequelize = require("../proyecto/db/sequelize");
const Solucion = require("./src/model/solucion_ia");
const Categoria = require("./src/model/categoria");
const Busqueda = require('./src/model/busqueda');
const Usuario = require('./src/model/usuario');
const Calificacion = require('./src/model/calificacion');
const Favorito = require('./src/model/favorito');
const Recomendacion = require('./src/model/recomendacion');
const Estadisticas = require('./src/model/estadisticas');
const bcrypt = require("bcrypt");
const session = require("express-session");



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

// Middleware para proteger rutas
function protegerRuta(req, res, next) {
  if (!req.session.usuarioId) {
    return res.redirect("/login");
  }
  next();
}

// Probar la conexión a la base de datos
sequelize
  .authenticate()
  .then(() =>
    console.log("Conexión a la base de datos establecida exitosamente.")
  )
  .catch((err) =>
    console.error("No se pudo conectar a la base de datos:", err)
  );

  // Configurar sesiones
app.use(
  session({
    secret: "contraseña_no_hackeable", // Cambia por una clave segura en producción
    resave: false, // No volver a guardar la sesión si no hubo cambios
    saveUninitialized: true, // Guardar sesiones no inicializadas
    cookie: {
      secure: false, // Cambiar a `true` si usas HTTPS
      httpOnly: true, // La cookie solo puede ser utilizada por el servidor
      maxAge: 1000 * 60 * 60, // Expiración: 1 hora
    },
  })
);

const generarRecomendaciones = async (usuarioId) => {
  try {
      // Obtener el historial de búsquedas del usuario
      const historial = await Busqueda.findAll({
          where: { id_usuario: usuarioId },
          attributes: ['id_solucion', 'palabras_claves'],
      });

      if (!historial.length) return; // Si no hay historial, no generar recomendaciones

      // Extraer las soluciones del historial
      const solucionesHistorial = historial.map(h => h.id_solucion).filter(Boolean);

      // Obtener las soluciones más relevantes que no están ya en las recomendaciones del usuario
      const solucionesRecomendadas = await Solucion.findAll({
          where: {
              id_solucion: { [Op.notIn]: solucionesHistorial }, // Excluir las ya vistas por el usuario
          },
          limit: 5, // Número de recomendaciones
      });

      // Insertar recomendaciones en la tabla
      const recomendaciones = solucionesRecomendadas.map(solucion => ({
          id_usuario: usuarioId,
          id_solucion: solucion.id_solucion,
      }));

      await Recomendacion.bulkCreate(recomendaciones, { ignoreDuplicates: true });

      console.log(`Recomendaciones generadas para el usuario ${usuarioId}`);
  } catch (error) {
      console.error('Error al generar recomendaciones:', error);
  }
};

// Rutas

// Ruta para mostrar el formulario de registro
app.get("/registro", (req, res) => {
  res.render("registro");
});

// Ruta para manejar el registro de usuarios
app.post("/registro", async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifrar contraseña
    await Usuario.create({ nombre, email, contraseña: hashedPassword });
    res.redirect("/login");
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).send("Error al registrar usuario.");
  }
});

// Ruta para mostrar el formulario de inicio de sesión
app.get("/login", (req, res) => {
  res.render("login");
});

// Ruta para manejar el inicio de sesión
app.post("/login", async (req, res) => {
  const { email, contraseña } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (usuario && (await bcrypt.compare(contraseña, usuario.contraseña))) {
      req.session.usuarioId = usuario.id_usuario; // Guardar el ID del usuario en la sesión
      console.log(`Usuario autenticado: ${usuario.id_usuario}`); // Mensaje de depuración
      res.redirect("/soluciones"); // Redirigir a la página principal
    } else {
      console.error("Correo o contraseña incorrectos.");
      res.status(401).send("Correo o contraseña incorrectos.");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).send("Error al iniciar sesión.");
  }
});


// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
    }
    res.redirect("/");
  });
});
  

// Agregar un favorito
app.post("/favoritos", async (req, res) => {
  const { id_solucion } = req.body;
  try {
    if (req.session.usuarioId) {
      await Favorito.create({
        id_usuario: req.session.usuarioId,
        id_solucion,
      });
      res.status(200).send("Solución añadida a favoritos.");
    } else {
      res.status(401).send("Debe iniciar sesión para guardar favoritos.");
    }
  } catch (error) {
    console.error("Error al guardar favorito:", error);
    res.status(500).send("Error al guardar favorito.");
  }
});

// Obtener favoritos
app.get("/recomendaciones", async (req, res) => {
  try {
    if (!req.session.usuarioId) return res.redirect("/login");

    const historial = await Busqueda.findAll({
      where: { id_usuario: req.session.usuarioId },
      attributes: ["palabras_claves"],
    });

    const palabrasClave = historial.map((h) => h.palabras_claves);
    const soluciones = await Solucion.findAll({
      where: {
        [Op.or]: palabrasClave.map((clave) => ({
          descripcion: { [Op.iLike]: `%${clave}%` },
        })),
      },
    });

    res.render("recomendaciones", { soluciones });
  } catch (error) {
    console.error("Error al obtener recomendaciones:", error);
    res.status(500).send("Error al obtener recomendaciones.");
  }
});

// Ruta para generar reporte de soluciones más buscadas
app.get("/reportes/mas-buscadas", async (req, res) => {
  try {
    const reporte = await Busqueda.findAll({
      attributes: [
        "id_solucion",
        [sequelize.fn("COUNT", sequelize.col("id_solucion")), "total_busquedas"],
      ],
      group: ["id_solucion"],
      order: [[sequelize.literal("total_busquedas"), "DESC"]],
    });

    res.render("reporte-mas-buscadas", { reporte });
  } catch (error) {
    console.error("Error al generar reporte:", error);
    res.status(500).send("Error al generar reporte.");
  }
});

// Ruta para calificar una solución
app.post("/calificar", async (req, res) => {
  const { id_solucion, calificacion, comentario } = req.body;
  try {
    if (req.session.usuarioId) {
      await Calificacion.create({
        id_usuario: req.session.usuarioId,
        id_solucion,
        calificacion,
        comentario,
      });
      res.status(200).send("Calificación registrada.");
    } else {
      res.status(401).send("Debe iniciar sesión para calificar.");
    }
  } catch (error) {
    console.error("Error al registrar calificación:", error);
    res.status(500).send("Error al registrar calificación.");
  }
});

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

app.get('/soluciones', async (req, res) => {

  let recomendacionesUsuario = [];
  let recomendacionesGenerales = [];

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
      recomendacionesUsuario,
      recomendacionesGenerales,
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
  const { nombre, categoria, modelo_negocio, precio_desde, precio_hasta } = req.query;
  const usuarioId = req.session?.usuarioId;

  const where = {};

  if (nombre) {
      where[Op.or] = [
          literal(`unaccent("solucion_ia"."nombre") ILIKE unaccent('%${nombre}%')`),
          literal(`unaccent("solucion_ia"."descripcion") ILIKE unaccent('%${nombre}%')`),
      ];
  }

  if (categoria && !isNaN(categoria)) {
      where.id_categoria = parseInt(categoria);
  }

  if (modelo_negocio) {
      where.modelo_negocio = modelo_negocio;
  }

  if (precio_desde) {
      where.precio = { [Op.gte]: parseFloat(precio_desde) };
  }

  if (precio_hasta) {
      where.precio = {
          ...where.precio,
          [Op.lte]: parseFloat(precio_hasta),
      };
  }

  try {
      const soluciones = await Solucion.findAll({
          where,
          include: [{ model: Categoria, as: 'categoria' }],
      });

      const categorias = await Categoria.findAll();

      if (usuarioId && nombre) {
          // Guarda la búsqueda
          await Busqueda.create({
              id_usuario: usuarioId,
              palabras_claves: nombre,
              id_solucion: soluciones.length > 0 ? soluciones[0].id_solucion : null,
          });

          // Genera recomendaciones basadas en la búsqueda
          await generarRecomendaciones(usuarioId);
      }

      res.render('soluciones', {
          soluciones,
          categorias,
          nombre: nombre || '',
          categoria,
          recomendacionesUsuario: [], // Opcional: puedes obtener recomendaciones aquí
          recomendacionesGenerales: [],
          modelo_negocio,
          precio_desde,
          precio_hasta,
      });
  } catch (error) {
      console.error('Error al realizar la búsqueda:', error);
      res.status(500).send('Error al realizar la búsqueda');
  }
});




app.get('/soluciones', async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    const usuarioId = req.session?.usuarioId || null;

    let recomendacionesUsuario = [];
    let recomendacionesGenerales = [];

    if (usuarioId) {
      // Obtener recomendaciones basadas en el usuario
      recomendacionesUsuario = await Recomendacion.findAll({
        where: { id_usuario: usuarioId },
        include: [
          {
            model: Solucion,
            as: 'solucion',
            include: [{ model: Categoria, as: 'categoria' }],
          },
        ],
      });
    }
    else {  // Si no hay usuario autenticado
      console.log('No hay usuario autenticado');
    }

    // Obtener recomendaciones generales basadas en búsquedas
    recomendacionesGenerales = await Solucion.findAll({
      include: [
        {
          model: Busqueda,
          attributes: [],
        },
      ],
      attributes: [
        'id_solucion',
        'nombre',
        'descripcion',
        [sequelize.fn('COUNT', sequelize.col('busquedas.id_busqueda')), 'total_busquedas'],
      ],
      group: ['id_solucion', 'nombre', 'descripcion'],
      order: [[sequelize.literal('total_busquedas'), 'DESC']],
      limit: 5,
    });

    console.log('Recomendaciones para el usuario:', recomendacionesUsuario);
    console.log('Recomendaciones generales:', recomendacionesGenerales);

    res.render('soluciones', {
      soluciones: [],
      categorias,
      recomendacionesUsuario,
      recomendacionesGenerales,
      nombre: '',
      categoria: '',
      modelo_negocio: '',
      precio_desde: '',
      precio_hasta: '',
    });
  } catch (error) {
    console.error('Error al obtener soluciones o categorías:', error);
    res.status(500).send('Error al obtener soluciones o categorías.');
  }
});

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
