// models/Solucion.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');  // Ajusta la ruta según la estructura de tu proyecto

const Solucion = sequelize.define('Solucion', {
id_solucion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
},
nombre: {
    type: DataTypes.STRING,
    allowNull: false
},
descripcion: {
    type: DataTypes.TEXT
},
id_categoria: {
    type: DataTypes.INTEGER
},
precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
}
}, {
  tableName: 'solucion_ia',  // Nombre de la tabla en la base de datos
timestamps: false
});

module.exports = Solucion;
