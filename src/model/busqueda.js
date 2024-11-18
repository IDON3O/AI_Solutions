const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');
const Solucion_ia = require('./solucion_ia');  // Asegúrate de que la ruta sea correcta
const Usuario = require('./usuario');  // Asegúrate de que la ruta sea correcta

class Busqueda extends Model {}

Busqueda.init({
    id_busqueda: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'id_usuario',
        }
    },
    id_solucion: {
        type: DataTypes.INTEGER,
        references: {
            model: Solucion_ia,
            key: 'id_solucion',
        }
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    palabras_claves: {
        type: DataTypes.STRING,
    }
}, {
    sequelize,
    modelName: 'busqueda',
    tableName: 'busqueda',
    timestamps: false,  // Si no usas createdAt y updatedAt
});

module.exports = Busqueda;
