const { DataTypes } = require("sequelize");
const sequelize = require("../../db/sequelize"); // Ruta correcta para importar sequelize

// Definir el modelo de Usuario
const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  contraseña: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  // Opciones del modelo
  tableName: "usuario", // Nombre de la tabla en la base de datos
  timestamps: true // Agregar createdAt y updatedAt automáticamente
});

// Exportar el modelo Usuario
module.exports = Usuario;
